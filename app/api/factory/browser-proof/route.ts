import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const PROOF_KEY = 'enterprise-browser-proof-20260726'
const TARGET_URL = 'https://xab-universal-gpt-factory-provisioning-proof-2026072-necvvuseo.vercel.app'
const TARGET_COMMIT = '75675391aa8b17c25e082c70f2d8177345f7f156'

const viewports = [
  { label: 'desktop', width: 1440, height: 1200 },
  { label: 'tablet', width: 834, height: 1112 },
  { label: 'mobile', width: 390, height: 844 },
]

function browserConfig() {
  const url = (process.env.BROWSER_WORKER_URL || '').replace(/\/$/, '')
  const secret = process.env.AUTO_BUILDER_OPERATOR_TOKEN
    || process.env.AUTO_BUILDER_BRIDGE_TOKEN
    || process.env.AGENT_OPERATOR_TOKEN
    || process.env.BROWSER_WORKER_SECRET
    || ''
  if (!url || !secret) throw new Error('BrowserWorker is not configured')
  return { url, secret }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function screenshotPresent(result: Record<string, unknown>) {
  const artifacts = asRecord(result.artifacts)
  const screenshots = Array.isArray(artifacts.screenshots) ? artifacts.screenshots : []
  const candidates = [
    artifacts.screenshot_url,
    artifacts.screenshot,
    artifacts.screenshot_data_url,
    artifacts.screenshot_base64,
    result.screenshot_url,
    ...screenshots,
  ]
  return candidates.some((value) => typeof value === 'string' && value.length > 20)
}

async function runViewport(label: string, width: number, height: number) {
  const { url, secret } = browserConfig()
  const response = await fetch(`${url}/api/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'X-Auto-Builder-Token': secret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '1.0',
      type: 'generated-site-validation',
      job_id: `universal-gpt-${label}-${crypto.randomUUID()}`,
      correlation_id: `project-0a312970-${label}`,
      objective: `Validate the production application at ${TARGET_URL}. Verify the home page renders, primary navigation contains Overview, Capabilities, and Contact links, there is no horizontal overflow, the page has an h1, links are usable, console and network errors are captured, accessibility roles are captured, and a retrievable screenshot is returned for ${label}.`,
      url: TARGET_URL,
      viewport: { width, height, deviceScaleFactor: 1 },
      timeout_ms: 90_000,
      capture: { screenshot: true, console: true, network_errors: true, accessibility: true },
      metadata: { target_commit: TARGET_COMMIT, route: '/', phase: 'production_browser_proof' },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(110_000),
  })
  const raw = await response.text()
  let result: Record<string, unknown> = {}
  try { result = raw ? JSON.parse(raw) as Record<string, unknown> : {} } catch { result = { raw: raw.slice(0, 2000) } }
  const artifacts = asRecord(result.artifacts)
  const consoleErrors = Array.isArray(artifacts.console_errors) ? artifacts.console_errors : []
  const networkErrors = Array.isArray(artifacts.network_errors) ? artifacts.network_errors : []
  const status = typeof result.status === 'string' ? result.status.toLowerCase() : ''
  const passed = response.ok
    && result.ok === true
    && ['pass', 'warn'].includes(status)
    && consoleErrors.length === 0
    && networkErrors.length === 0
    && screenshotPresent(result)

  return {
    label,
    width,
    height,
    passed,
    http_status: response.status,
    worker_ok: result.ok === true,
    worker_status: result.status || null,
    screenshot_present: screenshotPresent(result),
    artifacts,
    steps: Array.isArray(result.steps) ? result.steps : [],
    receipt_id: result.receipt_id || null,
    worker_version: result.worker_version || null,
    target_commit: TARGET_COMMIT,
    target_url: TARGET_URL,
  }
}

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production' || req.nextUrl.searchParams.get('proof') !== PROOF_KEY) {
    return NextResponse.json({ ok: false, state: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    const results = await Promise.all(viewports.map((viewport) => runViewport(viewport.label, viewport.width, viewport.height)))
    const passed = results.every((result) => result.passed)
    return NextResponse.json({
      ok: passed,
      state: passed ? 'BROWSERWORKER_PRODUCTION_PASS' : 'BROWSERWORKER_PRODUCTION_FAILED',
      target_url: TARGET_URL,
      target_commit: TARGET_COMMIT,
      viewports: results,
      screenshot_count: results.filter((result) => result.screenshot_present).length,
      production_traffic_changed: false,
      timestamp: new Date().toISOString(),
    }, { status: passed ? 200 : 422 })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      state: 'BROWSERWORKER_PRODUCTION_ERROR',
      error: error instanceof Error ? error.message : String(error),
      target_url: TARGET_URL,
      target_commit: TARGET_COMMIT,
      production_traffic_changed: false,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
