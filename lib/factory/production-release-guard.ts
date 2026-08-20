type JsonRecord = Record<string, unknown>

export type ProductionReleaseApproval = {
  receipt_id: string
  approved_by: string
  approved_at: string
}

export function readProductionReleaseApproval(metadata: JsonRecord): ProductionReleaseApproval | null {
  const raw = metadata.production_release_approval
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const approval = raw as JsonRecord
  if (approval.approved !== true) return null
  const receiptId = typeof approval.receipt_id === 'string' ? approval.receipt_id.trim() : ''
  const approvedBy = typeof approval.approved_by === 'string' ? approval.approved_by.trim() : ''
  const approvedAt = typeof approval.approved_at === 'string' ? approval.approved_at.trim() : ''
  if (!receiptId || !approvedBy || !approvedAt) return null
  return { receipt_id: receiptId, approved_by: approvedBy, approved_at: approvedAt }
}
