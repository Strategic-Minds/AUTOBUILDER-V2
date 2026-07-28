import { describe, expect, it } from 'vitest'
import {
  evaluateFunctionalEvidence,
  evaluateParityEvidence,
  evaluateSecurityEvidence,
  validateApplicationAdapterEnvelope,
} from '../../lib/factory/application-factory-adapter'

const packet = {
  project_id: 'BIDFAST',
  required_routes: ['/', '/login', '/dashboard', '/projects'],
  required_viewports: [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 1000 },
  ],
  required_themes: ['light', 'dark'],
  operational_scenarios: ['login', 'mobile_navigation', 'tenant_isolation'],
  completion_gates: {
    visual_parity_minimum: 0.99,
    light_mode_coverage_minimum: 1,
    dark_mode_coverage_minimum: 1,
  },
}

describe('application factory adapter', () => {
  it('validates the generic adapter envelope', () => {
    expect(
      validateApplicationAdapterEnvelope({
        adapter: 'source_truth',
        method: 'audit',
        payload: { packet },
      }),
    ).toMatchObject({ adapter: 'source_truth', method: 'audit' })

    expect(() => validateApplicationAdapterEnvelope({ method: 'audit' })).toThrow('ADAPTER_REQUIRED')
    expect(() => validateApplicationAdapterEnvelope({ adapter: 'source_truth' })).toThrow('METHOD_REQUIRED')
  })

  it('refuses visual parity when route or theme evidence is incomplete', () => {
    const result = evaluateParityEvidence({
      packet,
      browser: {
        route_coverage: 0.75,
        viewport_coverage: 1,
        theme_coverage: 0.5,
        screenshot_coverage: 1,
      },
    })

    expect(result.ok).toBe(false)
    expect(result.minimum_score).toBe(0.5)
    expect(result.failures).toContain('ROUTE_COVERAGE_INCOMPLETE')
    expect(result.failures).toContain('THEME_COVERAGE_INCOMPLETE')
  })

  it('requires every operational scenario and clean runtime evidence', () => {
    const blocked = evaluateFunctionalEvidence({
      packet,
      browser: {
        proven_operational_scenarios: ['login'],
        dead_controls: 0,
        console_errors: [],
        network_errors: [],
      },
    })
    expect(blocked.ok).toBe(false)
    expect(blocked.pass_rate).toBeCloseTo(1 / 3)
    expect(blocked.missing_scenarios).toEqual(['mobile_navigation', 'tenant_isolation'])

    const passed = evaluateFunctionalEvidence({
      packet,
      browser: {
        proven_operational_scenarios: ['login', 'mobile_navigation', 'tenant_isolation'],
        dead_controls: 0,
        console_errors: [],
        network_errors: [],
      },
    })
    expect(passed.ok).toBe(true)
    expect(passed.pass_rate).toBe(1)
  })

  it('requires explicit tenant-isolation and authorization evidence', () => {
    const blocked = evaluateSecurityEvidence({})
    expect(blocked.ok).toBe(false)
    expect(blocked.tenant_isolation_failures).toBe(1)
    expect(blocked.authorization_bypasses).toBe(1)

    const passed = evaluateSecurityEvidence({
      security_evidence: {
        tenant_isolation_proven: true,
        authorization_boundaries_proven: true,
        source: 'browserworker-security-suite',
      },
    })
    expect(passed.ok).toBe(true)
    expect(passed.tenant_isolation_failures).toBe(0)
    expect(passed.authorization_bypasses).toBe(0)
  })
})
