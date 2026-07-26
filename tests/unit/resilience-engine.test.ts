import { describe, expect, it } from 'vitest'

import { classifyFailure, getResilienceSnapshot, runResilienceCycle } from '@/lib/resilience/engine'

describe('XAB Resilience OS engine', () => {
  it('classifies source-truth, database, and viewport failures', () => {
    expect(classifyFailure('Workbook checksum and deployment commit mismatch')).toBe('source_truth')
    expect(classifyFailure('Supabase RLS policy missing')).toBe('database')
    expect(classifyFailure('Mobile layout horizontal overflow')).toBe('frontend')
  })

  it('keeps the release gate closed when a critical defect is unrepaired', () => {
    const result = runResilienceCycle([
      {
        id: 'rls-failure',
        signal: 'Supabase RLS policy missing',
        severity: 'critical',
        detected: true,
        repaired: false,
        regressionPass: false,
      },
    ])

    expect(result.releaseGate).toBe('REPAIR_REQUIRED')
    expect(result.blockingDefects).toBe(1)
    expect(result.score).toBeLessThan(95)
  })

  it('accepts a Preview only after every detected fault is repaired and passes regression', () => {
    const result = runResilienceCycle([
      {
        id: 'route-failure',
        signal: 'API route returned invalid response',
        severity: 'high',
        detected: true,
        repaired: true,
        regressionPass: true,
      },
      {
        id: 'layout-failure',
        signal: 'Mobile layout horizontal overflow',
        severity: 'medium',
        detected: true,
        repaired: true,
        regressionPass: true,
      },
    ])

    expect(result.releaseGate).toBe('PREVIEW_ACCEPTABLE')
    expect(result.blockingDefects).toBe(0)
    expect(result.resolvedDefects).toBe(2)
    expect(result.score).toBe(100)
  })

  it('never unlocks Production from the Preview snapshot', () => {
    const snapshot = getResilienceSnapshot()

    expect(snapshot.environment).toBe('PREVIEW_ONLY')
    expect(snapshot.productionLocked).toBe(true)
    expect(snapshot.sourceTruth.workbookSha256).toHaveLength(64)
  })
})
