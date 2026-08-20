import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

type JsonRecord = Record<string, unknown>
function record(value: unknown): JsonRecord { return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {} }
function text(value: unknown) { return typeof value === 'string' ? value.trim() : '' }

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Approval-receipt intake only.
 * This route deliberately does NOT deploy, merge, promote, or mutate production.
 * It validates the explicit operator approval payload so a separate governed
 * branch implementation can bind it to the durable project record.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = authorizeInternalRequest(request, 'agents:dispatch')
  if (!auth.ok) return NextResponse.json({ ok: false, state: auth.state, error: auth.error, production_mutation: false }, { status: auth.http_status })

  let body: JsonRecord
  try { body = record(await request.json()) }
  catch { return NextResponse.json({ ok: false, state: 'INVALID_JSON', production_mutation: false }, { status: 400 }) }

  const { id } = await context.params
  const approvalPhrase = text(body.approvalPhrase)
  const approvedBy = text(body.approvedBy)
  const approvalReceiptId = text(body.approvalReceiptId)
  const expectedDeploymentId = text(body.expectedDeploymentId)

  if (approvalPhrase !== 'APPROVE_PRODUCTION_RELEASE') {
    return NextResponse.json({ ok: false, state: 'EXPLICIT_PRODUCTION_APPROVAL_REQUIRED', production_mutation: false }, { status: 422 })
  }
  const missing = [!approvedBy ? 'approvedBy' : '', !approvalReceiptId ? 'approvalReceiptId' : '', !expectedDeploymentId ? 'expectedDeploymentId' : ''].filter(Boolean)
  if (missing.length) return NextResponse.json({ ok: false, state: 'APPROVAL_RECEIPT_BINDING_REQUIRED', missing, production_mutation: false }, { status: 422 })

  return NextResponse.json({
    ok: true,
    state: 'APPROVAL_PAYLOAD_VALIDATED_NOT_APPLIED',
    project_id: id,
    approval: { approved_by: approvedBy, receipt_id: approvalReceiptId, expected_deployment_id: expectedDeploymentId },
    next_required_internal_action: 'bind approval to project metadata and requeue preview monitor only after governance patch lands',
    production_mutation: false,
  }, { status: 202 })
}
