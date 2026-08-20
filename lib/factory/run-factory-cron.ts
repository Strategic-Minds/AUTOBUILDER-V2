import { NextRequest, NextResponse } from 'next/server'
import { runBacklogHeartbeat } from '@/lib/backlog-engine/run-heartbeat'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { processMonitorFinalBuildSafely } from '@/lib/factory/safe-monitor-final-build'
import { claimFactoryJob, failFactoryJob, processFactoryJob } from '@/lib/factory/xab-v3-store'

const EXPECTED_SCHEDULE = '*/5 * * * *'

function blockedStatus(message: string) {
  if (message.includes('FACTORY_QUEUE_MIGRATION_REQUIRED')) {
    return { state: 'BLOCKED_DATABASE_MIGRATION_REQUIRED', status: 503 }
  }
  if (message.includes('Factory database is not configured')) {
    return { state: 'BLOCKED_FACTORY_DATABASE_CONFIGURATION', status: 503 }
  }
  return { state: 'DEGRADED', status: 503 }
}

export async function runFactoryCron(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'agents:dispatch')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_mutation: false },
      { status: auth.http_status },
    )
  }

  const schedule = req.headers.get('x-vercel-cron-schedule')
  if (schedule && schedule !== EXPECTED_SCHEDULE) {
    return NextResponse.json(
      {
        ok: false,
        state: 'FORBIDDEN_SCHEDULE',
        expected_schedule: EXPECTED_SCHEDULE,
        production_mutation: false,
      },
      { status: 403 },
    )
  }

  // The existing five-minute cron remains the only timer. The Backlog Engine
  // acquires at most one atomic 55-minute lease per UTC hour. Missing Backlog
  // schema is reported as evidence but never blocks the canonical factory queue.
  const backlog = await runBacklogHeartbeat()

  const workerId = `factory-${crypto.randomUUID()}`
  const results: Array<Record<string, unknown>> = []

  try {
    for (let index = 0; index < 3; index += 1) {
      const job = await claimFactoryJob(workerId)
      if (!job) break

      try {
        // monitor_final_build used to inherit an automatic Preview -> Production
        // promotion. It now has a dedicated fail-closed processor. All other
        // factory jobs keep using the canonical XAB v3 processor.
        const result = job.type === 'monitor_final_build'
          ? await processMonitorFinalBuildSafely(job)
          : await processFactoryJob(job)
        results.push({ job_id: job.id, type: job.type, state: 'completed', result })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        try {
          await failFactoryJob(job, message)
          results.push({ job_id: job.id, type: job.type, state: 'failed_or_requeued', error: message })
        } catch (settlementError) {
          const settlementMessage = settlementError instanceof Error ? settlementError.message : String(settlementError)
          results.push({
            job_id: job.id,
            type: job.type,
            state: 'settlement_failed',
            error: message,
            settlement_error: settlementMessage,
          })
          const blocked = blockedStatus(settlementMessage)
          return NextResponse.json(
            {
              ok: false,
              state: blocked.state,
              worker_id: workerId,
              results,
              backlog_engine: backlog,
              production_mutation: false,
              timestamp: new Date().toISOString(),
            },
            { status: blocked.status },
          )
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const blocked = blockedStatus(message)
    return NextResponse.json(
      {
        ok: false,
        state: blocked.state,
        error: message,
        worker_id: workerId,
        results,
        backlog_engine: backlog,
        production_mutation: false,
        timestamp: new Date().toISOString(),
      },
      { status: blocked.status },
    )
  }

  return NextResponse.json({
    ok: true,
    state: results.length ? 'DISPATCHED' : 'IDLE',
    worker_id: workerId,
    schedule: EXPECTED_SCHEDULE,
    results,
    backlog_engine: backlog,
    production_mutation: false,
    timestamp: new Date().toISOString(),
  })
}
