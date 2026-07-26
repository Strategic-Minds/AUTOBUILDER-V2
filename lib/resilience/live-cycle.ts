import { runResilienceCycle, type FaultInput } from './engine'
import { createRun, finishBrowserJob, finishRun, saveBrowserJob, saveReceipt } from './store'

type JsonRecord = Record<string, unknown>

type Viewport = { label: 'desktop' | 'tablet' | 'mobile'; width: number; height: number }

const VIEWPORTS: Viewport[] = [
  { label: 'desktop', width: 1440, height: 1200 },
  { label: 'tablet', width: 834, height: 1112 },
  { label: 'mobile', width: 390, height: 844 },
]

function workerConfig() {
  const url = (process.env.BROWSER_WORKER_URL || '').replace(/\/$/, '')
  const secret = process.env.AUTO_BUILDER_OPERATOR_TOKEN
    || process.env.AUTO_BUILDER_BRIDGE_TOKEN
    || process.env.AGENT_OPERATOR_TOKEN
    || process.env.BROWSER_WORKER_SECRET
    || ''
  if (!url || !secret) throw new Error('BrowserWorker is not configured')
  return { url, secret }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function screenshotPresent(result: JsonRecord) {
  const artifacts = asRecord(result.artifacts)
  const screenshots = Array.isArray(artifacts.screenshots) ? artifacts.screenshots : []
  const values = [artifacts.screenshot_url, artifacts.screenshot, artifacts.screenshot_data_url, artifacts.screenshot_base64, result.screenshot_url, ...screenshots]
  return values.some((value) => typeof value === 'string' && value.length > 20)
}

async function runViewport(runId: string, targetUrl: string, viewport: Viewport) {
  const { url, secret } = workerConfig()
  const externalJobId = `xro-${viewport.label}-${crypto.randomUUID()}`
  const request = {
    version: '1.0',
    type: 'generated-site-validation',
    job_id: externalJobId,
    correlation_id: runId,
    objective: `Validate ${targetUrl}/resilience. Confirm the page loads, the main heading and production lock are visible, the recursive cycle button is usable, there is no horizontal overflow, console and network errors are captured, accessibility evidence is captured, and a retrievable screenshot is returned for ${viewport.label}.`,
    url: `${targetUrl.replace(/\/$/, '')}/resilience`,
    viewport: { width: viewport.width, height: viewport.height, deviceScaleFactor: 1 },
    timeout_ms: 90_000,
    capture: { screenshot: true, console: true, network_errors: true, accessibility: true },
    metadata: { mission_id: 'UASF-V7-20260726-001', viewport: viewport.label },
  }

  await saveBrowserJob(runId, externalJobId, viewport.label, request)

  try {
    const response = await fetch(`${url}/api/run`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'X-Auto-Builder-Token': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: AbortSignal.timeout(110_000),
    })
    const raw = await response.text()
    let result: JsonRecord = {}
    try { result = raw ? JSON.parse(raw) as JsonRecord : {} } catch { result = { raw: raw.slice(0, 2000) } }
    const artifacts = asRecord(result.artifacts)
    const consoleErrors = Array.isArray(artifacts.console_errors) ? artifacts.console_errors : []
    const networkErrors = Array.isArray(artifacts.network_errors) ? artifacts.network_errors : []
    const status = typeof result.status === 'string' ? result.status.toLowerCase() : ''
    const passed = response.ok && result.ok === true && ['pass', 'warn'].includes(status) && consoleErrors.length === 0 && networkErrors.length === 0 && screenshotPresent(result)
    await finishBrowserJob(externalJobId, passed, result, passed ? undefined : `Worker returned ${response.status} ${status || 'unknown'}`)
    return { viewport: viewport.label, passed, responseStatus: response.status, screenshotPresent: screenshotPresent(result), result }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await finishBrowserJob(externalJobId, false, {}, message)
    return { viewport: viewport.label, passed: false, responseStatus: 0, screenshotPresent: false, result: {}, error: message }
  }
}

export async function executeLiveResilienceCycle(targetUrl: string) {
  const cycleId = `live-${Date.now()}`
  const run = await createRun(cycleId)
  const browserResults = await Promise.all(VIEWPORTS.map((viewport) => runViewport(run.id, targetUrl, viewport)))
  const faults: FaultInput[] = browserResults.map((item) => ({
    id: `browser-${item.viewport}`,
    signal: `${item.viewport} BrowserWorker validation`,
    severity: 'critical',
    detected: true,
    repaired: item.passed,
    regressionPass: item.passed,
  }))
  const result = runResilienceCycle(faults, cycleId)
  const evidence = { targetUrl, viewports: browserResults, screenshotCount: browserResults.filter((item) => item.screenshotPresent).length }
  await finishRun(run.id, { score: result.score, releaseGate: result.releaseGate, findings: result.findings, browserEvidence: evidence })
  await saveReceipt(run.id, 'browserworker_validation_mesh', result.releaseGate === 'PREVIEW_ACCEPTABLE', evidence)
  return { runId: run.id, result, evidence }
}
