import { describe, expect, it } from 'vitest'
import { readProductionReleaseApproval } from '../../lib/factory/production-release-guard'

describe('production release guard', () => {
  it('fails closed without an explicit bound receipt', () => {
    expect(readProductionReleaseApproval({})).toBeNull()
    expect(readProductionReleaseApproval({ production_release_approval: { approved: true } })).toBeNull()
  })

  it('accepts only a complete explicit approval record', () => {
    expect(readProductionReleaseApproval({
      production_release_approval: {
        approved: true,
        receipt_id: 'receipt-123',
        approved_by: 'operator@example.com',
        approved_at: '2026-08-20T06:45:00Z',
      },
    })).toEqual({ receipt_id: 'receipt-123', approved_by: 'operator@example.com', approved_at: '2026-08-20T06:45:00Z' })
  })
})
