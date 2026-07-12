import { NextResponse } from 'next/server'
import { dbGetDashboardStats } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAuth()
    const stats = await dbGetDashboardStats()
    return NextResponse.json({ stats })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/stats GET]', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
