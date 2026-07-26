import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createProject, listProjects } from '@/lib/factory/xab-v3-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireAuth()
    if (!user.email) return NextResponse.json({ error: 'Authenticated user has no email' }, { status: 400 })
    return NextResponse.json({ projects: await listProjects(user.email) })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to list projects' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user.email) return NextResponse.json({ error: 'Authenticated user has no email' }, { status: 400 })
    const body = await req.json()
    const input = {
      name: String(body.name || '').trim(),
      clientName: String(body.clientName || body.name || '').trim(),
      industry: String(body.industry || '').trim(),
      region: String(body.region || '').trim(),
      services: String(body.services || '').trim(),
      brief: String(body.brief || '').trim(),
    }
    if (!input.name || !input.clientName || !input.industry || !input.region) {
      return NextResponse.json({ error: 'name, clientName, industry, and region are required' }, { status: 400 })
    }
    const project = await createProject(input, user.email)
    return NextResponse.json({ ok: true, project }, { status: 202 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create project' }, { status: 500 })
  }
}
