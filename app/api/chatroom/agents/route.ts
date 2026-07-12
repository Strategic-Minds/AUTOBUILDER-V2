import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('chatroom_agents')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json({ agents: data ?? [] })
  } catch {
    return NextResponse.json({ agents: [] })
  }
}
