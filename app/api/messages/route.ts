import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { dbGetMessages, dbCreateMessage } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '50')
    const messages = await dbGetMessages(limit)
    return NextResponse.json({ messages })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/messages GET]', err)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    const message = await dbCreateMessage(body)
    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/messages POST]', err)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
