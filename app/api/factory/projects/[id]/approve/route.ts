import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { approveOption, getProjectBundle } from '@/lib/factory/xab-v3-store'

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

    const requestedTestApproval = body.test_auto_approval === true
    let testAutoApproval = false
    if (requestedTestApproval) {
      const bundle = await getProjectBundle(id, user.email)
      const projectName = String(bundle.project.name || '').trim().toUpperCase()
      if (projectName !== 'AUTOBUILDER_GOLDEN_PATH_TEST') {
        return NextResponse.json(
          { error: 'test_auto_approval is restricted to AUTOBUILDER_GOLDEN_PATH_TEST' },
          { status: 403 },
        )
      }
      testAutoApproval = true
    }

    const result = await approveOption({
      projectId: id,
      kind,
      option,
      comment: String(body.comment || '').trim() || undefined,
      actor: testAutoApproval ? `test_auto_approval:${user.email}` : user.email,
      ownerEmail: user.email,
      testAutoApproval,
    })
    return NextResponse.json({
      ok: true,
      result,
      approval_origin: testAutoApproval ? 'isolated_golden_path_test' : 'authenticated_operator',
      production_locked: true,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    const message = error instanceof Error ? error.message : 'Unable to approve option'
    const status = message.includes('FACTORY_QUEUE_MIGRATION_REQUIRED') ? 503 : 500
    return NextResponse.json({ error: message, production_locked: true }, { status })
  }
}
