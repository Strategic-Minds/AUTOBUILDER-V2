import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { dbGetProject, dbUpdateProject, dbDeleteProject } from '@/lib/supabase/db'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const project = await dbGetProject(id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/projects/[id] GET]', err)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await req.json()
    const project = await dbUpdateProject(id, body)
    return NextResponse.json({ project })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/projects/[id] PATCH]', err)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    await dbDeleteProject(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/projects/[id] DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
