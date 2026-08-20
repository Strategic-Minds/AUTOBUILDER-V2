import { describe, expect, it } from 'vitest'
import {
  actionAllowed,
  attributionConfidence,
  compareChampion,
  expectedGrossProfit,
  hourlyCycleKey,
  opportunityValueScore,
  shouldRunHourlyCycle,
  summarizeEconomicAttribution,
} from '../../lib/backlog-engine/core'

describe('Autonomous Backlog Engine economics and governance', () => {
  it('calculates probability-weighted expected gross profit', () => {
    expect(expectedGrossProfit({
      estimatedContractValue: 225000,
      estimatedGrossMargin: 0.28,
      probabilityOfAward: 0.42,
      strategicFit: 0.9,
      confidence: 0.85,
      estimatedPursuitCost: 3500,
      riskFactor: 0.8,
    })).toBeCloseTo(26460)
  })

  it('ranks pursuit economics instead of contract face value alone', () => {
    const school = opportunityValueScore({ estimatedContractValue: 225000, estimatedGrossMargin: 0.28, probabilityOfAward: 0.42, strategicFit: 0.9, confidence: 0.85, reusability: 0.9, estimatedPursuitCost: 3500, riskFactor: 0.8 })
    const airport = opportunityValueScore({ estimatedContractValue: 760000, estimatedGrossMargin: 0.20, probabilityOfAward: 0.22, strategicFit: 0.62, confidence: 0.60, reusability: 0.70, estimatedPursuitCost: 18000, riskFactor: 1.5 })
    expect(school.score).toBeGreaterThan(airport.score)
  })

  it('blocks protected actions without explicit approval', () => {
    expect(actionAllowed('production_deploy').allowed).toBe(false)
    expect(actionAllowed('production_deploy', ['production_deploy']).allowed).toBe(true)
    expect(actionAllowed('branch_build').allowed).toBe(true)
  })

  it('attributes only award events as verified backlog', () => {
    const summary = summarizeEconomicAttribution([
      { type: 'opportunity.discovered', amount: 500000 },
      { type: 'bid.prepared', amount: 300000 },
      { type: 'award.won', amount: 120000 },
      { type: 'gross_profit.realized', amount: 30000 },
      { type: 'cost.ai', amount: 1000 },
      { type: 'cost.browser', amount: 500 },
    ])
    expect(summary.verifiedBacklogGenerated).toBe(120000)
    expect(summary.verifiedGrossProfitAttributed).toBe(30000)
    expect(summary.customerRoi).toBe(20)
  })

  it('requires independent award evidence for full attribution confidence', () => {
    expect(attributionConfidence(['customer_id', 'opportunity_id', 'bid_id'])).toBe(75)
    expect(attributionConfidence(['customer_id', 'opportunity_id', 'bid_id', 'award_evidence'])).toBe(100)
  })

  it('rejects challenger regressions even when score is higher', () => {
    expect(compareChampion({ score: 91 }, { score: 96, blockingRegressions: 1 }).decision).toBe('reject')
    expect(compareChampion({ score: 91 }, { score: 92, blockingRegressions: 0 }).decision).toBe('candidate')
  })

  it('uses a stable UTC hourly cycle key', () => {
    expect(hourlyCycleKey(new Date('2026-08-20T06:34:55Z'))).toBe('2026-08-20T06:00Z')
  })

  it('runs no more than once per hour after completion', () => {
    const now = new Date('2026-08-20T06:34:55Z')
    expect(shouldRunHourlyCycle('2026-08-20T06:00:00Z', now)).toBe(false)
    expect(shouldRunHourlyCycle('2026-08-20T05:30:00Z', now)).toBe(true)
  })
})
