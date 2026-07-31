import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function load(name: string) {
  return JSON.parse(readFileSync(join(process.cwd(), 'governance', name), 'utf8'))
}

describe('system authority governance', () => {
  it('declares one canonical application and one private control plane', () => {
    const authority = load('SYSTEM_AUTHORITY.json')
    expect(authority.authority.canonical_repository).toBe('Strategic-Minds/AUTOBUILDER-V2')
    expect(authority.authority.control_plane_repository).toBe('XTREME-SYSTEMS/factory-control-plane')
    expect(authority.authority.browserworker_repository).toBe('Strategic-Minds/BROWSERWORKER')
    expect(authority.roles.XAB).toContain('donor only')
    expect(authority.roles['UNIVERSAL-AUTONOMOUS-CODING-SYSTEM']).toContain('template')
  })

  it('keeps every protected production action locked', () => {
    const authority = load('SYSTEM_AUTHORITY.json')
    const policy = authority.release_policy
    expect(policy.production_locked).toBe(true)
    expect(policy.protected_branch_merge_requires_explicit_operator_approval).toBe(true)
    expect(policy.production_deployment_requires_explicit_operator_approval).toBe(true)
    expect(policy.secret_mutation_requires_explicit_operator_approval).toBe(true)
    expect(policy.production_database_migration_requires_explicit_operator_approval).toBe(true)
  })

  it('does not authorize destructive retirement actions', () => {
    const retirement = load('RETIREMENT_REGISTRY.json')
    expect(retirement.destructive_actions_authorized).toBe(false)
    expect(retirement.retain.map((item: { asset: string }) => item.asset)).toContain('Strategic-Minds/AUTOBUILDER-V2')
    expect(retirement.archive_candidates.every((item: { status: string }) => item.status === 'candidate_only')).toBe(true)
  })

  it('reports degraded connectors rather than inflating readiness', () => {
    const readiness = load('CONNECTOR_READINESS.json')
    expect(readiness.connectors.auto_builder_2.state).toBe('DEGRADED')
    expect(readiness.connectors.supabase.state).toBe('READ_VERIFIED')
    expect(readiness.connectors.google_drive.state).toBe('READ_VERIFIED')
  })
})
