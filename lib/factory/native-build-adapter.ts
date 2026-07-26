import { buildGeneratedSiteFiles, slugifyProject, type GeneratedSiteInput } from './site-generator'

type JsonRecord = Record<string, unknown>

type GitHubRepository = {
  full_name: string
  name: string
  default_branch: string
  private: boolean
}

type GitHubRef = { object: { sha: string } }
type GitHubCommit = { sha: string; tree: { sha: string } }
type GitHubPullRequest = { html_url: string; number: number; state: string }

type VercelProject = { id: string; name: string }
type VercelDeployment = {
  id: string
  url?: string
  readyState?: string
  status?: string
  inspectorUrl?: string
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
  production_locked: true
  artifact_manifest: Array<{ path: string; bytes: number }>
  rollback: JsonRecord
}

export type NativeBuildMonitorInput = {
  deploymentId: string
  repository: string
  branch: string
  pullRequestUrl: string
  vercelProjectId: string
}

export type NativeBuildMonitorResult = {
  ok: boolean
  run_id: string
  state: string
  preview_url: string | null
  repository: string
  branch: string
  pull_request_url: string
  vercel_project_id: string
  browser_evidence: JsonRecord[]
  visual_reference_applicable: false
  visual_parity: null
  structural_parity: number
  operational_parity: number
  contact_parity: number
  critical_defects: number
  high_defects: number
  production_locked: true
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

function requiredEnv(names: string[]) {
  const missing = names.filter((name) => !process.env[name])
  if (missing.length) {
    throw new NativeBuildBlockedError(
      'NATIVE_BUILD_ENV_REQUIRED',
      `Native preview adapter is missing required configuration: ${missing.join(', ')}`,
      missing,
    )
  }
}

function safeName(value: string, max = 80) {
  return slugifyProject(value).slice(0, max)
}

function encodePath(value: string) {
  return value.split('/').map(encodeURIComponent).join('/')
}

async function jsonResponse<T>(response: Response, label: string): Promise<T> {
  const text = await response.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) {
    const body = typeof data === 'string' ? data : JSON.stringify(data)
    throw new Error(`${label} failed ${response.status}: ${body.slice(0, 700)}`)
  }
  return data as T
}

async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('GITHUB_TOKEN_REQUIRED', 'GITHUB_TOKEN is required for native output builds', ['GITHUB_TOKEN'])
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
  if (!token) throw new NativeBuildBlockedError('GITHUB_TOKEN_REQUIRED', 'GITHUB_TOKEN is required for native output builds', ['GITHUB_TOKEN'])
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Xtreme-AI-Builder-Native-Adapter',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  return jsonResponse<T>(response, `GitHub ${path}`)
}

async function vercel<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.VERCEL_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('VERCEL_TOKEN_REQUIRED', 'VERCEL_TOKEN is required for native preview deployments', ['VERCEL_TOKEN'])
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(30_000),
  })
  return jsonResponse<T>(response, `Vercel ${path}`)
}

async function vercelMaybe<T>(path: string): Promise<T | null> {
  const token = process.env.VERCEL_TOKEN || ''
  if (!token) throw new NativeBuildBlockedError('VERCEL_TOKEN_REQUIRED', 'VERCEL_TOKEN is required for native preview deployments', ['VERCEL_TOKEN'])
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
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new NativeBuildBlockedError('INVALID_OUTPUT_REPOSITORY', 'Output repository must use owner/name format')
  }
  return { owner: parts[0], name: safeName(parts[1]), fullName: `${parts[0]}/${safeName(parts[1])}` }
}

async function ensureRepository(input: NativeBuildStartInput) {
  const fallbackName = `xab-${safeName(input.projectName)}-${input.projectId.slice(0, 8).toLowerCase()}`
  const target = parseRepository(input.outputRepository, fallbackName)
  const existing = await githubMaybe<GitHubRepository>(`/repos/${encodePath(target.fullName)}`)
  if (existing) return existing

  const creationEnabled = process.env.XAB_ALLOW_OUTPUT_REPO_CREATE === 'true' && input.allowCreateRepository === true
  if (!creationEnabled) {
    throw new NativeBuildBlockedError(
      'OUTPUT_REPOSITORY_CREATION_APPROVAL_REQUIRED',
      `Output repository ${target.fullName} does not exist and creation is disabled`,
    )
  }

  return github<GitHubRepository>(`/orgs/${encodeURIComponent(target.owner)}/repos`, {
    method: 'POST',
    body: JSON.stringify({
      name: target.name,
      description: `Preview-only output generated by Xtreme AI Builder for ${input.clientName}`,
      private: true,
      auto_init: true,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
    }),
  })
}

async function ensureBranch(repository: GitHubRepository, branch: string) {
  const encodedRepo = encodePath(repository.full_name)
  const encodedBranch = encodeURIComponent(branch)
  const existing = await githubMaybe<GitHubRef>(`/repos/${encodedRepo}/git/ref/heads/${encodedBranch}`)
  if (existing) return existing.object.sha

  const base = await github<GitHubRef>(`/repos/${encodedRepo}/git/ref/heads/${encodeURIComponent(repository.default_branch)}`)
  await github(`/repos/${encodedRepo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.object.sha }),
  })
  return base.object.sha
}

async function commitFiles(repository: GitHubRepository, branch: string, files: Record<string, string>) {
  const encodedRepo = encodePath(repository.full_name)
  const parentSha = await ensureBranch(repository, branch)
  const parent = await github<GitHubCommit>(`/repos/${encodedRepo}/git/commits/${parentSha}`)
  const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = []

  for (const [path, content] of Object.entries(files)) {
    const blob = await github<{ sha: string }>(`/repos/${encodedRepo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content, encoding: 'utf-8' }),
    })
    treeEntries.push({ path, mode: '100644', type: 'blob', sha: blob.sha })
  }

  const tree = await github<{ sha: string }>(`/repos/${encodedRepo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree: treeEntries }),
  })
  const commit = await github<GitHubCommit>(`/repos/${encodedRepo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: 'feat: generate approved Xtreme AI Builder preview',
      tree: tree.sha,
      parents: [parentSha],
    }),
  })
  await github(`/repos/${encodedRepo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  })
  return commit.sha
}

async function ensurePullRequest(repository: GitHubRepository, branch: string) {
  const encodedRepo = encodePath(repository.full_name)
  const owner = repository.full_name.split('/')[0]
  const open = await github<GitHubPullRequest[]>(
    `/repos/${encodedRepo}/pulls?state=open&head=${encodeURIComponent(`${owner}:${branch}`)}&base=${encodeURIComponent(repository.default_branch)}`,
  )
  if (open[0]) return open[0]
  return github<GitHubPullRequest>(`/repos/${encodedRepo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Xtreme AI Builder generated preview',
      body: 'Preview-only generated implementation. Production remains locked pending validation and operator approval.',
      head: branch,
      base: repository.default_branch,
      draft: true,
    }),
  })
}

async function ensureVercelProject(repository: GitHubRepository, requestedName: string, allowCreate: boolean) {
  requiredEnv(['VERCEL_TOKEN', 'VERCEL_TEAM_ID'])
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const projectName = safeName(requestedName, 52)
  const existing = await vercelMaybe<VercelProject>(`/v9/projects/${encodeURIComponent(projectName)}?teamId=${encodeURIComponent(teamId)}`)
  if (existing) return existing

  const creationEnabled = process.env.XAB_ALLOW_VERCEL_PROJECT_CREATE === 'true' && allowCreate
  if (!creationEnabled) {
    throw new NativeBuildBlockedError(
      'VERCEL_PROJECT_CREATION_APPROVAL_REQUIRED',
      `Vercel project ${projectName} does not exist and creation is disabled`,
    )
  }

  return vercel<VercelProject>(`/v10/projects?teamId=${encodeURIComponent(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({
      name: projectName,
      framework: 'nextjs',
      enablePreviewFeedback: true,
      enableProductionFeedback: false,
      gitRepository: { repo: repository.full_name, type: 'github' },
    }),
  })
}

async function createPreviewDeployment(repository: GitHubRepository, branch: string, project: VercelProject) {
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const owner = repository.full_name.split('/')[0]
  const deployment = await vercel<VercelDeployment>(`/v13/deployments?teamId=${encodeURIComponent(teamId)}`, {
    method: 'POST',
    body: JSON.stringify({
      name: project.name,
      project: project.id,
      gitSource: {
        type: 'github',
        repo: repository.name,
        org: owner,
        ref: branch,
      },
      meta: {
        xab_preview_only: 'true',
        xab_production_locked: 'true',
      },
    }),
  })
  return deployment
}

export async function startNativeBuild(input: NativeBuildStartInput): Promise<NativeBuildStartResult> {
  requiredEnv(['GITHUB_TOKEN', 'VERCEL_TOKEN', 'VERCEL_TEAM_ID'])
  const repository = await ensureRepository(input)
  const branch = `xab/generated-${safeName(input.projectName, 32)}-${input.projectId.slice(0, 8).toLowerCase()}`
  const files = buildGeneratedSiteFiles(input)
  const commitSha = await commitFiles(repository, branch, files)
  const pullRequest = await ensurePullRequest(repository, branch)
  const vercelProject = await ensureVercelProject(repository, repository.name, input.allowCreateVercelProject === true)
  const deployment = await createPreviewDeployment(repository, branch, vercelProject)
  const previewUrl = deployment.url ? `https://${deployment.url}` : null

  return {
    ok: true,
    run_id: deployment.id,
    state: deployment.readyState === 'READY' ? 'READY' : 'DEPLOYING_PREVIEW',
    repository: repository.full_name,
    branch,
    commit_sha: commitSha,
    pull_request_url: pullRequest.html_url,
    pull_request_number: pullRequest.number,
    vercel_project_id: vercelProject.id,
    vercel_project_name: vercelProject.name,
    deployment_id: deployment.id,
    preview_url: previewUrl,
    production_locked: true,
    artifact_manifest: Object.entries(files).map(([path, content]) => ({ path, bytes: Buffer.byteLength(content) })),
    rollback: {
      production_traffic_changed: false,
      prior_default_branch: repository.default_branch,
      generated_branch: branch,
      generated_commit: commitSha,
      preview_deployment_id: deployment.id,
      instruction: 'Close the draft pull request and delete the generated branch only after explicit rollback approval.',
    },
  }
}

async function runBrowserValidation(previewUrl: string, width: number, height: number, label: string) {
  requiredEnv(['BROWSER_WORKER_URL', 'BROWSER_WORKER_SECRET'])
  const workerUrl = (process.env.BROWSER_WORKER_URL || '').replace(/\/$/, '')
  const secret = process.env.BROWSER_WORKER_SECRET || ''
  const response = await fetch(`${workerUrl}/api/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '1.0',
      type: 'generated-site-validation',
      job_id: `xab-${label}-${crypto.randomUUID()}`,
      correlation_id: `xab-${crypto.randomUUID()}`,
      objective: `Validate generated ${label} preview`,
      url: previewUrl,
      viewport: { width, height, deviceScaleFactor: 1 },
      timeout_ms: 45_000,
      capture: { screenshot: true, console: true, network_errors: true },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(50_000),
  })
  const result = await jsonResponse<JsonRecord>(response, `BrowserWorker ${label}`)
  return { label, width, height, ...result }
}

export async function monitorNativeBuild(input: NativeBuildMonitorInput): Promise<NativeBuildMonitorResult> {
  requiredEnv(['VERCEL_TOKEN', 'VERCEL_TEAM_ID'])
  const teamId = process.env.VERCEL_TEAM_ID || ''
  const deployment = await vercel<VercelDeployment>(
    `/v13/deployments/${encodeURIComponent(input.deploymentId)}?teamId=${encodeURIComponent(teamId)}`,
  )
  const state = String(deployment.readyState || deployment.status || 'UNKNOWN').toUpperCase()
  const previewUrl = deployment.url ? `https://${deployment.url}` : null

  if (!['READY', 'ERROR', 'CANCELED', 'CANCELLED'].includes(state)) {
    return {
      ok: true,
      run_id: input.deploymentId,
      state,
      preview_url: previewUrl,
      repository: input.repository,
      branch: input.branch,
      pull_request_url: input.pullRequestUrl,
      vercel_project_id: input.vercelProjectId,
      browser_evidence: [],
      visual_reference_applicable: false,
      visual_parity: null,
      structural_parity: 0,
      operational_parity: 0,
      contact_parity: 0,
      critical_defects: 0,
      high_defects: 0,
      production_locked: true,
      rollback: { production_traffic_changed: false, deployment_id: input.deploymentId },
    }
  }

  if (state !== 'READY' || !previewUrl) {
    return {
      ok: false,
      run_id: input.deploymentId,
      state,
      preview_url: previewUrl,
      repository: input.repository,
      branch: input.branch,
      pull_request_url: input.pullRequestUrl,
      vercel_project_id: input.vercelProjectId,
      browser_evidence: [],
      visual_reference_applicable: false,
      visual_parity: null,
      structural_parity: 0,
      operational_parity: 0,
      contact_parity: 0,
      critical_defects: 1,
      high_defects: 0,
      production_locked: true,
      rollback: { production_traffic_changed: false, deployment_id: input.deploymentId },
    }
  }

  const browserEvidence = await Promise.all([
    runBrowserValidation(previewUrl, 1440, 1200, 'desktop'),
    runBrowserValidation(previewUrl, 768, 1024, 'tablet'),
    runBrowserValidation(previewUrl, 390, 844, 'mobile'),
  ])
  const passed = browserEvidence.every((item) => item.ok === true && ['pass', 'warn'].includes(String(item.status)))
  const consoleErrors = browserEvidence.flatMap((item) => {
    const artifacts = item.artifacts && typeof item.artifacts === 'object' ? item.artifacts as JsonRecord : {}
    return Array.isArray(artifacts.console_errors) ? artifacts.console_errors : []
  })
  const networkErrors = browserEvidence.flatMap((item) => {
    const artifacts = item.artifacts && typeof item.artifacts === 'object' ? item.artifacts as JsonRecord : {}
    return Array.isArray(artifacts.network_errors) ? artifacts.network_errors : []
  })
  const clean = passed && consoleErrors.length === 0 && networkErrors.length === 0

  return {
    ok: clean,
    run_id: input.deploymentId,
    state: clean ? 'RELEASE_CANDIDATE' : 'VALIDATION_FAILED',
    preview_url: previewUrl,
    repository: input.repository,
    branch: input.branch,
    pull_request_url: input.pullRequestUrl,
    vercel_project_id: input.vercelProjectId,
    browser_evidence: browserEvidence,
    visual_reference_applicable: false,
    visual_parity: null,
    structural_parity: passed ? 1 : 0,
    operational_parity: clean ? 1 : 0,
    contact_parity: clean ? 1 : 0,
    critical_defects: passed ? 0 : 1,
    high_defects: passed && !clean ? 1 : 0,
    production_locked: true,
    rollback: {
      production_traffic_changed: false,
      deployment_id: input.deploymentId,
      branch: input.branch,
      instruction: 'Close the draft pull request and remove the preview branch only after explicit rollback approval.',
    },
  }
}
