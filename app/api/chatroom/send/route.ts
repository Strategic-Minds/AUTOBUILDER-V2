import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, handleRateLimitResponse } from '@/lib/rate-limit'

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
  // Rate limit: 20 messages per minute per IP
  const rl = rateLimit(req, 20, 60000)
  if (!rl.success) {
    return handleRateLimitResponse(rl)
  }

  try {
    const body = await req.json()
    const { roomId, content, role = 'user', agentId } = body

    if (!roomId || !content) {
      return NextResponse.json({ ok: false, error: 'roomId and content required' }, { status: 400 })
    }

    const insert = await sbInsert('chatroom_messages', {
      room_id: roomId,
      content: String(content).slice(0, 8000),
      role,
      agent_id: agentId ?? null,
      created_at: new Date().toISOString(),
    })

    if (!insert.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to persist message', detail: insert.data }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: insert.data,
      'X-RateLimit-Remaining': rl.remaining,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  // Rate limit: 60 reads per minute per IP
  const rl = rateLimit(req, 60, 60000)
  if (!rl.success) return handleRateLimitResponse(rl)

  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')

  if (!roomId) {
    return NextResponse.json({ ok: false, error: 'roomId required' }, { status: 400 })
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/chatroom_messages?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc&limit=100`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  )
  const data = await r.json().catch(() => [])
  return NextResponse.json({ ok: true, messages: data })
}