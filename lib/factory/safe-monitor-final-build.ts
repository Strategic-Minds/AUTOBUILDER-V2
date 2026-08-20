import { monitorNativeBuild, rollbackNativeBuild } from './native-build-adapter'
import { readProductionReleaseApproval } from './production-release-guard'

type JsonRecord = Record<string, unknown>
type WorkflowJob = {
  id: string
  project_id: string
  type: string
  payload: JsonRecord
  lease_token: string | null
}
type Project = {
  id: string
  status: string
  website_url: string | null
  production_locked: boolean
  metadata: JsonRecord
}

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Factory database is not configured')
  return { url, key }
}

async function db<T>(path: string, method = 'GET', body?: unknown, prefer = 'return=representation'): Promise<T> {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const raw = await response.text()
  if (!response.ok) throw new Error(`Database ${method} failed ${response.status}: ${raw.slice(0, 600)}`)
  return (raw ? JSON.parse(raw) : null) as T
}

async function rpc<T>(name: string, body: JsonRecord): Promise<T> {
  try { return await db<T>(`rpc/${name}`, 'POST', body) }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('PGRST202') || message.includes('Could not find the function')) throw new Error(`FACTORY_QUEUE_MIGRATION_REQUIRED: ${name}`)
    throw error
  }
}

const enc = encodeURIComponent
function text(record: JsonRecord, names: string[]) {
  for (const name of names) {
    const value = record[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}
function number(record: JsonRecord, names: string[]) {
  for (const name of names) {
    const value = record[name]
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
}

async function patchProject(projectId: string, patch: JsonRecord) {
  return db<Project[]>(`xab_v3_projects?id=eq.${enc(projectId)}`, 'PATCH', { ...patch, updated_at: new Date().toISOString() })
}

async function receipt(projectId: string, kind: string, passed: boolean, details: JsonRecord) {
  return db('xab_v3_receipts', 'POST', { project_id: projectId, kind, passed, details })
}

async function queueMonitor(projectId: string, payload: JsonRecord, step: string) {
  return db(
    'xab_v3_workflow_jobs?on_conflict=idempotency_key',
    'POST',
    {
      project_id: projectId,
      type: 'monitor_final_build',
      step,
      idempotency_key: `monitor:safe:${step}:${projectId}:${Date.now()}`,
      payload,
      state: 'queued',
      max_attempts: 5,
    },
    'resolution=ignore-duplicates,return=representation',
  )
}

async function finish(job: WorkflowJob, succeeded: boolean, result?: JsonRecord, error?: string) {
  if (!job.lease_token) throw new Error('Workflow job has no lease token')
  const rows = await rpc<Array<{ id: string }>>('xab_v3_finish_workflow_job', {
    p_job_id: job.id,
    p_lease_token: job.lease_token,
    p_succeeded: succeeded,
    p_result: result || null,
    p_error: error || null,
    p_retry_delay_seconds: 30,
  })
  if (!rows[0]) throw new Error('Workflow job finish returned no record')
}

export async function processMonitorFinalBuildSafely(job: WorkflowJob) {
  const projects = await db<Project[]>(`xab_v3_projects?id=eq.${enc(job.project_id)}&limit=1`)
  const project = projects[0]
  if (!project) throw new Error('Workflow project is missing')

  const metadata = project.metadata || {}
  const start = metadata.native_build_start && typeof metadata.native_build_start === 'object' ? metadata.native_build_start as JsonRecord : {}
  const payload = job.payload || {}
  const phase: 'preview' | 'production' = text(payload, ['phase']) === 'production' ? 'production' : 'preview'
  const deploymentId = text(payload, ['deployment_id']) || text(start, ['deployment_id', 'run_id'])
  const repository = text(payload, ['repository']) || text(start, ['repository'])
  const branch = text(payload, ['branch']) || text(start, ['branch'])
  const pullRequestUrl = text(payload, ['pull_request_url']) || text(start, ['pull_request_url'])
  const pullRequestNumber = number(payload, ['pull_request_number']) || number(start, ['pull_request_number'])
  const vercelProjectId = text(payload, ['vercel_project_id']) || text(start, ['vercel_project_id'])
  const previousProductionDeploymentId = text(payload, ['previous_production_deployment_id']) || text(start, ['previous_production_deployment_id'])
  if (!deploymentId || !repository || !branch || !pullRequestUrl || !pullRequestNumber || !vercelProjectId) throw new Error('Native build monitor is missing durable deployment metadata')

  if (phase === 'production') {
    const approval = readProductionReleaseApproval(metadata)
    if (!approval || approval.receipt_id !== text(payload, ['approval_receipt_id'])) {
      const result = { ok: false, state: 'BLOCKED_PRODUCTION_APPROVAL_REQUIRED', production_locked: true }
      await receipt(project.id, 'production_monitor_blocked_without_approval', false, result)
      await finish(job, true, result)
      return result
    }
  }

  const monitorInput = { deploymentId, repository, branch, pullRequestUrl, pullRequestNumber, vercelProjectId, projectId: project.id, previousProductionDeploymentId, phase }
  const result = await monitorNativeBuild(monitorInput)
  const state = String(result.state || '').toUpperCase()
  const terminal = ['RELEASE_CANDIDATE', 'PRODUCTION_READY', 'VALIDATION_FAILED', 'ERROR', 'CANCELED', 'CANCELLED'].includes(state)

  if (!terminal) {
    await patchProject(project.id, { status: 'generating', website_url: result.production_url || result.preview_url, metadata: { ...metadata, native_build_start: start, native_build_status: result }, production_locked: true })
    await queueMonitor(project.id, payload, phase === 'production' ? 'production-smoke' : 'validation')
    const outcome = { pending: true, phase, state, url: result.production_url || result.preview_url, production_locked: true }
    await finish(job, true, outcome)
    return outcome
  }

  if (!result.ok) {
    let rollback: JsonRecord | null = null
    if (phase === 'production') rollback = await rollbackNativeBuild(vercelProjectId, previousProductionDeploymentId, `XAB production validation failed: ${state}`) as JsonRecord
    await receipt(project.id, phase === 'production' ? 'production_smoke_failed' : 'final_preview_validation_failed', false, { state, browser_evidence: result.browser_evidence, runtime_evidence: result.runtime_evidence, rollback: rollback || result.rollback, production_locked: true })
    throw new Error(`Native ${phase} build failed validation with state ${state}`)
  }

  if (phase === 'preview' && state === 'RELEASE_CANDIDATE') {
    const outcome = { ok: true, state: 'AWAITING_PRODUCTION_APPROVAL', preview_url: result.preview_url, production_locked: true }
    await patchProject(project.id, {
      status: 'waiting_for_approval',
      website_url: result.preview_url,
      metadata: { ...metadata, native_build_start: start, preview_validation: result, production_release_state: 'AWAITING_PRODUCTION_APPROVAL' },
      production_locked: true,
    })
    await receipt(project.id, 'production_release_approval_required', true, {
      preview_url: result.preview_url,
      repository: result.repository,
      branch: result.branch,
      pull_request_url: result.pull_request_url,
      browser_evidence: result.browser_evidence,
      runtime_evidence: result.runtime_evidence,
      rollback: result.rollback,
      production_release_state: 'AWAITING_PRODUCTION_APPROVAL',
      production_locked: true,
    })
    await finish(job, true, outcome)
    return outcome
  }

  if (phase === 'production' && state === 'PRODUCTION_READY') {
    const outcome = { ok: true, state: 'PRODUCTION_VALIDATED_AWAITING_FINAL_UNLOCK', production_url: result.production_url, production_locked: true }
    await patchProject(project.id, {
      status: 'waiting_for_approval',
      website_url: result.production_url,
      metadata: { ...metadata, native_build_start: start, production_validation: result, production_release_state: 'AWAITING_FINAL_UNLOCK' },
      production_locked: true,
    })
    await receipt(project.id, 'production_smoke_passed_awaiting_final_unlock', true, { ...outcome, browser_evidence: result.browser_evidence, runtime_evidence: result.runtime_evidence, rollback: result.rollback })
    await finish(job, true, outcome)
    return outcome
  }

  throw new Error(`Unexpected safe monitor terminal state ${state}`)
}
