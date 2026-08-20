import { describe, expect, it } from 'vitest'
import { readProductionReleaseApproval } from '../../lib/factory/production-release-guard'

describe('safe monitor approval binding', () => {
  it('does not accept approval without receipt identity', () => {
    expect(readProductionReleaseApproval({
      production_release_approval: {
        approved: true,
        approved_by: 'operator',
        approved_at: new Date().toISOString(),
      },
    })).toBeNull()
  })
})
