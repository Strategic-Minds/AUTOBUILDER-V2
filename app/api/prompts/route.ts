import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { dbGetPrompts, dbUpsertPrompt } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const category = req.nextUrl.searchParams.get('category') ?? undefined
    const prompts = await dbGetPrompts(category)
    return NextResponse.json({ prompts })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/prompts GET]', err)
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    const prompt = await dbUpsertPrompt(body)
    return NextResponse.json({ prompt }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/prompts POST]', err)
    return NextResponse.json({ error: 'Failed to upsert prompt' }, { status: 500 })
  }
}
