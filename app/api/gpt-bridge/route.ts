import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_BASE44_AGENT_URL = 'https://app.base44.com/api/agents/6a4ae522852a5e08bfa42450'

function bridgeConfig() {
  const configuredUrl = process.env.BASE44_AGENT_WEBHOOK_URL || process.env.BASE44_AGENT_URL || DEFAULT_BASE44_AGENT_URL
  const baseUrl = configuredUrl.replace(/\/$/, '')
  return {
    messageUrl: baseUrl.endsWith('/messages') ? baseUrl : `${baseUrl}/messages`,
    outboundToken: process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || '',
    inboundToken: process.env.AUTO_BUILDER_BRIDGE_TOKEN || '',
  }
}

function authorizeBridge(req: NextRequest) {
  const standard = authorizeInternalRequest(req, 'agents:dispatch')
  if (standard.ok) return standard
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const { inboundToken } = bridgeConfig()
  if (inboundToken && token === inboundToken) return { ...standard, ok: true, state: 'AUTHORIZED' as const, http_status: 200 as const, error: undefined }
  return standard
}

export async function POST(req: NextRequest) {
  const auth = authorizeBridge(req)
  if (!auth.ok) return NextResponse.json({ ok: false, state: auth.state, error: auth.error }, { status: auth.http_status })
  try {
    const body = await req.json()
    const message = String(body.message || body.content || '').trim()
    if (!message) return NextResponse.json({ ok: false, error: 'message is required' }, { status: 400 })
    const { messageUrl, outboundToken } = bridgeConfig()
    if (!outboundToken) return NextResponse.json({ ok: false, state: 'BLOCKED_BASE44_CREDENTIAL_REQUIRED', missing_environment_variables: ['BASE44_SERVICE_TOKEN'] }, { status: 503 })
    const correlationId = req.headers.get('x-correlation-id') || `base44-${crypto.randomUUID()}`
    const idempotencyKey = req.headers.get('x-idempotency-key') || `base44:${correlationId}`
    const response = await fetch(messageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${outboundToken}`, 'X-Correlation-Id': correlationId, 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ content: message, role: 'user', metadata: { source: body.source || 'autobuilder-v2', thread_id: body.thread_id, context: body.context || {}, correlation_id: correlationId, idempotency_key: idempotencyKey, production_target: true } }),
      signal: AbortSignal.timeout(55_000), cache: 'no-store',
    })
    const text = await response.text()
    let data: Record<string, unknown> = { content: text }
    try { data = text ? JSON.parse(text) : {} } catch { /* keep text */ }
    if (!response.ok) return NextResponse.json({ ok: false, state: 'BASE44_AGENT_ERROR', status: response.status, detail: text.slice(0, 500), correlation_id: correlationId }, { status: 502 })
    return NextResponse.json({ ok: true, state: 'BASE44_ROUND_TRIP_COMPLETED', reply: data.content || data.message || data.reply || data, thread_id: body.thread_id || data.conversation_id || data.thread_id || null, source: 'base44-superagent', correlation_id: correlationId, idempotency_key: idempotencyKey, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ ok: false, state: 'BRIDGE_ERROR', error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function GET() {
  const { outboundToken, inboundToken } = bridgeConfig()
  return NextResponse.json({ ok: true, bridge: 'autobuilder-v2-base44-superagent', status: outboundToken ? 'ready' : 'credential_required', outbound_base44_configured: Boolean(outboundToken), inbound_bridge_configured: Boolean(inboundToken || process.env.CRON_SECRET), agent_id: '6a4ae522852a5e08bfa42450', production_target: true, timestamp: new Date().toISOString() })
}
