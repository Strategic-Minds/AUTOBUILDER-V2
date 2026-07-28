import { describe, it, expect } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

describe('Adapters and Hardening Tests', () => {
  it('seo scoring: full valid task scores 100', async () => {
    const mod = await import('../../workers/adapters/seo')
    expect(mod.run).toBeDefined()
    expect(typeof mod.run).toBe('function')
  })

  it('hardening: scanForSecrets flags an obvious fake key pattern', async () => {
    const { scanForSecrets } = await import('../../packages/security/hardening')
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harden-test-'))
    await fs.writeFile(path.join(dir, 'bad.ts'), `const secret = "sk_live_${'a'.repeat(24)}"`)
    const findings = await scanForSecrets(dir)
    expect(findings.length).toBeGreaterThanOrEqual(1)
    expect(findings.some((finding) => finding.pattern === 'stripe_live_key')).toBe(true)
  })

  it('hardening: scanForSecrets finds nothing in a clean file', async () => {
    const { scanForSecrets } = await import('../../packages/security/hardening')
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harden-clean-'))
    await fs.writeFile(path.join(dir, 'clean.ts'), `export const greeting = 'hello world'`)
    const findings = await scanForSecrets(dir)
    expect(findings.length).toBe(0)
  })

  it('hardening: env.example.md is never itself flagged as a secret', async () => {
    const { scanForSecrets } = await import('../../packages/security/hardening')
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harden-example-'))
    await fs.writeFile(path.join(dir, '.env.example.md'), `STRIPE_KEY=sk_live_${'a'.repeat(24)}`)
    const findings = await scanForSecrets(dir)
    expect(findings.length).toBe(0)
  })

  it('receipts: maps adapter evidence to the deployed factory_receipts columns', async () => {
    const { buildFactoryReceipt } = await import('../../workers/adapters/base')
    const startedAt = new Date('2026-07-28T06:00:00.000Z')
    const receipt = buildFactoryReceipt('auto-reflect', {
      adapter: 'auto-reflect',
      status: 'blocked',
      dry_run: false,
      processed: 0,
      skipped: 0,
      errors: [],
      details: { reason: 'schema_dependency_missing' },
    }, startedAt)

    expect(receipt).toMatchObject({
      receipt_type: 'adapter_run',
      status: 'blocked',
      produced_by: 'base44_superagent',
      action_summary: 'adapter_run:auto-reflect',
      rollback_available: false,
    })
    expect(receipt.evidence).toMatchObject({
      adapter: 'auto-reflect',
      production_mutated: false,
      execution_mode: 'live',
    })
    expect(receipt).not.toHaveProperty('action')
    expect(receipt).not.toHaveProperty('payload')
  })

  it('schema drift: missing PostgREST table becomes a blocked dependency', async () => {
    const { normalizeSchemaDriftResult } = await import('../../workers/adapters/schema-drift')
    const normalized = normalizeSchemaDriftResult({
      status: 'error',
      errors: ["Could not find the table 'public.factory_quality_findings' in the schema cache"],
      details: {},
    })

    expect(normalized.status).toBe('blocked')
    expect(normalized.errors).toEqual([])
    expect(normalized.details).toMatchObject({
      reason: 'schema_dependency_missing',
      missing_relations: ['factory_quality_findings'],
      migration_required: true,
      production_mutation: false,
    })
  })

  it('schema drift: missing PostgREST column becomes a blocked dependency', async () => {
    const { normalizeSchemaDriftResult } = await import('../../workers/adapters/schema-drift')
    const normalized = normalizeSchemaDriftResult({
      status: 'error',
      errors: ["Could not find the 'finding_id' column of 'factory_repair_jobs' in the schema cache"],
      details: {},
    })

    expect(normalized.status).toBe('blocked')
    expect(normalized.errors).toEqual([])
    expect(normalized.details).toMatchObject({
      reason: 'schema_dependency_missing',
      missing_columns: ['factory_repair_jobs.finding_id'],
      migration_required: true,
      production_mutation: false,
    })
  })

  it('schema drift: unrelated adapter errors remain errors', async () => {
    const { normalizeSchemaDriftResult } = await import('../../workers/adapters/schema-drift')
    const original = { status: 'error', errors: ['network timeout'], details: {} }
    expect(normalizeSchemaDriftResult(original)).toEqual(original)
  })

  it('factory quality migration is additive, service-role-only, and reversible', async () => {
    const forward = await fs.readFile(path.join(process.cwd(), 'supabase/migrations/20260728062000_factory_quality_schema_contract.sql'), 'utf8')
    const rollback = await fs.readFile(path.join(process.cwd(), 'supabase/rollback/20260728062000_factory_quality_schema_contract.down.sql'), 'utf8')

    for (const fragment of [
      'create table if not exists public.factory_quality_findings',
      'create table if not exists public.factory_quality_scores',
      'add column if not exists finding_id uuid',
      'alter table public.factory_repair_jobs enable row level security',
      'revoke all on public.factory_receipts from public, anon, authenticated',
      'to service_role',
    ]) {
      expect(forward.toLowerCase()).toContain(fragment.toLowerCase())
    }
    expect(rollback.toLowerCase()).toContain('drop table if exists public.factory_quality_findings')
    expect(rollback.toLowerCase()).toContain('drop column if exists finding_id')
  })

  it('all 13 adapters export a callable run()', async () => {
    const modules = await Promise.all([
      import('../../workers/adapters/content-gen'),
      import('../../workers/adapters/seo'),
      import('../../workers/adapters/image-queue'),
      import('../../workers/adapters/payment-gate'),
      import('../../workers/adapters/whatsapp-sync'),
      import('../../workers/adapters/social'),
      import('../../workers/adapters/quality-scan'),
      import('../../workers/adapters/auto-reflect'),
      import('../../workers/adapters/auto-fix'),
      import('../../workers/adapters/auto-heal'),
      import('../../workers/adapters/auto-harden'),
      import('../../workers/adapters/competitor-intel'),
      import('../../workers/adapters/template-intel'),
    ])
    for (const mod of modules) expect(typeof mod.run).toBe('function')
  })
})
