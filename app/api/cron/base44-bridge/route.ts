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
  const root = configuredUrl.replace(/\/$/, '')
  if (!supabaseUrl || !supabaseKey) throw new Error('Base44 bridge database is not configured')
  if (!base44Token) throw new Error('Base44 outbound credential is not configured')
  return {
    supabaseUrl,
    supabaseKey,
    base44Token,
    base44Url: root.endsWith('/messages') ? root : `${root}/messages`,
  }
}

async function db<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const { supabaseUrl, supabaseKey } = config()
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  const text = await response.text()
  let data: unknown = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  if (!response.ok) throw new Error(`Bridge database ${method} failed ${response.status}: ${text.slice(0, 600)}`)
  return data as T
}

async function claim(worker: string) {
  const rows = await db<BridgeJob[]>('rpc/xab_claim_base44_bridge_job', 'POST', {
    p_worker_id: worker,
    p_lease_seconds: 240,
  })
  return rows[0] || null
}

async function finish(job: BridgeJob, ok: boolean, result?: JsonRecord, error?: string) {
  return db<JsonRecord>('rpc/xab_finish_base44_bridge_job', 'POST', {
    p_job_id: job.id,
    p_worker_id: job.lease_owner,
    p_succeeded: ok,
    p_result: result || null,
    p_error: error || null,
    p_retry_delay_seconds: 60,
  })
}

async function receipt(job: BridgeJob, passed: boolean, details: JsonRecord) {
  const rows = await db<Array<{ id: string }>>('xab_base44_bridge_receipts', 'POST', {
    job_id: job.id,
    job_key: job.job_key,
    passed,
    receipt_type: 'base44_gpt_github_roundtrip',
    details,
  })
  return rows[0] || null
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
        automatic_production_after_gates: true,
        production_locked_until_gates_pass: true,
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(55_000),
  })
  const text = await response.text()
  let output: JsonRecord = { content: text }
  try { output = text ? JSON.parse(text) : {} } catch { /* keep text */ }
  if (!response.ok) throw new Error(`Base44 agent failed ${response.status}: ${text.slice(0, 800)}`)
  return { status: response.status, output, correlation_id: correlationId }
}

async function run(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'agents:dispatch')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_target: true },
      { status: auth.http_status },
    )
  }

  const schedule = req.headers.get('x-vercel-cron-schedule')
  if (schedule && schedule !== EXPECTED_SCHEDULE) {
    return NextResponse.json(
      { ok: false, state: 'FORBIDDEN_SCHEDULE', expected_schedule: EXPECTED_SCHEDULE },
      { status: 403 },
    )
  }

  const worker = `base44-bridge-${crypto.randomUUID()}`
  let job: BridgeJob | null = null
  try {
    job = await claim(worker)
    if (!job) {
      return NextResponse.json({
        ok: true,
        state: 'IDLE',
        worker_id: worker,
        production_target: true,
        automatic_production_after_gates: true,
        timestamp: new Date().toISOString(),
      })
    }

    const result = await callBase44(job)
    const settled = await finish(job, true, result)
    const saved = await receipt(job, true, {
      worker_id: worker,
      attempts: job.attempts,
      result,
      settled,
      production_target: true,
    })
    return NextResponse.json({
      ok: true,
      state: 'BASE44_GPT_GITHUB_ROUNDTRIP_COMPLETED',
      worker_id: worker,
      job_key: job.job_key,
      receipt_id: saved?.id || null,
      result,
      production_target: true,
      automatic_production_after_gates: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (job) {
      try {
        const settled = await finish(job, false, undefined, message)
        await receipt(job, false, {
          worker_id: worker,
          attempts: job.attempts,
          error: message,
          settled,
          production_target: true,
        })
      } catch { /* preserve original failure */ }
    }
    return NextResponse.json(
      {
        ok: false,
        state: 'BASE44_GPT_GITHUB_ROUNDTRIP_FAILED',
        worker_id: worker,
        job_key: job?.job_key || null,
        error: message,
        production_target: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
