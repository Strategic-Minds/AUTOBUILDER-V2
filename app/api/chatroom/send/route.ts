import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, agent_name, agent_emoji, message, message_type } = body
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('agent_messages')
      .insert({ agent_id: agent_id ?? 'human', agent_name: agent_name ?? 'Jeremy',
        agent_emoji: agent_emoji ?? '👤', message: message.trim(),
        message_type: message_type ?? 'chat' })
      .select('id').single()
    if (error) throw error
    return NextResponse.json({ success: true, message_id: data?.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
