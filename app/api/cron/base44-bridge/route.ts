import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const EXPECTED_SCHEDULE = '*/5 * * * *'
const DEFAULT_BASE44_AGENT_URL = 'https://app.base44.com/api/agents/6a4ae522852a5e08bfa42450'

type JsonRecord = Record<string, unknown>

type BridgeJob = {
  id: string
  job_key: string
  project_id: string | null
  message: string
  source: string
  context: JsonRecord
  attempts: number
  max_attempts: number
  lease_owner: string
}

function config() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const base44Token = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || ''
  const configuredUrl = process.env.BASE44_AGENT_WEBHOOK_URL || process.env.BASE44_AGENT_URL || DEFAULT_BASE44_AGENT_URL
  const rootUrl = configuredUrl.replace(/\/$/, '')
  const base44Url = rootUrl.endsWith('/messages') ? rootUrl : `${rootUrl}/messages`
  if (!supabaseUrl || !supabaseKey) throw new Error('Base44 bridge database is not configured')
  if (!base44Token) throw new Error('Base44 outbound credential is not configured')
  return { supabaseUrl, supabaseKey, base44Token, base44Url }
}

async function db<T>(path: string, method = 'GET', body?: unknown, prefer = 'return=representation'): Promise<T> {
  const { supabaseUrl, supabaseKey } = config()
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try { parsed = JSON.parse(text) } catch { parsed = text }
  }
  if (!response.ok) throw new Error(`Bridge database ${method} failed ${response.status}: ${text.slice(0, 600)}`)
  return parsed as T
}

async function claimJob(workerId: string) {
  const rows = await db<BridgeJob[]>('rpc/xab_claim_base44_bridge_job', 'POST', {
    p_worker_id: workerId,
    p_lease_seconds: 240,
  })
  return rows[0] || null
}

async function finishJob(job: BridgeJob, succeeded: boolean, result?: JsonRecord, error?: string) {
  return db<BridgeJob>('rpc/xab_finish_base44_bridge_job', 'POST', {
    p_job_id: job.id,
    p_worker_id: job.lease_owner,
    p_succeeded: succeeded,
    p_result: result || null,
    p_error: error || null,
    p_retry_delay_seconds: 60,
  })
}

async function writeReceipt(job: BridgeJob, passed: boolean, details: JsonRecord) {
  const rows = await db<Array<{ id: string }>>('xab_base44_bridge_receipts', 'POST', {
    job_id: job.id,
    job_key: job.job_key,
    passed,
    receipt_type: 'base44_github_roundtrip',
    details,
  })
  return rows[0] || null
}

function parseResponse(text: string): JsonRecord {
  if (!text) return {}
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' ? parsed as JsonRecord : { content: parsed }
  } catch {
    return { content: text }
  }
}

async function callBase44(job: BridgeJob) {
  const { base44Token, base44Url } = config()
  const correlationId = `bridge-${job.id}`
  const response = await fetch(base44Url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${base44Token}`,
      'X-Correlation-Id': correlationId,
      'X-Idempotency-Key': job.job_key,
    },
    body: JSON.stringify({
      content: job.message,
      role: 'user',
      metadata: {
        source: job.source,
        project_id: job.project_id,
        job_id: job.id,
        job_key: job.job_key,
        context: job.context || {},
        production_target: true,
        read_only_validation: true,
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(55_000),
  })
  const text = await response.text()
  const output = parseResponse(text)
  if (!response.ok) throw new Error(`Base44 agent failed ${response.status}: ${text.slice(0, 800)}`)
  return { status: response.status, output, correlation_id: correlationId }
}

async function run(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'agents:dispatch')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, request_id: auth.request_id },
      { status: auth.http_status },
    )
  }

  const schedule = req.headers.get('x-vercel-cron-schedule')
  if (schedule && schedule !== EXPECTED_SCHEDULE) {
    return NextResponse.json({ ok: false, state: 'FORBIDDEN_SCHEDULE', expected_schedule: EXPECTED_SCHEDULE }, { status: 403 })
  }

  const workerId = `base44-bridge-${crypto.randomUUID()}`
  let job: BridgeJob | null = null
  try {
    job = await claimJob(workerId)
    if (!job) {
      return NextResponse.json({ ok: true, state: 'IDLE', worker_id: workerId, timestamp: new Date().toISOString() })
    }

    const result = await callBase44(job)
    const finished = await finishJob(job, true, result)
    const receipt = await writeReceipt(job, true, {
      worker_id: workerId,
      attempts: job.attempts,
      result,
      finished_state: finished.state,
    })
    return NextResponse.json({
      ok: true,
      state: 'BASE44_GITHUB_ROUNDTRIP_COMPLETED',
      worker_id: workerId,
      job_key: job.job_key,
      receipt_id: receipt?.id || null,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (job) {
      try {
        const finished = await finishJob(job, false, undefined, message)
        await writeReceipt(job, false, {
          worker_id: workerId,
          attempts: job.attempts,
          error: message,
          finished_state: finished.state,
        })
      } catch {
        // Preserve the original execution failure in the response.
      }
    }
    return NextResponse.json({
      ok: false,
      state: 'BASE44_GITHUB_ROUNDTRIP_FAILED',
      worker_id: workerId,
      job_key: job?.job_key || null,
      error: message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}
