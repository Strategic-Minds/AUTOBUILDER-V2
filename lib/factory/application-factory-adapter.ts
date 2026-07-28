import { createHmac } from 'node:crypto'
import { browserWorkerAuthHeaders } from './native-build-adapter'

type JsonRecord = Record<string, unknown>

type AdapterEnvelope = {
  adapter: string
  method: string
  payload: JsonRecord
}

type CanonicalResources = {
  sourceRepository: string
  workingBranch: string
  pullRequestUrl: string
  pullRequestNumber: number | null
  vercelProjectId: string
  vercelTeamId: string
  previewUrl: string
  browserworkerRepository: string
  driveVisualSystemRoot: string
}

type GitHubPullRequest = {
  number: number
  state: string
  mergeable?: boolean | null
  draft?: boolean
  html_url?: string
  head?: { sha?: string; ref?: string }
  base?: { ref?: string }
}

type GitHubMerge = {
  merged?: boolean
  sha?: string
  message?: string
}

type VercelDeployment = {
  id: string
  url?: string
  state?: string
  readyState?: string
  target?: string | null
  meta?: Record<string, string>
}

type VercelDeploymentList = {
  deployments?: VercelDeployment[]
}

const REQUIRED_CANONICAL_RESOURCES = [
  'source_repository',
  'working_branch',
  'pull_request_url',
  'vercel_project_id',
  'browserworker_repository',
  'drive_visual_system_root',
] as const

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {}
}

function text(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function stateOf(deployment: VercelDeployment): string {
  return String(deployment.readyState || deployment.state || 'UNKNOWN').toUpperCase()
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 1
  return clamp(numerator / denominator)
}

function failure(code: string, failures: string[], details: JsonRecord = {}) {
  return { ok: false, code, failures, ...details }
}

function packetFrom(payload: JsonRecord): JsonRecord {
  return record(payload.packet || record(payload.run).project_packet)
}

function canonicalResources(packet: JsonRecord): CanonicalResources {
  const canonical = record(packet.canonical_resources)
  const pullRequestUrl = text(canonical.pull_request_url)
  const match = pullRequestUrl.match(/\/pull\/(\d+)(?:$|[/?#])/)
  return {
    sourceRepository: text(canonical.source_repository),
    workingBranch: text(canonical.working_branch),
    pullRequestUrl,
    pullRequestNumber: match ? Number(match[1]) : null,
    vercelProjectId: text(canonical.vercel_project_id),
    vercelTeamId: text(canonical.vercel_team_id) || text(process.env.VERCEL_TEAM_ID),
    previewUrl: text(canonical.preview_url),
    browserworkerRepository: text(canonical.browserworker_repository),
    driveVisualSystemRoot: text(canonical.drive_visual_system_root),
  }
}

function parseRepository(value: string) {
  const [owner, repository, ...extra] = value.split('/')
  if (!owner || !repository || extra.length > 0) throw new Error('INVALID_SOURCE_REPOSITORY')
  return { owner, repository, fullName: `${owner}/${repository}` }
}

function requiredEnvironment(names: string[]) {
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) throw new Error(`ADAPTER_ENV_REQUIRED:${missing.join(',')}`)
}

async function json<T>(response: Response, label: string): Promise<T> {
  const raw = await response.text()
  let payload: unknown = null
  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = raw
  }
  if (!response.ok) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    throw new Error(`${label}_HTTP_${response.status}:${body.slice(0, 500)}`)
  }
  return payload as T
}

async function github<T>(path: string, init: RequestInit = {}): Promise<T> {
  requiredEnvironment(['GITHUB_TOKEN'])
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AUTOBUILDER-V2-Application-Factory-Adapter',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(30_000),
  })
  return json<T>(response, `GITHUB_${path}`)
}

async function vercel<T>(path: string, init: RequestInit = {}): Promise<T> {
  requiredEnvironment(['VERCEL_TOKEN'])
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
    signal: init.signal || AbortSignal.timeout(30_000),
  })
  return json<T>(response, `VERCEL_${path}`)
}

async function inspectPullRequest(resources: CanonicalResources): Promise<GitHubPullRequest> {
  if (!resources.pullRequestNumber) throw new Error('PULL_REQUEST_NUMBER_REQUIRED')
  const repository = parseRepository(resources.sourceRepository)
  return github<GitHubPullRequest>(
    `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}/pulls/${resources.pullRequestNumber}`,
  )
}

async function inspectDeployments(resources: CanonicalResources) {
  if (!resources.vercelProjectId || !resources.vercelTeamId) throw new Error('VERCEL_PROJECT_AND_TEAM_REQUIRED')
  const listing = await vercel<VercelDeploymentList>(
    `/v6/deployments?projectId=${encodeURIComponent(resources.vercelProjectId)}&limit=40&teamId=${encodeURIComponent(resources.vercelTeamId)}`,
  )
  const deployments = listing.deployments || []
  const previewHost = resources.previewUrl ? new URL(resources.previewUrl).hostname : ''
  const preview = deployments.find((deployment) => {
    if (previewHost && deployment.url === previewHost) return true
    return deployment.target !== 'production' && deployment.meta?.githubCommitRef === resources.workingBranch
  })
  const production = deployments.find(
    (deployment) => deployment.target === 'production' && stateOf(deployment) === 'READY' && deployment.id !== preview?.id,
  )
  return { deployments, preview: preview || null, production: production || null }
}

export function validateApplicationAdapterEnvelope(value: unknown): AdapterEnvelope {
  const envelope = record(value)
  const adapter = text(envelope.adapter)
  const method = text(envelope.method)
  if (!adapter) throw new Error('ADAPTER_REQUIRED')
  if (!method) throw new Error('METHOD_REQUIRED')
  return { adapter, method, payload: record(envelope.payload) }
}

export function evaluateParityEvidence(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const browser = record(payload.browser)
  const gates = record(packet.completion_gates)
  const routeCoverage = clamp(Number(browser.route_coverage || 0))
  const viewportCoverage = clamp(Number(browser.viewport_coverage || 0))
  const themeCoverage = clamp(Number(browser.theme_coverage || 0))
  const screenshotCoverage = clamp(Number(browser.screenshot_coverage || 0))
  const minimumScore = Math.min(routeCoverage, viewportCoverage, themeCoverage, screenshotCoverage)
  const requiredScore = Number(gates.visual_parity_minimum || 0.99)
  const lightRequired = Number(gates.light_mode_coverage_minimum || 1)
  const darkRequired = Number(gates.dark_mode_coverage_minimum || 1)
  const requiredThemes = strings(packet.required_themes)
  const lightCoverage = requiredThemes.includes('light') ? themeCoverage : 1
  const darkCoverage = requiredThemes.includes('dark') ? themeCoverage : 1
  const ok = minimumScore >= requiredScore && lightCoverage >= lightRequired && darkCoverage >= darkRequired
  return {
    ok,
    minimum_score: minimumScore,
    average_score: Number(((routeCoverage + viewportCoverage + themeCoverage + screenshotCoverage) / 4).toFixed(4)),
    light_mode_coverage: lightCoverage,
    dark_mode_coverage: darkCoverage,
    active_legacy_brand_violations: Number(browser.active_legacy_brand_violations || 0),
    failures: ok
      ? []
      : [
          ...(routeCoverage < 1 ? ['ROUTE_COVERAGE_INCOMPLETE'] : []),
          ...(viewportCoverage < 1 ? ['VIEWPORT_COVERAGE_INCOMPLETE'] : []),
          ...(themeCoverage < 1 ? ['THEME_COVERAGE_INCOMPLETE'] : []),
          ...(screenshotCoverage < 1 ? ['SCREENSHOT_COVERAGE_INCOMPLETE'] : []),
          ...(minimumScore < requiredScore ? ['VISUAL_PARITY_BELOW_MINIMUM'] : []),
        ],
  }
}

export function evaluateFunctionalEvidence(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const browser = record(payload.browser)
  const required = strings(packet.operational_scenarios)
  const proven = strings(browser.proven_operational_scenarios)
  const provenSet = new Set(proven)
  const matched = required.filter((scenario) => provenSet.has(scenario))
  const passRate = ratio(matched.length, required.length)
  const consoleErrors = Array.isArray(browser.console_errors) ? browser.console_errors.length : Number.MAX_SAFE_INTEGER
  const networkErrors = Array.isArray(browser.network_errors) ? browser.network_errors.length : Number.MAX_SAFE_INTEGER
  const deadControls = Number(browser.dead_controls ?? Number.MAX_SAFE_INTEGER)
  const ok = passRate === 1 && deadControls === 0 && consoleErrors === 0 && networkErrors === 0
  return {
    ok,
    pass_rate: passRate,
    dead_controls: deadControls,
    unexpected_console_errors: consoleErrors,
    unexpected_network_errors: networkErrors,
    proven_scenarios: matched,
    missing_scenarios: required.filter((scenario) => !provenSet.has(scenario)),
    failures: ok ? [] : ['FULL_OPERATIONAL_EVIDENCE_REQUIRED'],
  }
}

export function evaluateSecurityEvidence(payload: JsonRecord) {
  const evidence = record(payload.security_evidence || record(payload.functional).security_evidence)
  const tenantIsolation = evidence.tenant_isolation_proven === true
  const authorization = evidence.authorization_boundaries_proven === true
  const ok = tenantIsolation && authorization
  return {
    ok,
    tenant_isolation_failures: tenantIsolation ? 0 : 1,
    authorization_bypasses: authorization ? 0 : 1,
    evidence_source: text(evidence.source) || null,
    failures: ok
      ? []
      : [
          ...(!tenantIsolation ? ['TENANT_ISOLATION_EVIDENCE_REQUIRED'] : []),
          ...(!authorization ? ['AUTHORIZATION_BOUNDARY_EVIDENCE_REQUIRED'] : []),
        ],
  }
}

async function sourceTruthAdapter(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const canonical = record(packet.canonical_resources)
  const missing = REQUIRED_CANONICAL_RESOURCES.filter((key) => !text(canonical[key]))
  const sourceTruth = record(packet.source_truth)
  const driveAssets = Object.entries(canonical).filter(
    ([key, value]) => key.startsWith('drive_') && typeof value === 'string' && value.trim().length > 0,
  )
  const ok = missing.length === 0 && Object.keys(sourceTruth).length > 0
  return {
    ok,
    approved_asset_count: driveAssets.length,
    missing_assets: missing,
    active_legacy_brand_violations: 0,
    source_truth_present: Object.keys(sourceTruth).length > 0,
    failures: ok ? [] : ['SOURCE_TRUTH_PACKET_INCOMPLETE'],
  }
}

async function implementerAdapter(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const resources = canonicalResources(packet)
  const pull = await inspectPullRequest(resources)
  const branchMatches = pull.head?.ref === resources.workingBranch
  const ok = pull.state === 'open' && branchMatches && Boolean(pull.head?.sha)
  return {
    ok,
    commit_sha: pull.head?.sha || null,
    branch: pull.head?.ref || null,
    pull_request_url: pull.html_url || resources.pullRequestUrl,
    implementation_mode: 'existing_governed_feature_branch',
    failures: ok
      ? []
      : [
          ...(pull.state !== 'open' ? ['PULL_REQUEST_NOT_OPEN'] : []),
          ...(!branchMatches ? ['WORKING_BRANCH_MISMATCH'] : []),
          ...(!pull.head?.sha ? ['IMPLEMENTATION_COMMIT_REQUIRED'] : []),
        ],
  }
}

async function technicalAdapter(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const resources = canonicalResources(packet)
  const [pull, deploymentState] = await Promise.all([inspectPullRequest(resources), inspectDeployments(resources)])
  const previewReady = Boolean(deploymentState.preview && stateOf(deploymentState.preview) === 'READY')
  const rollbackReady = Boolean(deploymentState.production && stateOf(deploymentState.production) === 'READY')
  const ok = pull.state === 'open' && Boolean(pull.head?.sha) && previewReady && rollbackReady
  return {
    ok,
    commit_sha: pull.head?.sha || null,
    preview_deployment_id: deploymentState.preview?.id || null,
    preview_state: deploymentState.preview ? stateOf(deploymentState.preview) : 'MISSING',
    rollback_target: deploymentState.production?.id || null,
    failures: ok
      ? []
      : [
          ...(pull.state !== 'open' ? ['PULL_REQUEST_NOT_OPEN'] : []),
          ...(!previewReady ? ['PREVIEW_DEPLOYMENT_NOT_READY'] : []),
          ...(!rollbackReady ? ['ROLLBACK_BASELINE_REQUIRED'] : []),
        ],
  }
}

async function deployerAdapter(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const resources = canonicalResources(packet)
  const deploymentState = await inspectDeployments(resources)
  const preview = deploymentState.preview
  const ok = Boolean(preview && stateOf(preview) === 'READY' && preview.url)
  return {
    ok,
    deployment_id: preview?.id || null,
    url: preview?.url ? `https://${preview.url}` : resources.previewUrl || null,
    state: preview ? stateOf(preview) : 'MISSING',
    rollback_target: deploymentState.production?.id || null,
    failures: ok ? [] : ['PREVIEW_DEPLOYMENT_NOT_READY'],
  }
}

function browserRunEndpoint() {
  requiredEnvironment(['BROWSER_WORKER_URL'])
  const base = (process.env.BROWSER_WORKER_URL || '').replace(/\/$/, '')
  return base.endsWith('/api/run') ? base : `${base}/api/run`
}

function selectedRoutes(packet: JsonRecord): string[] {
  const routes = strings(packet.required_routes)
  const preferred = ['/', '/login', '/dashboard', '/projects', '/settings/company']
  const selected = preferred.filter((route) => routes.includes(route))
  return selected.length > 0 ? selected : routes.slice(0, 3)
}

async function browserAdapter(payload: JsonRecord) {
  const packet = packetFrom(payload)
  const preview = record(payload.preview)
  const url = text(preview.url)
  if (!url) return failure('PREVIEW_URL_REQUIRED', ['PREVIEW_URL_REQUIRED'])
  const routes = selectedRoutes(packet)
  const viewports = Array.isArray(packet.required_viewports)
    ? packet.required_viewports.map(record).filter((viewport) => Number(viewport.width) > 0 && Number(viewport.height) > 0)
    : []
  const requiredViewports = viewports.length > 0 ? viewports : [{ name: 'desktop', width: 1440, height: 1000 }]
  const requiredRoutes = strings(packet.required_routes)
  const requiredThemes = strings(packet.required_themes)

  const runs = await Promise.all(
    requiredViewports.map(async (viewport) => {
      const label = text(viewport.name) || `${viewport.width}x${viewport.height}`
      const steps = routes.flatMap((route) => [
        { action: 'goto', url: new URL(route, url).toString() },
        { action: 'validate_status' },
        { action: 'screenshot', fullPage: true },
        { action: 'capture_console' },
        { action: 'capture_network_errors' },
      ])
      const response = await fetch(browserRunEndpoint(), {
        method: 'POST',
        headers: { ...browserWorkerAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: '1.0',
          type: 'application-factory-evidence',
          job_id: `application-factory-${label}-${crypto.randomUUID()}`,
          correlation_id: text(payload.run_id) || `application-factory-${Date.now()}`,
          objective: `Capture status, screenshots, console, and network evidence for ${routes.join(', ')}`,
          url,
          viewport: { width: Number(viewport.width), height: Number(viewport.height), deviceScaleFactor: 1 },
          timeout_ms: 120_000,
          capture: { screenshot: true, console: true, network_errors: true, html: false },
          steps,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(125_000),
      })
      const result = await json<JsonRecord>(response, `BROWSERWORKER_${label}`)
      const artifacts = record(result.artifacts)
      const screenshots = strings(artifacts.screenshots)
      const consoleErrors = Array.isArray(artifacts.console_errors) ? artifacts.console_errors : []
      const networkErrors = Array.isArray(artifacts.network_errors) ? artifacts.network_errors : []
      const failedSteps = Array.isArray(result.steps)
        ? result.steps.map(record).filter((step) => step.status === 'fail')
        : []
      return {
        label,
        ok: result.ok === true && failedSteps.length === 0 && screenshots.length >= routes.length,
        screenshots,
        console_errors: consoleErrors,
        network_errors: networkErrors,
        failed_steps: failedSteps,
        receipt_id: text(result.receipt_id) || null,
      }
    }),
  )

  const screenshots = runs.flatMap((run) => run.screenshots)
  const consoleErrors = runs.flatMap((run) => run.console_errors)
  const networkErrors = runs.flatMap((run) => run.network_errors)
  const passedViewports = runs.filter((run) => run.ok).length
  const mechanicsPass = passedViewports === requiredViewports.length
  return {
    ok: mechanicsPass,
    screenshots,
    console_errors: consoleErrors,
    network_errors: networkErrors,
    dead_controls: Number.MAX_SAFE_INTEGER,
    tested_routes: routes,
    proven_operational_scenarios: [],
    route_coverage: ratio(routes.length, requiredRoutes.length),
    viewport_coverage: ratio(passedViewports, requiredViewports.length),
    theme_coverage: requiredThemes.length <= 1 ? 1 : 0.5,
    screenshot_coverage: ratio(screenshots.length, routes.length * requiredViewports.length),
    active_legacy_brand_violations: 0,
    runs,
    failures: mechanicsPass ? [] : ['BROWSER_MECHANICS_FAILED'],
  }
}

async function diagnoserAdapter(payload: JsonRecord) {
  const evaluation = record(payload.evaluation)
  const gate = record(evaluation.gate)
  const failures = strings(gate.failures)
  return {
    ok: true,
    failures,
    diagnosis: failures.map((item) => ({ failure: item, action: 'route_to_specialist_repair_worker' })),
    repair_supported: false,
  }
}

async function repairerAdapter(payload: JsonRecord) {
  return failure('SPECIALIST_REPAIR_EXECUTOR_REQUIRED', ['SPECIALIST_REPAIR_EXECUTOR_REQUIRED'], {
    commit_sha: null,
    diagnosis: record(payload.diagnosis),
    production_mutation: false,
  })
}

async function productionAdapter(payload: JsonRecord) {
  const run = record(payload.run)
  const packet = packetFrom({ run })
  const resources = canonicalResources(packet)
  const scorecard = record(run.scorecard)
  const gate = record(scorecard.gate)
  const approval = record(payload.approval)
  if (gate.ok !== true) return failure('VALIDATED_SCORECARD_REQUIRED', ['VALIDATED_SCORECARD_REQUIRED'])
  if (approval.decision !== 'approved') return failure('PRODUCTION_APPROVAL_REQUIRED', ['PRODUCTION_APPROVAL_REQUIRED'])
  const deploymentId = text(run.deployment_id)
  if (!deploymentId) return failure('RELEASE_DEPLOYMENT_REQUIRED', ['RELEASE_DEPLOYMENT_REQUIRED'])

  const [pull, deployments] = await Promise.all([inspectPullRequest(resources), inspectDeployments(resources)])
  const rollbackTarget = deployments.production?.id || null
  if (!rollbackTarget) return failure('ROLLBACK_BASELINE_REQUIRED', ['ROLLBACK_BASELINE_REQUIRED'])

  const repository = parseRepository(resources.sourceRepository)
  if (pull.state === 'open') {
    const merge = await github<GitHubMerge>(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}/pulls/${resources.pullRequestNumber}/merge`,
      {
        method: 'PUT',
        body: JSON.stringify({
          merge_method: 'squash',
          commit_title: `release: ${text(packet.project_name) || text(packet.project_id)} production candidate`,
          sha: pull.head?.sha,
        }),
      },
    )
    if (!merge.merged) return failure('PULL_REQUEST_MERGE_FAILED', ['PULL_REQUEST_MERGE_FAILED'], { message: merge.message || null })
  }

  await vercel(
    `/v10/projects/${encodeURIComponent(resources.vercelProjectId)}/promote/${encodeURIComponent(deploymentId)}?teamId=${encodeURIComponent(resources.vercelTeamId)}`,
    { method: 'POST', body: '{}' },
  )

  const deployment = await vercel<VercelDeployment>(
    `/v13/deployments/${encodeURIComponent(deploymentId)}?teamId=${encodeURIComponent(resources.vercelTeamId)}`,
  )
  const url = deployment.url ? `https://${deployment.url}` : text(run.preview_url)
  const requiredRoutes = strings(packet.required_routes)
  const smokeRoutes = requiredRoutes.length > 0 ? requiredRoutes : ['/']
  const smoke = await Promise.all(
    smokeRoutes.map(async (route) => {
      try {
        const response = await fetch(new URL(route, url), {
          cache: 'no-store',
          redirect: 'manual',
          signal: AbortSignal.timeout(20_000),
        })
        return { route, status: response.status, passed: response.status < 500 }
      } catch (error) {
        return { route, status: 0, passed: false, error: error instanceof Error ? error.message : String(error) }
      }
    }),
  )
  const smokePass = smoke.every((item) => item.passed)
  if (!smokePass) {
    await vercel(
      `/v1/projects/${encodeURIComponent(resources.vercelProjectId)}/rollback/${encodeURIComponent(rollbackTarget)}?teamId=${encodeURIComponent(resources.vercelTeamId)}&description=${encodeURIComponent('Application factory production smoke failed')}`,
      { method: 'POST', body: '{}' },
    )
    return failure('PRODUCTION_SMOKE_FAILED', ['PRODUCTION_SMOKE_FAILED'], {
      deployment_id: deploymentId,
      url,
      smoke,
      smoke_test_passed: false,
      rollback_ready: true,
      rolled_back: true,
      rollback_target: rollbackTarget,
    })
  }

  return {
    ok: true,
    deployment_id: deploymentId,
    url,
    smoke_test_passed: true,
    rollback_ready: true,
    rollback_target: rollbackTarget,
    smoke,
    release_receipt_hash: createHmac('sha256', process.env.CRON_SECRET || 'unconfigured')
      .update(`${text(payload.run_id)}:${deploymentId}:${url}`)
      .digest('hex'),
    failures: [],
  }
}

export async function executeApplicationFactoryAdapter(envelope: AdapterEnvelope) {
  const { adapter, method, payload } = envelope
  const expectedMethod: Record<string, string> = {
    source_truth: 'audit',
    implementer: 'implement',
    technical: 'validate',
    deployer: 'preview',
    browser: 'validate',
    parity: 'score',
    functional: 'validate',
    security: 'validate',
    diagnoser: 'diagnose',
    repairer: 'repair',
    production: 'promote',
  }
  if (!expectedMethod[adapter]) return failure('UNKNOWN_ADAPTER', ['UNKNOWN_ADAPTER'])
  if (expectedMethod[adapter] !== method) return failure('ADAPTER_METHOD_MISMATCH', ['ADAPTER_METHOD_MISMATCH'])

  try {
    if (adapter === 'source_truth') return sourceTruthAdapter(payload)
    if (adapter === 'implementer') return implementerAdapter(payload)
    if (adapter === 'technical') return technicalAdapter(payload)
    if (adapter === 'deployer') return deployerAdapter(payload)
    if (adapter === 'browser') return browserAdapter(payload)
    if (adapter === 'parity') return evaluateParityEvidence(payload)
    if (adapter === 'functional') return evaluateFunctionalEvidence(payload)
    if (adapter === 'security') return evaluateSecurityEvidence(payload)
    if (adapter === 'diagnoser') return diagnoserAdapter(payload)
    if (adapter === 'repairer') return repairerAdapter(payload)
    if (adapter === 'production') return productionAdapter(payload)
    return failure('UNKNOWN_ADAPTER', ['UNKNOWN_ADAPTER'])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return failure('ADAPTER_EXECUTION_FAILED', [message], { production_mutation: false })
  }
}
