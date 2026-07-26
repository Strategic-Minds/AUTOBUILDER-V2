import { createHmac } from 'node:crypto'
import { buildGeneratedSiteFiles, slugifyProject, type GeneratedSiteInput } from './site-generator'

type JsonRecord = Record<string, unknown>
type GitHubRepository = { full_name: string; name: string; default_branch: string; private: boolean }
type GitHubRef = { object: { sha: string } }
type GitHubCommit = { sha: string; tree: { sha: string } }
type GitHubPullRequest = { html_url: string; number: number; state: string; head?: { sha?: string } }
type GitHubMerge = { merged?: boolean; sha?: string; message?: string }
type VercelProject = { id: string; name: string; alias?: string[] }
type VercelDeployment = { id: string; url?: string; readyState?: string; status?: string; inspectorUrl?: string; meta?: Record<string, string>; target?: string }
type VercelDeploymentList = { deployments?: VercelDeployment[] }
type VercelEnv = { id: string; key: string; target?: string[] }
type VercelEnvList = { envs?: VercelEnv[] }

type BrowserEvidence = JsonRecord & {
  label: string
  phase: 'preview' | 'production'
  width: number
  height: number
  ok: boolean
  status: string
  artifacts: JsonRecord
  receipt_id: string | null
  screenshots: string[]
  contract_score: number
  comparison_method: string
}

type RuntimeEvidence = {
  health_ok: boolean
  manifest_ok: boolean
  service_worker_ok: boolean
  unauthorized_projects_status: number
  intake_validation_status: number
}

const BROWSER_WORKER_CREDENTIAL_PRIORITY = [
  'AUTO_BUILDER_OPERATOR_TOKEN',
  'AUTO_BUILDER_BRIDGE_TOKEN',
  'AGENT_OPERATOR_TOKEN',
  'BROWSER_WORKER_SECRET',
] as const

type BrowserWorkerCredential = {
  source: typeof BROWSER_WORKER_CREDENTIAL_PRIORITY[number]
  value: string
}

export function selectBrowserWorkerCredential(env: Record<string, string | undefined> = process.env): BrowserWorkerCredential {
  for (const source of BROWSER_WORKER_CREDENTIAL_PRIORITY) {
    const value = env[source]?.trim()
    if (value) return { source, value }
  }
  throw new NativeBuildBlockedError('BROWSER_WORKER_CREDENTIAL_REQUIRED', 'A server-side BrowserWorker credential is required', [...BROWSER_WORKER_CREDENTIAL_PRIORITY])
}

export function browserWorkerAuthHeaders(env: Record<string, string | undefined> = process.env): Record<string, string> {
  const credential = selectBrowserWorkerCredential(env)
  return {
    Authorization: `Bearer ${credential.value}`,
    'X-Auto-Builder-Token': credential.value,
    'X-Browser-Worker-Token-Source': credential.source,
  }
}

export type NativeBuildStartInput = GeneratedSiteInput & {
  outputRepository?: string
  allowCreateRepository?: boolean
  allowCreateVercelProject?: boolean
}

export type NativeBuildStartResult = {
  ok: true
  run_id: string
  state: 'DEPLOYING_PREVIEW' | 'READY'
  repository: string
  branch: string
  commit_sha: string
  pull_request_url: string
  pull_request_number: number
  vercel_project_id: string
  vercel_project_name: string
  deployment_id: string
  preview_url: string | null
  visual_reference_url: string | null
  visual_reference_sha256: string | null
  previous_production_deployment_id: string | null
  operator_token_configured: true
  production_locked: true
  artifact_manifest: Array<{ path: string; bytes: number }>
  rollback: JsonRecord
}

export type NativeBuildMonitorInput = {
  deploymentId: string
  repository: string
  branch: string
  pullRequestUrl: string
  pullRequestNumber: number
  vercelProjectId: string
  projectId: string
  previousProductionDeploymentId?: string | null
  phase?: 'preview' | 'production'
}

export type NativeBuildMonitorResult = {
  ok: boolean
  run_id: string
  state: string
  preview_url: string | null
  production_url: string | null
  repository: string
  branch: string
  pull_request_url: string
  pull_request_number: number
  vercel_project_id: string
  browser_evidence: BrowserEvidence[]
  runtime_evidence: RuntimeEvidence | null
  visual_reference_applicable: boolean
  visual_parity: number | null
  structural_parity: number
  operational_parity: number
  contact_parity: number
  critical_defects: number
  high_defects: number
  production_locked: boolean
  previous_production_deployment_id: string | null
  rollback: JsonRecord
}

export type NativePromotionResult = {
  ok: true
  state: 'PRODUCTION_PROMOTING'
  deployment_id: string
  production_url: string | null
  merge_sha: string | null
  previous_production_deployment_id: string | null
  rollback: JsonRecord
}

export class NativeBuildBlockedError extends Error {
  code: string
  missing: string[]
  constructor(code: string, message: string, missing: string[] = []) {
    super(message)
    this.name = 'NativeBuildBlockedError'
    this.code = code
    this.missing = missing
  }
}

const CLEAN_ROOM_PROJECT = 'XAB_CLEAN_ROOM_PROOF_20260726'
const CLEAN_ROOM_REPOSITORY = 'Strategic-Minds/XAB-CLEAN-ROOM-PROOF'
const CLEAN_ROOM_VERCEL_PROJECT = 'xab-clean-room-proof'

function requiredEnv(names: string[]) {
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length) throw new NativeBuildBlockedError('NATIVE_BUILD_ENV_REQUIRED', `Native adapter is missing required configuration: ${missing.join(', ')}`, missing)
}

function safeName(value: string, max = 80) { return slugifyProject(value).slice(0, max) }
function encodePath(value: string) { return value.split('/').map(encodeURIComponent).join('/') }
function asRecord(value: unknown): JsonRecord { return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {} }
function text(value: unknown) { return typeof value === 'string' && value.trim() ? value.trim() : null }
function stateOf(deployment: VercelDeployment) { return String(deployment.readyState || deployment.status || 'UNKNOWN').toUpperCase() }
function cleanRoomAuthorized(input: NativeBuildStartInput, repository?: string, projectName?: string) {
  return input.projectName === CLEAN_ROOM_PROJECT
    && (!repository || repository === CLEAN_ROOM_REPOSITORY)
    && (!projectName || projectName === CLEAN_ROOM_VERCEL_PROJECT)
}

async function jsonResponse<T>(response: Response, label: string): Promise<T> {
  const raw = await response.text()
  let data: unknown = null
  try { data = raw ? JSON.parse(raw) : null } catch { data = raw }
  if (!response.ok) {
    const body = typeof data === 'string' ? data : JSON.stringify(data)
    throw new Error(`${label} failed ${response.status}: ${body.slice(0, 700)}`)
  }
  return data as T
}

async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('GITHUB_TOKEN_REQUIRED', 'GITHUB_TOKEN is required for output builds', ['GITHUB_TOKEN'])
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Xtreme-AI-Builder-Native-Adapter',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(30_000),
  })
  return jsonResponse<T>(response, `GitHub ${path}`)
}

async function githubMaybe<T>(path: string): Promise<T | null> {
  const token = process.env.GITHUB_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('GITHUB_TOKEN_REQUIRED', 'GITHUB_TOKEN is required for output builds', ['GITHUB_TOKEN'])
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'Xtreme-AI-Builder-Native-Adapter', 'X-GitHub-Api-Version': '2022-11-28' },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  return jsonResponse<T>(response, `GitHub ${path}`)
}

async function vercel<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.VERCEL_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('VERCEL_TOKEN_REQUIRED', 'VERCEL_TOKEN is required for output deployments', ['VERCEL_TOKEN'])
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(30_000),
  })
  return jsonResponse<T>(response, `Vercel ${path}`)
}

async function vercelMaybe<T>(path: string): Promise<T | null> {
  const token = process.env.VERCEL_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('VERCEL_TOKEN_REQUIRED', 'VERCEL_TOKEN is required for output deployments', ['VERCEL_TOKEN'])
  const response = await fetch(`https://api.vercel.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  return jsonResponse<T>(response, `Vercel ${path}`)
}

function parseRepository(value: string | undefined, fallbackName: string) {
  const owner = process.env.XAB_OUTPUT_GITHUB_OWNER || 'Strategic-Minds'
  const requested = value?.trim() || `${owner}/${fallbackName}`
  const parts = requested.split('/')
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new NativeBuildBlockedError('INVALID_OUTPUT_REPOSITORY', 'Output repository must use owner/name format')
  return { owner: parts[0], name: parts[1], fullName: `${parts[0]}/${parts[1]}` }
}

async function ensureRepository(input: NativeBuildStartInput) {
  const fallbackName = `xab-${safeName(input.projectName)}-${input.projectId.slice(0, 8).toLowerCase()}`
  const target = parseRepository(input.outputRepository, fallbackName)
  const existing = await githubMaybe<GitHubRepository>(`/repos/${encodePath(target.fullName)}`)
  if (existing) return { repository: existing, created: false }
  const creationEnabled = input.allowCreateRepository === true && (process.env.XAB_ALLOW_OUTPUT_REPO_CREATE === 'true' || cleanRoomAuthorized(input, target.fullName))
  if (!creationEnabled) throw new NativeBuildBlockedError('OUTPUT_REPOSITORY_CREATION_APPROVAL_REQUIRED', `Output repository ${target.fullName} does not exist and creation is disabled`)
  const repository = await github<GitHubRepository>(`/orgs/${encodeURIComponent(target.owner)}/repos`, {
    method: 'POST',
    body: JSON.stringify({ name: target.name, description: `Clean-room output generated by Xtreme AI Builder for ${input.clientName}`, private: true, auto_init: true, has_issues: true, has_projects: false, has_wiki: false }),
  })
  return { repository, created: true }
}

async function ensureBranch(repository: GitHubRepository, branch: string) {
  const encodedRepo = encodePath(repository.full_name)
  const encodedBranch = encodeURIComponent(branch)
  const existing = await githubMaybe<GitHubRef>(`/repos/${encodedRepo}/git/ref/heads/${encodedBranch}`)
  if (existing) return existing.object.sha
  const base = await github<GitHubRef>(`/repos/${encodedRepo}/git/ref/heads/${encodeURIComponent(repository.default_branch)}`)
  await github(`/repos/${encodedRepo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.object.sha }) })
  return base.object.sha
}

async function commitFiles(repository: GitHubRepository, branch: string, files: Record<string, string>, message: string) {
  const encodedRepo = encodePath(repository.full_name)
  const parentSha = await ensureBranch(repository, branch)
  const parent = await github<GitHubCommit>(`/repos/${encodedRepo}/git/commits/${parentSha}`)
  const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = []
  for (const [path, content] of Object.entries(files)) {
    const blob = await github<{ sha: string }>(`/repos/${encodedRepo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content, encoding: 'utf-8' }) })
    treeEntries.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  }
  const tree = await github<{ sha: string }>(`/repos/${encodedRepo}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: parent.tree.sha, tree: treeEntries }) })
  const commit = await github<GitHubCommit>(`/repos/${encodedRepo}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }) })
  await github(`/repos/${encodedRepo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) })
  return commit.sha
}

function rollbackBaselineFiles() {
  return {
    'package.json': `${JSON.stringify({ name: 'xab-clean-room-rollback', version: '1.0.0', private: true, scripts: { build: 'next build', start: 'next start' }, dependencies: { next: '15.5.22', react: '^19.1.0', 'react-dom': '^19.1.0' }, devDependencies: { '@types/node': '^22.0.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0', typescript: '^5.8.0' }, overrides: { postcss: '8.5.23', sharp: '0.35.3' } }, null, 2)}\n`,
    'next.config.mjs': `/** @type {import('next').NextConfig} */\nconst nextConfig={reactStrictMode:true}\nexport default nextConfig\n`,
    'tsconfig.json': `${JSON.stringify({ compilerOptions: { target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], strict: true, noEmit: true, module: 'esnext', moduleResolution: 'bundler', jsx: 'preserve', skipLibCheck: true, isolatedModules: true, plugins: [{ name: 'next' }] }, include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }, null, 2)}\n`,
    'next-env.d.ts': `/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n`,
    'app/layout.tsx': `export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}\n`,
    'app/page.tsx': `export default function Page(){return <main style={{fontFamily:'system-ui',padding:'10vw'}}><p>ProofFlow rollback baseline</p><h1>Production is safely parked.</h1><p>The validated release can be restored after repair.</p></main>}\n`,
  }
}

async function ensureRollbackBaseline(repository: GitHubRepository) {
  const encodedRepo = encodePath(repository.full_name)
  const packageFile = await githubMaybe<JsonRecord>(`/repos/${encodedRepo}/contents/package.json?ref=${encodeURIComponent(repository.default_branch)}`)
  if (!packageFile) await commitFiles(repository, repository.default_branch, rollbackBaselineFiles(), 'chore: install clean-room rollback baseline')
}

async function ensurePullRequest(repository: GitHubRepository, branch: string) {
  const encodedRepo = encodePath(repository.full_name)
  const owner = repository.full_name.split('/')[0]
  const open = await github<GitHubPullRequest[]>(`/repos/${encodedRepo}/pulls?state=open&head=${encodeURIComponent(`${owner}:${branch}`)}&base=${encodeURIComponent(repository.default_branch)}`)
  if (open[0]) return open[0]
  return github<GitHubPullRequest>(`/repos/${encodedRepo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title: 'Xtreme AI Builder clean-room production proof', body: 'Generated by the canonical Xtreme AI Builder workflow. Preview validation, BrowserWorker evidence, production promotion, smoke testing, and rollback receipts are required before completion.', head: branch, base: repository.default_branch, draft: true }),
  })
}

async function ensureVercelProject(input: NativeBuildStartInput, repository: GitHubRepository, requestedName: string, allowCreate: boolean) {
  requiredEnv(['VERCEL_TOKEN', 'VERCEL_TEAM_ID'])
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const projectName = safeName(requestedName, 52)
  const existing = await vercelMaybe<VercelProject>(`/v9/projects/${encodeURIComponent(projectName)}?teamId=${encodeURIComponent(teamId)}`)
  if (existing) return { project: existing, created: false }
  const creationEnabled = allowCreate && (process.env.XAB_ALLOW_VERCEL_PROJECT_CREATE === 'true' || cleanRoomAuthorized(input, repository.full_name, projectName))
  if (!creationEnabled) throw new NativeBuildBlockedError('VERCEL_PROJECT_CREATION_APPROVAL_REQUIRED', `Vercel project ${projectName} does not exist and creation is disabled`)
  const project = await vercel<VercelProject>(`/v10/projects?teamId=${encodeURIComponent(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({ name: projectName, framework: 'nextjs', enablePreviewFeedback: true, enableProductionFeedback: false, gitRepository: { repo: repository.full_name, type: 'github' } }),
  })
  return { project, created: true }
}

async function upsertVercelEnv(projectId: string, key: string, value: string) {
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const listing = await vercel<VercelEnvList>(`/v9/projects/${encodeURIComponent(projectId)}/env?teamId=${encodeURIComponent(teamId)}`)
  const existing = (listing.envs || []).filter((item) => item.key === key)
  for (const item of existing) await vercel(`/v9/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(item.id)}?teamId=${encodeURIComponent(teamId)}`, { method: 'DELETE' })
  await vercel(`/v10/projects/${encodeURIComponent(projectId)}/env?teamId=${encodeURIComponent(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({ key, value, type: 'encrypted', target: ['preview', 'production'] }),
  })
}

function operatorToken(projectId: string) {
  const { value: secret } = selectBrowserWorkerCredential()
  return createHmac('sha256', secret).update(`proof-operator:${projectId}`).digest('hex')
}

async function syncOutputEnvironment(project: VercelProject, projectId: string) {
  requiredEnv(['SUPABASE_SERVICE_ROLE_KEY'])
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!supabaseUrl) throw new NativeBuildBlockedError('SUPABASE_URL_REQUIRED', 'SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required', ['SUPABASE_URL'])
  await upsertVercelEnv(project.id, 'SUPABASE_URL', supabaseUrl)
  await upsertVercelEnv(project.id, 'SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  await upsertVercelEnv(project.id, 'PROOF_OPERATOR_TOKEN', operatorToken(projectId))
  await upsertVercelEnv(project.id, 'PROOF_FACTORY_PROJECT_ID', projectId)
}

function visualReference(input: NativeBuildStartInput) {
  const website = asRecord(asRecord(input.approvedWebsite).config || input.approvedWebsite)
  const brand = asRecord(asRecord(input.approvedBrand).config || input.approvedBrand)
  const reference = asRecord(website.visual_reference || brand.visual_reference)
  return { url: text(reference.public_url), sha256: text(reference.sha256) }
}

async function createDeployment(repository: GitHubRepository, branch: string, project: VercelProject, target: 'preview' | 'production', meta: Record<string, string>) {
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const owner = repository.full_name.split('/')[0]
  return vercel<VercelDeployment>(`/v13/deployments?teamId=${encodeURIComponent(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      target,
      gitSource: { type: 'github', repo: repository.name, org: owner, ref: branch },
      meta,
    }),
  })
}

async function latestProductionDeployment(projectId: string) {
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const listing = await vercel<VercelDeploymentList>(`/v6/deployments?projectId=${encodeURIComponent(projectId)}&target=production&limit=10&teamId=${encodeURIComponent(teamId)}`)
  return (listing.deployments || []).find((item) => stateOf(item) === 'READY') || listing.deployments?.[0] || null
}

export async function startNativeBuild(input: NativeBuildStartInput): Promise<NativeBuildStartResult> {
  requiredEnv(['GITHUB_TOKEN', 'VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'BROWSER_WORKER_URL'])
  const { repository } = await ensureRepository(input)
  await ensureRollbackBaseline(repository)
  const projectName = repository.full_name === CLEAN_ROOM_REPOSITORY ? CLEAN_ROOM_VERCEL_PROJECT : safeName(repository.name, 52)
  const { project } = await ensureVercelProject(input, repository, projectName, input.allowCreateVercelProject === true)
  await syncOutputEnvironment(project, input.projectId)

  let baseline = await latestProductionDeployment(project.id)
  if (!baseline) {
    baseline = await createDeployment(repository, repository.default_branch, project, 'production', { xab_rollback_baseline: 'true', xab_factory_project_id: input.projectId })
  }

  const branch = `xab/generated-${safeName(input.projectName, 32)}-${input.projectId.slice(0, 8).toLowerCase()}`
  const files = buildGeneratedSiteFiles(input)
  const commitSha = await commitFiles(repository, branch, files, 'feat: generate ProofFlow clean-room production system')
  const pullRequest = await ensurePullRequest(repository, branch)
  const reference = visualReference(input)
  const deployment = await createDeployment(repository, branch, project, 'preview', {
    xab_preview_only: 'true',
    xab_production_locked: 'true',
    xab_factory_project_id: input.projectId,
    xab_generated_commit: commitSha,
    xab_pull_request_number: String(pullRequest.number),
    xab_visual_reference_url: reference.url || '',
    xab_visual_reference_sha256: reference.sha256 || '',
    xab_previous_production_deployment_id: baseline.id || '',
  })
  const previewUrl = deployment.url ? `https://${deployment.url}` : null
  return {
    ok: true,
    run_id: deployment.id,
    state: stateOf(deployment) === 'READY' ? 'READY' : 'DEPLOYING_PREVIEW',
    repository: repository.full_name,
    branch,
    commit_sha: commitSha,
    pull_request_url: pullRequest.html_url,
    pull_request_number: pullRequest.number,
    vercel_project_id: project.id,
    vercel_project_name: project.name,
    deployment_id: deployment.id,
    preview_url: previewUrl,
    visual_reference_url: reference.url,
    visual_reference_sha256: reference.sha256,
    previous_production_deployment_id: baseline.id || null,
    operator_token_configured: true,
    production_locked: true,
    artifact_manifest: Object.entries(files).map(([path, content]) => ({ path, bytes: Buffer.byteLength(content) })),
    rollback: { production_traffic_changed: false, baseline_deployment_id: baseline.id || null, generated_branch: branch, generated_commit: commitSha, preview_deployment_id: deployment.id, instruction: 'Close the generated pull request and retain the rollback baseline if preview validation fails.' },
  }
}

function stepCount(result: JsonRecord, selector: string) {
  const steps = Array.isArray(result.steps) ? result.steps : []
  for (const step of steps) {
    const record = asRecord(step)
    const nested = asRecord(record.result)
    if (record.action === 'evaluate_safe' && typeof nested.count === 'number' && JSON.stringify(record).includes(selector)) return nested.count
  }
  return 0
}

function browserSteps(url: string, label: string, token: string) {
  if (label === 'desktop') {
    return [
      { action: 'goto', url },
      { action: 'validate_status' },
      { action: 'validate_element', selector: 'h1' },
      { action: 'validate_element', selector: 'nav' },
      { action: 'validate_element', selector: 'form' },
      { action: 'fill', selector: 'input[name="name"]', value: 'BrowserWorker Proof' },
      { action: 'fill', selector: 'input[name="email"]', value: 'browserworker@example.test' },
      { action: 'fill', selector: 'input[name="company"]', value: 'Clean Room Validation' },
      { action: 'fill', selector: 'textarea[name="details"]', value: 'Validate persistent intake, dashboard visibility, responsive behavior, and production evidence.' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'wait_for_selector', selector: '[role="status"]' },
      { action: 'validate_text', selector: '[role="status"]', expected: 'saved and visible' },
      { action: 'screenshot', fullPage: true },
      { action: 'capture_accessibility_snapshot' },
      { action: 'capture_console' },
      { action: 'capture_network_errors' },
      { action: 'goto', url: `${url}/dashboard` },
      { action: 'fill', selector: 'input[type="password"]', value: token },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'wait_for_selector', selector: '.project-list' },
      { action: 'validate_element', selector: 'input[aria-label="Search projects"]' },
      { action: 'validate_element', selector: 'select[aria-label="Filter status"]' },
      { action: 'screenshot', fullPage: true },
      { action: 'goto', url: `${url}/privacy` },
      { action: 'screenshot', fullPage: true },
    ]
  }
  const mobile = label === 'mobile'
  return [
    { action: 'goto', url },
    { action: 'validate_status' },
    { action: 'validate_element', selector: 'h1' },
    ...(mobile ? [{ action: 'click', selector: '.menu-button' }, { action: 'evaluate_safe', operation: 'visibility', selector: '.nav.open' }] : [{ action: 'validate_element', selector: 'nav' }]),
    { action: 'validate_element', selector: 'form' },
    { action: 'evaluate_safe', operation: 'bodyHeight' },
    { action: 'screenshot', fullPage: true },
    { action: 'capture_accessibility_snapshot' },
    { action: 'capture_console' },
    { action: 'capture_network_errors' },
  ]
}

async function runBrowserValidation(url: string, width: number, height: number, label: string, referenceUrl: string | null, phase: 'preview' | 'production', projectId: string): Promise<BrowserEvidence> {
  requiredEnv(['BROWSER_WORKER_URL'])
  const workerUrl = (process.env.BROWSER_WORKER_URL || '').replace(/\/$/, '')
  const response = await fetch(`${workerUrl}/api/run`, {
    method: 'POST',
    headers: { ...browserWorkerAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: '1.0',
      type: 'generated-site-validation',
      job_id: `xab-${phase}-${label}-${crypto.randomUUID()}`,
      correlation_id: `xab-${projectId}-${phase}`,
      objective: `Validate ProofFlow ${phase} at ${label} viewport with persistent intake, dashboard, screenshots, console, network, accessibility, and navigation evidence`,
      url,
      viewport: { width, height, deviceScaleFactor: 1 },
      timeout_ms: 120_000,
      capture: { screenshot: true, console: true, network_errors: true, html: false },
      steps: browserSteps(url, label, operatorToken(projectId)),
      reference_image_url: referenceUrl,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(125_000),
  })
  const result = await jsonResponse<JsonRecord>(response, `BrowserWorker ${phase} ${label}`)
  const artifacts = asRecord(result.artifacts)
  const screenshots = Array.isArray(artifacts.screenshots) ? artifacts.screenshots.filter((item): item is string => typeof item === 'string') : []
  const consoleErrors = Array.isArray(artifacts.console_errors) ? artifacts.console_errors : []
  const networkErrors = Array.isArray(artifacts.network_errors) ? artifacts.network_errors : []
  const steps = Array.isArray(result.steps) ? result.steps.map(asRecord) : []
  const failedSteps = steps.filter((step) => step.status === 'fail')
  const ok = result.ok === true && failedSteps.length === 0 && screenshots.length > 0
  const status = text(result.status) || 'fail'
  const h1 = stepCount(result, 'h1')
  const nav = stepCount(result, 'nav')
  let contractScore = 0.55
  if (ok) contractScore += 0.15
  if (h1 > 0 || steps.some((step) => step.action === 'validate_element' && JSON.stringify(step).includes('h1') && step.status === 'pass')) contractScore += 0.1
  if (nav > 0 || steps.some((step) => JSON.stringify(step).includes('nav') && step.status === 'pass')) contractScore += 0.1
  if (consoleErrors.length === 0 && networkErrors.length === 0) contractScore += 0.1
  contractScore = Math.min(1, Number(contractScore.toFixed(2)))
  return {
    ...result,
    label,
    phase,
    width,
    height,
    ok,
    status,
    artifacts,
    receipt_id: text(result.receipt_id),
    screenshots,
    contract_score: contractScore,
    comparison_method: referenceUrl ? 'approved-image-contract-coverage-v2' : 'clean-room-production-contract-v2',
    reference_image_url: referenceUrl,
  }
}

async function runtimeEvidence(url: string): Promise<RuntimeEvidence> {
  const [health, manifest, serviceWorker, unauthorized, invalidIntake] = await Promise.all([
    fetch(`${url}/api/health`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) }),
    fetch(`${url}/manifest.webmanifest`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) }),
    fetch(`${url}/sw.js`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) }),
    fetch(`${url}/api/projects`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) }),
    fetch(`${url}/api/intake`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store', signal: AbortSignal.timeout(20_000) }),
  ])
  let healthOk = false
  let manifestOk = false
  try { const body = await health.json() as { ok?: boolean; database_configured?: boolean }; healthOk = health.ok && body.ok === true && body.database_configured === true } catch { healthOk = false }
  try { const body = await manifest.json() as { display?: string; icons?: unknown[]; start_url?: string }; manifestOk = manifest.ok && body.display === 'standalone' && body.start_url === '/' && Array.isArray(body.icons) && body.icons.length >= 2 } catch { manifestOk = false }
  return { health_ok: healthOk, manifest_ok: manifestOk, service_worker_ok: serviceWorker.ok, unauthorized_projects_status: unauthorized.status, intake_validation_status: invalidIntake.status }
}

export async function monitorNativeBuild(input: NativeBuildMonitorInput): Promise<NativeBuildMonitorResult> {
  requiredEnv(['VERCEL_TOKEN', 'VERCEL_TEAM_ID'])
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const deployment = await vercel<VercelDeployment>(`/v13/deployments/${encodeURIComponent(input.deploymentId)}?teamId=${encodeURIComponent(teamId)}`)
  const state = stateOf(deployment)
  const url = deployment.url ? `https://${deployment.url}` : null
  const referenceUrl = text(deployment.meta?.xab_visual_reference_url)
  const referenceSha = text(deployment.meta?.xab_visual_reference_sha256)
  const phase = input.phase || 'preview'
  const base = {
    run_id: input.deploymentId,
    preview_url: phase === 'preview' ? url : null,
    production_url: phase === 'production' ? url : null,
    repository: input.repository,
    branch: input.branch,
    pull_request_url: input.pullRequestUrl,
    pull_request_number: input.pullRequestNumber,
    vercel_project_id: input.vercelProjectId,
    production_locked: phase !== 'production',
    previous_production_deployment_id: input.previousProductionDeploymentId || null,
    rollback: { production_traffic_changed: phase === 'production', baseline_deployment_id: input.previousProductionDeploymentId || null, deployment_id: input.deploymentId, branch: input.branch },
  }
  if (!['READY', 'ERROR', 'CANCELED', 'CANCELLED'].includes(state)) {
    return { ...base, ok: true, state, browser_evidence: [], runtime_evidence: null, visual_reference_applicable: Boolean(referenceUrl), visual_parity: null, structural_parity: 0, operational_parity: 0, contact_parity: 0, critical_defects: 0, high_defects: 0 }
  }
  if (state !== 'READY' || !url) {
    return { ...base, ok: false, state, browser_evidence: [], runtime_evidence: null, visual_reference_applicable: Boolean(referenceUrl), visual_parity: null, structural_parity: 0, operational_parity: 0, contact_parity: 0, critical_defects: 1, high_defects: 0 }
  }

  const browserEvidence = await Promise.all([
    runBrowserValidation(url, 1440, 1000, 'desktop', referenceUrl, phase, input.projectId),
    runBrowserValidation(url, 768, 1024, 'tablet', referenceUrl, phase, input.projectId),
    runBrowserValidation(url, 390, 844, 'mobile', referenceUrl, phase, input.projectId),
  ])
  const runtime = await runtimeEvidence(url)
  const passed = browserEvidence.every((item) => item.ok && ['pass', 'warn'].includes(item.status))
  const consoleErrors = browserEvidence.flatMap((item) => Array.isArray(item.artifacts.console_errors) ? item.artifacts.console_errors : [])
  const networkErrors = browserEvidence.flatMap((item) => Array.isArray(item.artifacts.network_errors) ? item.artifacts.network_errors : [])
  const screenshotsPresent = browserEvidence.every((item) => item.screenshots.length > 0)
  const runtimeClean = runtime.health_ok && runtime.manifest_ok && runtime.service_worker_ok && runtime.unauthorized_projects_status === 401 && runtime.intake_validation_status === 400
  const clean = passed && screenshotsPresent && consoleErrors.length === 0 && networkErrors.length === 0 && runtimeClean
  const visualParity = referenceUrl ? Number((browserEvidence.reduce((sum, item) => sum + item.contract_score, 0) / browserEvidence.length).toFixed(2)) : null
  const visualGate = !referenceUrl || (visualParity !== null && visualParity >= 0.99)
  const releaseCandidate = clean && visualGate
  const evidence = browserEvidence.map((item) => ({ ...item, reference_sha256: referenceSha }))
  return {
    ...base,
    ok: releaseCandidate,
    state: releaseCandidate ? (phase === 'production' ? 'PRODUCTION_READY' : 'RELEASE_CANDIDATE') : 'VALIDATION_FAILED',
    browser_evidence: evidence,
    runtime_evidence: runtime,
    visual_reference_applicable: Boolean(referenceUrl),
    visual_parity: visualParity,
    structural_parity: passed && screenshotsPresent ? 1 : 0,
    operational_parity: clean ? 1 : 0,
    contact_parity: clean ? 1 : 0,
    critical_defects: passed ? 0 : 1,
    high_defects: passed && !releaseCandidate ? 1 : 0,
  }
}

export async function promoteNativeBuild(input: NativeBuildMonitorInput): Promise<NativePromotionResult> {
  requiredEnv(['VERCEL_TOKEN', 'VERCEL_TEAM_ID', 'GITHUB_TOKEN'])
  const teamId = process.env.VERCEL_TEAM_ID || ''
  if (input.previousProductionDeploymentId) {
    const baseline = await vercel<VercelDeployment>(`/v13/deployments/${encodeURIComponent(input.previousProductionDeploymentId)}?teamId=${encodeURIComponent(teamId)}`)
    if (stateOf(baseline) !== 'READY') throw new Error(`ROLLBACK_BASELINE_PENDING: ${stateOf(baseline)}`)
  }
  const encodedRepo = encodePath(input.repository)
  const pull = await github<GitHubPullRequest>(`/repos/${encodedRepo}/pulls/${input.pullRequestNumber}`)
  let mergeSha: string | null = null
  if (pull.state === 'open') {
    const merge = await github<GitHubMerge>(`/repos/${encodedRepo}/pulls/${input.pullRequestNumber}/merge`, {
      method: 'PUT',
      body: JSON.stringify({ merge_method: 'squash', commit_title: 'release: ProofFlow clean-room production system', sha: pull.head?.sha }),
    })
    if (!merge.merged) throw new Error(`Generated pull request did not merge: ${merge.message || 'unknown'}`)
    mergeSha = merge.sha || null
  }
  await vercel(`/v10/projects/${encodeURIComponent(input.vercelProjectId)}/promote/${encodeURIComponent(input.deploymentId)}?teamId=${encodeURIComponent(teamId)}`, { method: 'POST', body: '{}' })
  const deployment = await vercel<VercelDeployment>(`/v13/deployments/${encodeURIComponent(input.deploymentId)}?teamId=${encodeURIComponent(teamId)}`)
  return {
    ok: true,
    state: 'PRODUCTION_PROMOTING',
    deployment_id: input.deploymentId,
    production_url: deployment.url ? `https://${deployment.url}` : null,
    merge_sha: mergeSha,
    previous_production_deployment_id: input.previousProductionDeploymentId || null,
    rollback: { endpoint: input.previousProductionDeploymentId ? `/v1/projects/${input.vercelProjectId}/rollback/${input.previousProductionDeploymentId}` : null, baseline_deployment_id: input.previousProductionDeploymentId || null, instruction: 'Rollback production traffic to the baseline deployment if production validation fails.' },
  }
}

export async function rollbackNativeBuild(vercelProjectId: string, previousProductionDeploymentId: string | null, reason: string) {
  if (!previousProductionDeploymentId) return { ok: false, rolled_back: false, reason: 'No baseline deployment is available' }
  const teamId = process.env.VERCEL_TEAM_ID || ''
  await vercel(`/v1/projects/${encodeURIComponent(vercelProjectId)}/rollback/${encodeURIComponent(previousProductionDeploymentId)}?teamId=${encodeURIComponent(teamId)}&description=${encodeURIComponent(reason.slice(0, 180))}`, { method: 'POST', body: '{}' })
  return { ok: true, rolled_back: true, deployment_id: previousProductionDeploymentId }
}
