import { browserWorkerAuthHeaders } from './native-build-adapter'

type JsonRecord = Record<string, unknown>
type FetchLike = typeof fetch

type AdapterOptions = {
  fetchImpl?: FetchLike
  env?: Record<string, string | undefined>
}

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function text(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 1
  return clamp(numerator / denominator)
}

function packetFrom(payload: JsonRecord): JsonRecord {
  return record(payload.packet || record(payload.run).project_packet)
}

function globalEndpoint(env: Record<string, string | undefined>): string {
  const explicit = text(env.BROWSER_WORKER_GLOBAL_URL)
  if (explicit) return requireHttps(explicit)

  const configured = text(env.BROWSER_WORKER_URL)
  if (!configured) throw new Error('ADAPTER_ENV_REQUIRED:BROWSER_WORKER_GLOBAL_URL|BROWSER_WORKER_URL')
  const base = configured.replace(/\/$/, '')
  if (base.endsWith('/api/global-validate')) return requireHttps(base)
  if (base.endsWith('/api/run')) return requireHttps(base.replace(/\/api\/run$/, '/api/global-validate'))
  return requireHttps(`${base}/api/global-validate`)
}

function requireHttps(value: string): string {
  const parsed = new URL(value)
  const localTest = process.env.NODE_ENV === 'test' && ['localhost', '127.0.0.1'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !localTest) throw new Error('BROWSER_WORKER_URL_HTTPS_REQUIRED')
  return parsed.toString()
}

function selectedRoutes(packet: JsonRecord): string[] {
  const routes = strings(packet.required_routes)
  const preferred = ['/', '/login', '/dashboard', '/projects', '/settings/company']
  const selected = preferred.filter((route) => routes.includes(route))
  return (selected.length > 0 ? selected : routes).slice(0, 3)
}

function referenceHashes(packet: JsonRecord): string[] {
  const approved = record(packet.approved_reference_manifest || packet.reference_manifest)
  return strings(approved.screenshot_hashes || packet.approved_reference_hashes)
    .filter((value) => /^[a-f0-9]{64}$/i.test(value))
}

function workerEntries(result: JsonRecord): JsonRecord[] {
  const viewports = record(result.viewports)
  return Object.values(viewports).map(record)
}

function entrySummary(entry: JsonRecord): JsonRecord {
  return record(entry.summary)
}

function stringValues(entries: JsonRecord[], field: string): string[] {
  return entries.flatMap((entry) => strings(entrySummary(entry)[field]))
}

export async function executeGlobalBrowserValidationAdapter(
  payload: JsonRecord,
  options: AdapterOptions = {},
) {
  const packet = packetFrom(payload)
  const preview = record(payload.preview)
  const url = text(preview.url)
  if (!url) {
    return {
      ok: false,
      code: 'PREVIEW_URL_REQUIRED',
      failures: ['PREVIEW_URL_REQUIRED'],
      production_mutation: false,
    }
  }

  const projectId = text(packet.project_id || packet.id)
  if (!projectId) {
    return {
      ok: false,
      code: 'PROJECT_ID_REQUIRED',
      failures: ['PROJECT_ID_REQUIRED'],
      production_mutation: false,
    }
  }

  const env = options.env || process.env
  const fetchImpl = options.fetchImpl || fetch
  const routes = selectedRoutes(packet)
  const requiredRoutes = strings(packet.required_routes)
  const requiredThemes = strings(packet.required_themes)
  const requiredScenarios = strings(packet.operational_scenarios)
  const provenScenarios = strings(
    payload.proven_operational_scenarios
      || record(payload.functional).proven_operational_scenarios,
  )
  const expectedViewportCount = 3
  const correlationId = text(payload.correlation_id || payload.run_id) || `application-factory-${Date.now()}`

  let response: Response
  try {
    response = await fetchImpl(globalEndpoint(env), {
      method: 'POST',
      headers: {
        ...browserWorkerAuthHeaders(env),
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
        'X-Idempotency-Key': text(payload.idempotency_key) || `browser:${projectId}:${correlationId}`,
      },
      body: JSON.stringify({
        project_id: projectId,
        artifact_id: text(packet.approval_manifest_id || payload.artifact_id) || undefined,
        correlation_id: correlationId,
        surface: ['website', 'dashboard', 'app', 'system'].includes(text(packet.project_type))
          ? text(packet.project_type)
          : 'system',
        url,
        routes,
        exact_reference_hashes: referenceHashes(packet),
        required_scenarios: requiredScenarios,
        proven_scenarios: provenScenarios,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(300_000),
    })
  } catch (error) {
    return {
      ok: false,
      code: 'BROWSERWORKER_REQUEST_FAILED',
      failures: [error instanceof Error ? error.message : String(error)],
      production_mutation: false,
    }
  }

  const raw = await response.text()
  let result: JsonRecord
  try {
    result = record(raw ? JSON.parse(raw) : {})
  } catch {
    return {
      ok: false,
      code: 'BROWSERWORKER_INVALID_JSON',
      failures: ['BROWSERWORKER_INVALID_JSON'],
      http_status: response.status,
      production_mutation: false,
    }
  }

  if (!response.ok && response.status !== 422) {
    return {
      ok: false,
      code: text(result.code) || `BROWSERWORKER_HTTP_${response.status}`,
      failures: strings(result.errors).length > 0 ? strings(result.errors) : [`BROWSERWORKER_HTTP_${response.status}`],
      http_status: response.status,
      production_mutation: false,
    }
  }

  const entries = workerEntries(result)
  const summaries = entries.map(entrySummary)
  const screenshotHashes = stringValues(entries, 'screenshot_hashes')
  const consoleErrors = stringValues(entries, 'console_errors')
  const networkErrors = stringValues(entries, 'network_errors')
  const failedSteps = stringValues(entries, 'failed_steps')
  const passedRuns = summaries.filter((summary) => summary.ok === true).length
  const expectedRuns = routes.length * expectedViewportCount
  const lease = record(result.lease)
  const evidence = record(result.evidence)
  const promotion = record(result.promotion)
  const visualParity = record(promotion.visual_parity)
  const operationalParity = record(promotion.operational_parity)
  const durableLease = lease.durable === true && lease.released === true
  const durableArtifacts = evidence.durable_artifact_persistence_proven === true
  const mechanicsPass = result.ok === true && passedRuns === expectedRuns
  const operationalProven = operationalParity.proven === true
  const exactVisualProven = visualParity.proven === true
  const themeCoverage = requiredThemes.length === 0 ? 1 : exactVisualProven ? 1 : 0
  const failures = [
    ...strings(result.errors),
    ...strings(promotion.blockers),
    ...(!mechanicsPass ? ['BROWSER_MECHANICS_FAILED'] : []),
    ...(!durableLease ? ['DURABLE_BROWSER_LEASE_REQUIRED'] : []),
    ...(!durableArtifacts ? ['DURABLE_BROWSER_ARTIFACT_PERSISTENCE_REQUIRED'] : []),
  ]

  return {
    ok: mechanicsPass && durableLease && durableArtifacts,
    code: mechanicsPass && durableLease && durableArtifacts ? 'BROWSER_EVIDENCE_PASS' : 'BROWSER_EVIDENCE_INCOMPLETE',
    screenshots: screenshotHashes.map((hash) => `sha256:${hash}`),
    screenshot_hashes: screenshotHashes,
    console_errors: consoleErrors,
    network_errors: networkErrors,
    failed_steps: failedSteps,
    dead_controls: operationalProven ? 0 : Number.MAX_SAFE_INTEGER,
    tested_routes: routes,
    proven_operational_scenarios: operationalProven ? requiredScenarios : [],
    route_coverage: ratio(routes.length, requiredRoutes.length),
    viewport_coverage: ratio(passedRuns, expectedRuns),
    theme_coverage: themeCoverage,
    screenshot_coverage: ratio(screenshotHashes.length, expectedRuns),
    active_legacy_brand_violations: Number(result.active_legacy_brand_violations || 0),
    durable_lease_proven: durableLease,
    durable_artifact_persistence_proven: durableArtifacts,
    exact_visual_parity_proven: exactVisualProven,
    operational_parity_proven: operationalProven,
    promotion_eligible: promotion.promotion_eligible === true && mechanicsPass && durableLease && durableArtifacts,
    evidence_digest: text(evidence.digest) || null,
    validation_id: text(result.validation_id) || null,
    correlation_id: text(result.correlation_id) || correlationId,
    runs: entries,
    failures: [...new Set(failures)],
    production_mutation: false,
  }
}
