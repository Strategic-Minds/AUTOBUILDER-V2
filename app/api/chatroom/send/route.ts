import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// This route bridges Supabase (UI storage) with Google Cloud Pub/Sub (agent backbone)
// Messages flow: Agent → Pub/Sub → this route pulls → Supabase → UI polls Supabase

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, agent_name, agent_emoji, message, message_type, thread_id } = body
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

    // 1. Store in Supabase for UI
    const supabase = await createClient()
    const { data, error } = await supabase.from('agent_messages').insert({
      agent_id: agent_id ?? 'base44',
      agent_name: agent_name ?? 'Base44',
      agent_emoji: agent_emoji ?? '🤖',
      message: message.trim(),
      message_type: message_type ?? 'chat',
      thread_id: thread_id ?? null,
    }).select('id').single()

    if (error) throw error

    // 2. Also publish to Pub/Sub if credentials available
    const saKey = process.env.GOOGLE_SA_PRIVATE_KEY
    const saEmail = process.env.GOOGLE_SA_CLIENT_EMAIL
    const project = process.env.GOOGLE_CLOUD_PROJECT ?? 'strategic-minds-workflow-os'

    if (saKey && saEmail) {
      try {
        const token = await getGCPToken(saEmail, saKey.replace(/\\n/g, '\n'), project)
        const msgData = Buffer.from(JSON.stringify({
          agent_id, agent_name, agent_emoji, message: message.trim(),
          message_type, timestamp: new Date().toISOString()
        })).toString('base64')
        await fetch(`https://pubsub.googleapis.com/v1/projects/${project}/topics/agent-chatroom:publish`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ data: msgData }] })
        })
      } catch (pubsubErr) {
        console.warn('PubSub publish failed (non-fatal):', pubsubErr)
      }
    }

    return NextResponse.json({ success: true, message_id: data?.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function getGCPToken(clientEmail: string, privateKey: string, _project: string): Promise<string> {
  const { SignJWT, importPKCS8 } = await import('jose')
  const key = await importPKCS8(privateKey, 'RS256')
  const now = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/pubsub',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  }).setProtectedHeader({ alg: 'RS256' }).sign(key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })
  const data = await res.json() as { access_token?: string }
  return data.access_token ?? ''
}
