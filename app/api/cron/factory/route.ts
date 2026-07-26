import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { claimFactoryJob, failFactoryJob, processFactoryJob } from '@/lib/factory/xab-v3-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'agents:dispatch')
  if (!auth.ok) {
    return NextResponse.json({ ok: false, state: auth.state, error: auth.error }, { status: auth.http_status })
  }
  const workerId = `factory-${crypto.randomUUID()}`
  const results: Array<Record<string, unknown>> = []
  for (let index = 0; index < 3; index += 1) {
    const job = await claimFactoryJob(workerId)
    if (!job) break
    try {
      const result = await processFactoryJob(job)
      results.push({ job_id: job.id, type: job.type, state: 'completed', result })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await failFactoryJob(job, message)
      results.push({ job_id: job.id, type: job.type, state: 'failed_or_requeued', error: message })
    }
  }
  return NextResponse.json({
    ok: true,
    state: results.length ? 'DISPATCHED' : 'IDLE',
    worker_id: workerId,
    results,
    production_mutation: false,
    timestamp: new Date().toISOString(),
  })
}
