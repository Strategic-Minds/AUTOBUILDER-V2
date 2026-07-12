import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BASE44_AGENT_URL = 'https://app.base44.com/api/agents/6a4ae522852a5e08bfa42450'
const BASE44_API_KEY = process.env.BASE44_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, thread_id, source = 'gpt', context = {} } = body

    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 })

    if (!BASE44_API_KEY) {
      return NextResponse.json({ 
        ok: false, 
        error: 'BASE44_API_KEY not configured in Vercel env vars',
        setup: 'Add BASE44_API_KEY to your Vercel project environment variables'
      }, { status: 503 })
    }

    const agentRes = await fetch(`${BASE44_AGENT_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BASE44_API_KEY}`,
      },
      body: JSON.stringify({
        content: message,
        role: 'user',
        metadata: { source, thread_id, context }
      }),
      signal: AbortSignal.timeout(55000)
    })

    if (!agentRes.ok) {
      const err = await agentRes.text()
      return NextResponse.json({ 
        error: 'Base44 agent error', 
        status: agentRes.status,
        detail: err.slice(0, 200)
      }, { status: 502 })
    }

    const agentData = await agentRes.json()
    return NextResponse.json({
      ok: true,
      reply: agentData.content || agentData.message || agentData.reply || JSON.stringify(agentData),
      thread_id: thread_id || agentData.conversation_id,
      source: 'base44-superagent',
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Bridge error', detail: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    bridge: 'gpt-base44-superagent',
    status: process.env.BASE44_API_KEY ? 'ready' : 'unconfigured — add BASE44_API_KEY to Vercel env',
    agent_id: '6a4ae522852a5e08bfa42450',
    usage: {
      method: 'POST',
      body: { message: 'string', thread_id: 'string (optional)', source: 'string (optional)' }
    },
    timestamp: new Date().toISOString()
  })
}
