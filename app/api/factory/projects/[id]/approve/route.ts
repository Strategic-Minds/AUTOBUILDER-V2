import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { approveOption } from '@/lib/factory/xab-v3-store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!user.email) return NextResponse.json({ error: 'Authenticated user has no email' }, { status: 400 })
    const { id } = await params
    const body = await req.json()
    const kind = body.kind === 'website' ? 'website' : body.kind === 'logo' ? 'logo' : null
    const option = Number(body.option)
    if (!kind) return NextResponse.json({ error: 'kind must be logo or website' }, { status: 400 })
    const result = await approveOption({
      projectId: id,
      kind,
      option,
      comment: String(body.comment || '').trim() || undefined,
      actor: user.email,
      ownerEmail: user.email,
    })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to approve option' }, { status: 500 })
  }
}
