import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, agent_name, agent_emoji, message, message_type, thread_id } = body
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase.from('agent_messages').insert({
      agent_id: agent_id ?? 'human',
      agent_name: agent_name ?? 'Jeremy',
      agent_emoji: agent_emoji ?? '👤',
      message: message.trim(),
      message_type: message_type ?? 'chat',
      thread_id: thread_id ?? null,
    }).select('id').single()

    if (error) throw error

    // Async publish to Pub/Sub via service account (non-blocking)
    publishToPubSub({ agent_id, agent_name, agent_emoji, message: message.trim(), message_type }).catch(() => {})

    return NextResponse.json({ success: true, message_id: data?.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function publishToPubSub(payload: Record<string, unknown>) {
  const saEmail = process.env.GOOGLE_SA_CLIENT_EMAIL
  const saKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'strategic-minds-workflow-os'
  if (!saEmail || !saKey) return

  // Get OAuth token using crypto module (no jose needed)
  const { createSign } = await import('crypto')
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claims = Buffer.from(JSON.stringify({
    iss: saEmail, scope: 'https://www.googleapis.com/auth/pubsub',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  })).toString('base64url')
  const toSign = `${header}.${claims}`
  const sign = createSign('RSA-SHA256')
  sign.update(toSign)
  const sig = sign.sign(saKey, 'base64url')
  const jwt = `${toSign}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })
  const tokenData = await tokenRes.json() as { access_token?: string }
  if (!tokenData.access_token) return

  const msgData = Buffer.from(JSON.stringify({ ...payload, timestamp: new Date().toISOString() })).toString('base64')
  await fetch(`https://pubsub.googleapis.com/v1/projects/${project}/topics/agent-chatroom:publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ data: msgData }] })
  })
}
