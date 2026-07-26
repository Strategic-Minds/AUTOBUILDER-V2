type JsonRecord = Record<string, unknown>

const MISSION_ID = 'UASF-V7-20260726-001'

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Resilience database is not configured')
  return { url, key }
}

async function db<T>(path: string, method = 'GET', body?: unknown, prefer = 'return=representation'): Promise<T> {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const raw = await response.text()
  let parsed: unknown = null
  if (raw) { try { parsed = JSON.parse(raw) } catch { parsed = raw } }
  if (!response.ok) throw new Error(`Resilience database ${method} failed ${response.status}: ${raw.slice(0, 500)}`)
  return parsed as T
}

export async function createRun(cycleId: string) {
  const rows = await db<Array<{ id: string }>>('xro_runs', 'POST', {
    mission_id: MISSION_ID,
    cycle_id: cycleId,
    state: 'running',
    score: 0,
    release_gate: 'REPAIR_REQUIRED',
  })
  if (!rows[0]) throw new Error('Resilience run creation returned no row')
  return rows[0]
}

export async function saveBrowserJob(runId: string, externalJobId: string, viewport: string, request: JsonRecord) {
  const rows = await db<Array<{ id: string }>>('xro_browser_jobs', 'POST', {
    run_id: runId,
    external_job_id: externalJobId,
    viewport,
    state: 'running',
    request,
  })
  return rows[0]
}

export async function finishBrowserJob(externalJobId: string, passed: boolean, result: JsonRecord, error?: string) {
  return db(`xro_browser_jobs?external_job_id=eq.${encodeURIComponent(externalJobId)}`, 'PATCH', {
    state: passed ? 'completed' : 'failed',
    result,
    last_error: error || null,
    updated_at: new Date().toISOString(),
  })
}

export async function finishRun(runId: string, input: { score: number; releaseGate: string; findings: unknown[]; browserEvidence: JsonRecord; error?: string }) {
  return db(`xro_runs?id=eq.${encodeURIComponent(runId)}`, 'PATCH', {
    state: input.error ? 'failed' : 'completed',
    score: input.score,
    release_gate: input.releaseGate,
    findings: input.findings,
    browser_evidence: input.browserEvidence,
    error: input.error || null,
    updated_at: new Date().toISOString(),
  })
}

export async function saveReceipt(runId: string, kind: string, passed: boolean, details: JsonRecord) {
  const rows = await db<Array<{ id: string }>>('xro_receipts', 'POST', { run_id: runId, kind, passed, details })
  return rows[0]
}

export async function latestRun() {
  const rows = await db<JsonRecord[]>(`xro_runs?mission_id=eq.${MISSION_ID}&order=created_at.desc&limit=1`)
  return rows[0] || null
}
