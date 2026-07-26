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
  last_error: string | null
  created_at: string
  updated_at: string
}

function config() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('Factory database is not configured')
  return { url, key }
}

async function db<T>(path: string, method = 'GET', body?: unknown, prefer = 'return=representation'): Promise<T> {
  const { url, key } = config()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try { parsed = JSON.parse(text) } catch { parsed = text }
  }
  if (!response.ok) throw new Error(`Database ${method} failed ${response.status}: ${text.slice(0, 600)}`)
  return parsed as T
}

const enc = encodeURIComponent

async function patchProject(projectId: string, patch: JsonRecord) {
  const rows = await db<ProjectRow[]>(`xab_v3_projects?id=eq.${enc(projectId)}`, 'PATCH', {
    ...patch,
    updated_at: new Date().toISOString(),
  })
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

async function queueJob(projectId: string, type: string, step: string, idempotencyKey: string, payload: JsonRecord = {}) {
  const rows = await db<WorkflowJobRow[]>(
    'xab_v3_workflow_jobs?on_conflict=idempotency_key',
    'POST',
    { project_id: projectId, type, step, idempotency_key: idempotencyKey, payload, state: 'queued' },
    'resolution=ignore-duplicates,return=representation',
  )
  return rows[0] || null
}

async function pendingApproval(projectId: string, kind: 'logo' | 'website') {
  const rows = await db<Array<{ id: string; state: string }>>(
    `xab_v3_approval_requests?project_id=eq.${enc(projectId)}&kind=eq.${kind}&state=eq.pending&order=created_at.desc&limit=1`,
  )
  return rows[0] || null
}

async function ensureApproval(projectId: string, kind: 'logo' | 'website') {
  const existing = await pendingApproval(projectId, kind)
  if (existing) return existing
  const rows = await db<Array<{ id: string; state: string }>>('xab_v3_approval_requests', 'POST', {
    project_id: projectId,
    kind,
    state: 'pending',
  })
  return rows[0]
}

export async function listProjects(ownerEmail: string) {
  return db<ProjectRow[]>(
    `xab_v3_projects?owner_email=eq.${enc(ownerEmail)}&order=created_at.desc&limit=100`,
  )
}

export async function getProjectBundle(projectId: string, ownerEmail: string) {
  const projects = await db<ProjectRow[]>(
    `xab_v3_projects?id=eq.${enc(projectId)}&owner_email=eq.${enc(ownerEmail)}&limit=1`,
  )
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

export async function createProject(input: {
  name: string
  clientName: string
  industry: string
  region: string
  services: string
  brief: string
}, ownerEmail: string) {
  const correlationId = `project-${crypto.randomUUID()}`
  const rows = await db<ProjectRow[]>('xab_v3_projects', 'POST', {
    owner_email: ownerEmail,
    name: input.name,
    client_name: input.clientName,
    industry: input.industry,
    region: input.region,
    status: 'queued',
    production_locked: true,
    metadata: {
      services: input.services,
      brief: input.brief,
      correlation_id: correlationId,
      operating_model: 'minimal-input-brand-approval-web-approval-final-build',
    },
  })
  const project = rows[0]
  if (!project) throw new Error('Project creation returned no record')
  await queueJob(project.id, 'generate_brand_options', 'brand', `brand:${project.id}`, { correlation_id: correlationId })
  await receipt(project.id, 'project_created', true, { production_locked: true }, correlationId)
  return project
}

export async function approveOption(input: {
  projectId: string
  kind: 'logo' | 'website'
  option: number
  comment?: string
  actor: string
  ownerEmail: string
}) {
  if (![1, 2, 3].includes(input.option)) throw new Error('Option must be 1, 2, or 3')
  const bundle = await getProjectBundle(input.projectId, input.ownerEmail)
  const approval = await pendingApproval(input.projectId, input.kind)
  if (!approval) throw new Error(`No pending ${input.kind} approval exists`)
  const confirmedAt = new Date().toISOString()
  await db(`xab_v3_approval_requests?id=eq.${enc(approval.id)}`, 'PATCH', {
    state: 'approved',
    selected_option: input.option,
    comment: input.comment || null,
    confirmed_by: input.actor,
    confirmed_at: confirmedAt,
    updated_at: confirmedAt,
  })
  await db('xab_v3_approval_decisions', 'POST', {
    approval_id: approval.id,
    decision: 'approved',
    selected_option: input.option,
    comment: input.comment || null,
    confirmed_by: input.actor,
  })
  const metadata = { ...(bundle.project.metadata || {}) }
  if (input.kind === 'logo') {
    await patchProject(input.projectId, { status: 'generating', metadata: { ...metadata, approved_logo_option: input.option } })
    await queueJob(input.projectId, 'generate_website_options', 'website', `website:${input.projectId}`, {
      approved_logo_option: input.option,
    })
  } else {
    await patchProject(input.projectId, { status: 'approved', metadata: { ...metadata, approved_website_option: input.option } })
    await queueJob(input.projectId, 'build_final_system', 'build', `build:${input.projectId}`, {
      approved_website_option: input.option,
    })
  }
  await receipt(input.projectId, `${input.kind}_approved`, true, {
    option: input.option,
    actor: input.actor,
    production_locked: true,
  })
  return { approval_id: approval.id, selected_option: input.option }
}

function fallbackBrandOptions(project: ProjectRow) {
  return [
    {
      option_number: 1,
      config: {
        label: 'Premium Precision',
        positioning: 'High-trust premium operator',
        palette: ['#FFFFFF', '#111111', '#D4AF37'],
        typography: 'Modern geometric sans with restrained display accents',
        logo_direction: 'Crisp monogram and wordmark system',
        voice: 'Confident, direct, technically credible',
        project: project.name,
      },
    },
    {
      option_number: 2,
      config: {
        label: 'Modern Authority',
        positioning: 'Clean enterprise-grade category leader',
        palette: ['#F8F9FB', '#171717', '#C7CCD4'],
        typography: 'Editorial grotesk with generous spacing',
        logo_direction: 'Minimal symbol with flexible horizontal lockup',
        voice: 'Clear, calm, outcome-focused',
        project: project.name,
      },
    },
    {
      option_number: 3,
      config: {
        label: 'Bold Local Leader',
        positioning: 'Memorable regional market leader',
        palette: ['#FFFFFF', '#090909', '#D4AF37'],
        typography: 'Strong condensed display paired with neutral body type',
        logo_direction: 'Distinctive badge and simplified app mark',
        voice: 'Energetic, practical, conversion-focused',
        project: project.name,
      },
    },
  ]
}

function fallbackWebsiteOptions(project: ProjectRow) {
  return [
    {
      option_number: 1,
      label: 'Precision Funnel',
      preview_url: null,
      config: {
        layout: 'Luxury minimal landing page with proof-first conversion funnel',
        sections: ['Hero', 'Trust proof', 'Services', 'Process', 'Gallery', 'Estimator CTA', 'FAQ', 'Contact'],
        interaction: 'Fast, restrained motion and strong mobile actions',
        project: project.name,
      },
    },
    {
      option_number: 2,
      label: 'Editorial Authority',
      preview_url: null,
      config: {
        layout: 'Editorial storytelling with case studies and market authority',
        sections: ['Hero', 'Featured work', 'Capabilities', 'Case studies', 'Why us', 'Resources', 'Consultation CTA'],
        interaction: 'Cinematic content transitions with accessible navigation',
        project: project.name,
      },
    },
    {
      option_number: 3,
      label: 'Conversion Command',
      preview_url: null,
      config: {
        layout: 'High-conversion service funnel with instant quote path',
        sections: ['Offer hero', 'Service selector', 'Visual proof', 'Reviews', 'Quote steps', 'Guarantees', 'Final CTA'],
        interaction: 'Sticky mobile actions and guided intake',
        project: project.name,
      },
    },
  ]
}

function mcpConfig() {
  const url = process.env.AUTO_BUILDER_MCP_URL || process.env.UPSTREAM_MCP_URL || ''
  const token = process.env.AUTO_BUILDER_MCP_TOKEN || process.env.UPSTREAM_MCP_TOKEN || process.env.AUTO_BUILDER_BRIDGE_TOKEN || ''
  if (!url) throw new Error('AUTO_BUILDER_MCP_URL is not configured')
  return { url, token }
}

function unwrapMcp(value: unknown): JsonRecord {
  const root = (value && typeof value === 'object' ? value : {}) as JsonRecord
  const result = (root.result && typeof root.result === 'object' ? root.result : root) as JsonRecord
  const content = Array.isArray(result.content) ? result.content : []
  const first = content[0]
  if (first && typeof first === 'object' && typeof (first as JsonRecord).text === 'string') {
    try { return JSON.parse(String((first as JsonRecord).text)) as JsonRecord } catch { return { text: (first as JsonRecord).text } }
  }
  return result
}

async function callMcp(name: string, args: JsonRecord) {
  const { url, token } = mcpConfig()
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(55_000),
  })
  const text = await response.text()
  let parsed: unknown = text
  try { parsed = text ? JSON.parse(text) : {} } catch { /* keep text */ }
  if (!response.ok) throw new Error(`Auto Builder MCP ${name} failed ${response.status}: ${text.slice(0, 600)}`)
  const root = parsed as JsonRecord
  if (root.isError) throw new Error(`Auto Builder MCP ${name} returned an error`)
  return unwrapMcp(parsed)
}

async function selectedOption(projectId: string, kind: 'logo' | 'website') {
  const approvals = await db<Array<{ selected_option: number | null }>>(
    `xab_v3_approval_requests?project_id=eq.${enc(projectId)}&kind=eq.${kind}&state=eq.approved&order=confirmed_at.desc&limit=1`,
  )
  const number = approvals[0]?.selected_option
  if (!number) throw new Error(`Approved ${kind} option is missing`)
  const table = kind === 'logo' ? 'xab_v3_logo_options' : 'xab_v3_website_options'
  const rows = await db<JsonRecord[]>(`${table}?project_id=eq.${enc(projectId)}&option_number=eq.${number}&limit=1`)
  if (!rows[0]) throw new Error(`Selected ${kind} option record is missing`)
  return rows[0]
}

async function generateBrandOptions(project: ProjectRow) {
  let providerOutput: JsonRecord | null = null
  try {
    providerOutput = await callMcp('run_swarm', {
      job_id: `brand:${project.id}`,
      mission: `Create exactly three distinct brand pack specifications for ${project.client_name}, a ${project.industry} business in ${project.region}. Return structured, implementation-ready directions for logo, palette, typography, imagery, messaging, and brand voice. Do not deploy or publish.`,
      mode: 'execute',
      requested_outputs: ['three_brand_packs'],
      production_mutation: false,
    })
  } catch (error) {
    providerOutput = { fallback: true, reason: error instanceof Error ? error.message : String(error) }
  }
  const options = fallbackBrandOptions(project).map((option) => ({
    project_id: project.id,
    ...option,
    config: { ...option.config, provider_output: providerOutput },
  }))
  await db('xab_v3_logo_options?on_conflict=project_id,option_number', 'POST', options, 'resolution=merge-duplicates,return=representation')
  await ensureApproval(project.id, 'logo')
  await patchProject(project.id, { status: 'waiting_for_approval' })
  await receipt(project.id, 'brand_options_generated', true, { options: 3, provider_output: providerOutput })
  return { options: 3 }
}

async function generateWebsiteOptions(project: ProjectRow) {
  const logo = await selectedOption(project.id, 'logo')
  let providerOutput: JsonRecord | null = null
  try {
    providerOutput = await callMcp('run_swarm', {
      job_id: `website-options:${project.id}`,
      mission: `Create exactly three distinct website packs for ${project.client_name}. Use the approved brand direction provided in the payload. Each pack must define homepage structure, funnel, responsive behavior, content direction, calls to action, trust proof, and application requirements. Do not deploy or publish.`,
      mode: 'execute',
      approved_brand: logo,
      requested_outputs: ['three_website_packs'],
      production_mutation: false,
    })
  } catch (error) {
    providerOutput = { fallback: true, reason: error instanceof Error ? error.message : String(error) }
  }
  const options = fallbackWebsiteOptions(project).map((option) => ({
    project_id: project.id,
    ...option,
    config: { ...option.config, approved_brand: logo, provider_output: providerOutput },
  }))
  await db('xab_v3_website_options?on_conflict=project_id,option_number', 'POST', options, 'resolution=merge-duplicates,return=representation')
  await ensureApproval(project.id, 'website')
  await patchProject(project.id, { status: 'waiting_for_approval' })
  await receipt(project.id, 'website_options_generated', true, { options: 3, provider_output: providerOutput })
  return { options: 3 }
}

function textValue(record: JsonRecord, names: string[]) {
  for (const name of names) {
    const value = record[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

async function startFinalBuild(project: ProjectRow) {
  const [logo, website] = await Promise.all([
    selectedOption(project.id, 'logo'),
    selectedOption(project.id, 'website'),
  ])
  const result = await callMcp('run_swarm', {
    job_id: `final-build:${project.id}`,
    idea_id: project.id,
    mission: `Build the complete production-quality website or application for ${project.client_name}, a ${project.industry} business in ${project.region}. Implement the approved brand pack and approved website pack exactly. Create a GitHub implementation branch, deploy a Vercel preview, test desktop, tablet, mobile, routes, buttons, forms, console, network, accessibility, and PWA behavior, run controlled repairs, attach receipts, and stop before production promotion.`,
    project_key: 'XTREME_AI_BUILDER',
    mode: 'execute',
    approved_brand: logo,
    approved_website: website,
    production_mutation: false,
    requested_outputs: ['github_branch', 'pull_request', 'vercel_preview', 'validation_receipts', 'rollback_receipt'],
  })
  const runId = textValue(result, ['run_id', 'id', 'job_id'])
  if (!runId) throw new Error('Auto Builder returned no durable run ID')
  await patchProject(project.id, {
    status: 'generating',
    metadata: { ...(project.metadata || {}), upstream_run_id: runId, upstream_start: result },
  })
  await queueJob(project.id, 'monitor_final_build', 'validation', `monitor:${project.id}:${Math.floor(Date.now() / 300000)}`, { run_id: runId })
  await receipt(project.id, 'final_build_started', true, { run_id: runId, production_locked: true })
  return { run_id: runId }
}

async function monitorFinalBuild(project: ProjectRow, payload: JsonRecord) {
  const runId = typeof payload.run_id === 'string' ? payload.run_id : textValue(project.metadata || {}, ['upstream_run_id'])
  if (!runId) throw new Error('Monitor job has no run ID')
  const result = await callMcp('get_swarm_status', { run_id: runId })
  const state = String(result.status || result.state || '').toUpperCase()
  if (['FAILED', 'ERROR', 'CANCELLED', 'TERMINAL_FAILED'].includes(state)) {
    throw new Error(`Final build failed with state ${state}`)
  }
  if (!['COMPLETE', 'COMPLETED', 'SUCCESS', 'SUCCEEDED'].includes(state)) {
    await patchProject(project.id, { status: 'generating', metadata: { ...(project.metadata || {}), upstream_run_id: runId, upstream_status: result } })
    await queueJob(project.id, 'monitor_final_build', 'validation', `monitor:${project.id}:${Math.floor(Date.now() / 300000) + 1}`, { run_id: runId })
    return { pending: true, state }
  }
  const nested = result.result && typeof result.result === 'object' ? result.result as JsonRecord : {}
  const previewUrl = textValue(result, ['preview_url', 'vercel_preview_url']) || textValue(nested, ['preview_url', 'vercel_preview_url'])
  await patchProject(project.id, {
    status: 'waiting_for_approval',
    website_url: previewUrl,
    metadata: { ...(project.metadata || {}), upstream_run_id: runId, upstream_status: result, final_preview_url: previewUrl },
    production_locked: true,
  })
  await receipt(project.id, 'final_preview_ready', Boolean(previewUrl), { run_id: runId, preview_url: previewUrl, result, production_locked: true })
  return { complete: true, preview_url: previewUrl }
}

export async function claimFactoryJob(workerId: string) {
  const queued = await db<WorkflowJobRow[]>('xab_v3_workflow_jobs?state=eq.queued&order=created_at.asc&limit=5')
  for (const candidate of queued) {
    const claimed = await db<WorkflowJobRow[]>(
      `xab_v3_workflow_jobs?id=eq.${enc(candidate.id)}&state=eq.queued`,
      'PATCH',
      {
        state: 'running',
        lease_owner: workerId,
        lease_expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
        attempts: Number(candidate.attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      },
    )
    if (claimed[0]) return claimed[0]
  }
  return null
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
  await db(`xab_v3_workflow_jobs?id=eq.${enc(job.id)}`, 'PATCH', {
    state: 'completed',
    result,
    lease_owner: null,
    lease_expires_at: null,
    last_error: null,
    updated_at: new Date().toISOString(),
  })
  return result
}

export async function failFactoryJob(job: WorkflowJobRow, error: string) {
  const terminal = Number(job.attempts || 0) >= Number(job.max_attempts || 3)
  await db(`xab_v3_workflow_jobs?id=eq.${enc(job.id)}`, 'PATCH', {
    state: terminal ? 'failed' : 'queued',
    lease_owner: null,
    lease_expires_at: null,
    last_error: error.slice(0, 1200),
    updated_at: new Date().toISOString(),
  })
  if (terminal) await patchProject(job.project_id, { status: 'failed' })
  await receipt(job.project_id, 'workflow_job_failed', false, { job_id: job.id, type: job.type, terminal, error: error.slice(0, 1200) })
}
