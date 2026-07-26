import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getProjectBundle } from '@/lib/factory/xab-v3-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (!user.email) return NextResponse.json({ error: 'Authenticated user has no email' }, { status: 400 })
    const { id } = await params
    return NextResponse.json(await getProjectBundle(id, user.email))
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load project' }, { status: 500 })
  }
}
