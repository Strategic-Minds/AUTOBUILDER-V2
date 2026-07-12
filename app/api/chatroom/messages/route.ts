import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
    if (error) throw error
    return NextResponse.json({ messages: data ?? [] })
  } catch (err) {
    return NextResponse.json({ messages: [], error: String(err) }, { status: 500 })
  }
}
