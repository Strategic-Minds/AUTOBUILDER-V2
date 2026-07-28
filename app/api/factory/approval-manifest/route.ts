import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { createApprovalManifest, verifyApprovalManifest, type ApprovalManifestInput } from '@/lib/factory/approval-manifest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validInput(value: unknown): value is ApprovalManifestInput {
  if (!isRecord(value) || !isRecord(value.project) || !isRecord(value.idea) || !isRecord(value.workflow)) return false
  return typeof value.project.id === 'string'
    && typeof value.project.name === 'string'
    && typeof value.idea.brief === 'string'
    && isRecord(value.brand)
    && isRecord(value.website)
    && Array.isArray(value.sourceTruth)
    && value.workflow.productionLocked === true
}

export async function POST(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'receipts:write')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_mutation: false },
      { status: auth.http_status },
    )
  }

  const body = await req.json().catch(() => null)
  if (!validInput(body)) {
    return NextResponse.json({ ok: false, error: 'INVALID_APPROVAL_MANIFEST_INPUT', production_mutation: false }, { status: 422 })
  }

  const manifest = createApprovalManifest(body)
  const verification = verifyApprovalManifest(manifest)
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: 'APPROVAL_MANIFEST_VERIFICATION_FAILED', production_mutation: false }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    state: 'APPROVAL_MANIFEST_LOCKED',
    manifest,
    verification,
    request_id: auth.request_id,
    production_mutation: false,
  })
}
