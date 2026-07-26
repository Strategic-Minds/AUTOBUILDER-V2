import { NextRequest, NextResponse } from 'next/server'
import { createProject, listProjects } from '@/lib/factory/xab-v3-store'
import { provisionProjectInfrastructure } from '@/lib/factory/universal-provisioning-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

const PROOF_KEY = 'enterprise-factory-provisioning-20260726'
const OWNER_EMAIL = 'strategicmindsadvisory@gmail.com'
const PROJECT_NAME = 'Universal GPT Factory Provisioning Proof 20260726'

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ ok: false, state: 'PREVIEW_ONLY' }, { status: 404 })
  }
  if (req.nextUrl.searchParams.get('proof') !== PROOF_KEY) {
    return NextResponse.json({ ok: false, state: 'NOT_FOUND' }, { status: 404 })
  }

  try {
    const projects = await listProjects(OWNER_EMAIL)
    const existing = projects.find((project) => project.name === PROJECT_NAME)
    const project = existing || await createProject({
      name: PROJECT_NAME,
      clientName: 'Strategic Minds Synthetic Validation',
      industry: 'Enterprise AI Systems',
      region: 'United States',
      services: 'Universal GPT infrastructure provisioning validation',
      brief: 'Synthetic preview-only proof that AUTOBUILDER-V2 creates a private Strategic Minds repository and connected Vercel project through the protected Universal GPT capability bus.',
    }, OWNER_EMAIL)

    const provisioned = await provisionProjectInfrastructure(project)
    return NextResponse.json({
      ok: true,
      state: 'FACTORY_INFRASTRUCTURE_PROOF_PASS',
      reused_project: Boolean(existing),
      project_id: project.id,
      project_name: project.name,
      infrastructure: provisioned.infrastructure,
      production_policy: 'production_after_validation',
      production_traffic_changed: false,
      synthetic: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      state: 'FACTORY_INFRASTRUCTURE_PROOF_FAILED',
      error: error instanceof Error ? error.message : String(error),
      production_traffic_changed: false,
      synthetic: true,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
