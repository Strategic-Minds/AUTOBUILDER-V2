import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const scorecard = JSON.parse(
  readFileSync(join(process.cwd(), 'governance/RELEASE_SCORECARD.json'), 'utf8'),
)

describe('Xtreme AI Builder release scorecard', () => {
  it('permits a 100 engineering score only when every engineering dimension is complete', () => {
    const release = scorecard.engineering_release_candidate
    const earned = Object.values(release.dimensions)
      .reduce((sum: number, item: unknown) => sum + Number((item as { earned: number }).earned), 0)
    const available = Object.values(release.dimensions)
      .reduce((sum: number, item: unknown) => sum + Number((item as { available: number }).available), 0)
    expect(earned).toBe(available)
    expect(release.score).toBe(100)
    expect(release.status).toBe('PASS')
  })

  it('blocks a false 100 live-readiness claim while protected gates are unearned', () => {
    const live = scorecard.live_autonomous_factory_readiness
    const earned = Object.values(live.dimensions)
      .reduce((sum: number, item: unknown) => sum + Number((item as { earned: number }).earned), 0)
    const available = Object.values(live.dimensions)
      .reduce((sum: number, item: unknown) => sum + Number((item as { available: number }).available), 0)
    expect(earned).toBe(live.score)
    expect(available).toBe(100)
    expect(live.score).toBeLessThan(100)
    expect(live.production_locked).toBe(true)
    expect(live.blockers.length).toBeGreaterThan(0)
  })

  it('requires executable retrievable evidence before live readiness can reach 100', () => {
    expect(scorecard.scoring_rule).toContain('executable, retrievable evidence')
    expect(scorecard.scoring_rule).toContain('cannot substitute for runtime proof')
  })
})
