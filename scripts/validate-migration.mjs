import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const canonicalForwardPath = path.join(root, 'supabase/migrations/20260726023000_xab_v3_queue_and_approval_hardening.sql')
const canonicalRollbackPath = path.join(root, 'supabase/rollback/20260726023000_xab_v3_queue_and_approval_hardening.down.sql')
const backlogForwardPath = path.join(root, 'supabase/migrations/20260820065000_autonomous_backlog_engine_v1.sql')
const backlogRollbackPath = path.join(root, 'supabase/rollback/20260820065000_autonomous_backlog_engine_v1.down.sql')
const backlogValidationPath = path.join(root, 'supabase/validation/20260820065000_autonomous_backlog_engine_v1.validation.sql')

const requiredCanonicalForward = ['for update skip locked','xab_v3_claim_workflow_job','xab_v3_heartbeat_workflow_job','xab_v3_finish_workflow_job','xab_v3_approve_option','to service_role','production_locked']
const requiredCanonicalRollback = ['drop function if exists public.xab_v3_claim_workflow_job','drop function if exists public.xab_v3_heartbeat_workflow_job','drop function if exists public.xab_v3_finish_workflow_job','drop function if exists public.xab_v3_approve_option','drop policy if exists xab_v3_projects_owner_read']
const requiredBacklogForward = ['backlog_opportunities','backlog_economic_attribution_events','backlog_execution_leases','backlog_improvement_runs','backlog_claim_hourly_lease','backlog_finish_hourly_lease','enable row level security','revoke all','to service_role']
const requiredBacklogRollback = ['drop function if exists public.backlog_claim_hourly_lease','drop function if exists public.backlog_finish_hourly_lease','drop table if exists public.backlog_execution_leases','drop table if exists public.backlog_opportunities']
const requiredBacklogValidation = ['backlog_execution_leases','backlog_claim_hourly_lease','backlog_finish_hourly_lease']

const forbiddenTablePatterns = [
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?uasf_/i,
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?factory_jobs_v/i,
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?autonomous_builds/i,
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?xab_base44_bridge_jobs/i,
]

function requireFragments(errors, label, source, fragments) {
  const normalized = source.toLowerCase()
  for (const fragment of fragments) if (!normalized.includes(fragment.toLowerCase())) errors.push(`${label} is missing required contract: ${fragment}`)
}

function requireTransaction(errors, label, source) {
  if (!/^\s*begin;/i.test(source) || !/commit;\s*$/i.test(source)) errors.push(`${label} must be wrapped in BEGIN/COMMIT`)
}

async function main() {
  const [canonicalForward, canonicalRollback, backlogForward, backlogRollback, backlogValidation, migrationNames] = await Promise.all([
    readFile(canonicalForwardPath, 'utf8'),
    readFile(canonicalRollbackPath, 'utf8'),
    readFile(backlogForwardPath, 'utf8'),
    readFile(backlogRollbackPath, 'utf8'),
    readFile(backlogValidationPath, 'utf8'),
    readdir(path.join(root, 'supabase/migrations')),
  ])

  const errors = []
  requireFragments(errors, 'Canonical forward migration', canonicalForward, requiredCanonicalForward)
  requireFragments(errors, 'Canonical rollback migration', canonicalRollback, requiredCanonicalRollback)
  requireFragments(errors, 'Backlog forward migration', backlogForward, requiredBacklogForward)
  requireFragments(errors, 'Backlog rollback migration', backlogRollback, requiredBacklogRollback)
  requireFragments(errors, 'Backlog validation SQL', backlogValidation, requiredBacklogValidation)

  for (const pattern of forbiddenTablePatterns) {
    if (pattern.test(canonicalForward)) errors.push(`Canonical forward migration contains forbidden parallel data-plane table: ${pattern}`)
    if (pattern.test(backlogForward)) errors.push(`Backlog migration contains forbidden parallel data-plane table: ${pattern}`)
  }

  const duplicateQueueMigrations = migrationNames.filter((name) => name !== path.basename(canonicalForwardPath) && (/xab_v3_runtime_queue_activation/i.test(name) || /base44_bridge_queue/i.test(name)))
  if (duplicateQueueMigrations.length) errors.push(`Duplicate queue migrations remain: ${duplicateQueueMigrations.join(', ')}`)

  requireTransaction(errors, 'Canonical forward migration', canonicalForward)
  requireTransaction(errors, 'Canonical rollback migration', canonicalRollback)
  requireTransaction(errors, 'Backlog forward migration', backlogForward)
  requireTransaction(errors, 'Backlog rollback migration', backlogRollback)

  if (/grant\s+.+\s+to\s+(?:anon|authenticated)/i.test(backlogForward)) errors.push('Backlog migration must not grant privileges to anon or authenticated roles')

  if (errors.length) {
    for (const error of errors) console.error(`MIGRATION_VALIDATION_ERROR ${error}`)
    process.exitCode = 1
    return
  }

  console.log('MIGRATION_VALIDATION_PASS')
  console.log(`Canonical forward: ${path.relative(root, canonicalForwardPath)}`)
  console.log(`Backlog forward: ${path.relative(root, backlogForwardPath)}`)
  console.log(`Backlog rollback: ${path.relative(root, backlogRollbackPath)}`)
  console.log(`Backlog validation: ${path.relative(root, backlogValidationPath)}`)
  console.log('Canonical queue: xab_v3_*')
  console.log('Backlog evidence plane: backlog_*')
  console.log('Production mutation: false')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
