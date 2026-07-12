import { NextRequest, NextResponse } from 'next/server'
import { dbGetAllReceipts, dbGetReceipts, dbCreateReceipt } from '@/lib/supabase/db'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const projectId = req.nextUrl.searchParams.get('projectId')
    const receipts = projectId
      ? await dbGetReceipts(projectId)
      : await dbGetAllReceipts()
    return NextResponse.json({ receipts })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/receipts GET]', err)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    const receipt = await dbCreateReceipt(body)
    return NextResponse.json({ receipt }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/receipts POST]', err)
    return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 })
  }
}
