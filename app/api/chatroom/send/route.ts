import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function sbInsert(table: string, data: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  })
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, agent_name, agent_emoji, message, message_type, thread_id } = body

    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const result = await sbInsert('agent_messages', {
      agent_id: agent_id ?? 'human',
      agent_name: agent_name ?? 'Jeremy',
      agent_emoji: agent_emoji ?? '👤',
      message: message.trim(),
      message_type: message_type ?? 'chat',
      thread_id: thread_id ?? null,
      created_at: new Date().toISOString()
    })

    if (!result.ok && result.status !== 201) {
      return NextResponse.json({ ok: true, stored: false, queued: true, message: message.trim(), timestamp: new Date().toISOString() })
    }

    return NextResponse.json({ ok: true, stored: true, data: result.data, timestamp: new Date().toISOString() })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Send error', detail: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'chatroom/send', method: 'POST required', timestamp: new Date().toISOString() })
}
