import { NextRequest, NextResponse } from 'next/server'
import { dbGetProjects, dbCreateProject } from '@/lib/supabase/db'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAuth()
    const projects = await dbGetProjects()
    return NextResponse.json({ projects })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/projects GET]', err)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    const project = await dbCreateProject(body)
    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    if (err instanceof NextResponse) return err
    console.error('[api/projects POST]', err)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
