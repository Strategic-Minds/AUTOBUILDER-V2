import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_BASE44_AGENT_URL = 'https://app.base44.com/api/agents/6a4ae522852a5e08bfa42450'

function bridgeConfig() {
  const configuredUrl = process.env.BASE44_AGENT_WEBHOOK_URL || process.env.BASE44_AGENT_URL || DEFAULT_BASE44_AGENT_URL
  const baseUrl = configuredUrl.replace(/\/$/, '')
  const messageUrl = baseUrl.endsWith('/messages') ? baseUrl : `${baseUrl}/messages`
  const outboundToken = process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || ''
  const inboundToken = process.env.AUTO_BUILDER_BRIDGE_TOKEN || ''
  return { messageUrl, outboundToken, inboundToken }
}

function authorizeBridgeRequest(req: NextRequest) {
  const standard = authorizeInternalRequest(req, 'agents:dispatch')
  if (standard.ok) return standard

  const { inboundToken } = bridgeConfig()
  const header = req.headers.get('authorization') || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (inboundToken && bearer === inboundToken) {
    return {
      ...standard,
      ok: true,
      state: 'AUTHORIZED' as const,
      http_status: 200 as const,
      service_id: req.headers.get('x-service-id') || 'base44-bridge',
      error: undefined,
    }
  }
  return standard
}

function parseAgentResponse(text: string) {
  if (!text) return null
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { content: text }
  }
}

export async function POST(req: NextRequest) {
  const auth = authorizeBridgeRequest(req)
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, request_id: auth.request_id },
      { status: auth.http_status },
    )
  }

  try {
    const body = await req.json()
    const message = String(body.message || body.content || '').trim()
    const threadId = body.thread_id ? String(body.thread_id) : undefined
    const source = String(body.source || 'autobuilder-v2')
    const context = body.context && typeof body.context === 'object' ? body.context : {}

    if (!message) return NextResponse.json({ ok: false, error: 'message is required' }, { status: 400 })

    const { messageUrl, outboundToken } = bridgeConfig()
    if (!outboundToken) {
      return NextResponse.json(
        {
          ok: false,
          state: 'BLOCKED_BASE44_CREDENTIAL_REQUIRED',
          error: 'Base44 outbound credential is not configured',
          missing_environment_variables: ['BASE44_SERVICE_TOKEN'],
          production_target: true,
          production_locked_until_gates_pass: true,
        },
        { status: 503 },
      )
    }

    const correlationId = req.headers.get('x-correlation-id') || `base44-${crypto.randomUUID()}`
    const idempotencyKey = req.headers.get('x-idempotency-key') || `base44:${correlationId}`
    const agentRes = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${outboundToken}`,
        'X-Correlation-Id': correlationId,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        content: message,
        role: 'user',
        metadata: {
          source,
          thread_id: threadId,
          context,
          correlation_id: correlationId,
          idempotency_key: idempotencyKey,
          production_target: true,
          automatic_production_after_gates: true,
          production_locked_until_gates_pass: true,
        },
      }),
      signal: AbortSignal.timeout(55_000),
      cache: 'no-store',
    })

    const responseText = await agentRes.text()
    const agentData = parseAgentResponse(responseText)
    if (!agentRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          state: 'BASE44_AGENT_ERROR',
          status: agentRes.status,
          detail: responseText.slice(0, 500),
          correlation_id: correlationId,
          production_target: true,
          production_locked_until_gates_pass: true,
        },
        { status: 502 },
      )
    }

    const record = agentData || {}
    return NextResponse.json({
      ok: true,
      state: 'BASE44_ROUND_TRIP_COMPLETED',
      reply: record.content || record.message || record.reply || agentData,
      thread_id: threadId || record.conversation_id || record.thread_id || null,
      source: 'base44-superagent',
      correlation_id: correlationId,
      idempotency_key: idempotencyKey,
      production_target: true,
      automatic_production_after_gates: true,
      production_locked_until_gates_pass: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        ok: false,
        state: 'BRIDGE_ERROR',
        error: detail,
        production_target: true,
        production_locked_until_gates_pass: true,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const { outboundToken, inboundToken } = bridgeConfig()
  return NextResponse.json({
    ok: true,
    bridge: 'autobuilder-v2-base44-superagent',
    status: outboundToken ? 'ready' : 'credential_required',
    outbound_base44_configured: Boolean(outboundToken),
    inbound_bridge_configured: Boolean(inboundToken || process.env.CRON_SECRET),
    agent_id: '6a4ae522852a5e08bfa42450',
    production_target: true,
    automatic_production_after_gates: true,
    production_locked_until_gates_pass: true,
    usage: {
      method: 'POST',
      authentication: 'Bearer AUTO_BUILDER_BRIDGE_TOKEN or CRON_SECRET',
      body: { message: 'string', thread_id: 'string (optional)', source: 'string (optional)', context: 'object (optional)' },
    },
    timestamp: new Date().toISOString(),
  })
}
