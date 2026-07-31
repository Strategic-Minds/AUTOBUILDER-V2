import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/20260731053000_browserworker_durable_evidence_hardening.sql',
)
const rollbackPath = join(
  process.cwd(),
  'supabase/rollback/20260731053000_browserworker_durable_evidence_hardening.down.sql',
)

function normalized(path: string) {
  return readFileSync(path, 'utf8').replace(/\s+/g, ' ').toLowerCase()
}

describe('BrowserWorker durable evidence migration packet', () => {
  it('revokes public SECURITY DEFINER lease execution and grants service-role only', () => {
    const sql = normalized(migrationPath)
    for (const signature of [
      'xai_acquire_factory_lease(text, text, integer)',
      'xai_renew_factory_lease(text, text, integer)',
      'xai_release_factory_lease(text, text)',
    ]) {
      expect(sql).toContain(`revoke all on function public.${signature} from public, anon, authenticated`)
      expect(sql).toContain(`grant execute on function public.${signature} to service_role`)
    }
  })

  it('forces RLS on lease and browser evidence tables', () => {
    const sql = normalized(migrationPath)
    for (const table of ['xai_factory_leases', 'xab_v3_browser_jobs', 'xab_v3_receipts']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`)
      expect(sql).toContain(`alter table public.${table} force row level security`)
    }
  })

  it('rejects inline screenshot blobs and restricts the receipt RPC', () => {
    const sql = normalized(migrationPath)
    expect(sql).toContain("p_result::text like '%data:image/%'")
    expect(sql).toContain('inline screenshot data is prohibited')
    expect(sql).toContain('security definer set search_path = public, pg_temp')
    expect(sql).toContain('revoke all on function public.xab_v3_record_browser_validation')
    expect(sql).toContain('grant execute on function public.xab_v3_record_browser_validation')
    expect(sql).toContain('to service_role')
  })

  it('uses a security-preserving rollback that never restores anonymous execution', () => {
    const rollback = normalized(rollbackPath)
    expect(rollback).toContain('drop function if exists public.xab_v3_record_browser_validation')
    expect(rollback).not.toMatch(/grant execute[^;]+to (public|anon|authenticated)/)
    expect(rollback).toContain('force row level security')
  })
})
