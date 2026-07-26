import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { createProject, listProjects } from '@/lib/factory/xab-v3-store'
import { provisionProjectInfrastructure } from '@/lib/factory/universal-provisioning-client'

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
    try {
      const provisioned = await provisionProjectInfrastructure(project)
      return NextResponse.json({
        ok: true,
        state: 'PROJECT_CREATED_AND_INFRASTRUCTURE_PROVISIONED',
        project: provisioned.project,
        infrastructure: provisioned.infrastructure,
        production_policy: 'production_after_validation',
      }, { status: 202 })
    } catch (provisioningError) {
      return NextResponse.json({
        ok: false,
        state: 'PROJECT_CREATED_INFRASTRUCTURE_FAILED',
        project,
        error: provisioningError instanceof Error ? provisioningError.message : 'Infrastructure provisioning failed',
        production_policy: 'production_after_validation',
      }, { status: 502 })
    }
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create project' }, { status: 500 })
  }
}
