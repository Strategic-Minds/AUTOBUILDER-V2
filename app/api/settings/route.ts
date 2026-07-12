import { NextRequest, NextResponse } from 'next/server'
import { dbGetSettings, dbSetSetting } from '@/lib/supabase/db'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAuth()
    const settings = await dbGetSettings()
    return NextResponse.json({ settings })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/settings GET]', err)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    // body: { key: string, value: unknown } or { settings: Record<string,unknown> }
    if (body.settings) {
      await Promise.all(
        Object.entries(body.settings).map(([k, v]) => dbSetSetting(k, v))
      )
    } else if (body.key !== undefined) {
      await dbSetSetting(body.key, body.value)
    } else {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/settings POST]', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
