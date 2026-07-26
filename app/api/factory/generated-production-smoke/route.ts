import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const PROOF_KEY = 'generated-production-smoke-20260726'
const BASE_URL = 'https://xab-universal-gpt-factory-provisioning-proof-2026072-necvvuseo.vercel.app'
const EXPECTED_COMMIT = '75675391aa8b17c25e082c70f2d8177345f7f156'

async function get(path: string) {
  const response = await fetch(`${BASE_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(30_000) })
  return { status: response.status, ok: response.ok, text: await response.text(), headers: Object.fromEntries(response.headers.entries()) }
}

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV === 'production' || request.nextUrl.searchParams.get('proof') !== PROOF_KEY) {
    return NextResponse.json({ ok: false, state: 'NOT_FOUND' }, { status: 404 })
  }

  const [home, capabilities, contact, health, manifest] = await Promise.all([
    get('/'), get('/capabilities'), get('/contact'), get('/api/health'), get('/manifest.webmanifest'),
  ])

  const formResponse = await fetch(`${BASE_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Synthetic Factory Validation',
      email: 'validation@example.com',
      message: 'This is a synthetic production smoke test. No customer communication should be sent.',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  const formText = await formResponse.text()

  let healthJson: Record<string, unknown> = {}
  let formJson: Record<string, unknown> = {}
  try { healthJson = JSON.parse(health.text) as Record<string, unknown> } catch {}
  try { formJson = JSON.parse(formText) as Record<string, unknown> } catch {}

  const securityHeaders = home.headers
  const checks = {
    home: home.ok && home.text.includes('Infrastructure becomes a verified production system.'),
    capabilities: capabilities.ok && capabilities.text.includes('A complete create-to-production operating loop.'),
    contact: contact.ok && contact.text.includes('Test the production-safe form.'),
    health: health.ok && healthJson.ok === true && healthJson.commit === EXPECTED_COMMIT && healthJson.environment === 'production',
    manifest: manifest.ok && manifest.text.includes('Universal GPT Factory Proof'),
    form: formResponse.ok && formJson.ok === true && formJson.synthetic === true && typeof formJson.receipt_id === 'string',
    csp: typeof securityHeaders['content-security-policy'] === 'string',
    hsts: typeof securityHeaders['strict-transport-security'] === 'string',
    frame_protection: securityHeaders['x-frame-options'] === 'DENY',
    content_type_protection: securityHeaders['x-content-type-options'] === 'nosniff',
  }
  const passed = Object.values(checks).every(Boolean)

  return NextResponse.json({
    ok: passed,
    state: passed ? 'GENERATED_PRODUCTION_SMOKE_PASS' : 'GENERATED_PRODUCTION_SMOKE_FAILED',
    target: BASE_URL,
    expected_commit: EXPECTED_COMMIT,
    checks,
    statuses: {
      home: home.status,
      capabilities: capabilities.status,
      contact: contact.status,
      health: health.status,
      manifest: manifest.status,
      form: formResponse.status,
    },
    form_receipt_id: typeof formJson.receipt_id === 'string' ? formJson.receipt_id : null,
    customer_message_sent: false,
    production_traffic_changed: false,
    timestamp: new Date().toISOString(),
  }, { status: passed ? 200 : 422 })
}
