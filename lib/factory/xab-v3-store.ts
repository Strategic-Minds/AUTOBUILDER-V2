import { monitorNativeBuild, promoteNativeBuild, rollbackNativeBuild, startNativeBuild } from './native-build-adapter'
import { buildBrandOptions, buildWebsiteOptions } from './pack-generator'

type JsonRecord = Record<string, unknown>

type ProjectRow = {
  id: string
  owner_email: string
  name: string
  client_name: string
  industry: string
  region: string
  website_url: string | null
  status: 'queued' | 'research' | 'generating' | 'waiting_for_approval' | 'approved' | 'failed' | 'archived'
  production_locked: boolean
  metadata: JsonRecord
  created_at: string
  updated_at: string
}

type WorkflowJobRow = {
  id: string
  project_id: string
  type: string
  state: 'queued' | 'running' | 'waiting_for_approval' | 'completed' | 'failed' | 'cancelled'
  step: string
  idempotency_key: string
  payload: JsonRecord
  result: JsonRecord | null
  attempts: number
  max_attempts: number
  lease_owner: string | null
  lease_expires_at: string | null
  available_at: string
  lease_token: string | null
  last_heartbeat_at: string | null
  finished_at: string | null
  dead_lettered_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

const CLEAN_ROOM_PROJECT = 'XAB_CLEAN_ROOM_PROOF_20260726'

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
  })
  const raw = await response.text()
  let parsed: unknown = null
  if (raw) { try { parsed = JSON.parse(raw) } catch { parsed = raw } }
  if (!response.ok) throw new Error(`Database ${method} failed ${response.status}: ${raw.slice(0, 600)}`)
  return parsed as T
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

async function patchProject(projectId: string, patch: JsonRecord) {
  const rows = await db<ProjectRow[]>(`xab_v3_projects?id=eq.${enc(projectId)}`, 'PATCH', { ...patch, updated_at: new Date().toISOString() })
  if (!rows[0]) throw new Error(`Project ${projectId} could not be updated`)
  return rows[0]
}

async function receipt(projectId: string, kind: string, passed: boolean, details: JsonRecord, correlationId?: string) {
  const rows = await db<Array<{ id: string }>>('xab_v3_receipts', 'POST', {
    project_id: projectId,
    kind,
    passed,
    correlation_id: correlationId || null,
    details,
  })
  return rows[0] || null
}

async function queueJob(projectId: string, type: string, step: string, idempotencyKey: string, payload: JsonRecord = {}, maxAttempts = 3) {
  const rows = await db<WorkflowJobRow[]>(
    'xab_v3_workflow_jobs?on_conflict=idempotency_key',
    'POST',
    { project_id: projectId, type, step, idempotency_key: idempotencyKey, payload, state: 'queued', max_attempts: maxAttempts },
    'resolution=ignore-duplicates,return=representation',
  )
  return rows[0] || null
}

async function pendingApproval(projectId: string, kind: 'logo' | 'website') {
  const rows = await db<Array<{ id: string; state: string }>>(`xab_v3_approval_requests?project_id=eq.${enc(projectId)}&kind=eq.${kind}&state=eq.pending&order=created_at.desc&limit=1`)
  return rows[0] || null
}

async function ensureApproval(projectId: string, kind: 'logo' | 'website') {
  const existing = await pendingApproval(projectId, kind)
  if (existing) return existing
  const rows = await db<Array<{ id: string; state: string }>>('xab_v3_approval_requests', 'POST', { project_id: projectId, kind, state: 'pending' })
  return rows[0]
}

async function selectedOption(projectId: string, kind: 'logo' | 'website') {
  const table = kind === 'logo' ? 'xab_v3_logo_options' : 'xab_v3_website_options'
  const approvals = await db<Array<{ selected_option: number }>>(`xab_v3_approval_requests?project_id=eq.${enc(projectId)}&kind=eq.${kind}&state=eq.approved&order=created_at.desc&limit=1`)
  const selected = approvals[0]?.selected_option
  if (!selected) throw new Error(`No approved ${kind} option exists`)
  const rows = await db<JsonRecord[]>(`${table}?project_id=eq.${enc(projectId)}&option_number=eq.${selected}&limit=1`)
  if (!rows[0]) throw new Error(`Approved ${kind} option is missing`)
  return rows[0]
}

function testAutoApproval(project: ProjectRow) {
  return project.name === CLEAN_ROOM_PROJECT && project.metadata?.test_auto_approval === true
}

export async function listProjects(ownerEmail: string) {
  return db<ProjectRow[]>(`xab_v3_projects?owner_email=eq.${enc(ownerEmail)}&order=created_at.desc&limit=100`)
}

export async function getProjectBundle(projectId: string, ownerEmail: string) {
  const projects = await db<ProjectRow[]>(`xab_v3_projects?id=eq.${enc(projectId)}&owner_email=eq.${enc(ownerEmail)}&limit=1`)
  const project = projects[0]
  if (!project) throw new Error('Project not found')
  const [logos, websites, approvals, jobs, receipts] = await Promise.all([
    db<JsonRecord[]>(`xab_v3_logo_options?project_id=eq.${enc(projectId)}&order=option_number.asc`),
    db<JsonRecord[]>(`xab_v3_website_options?project_id=eq.${enc(projectId)}&order=option_number.asc`),
    db<JsonRecord[]>(`xab_v3_approval_requests?project_id=eq.${enc(projectId)}&order=created_at.desc`),
    db<JsonRecord[]>(`xab_v3_workflow_jobs?project_id=eq.${enc(projectId)}&order=created_at.desc&limit=100`),
    db<JsonRecord[]>(`xab_v3_receipts?project_id=eq.${enc(projectId)}&order=created_at.desc&limit=100`),
  ])
  return { project, logos, websites, approvals, jobs, receipts }
}

export async function createProject(input: { name: string; clientName: string; industry: string; region: string; services: string; brief: string }, ownerEmail: string) {
  const correlationId = `project-${crypto.randomUUID()}`
  const rows = await db<ProjectRow[]>('xab_v3_projects', 'POST', {
    owner_email: ownerEmail,
    name: input.name,
    client_name: input.clientName,
    industry: input.industry,
    region: input.region,
    status: 'queued',
    production_locked: true,
    metadata: { services: input.services, brief: input.brief, correlation_id: correlationId, operating_model: 'minimal-input-brand-approval-web-approval-production-build' },
  })
  const project = rows[0]
  if (!project) throw new Error('Project creation returned no record')
  await queueJob(project.id, 'generate_brand_options', 'brand', `brand:${project.id}`, { correlation_id: correlationId })
  await receipt(project.id, 'project_created', true, { production_locked: true }, correlationId)
  return project
}

export async function approveOption(input: { projectId: string; kind: 'logo' | 'website'; option: number; comment?: string; actor: string; ownerEmail: string; testAutoApproval?: boolean }) {
  if (![1, 2, 3].includes(input.option)) throw new Error('Option must be 1, 2, or 3')
  return rpc<JsonRecord>('xab_v3_approve_option', {
    p_project_id: input.projectId,
    p_kind: input.kind,
    p_option: input.option,
    p_comment: input.comment || '',
    p_actor: input.actor,
    p_owner_email: input.ownerEmail,
    p_test_auto_approval: input.testAutoApproval === true,
  })
}

async function generateBrandOptions(project: ProjectRow) {
  const options = buildBrandOptions(project).map((option) => ({ project_id: project.id, ...option, config: { ...option.config, generation_mode: 'deterministic_complete_pack_v2' } }))
  await db('xab_v3_logo_options?on_conflict=project_id,option_number', 'POST', options, 'resolution=merge-duplicates,return=representation')
  await ensureApproval(project.id, 'logo')
  await patchProject(project.id, { status: 'waiting_for_approval' })
  await receipt(project.id, 'brand_options_generated', true, { options: 3, generation_mode: 'deterministic_complete_pack_v2' })
  if (testAutoApproval(project)) {
    await approveOption({ projectId: project.id, kind: 'logo', option: 1, actor: 'XAB clean-room test runner', ownerEmail: project.owner_email, comment: 'Explicit test-only approval', testAutoApproval: true })
    await receipt(project.id, 'brand_test_auto_approved', true, { selected_option: 1, test_auto_approval: true })
  }
  return { options: 3, generation_mode: 'deterministic_complete_pack_v2', test_auto_approved: testAutoApproval(project) }
}

async function generateWebsiteOptions(project: ProjectRow) {
  const logo = await selectedOption(project.id, 'logo')
  const options = buildWebsiteOptions(project, logo).map((option) => ({ project_id: project.id, ...option, config: { ...option.config, generation_mode: 'deterministic_complete_pack_v2' } }))
  await db('xab_v3_website_options?on_conflict=project_id,option_number', 'POST', options, 'resolution=merge-duplicates,return=representation')
  await ensureApproval(project.id, 'website')
  await patchProject(project.id, { status: 'waiting_for_approval' })
  await receipt(project.id, 'website_options_generated', true, { options: 3, generation_mode: 'deterministic_complete_pack_v2' })
  if (testAutoApproval(project)) {
    await approveOption({ projectId: project.id, kind: 'website', option: 1, actor: 'XAB clean-room test runner', ownerEmail: project.owner_email, comment: 'Explicit test-only approval', testAutoApproval: true })
    await receipt(project.id, 'website_test_auto_approved', true, { selected_option: 1, test_auto_approval: true })
  }
  return { options: 3, generation_mode: 'deterministic_complete_pack_v2', test_auto_approved: testAutoApproval(project) }
}

function textValue(record: JsonRecord, names: string[]) {
  for (const name of names) { const value = record[name]; if (typeof value === 'string' && value.trim()) return value.trim() }
  return null
}

function numberValue(record: JsonRecord, names: string[]) {
  for (const name of names) { const value = record[name]; if (typeof value === 'number' && Number.isFinite(value)) return value }
  return null
}

async function startFinalBuild(project: ProjectRow) {
  const [logo, website] = await Promise.all([selectedOption(project.id, 'logo'), selectedOption(project.id, 'website')])
  const metadata = project.metadata || {}
  const result = await startNativeBuild({
    projectId: project.id,
    projectName: project.name,
    clientName: project.client_name,
    industry: project.industry,
    region: project.region,
    services: textValue(metadata, ['services']) || '',
    brief: textValue(metadata, ['brief']) || '',
    approvedBrand: logo,
    approvedWebsite: website,
    outputRepository: textValue(metadata, ['output_repository', 'output_repo']) || undefined,
    allowCreateRepository: metadata.allow_output_repository_create === true,
    allowCreateVercelProject: metadata.allow_vercel_project_create === true,
  })
  await patchProject(project.id, { status: 'generating', website_url: result.preview_url, metadata: { ...metadata, native_build_start: result, native_run_id: result.run_id }, production_locked: true })
  await queueJob(project.id, 'monitor_final_build', 'validation', `monitor:preview:${project.id}:${Date.now()}`, {
    phase: 'preview',
    project_id: project.id,
    deployment_id: result.deployment_id,
    repository: result.repository,
    branch: result.branch,
    pull_request_url: result.pull_request_url,
    pull_request_number: result.pull_request_number,
    vercel_project_id: result.vercel_project_id,
    previous_production_deployment_id: result.previous_production_deployment_id,
  }, 5)
  await receipt(project.id, 'final_build_started', true, { ...result, production_locked: true })
  return result as unknown as JsonRecord
}

async function monitorFinalBuild(project: ProjectRow, payload: JsonRecord) {
  const metadata = project.metadata || {}
  const start = metadata.native_build_start && typeof metadata.native_build_start === 'object' ? metadata.native_build_start as JsonRecord : {}
  const phase: 'preview' | 'production' = textValue(payload, ['phase']) === 'production' ? 'production' : 'preview'
  const deploymentId = textValue(payload, ['deployment_id']) || textValue(start, ['deployment_id', 'run_id'])
  const repository = textValue(payload, ['repository']) || textValue(start, ['repository'])
  const branch = textValue(payload, ['branch']) || textValue(start, ['branch'])
  const pullRequestUrl = textValue(payload, ['pull_request_url']) || textValue(start, ['pull_request_url'])
  const pullRequestNumber = numberValue(payload, ['pull_request_number']) || numberValue(start, ['pull_request_number'])
  const vercelProjectId = textValue(payload, ['vercel_project_id']) || textValue(start, ['vercel_project_id'])
  const previousProductionDeploymentId = textValue(payload, ['previous_production_deployment_id']) || textValue(start, ['previous_production_deployment_id'])
  if (!deploymentId || !repository || !branch || !pullRequestUrl || !pullRequestNumber || !vercelProjectId) throw new Error('Native build monitor is missing durable deployment metadata')

  const monitorInput = { deploymentId, repository, branch, pullRequestUrl, pullRequestNumber, vercelProjectId, projectId: project.id, previousProductionDeploymentId, phase }
  const result = await monitorNativeBuild(monitorInput)
  const state = String(result.state || '').toUpperCase()
  const terminalStates = phase === 'production' ? ['PRODUCTION_READY', 'VALIDATION_FAILED', 'ERROR', 'CANCELED', 'CANCELLED'] : ['RELEASE_CANDIDATE', 'VALIDATION_FAILED', 'ERROR', 'CANCELED', 'CANCELLED']

  if (!terminalStates.includes(state)) {
    await patchProject(project.id, { status: 'generating', website_url: result.production_url || result.preview_url, metadata: { ...metadata, native_build_start: start, native_build_status: result }, production_locked: true })
    await queueJob(project.id, 'monitor_final_build', phase === 'production' ? 'production-smoke' : 'validation', `monitor:${phase}:${project.id}:${Date.now()}`, payload, 5)
    return { pending: true, phase, state, url: result.production_url || result.preview_url }
  }

  if (!result.ok) {
    let rollback: JsonRecord | null = null
    if (phase === 'production') rollback = await rollbackNativeBuild(vercelProjectId, previousProductionDeploymentId, `XAB production validation failed: ${state}`) as unknown as JsonRecord
    await receipt(project.id, phase === 'production' ? 'production_smoke_failed' : 'final_preview_validation_failed', false, { state, browser_evidence: result.browser_evidence, runtime_evidence: result.runtime_evidence, rollback: rollback || result.rollback, production_locked: true })
    throw new Error(`Native ${phase} build failed validation with state ${state}`)
  }

  if (phase === 'preview' && state === 'RELEASE_CANDIDATE') {
    await receipt(project.id, 'final_preview_ready', true, { preview_url: result.preview_url, repository: result.repository, branch: result.branch, pull_request_url: result.pull_request_url, browser_evidence: result.browser_evidence, runtime_evidence: result.runtime_evidence, visual_parity: result.visual_parity, structural_parity: result.structural_parity, operational_parity: result.operational_parity, contact_parity: result.contact_parity, critical_defects: result.critical_defects, high_defects: result.high_defects, rollback: result.rollback, production_locked: true })
    const promotion = await promoteNativeBuild(monitorInput)
    await patchProject(project.id, { status: 'generating', website_url: promotion.production_url, metadata: { ...metadata, native_build_start: start, preview_validation: result, production_promotion: promotion }, production_locked: true })
    await queueJob(project.id, 'monitor_final_build', 'production-smoke', `monitor:production:${project.id}:${Date.now()}`, { ...payload, phase: 'production', deployment_id: promotion.deployment_id, previous_production_deployment_id: promotion.previous_production_deployment_id }, 5)
    await receipt(project.id, 'production_promotion_started', true, { ...promotion, production_locked: true })
    return promotion as unknown as JsonRecord
  }

  if (phase === 'production' && state === 'PRODUCTION_READY') {
    await patchProject(project.id, { status: 'approved', website_url: result.production_url, metadata: { ...metadata, native_build_start: start, production_validation: result, production_completed_at: new Date().toISOString() }, production_locked: false })
    await receipt(project.id, 'production_release_complete', true, { production_url: result.production_url, repository: result.repository, branch: result.branch, pull_request_url: result.pull_request_url, browser_evidence: result.browser_evidence, runtime_evidence: result.runtime_evidence, structural_parity: result.structural_parity, operational_parity: result.operational_parity, contact_parity: result.contact_parity, critical_defects: result.critical_defects, high_defects: result.high_defects, rollback: result.rollback, production_locked: false })
    return result as unknown as JsonRecord
  }

  throw new Error(`Unexpected native build terminal state ${state}`)
}

export async function claimFactoryJob(workerId: string) {
  const rows = await rpc<WorkflowJobRow[]>('xab_v3_claim_workflow_job', { p_worker_id: workerId, p_lease_seconds: 240 })
  return rows[0] || null
}

export async function heartbeatFactoryJob(job: WorkflowJobRow) {
  if (!job.lease_token) throw new Error('Workflow job has no lease token')
  return rpc<boolean>('xab_v3_heartbeat_workflow_job', { p_job_id: job.id, p_lease_token: job.lease_token, p_lease_seconds: 240 })
}

async function finishFactoryJob(job: WorkflowJobRow, succeeded: boolean, result?: JsonRecord, error?: string) {
  if (!job.lease_token) throw new Error('Workflow job has no lease token')
  const rows = await rpc<WorkflowJobRow[]>('xab_v3_finish_workflow_job', { p_job_id: job.id, p_lease_token: job.lease_token, p_succeeded: succeeded, p_result: result || null, p_error: error || null, p_retry_delay_seconds: 30 })
  if (!rows[0]) throw new Error('Workflow job finish returned no record')
  return rows[0]
}

export async function processFactoryJob(job: WorkflowJobRow) {
  const projects = await db<ProjectRow[]>(`xab_v3_projects?id=eq.${enc(job.project_id)}&limit=1`)
  const project = projects[0]
  if (!project) throw new Error('Workflow project is missing')
  let result: JsonRecord
  if (job.type === 'generate_brand_options') result = await generateBrandOptions(project)
  else if (job.type === 'generate_website_options') result = await generateWebsiteOptions(project)
  else if (job.type === 'build_final_system') result = await startFinalBuild(project)
  else if (job.type === 'monitor_final_build') result = await monitorFinalBuild(project, job.payload || {})
  else throw new Error(`Unsupported workflow job ${job.type}`)
  await finishFactoryJob(job, true, result)
  return result
}

export async function failFactoryJob(job: WorkflowJobRow, error: string) {
  const finished = await finishFactoryJob(job, false, undefined, error.slice(0, 1200))
  const terminal = finished.state === 'failed'
  if (terminal) await patchProject(job.project_id, { status: 'failed' })
  await receipt(job.project_id, 'workflow_job_failed', false, { job_id: job.id, type: job.type, terminal, attempts: finished.attempts, max_attempts: finished.max_attempts, dead_lettered_at: finished.dead_lettered_at, error: error.slice(0, 1200) })
}
