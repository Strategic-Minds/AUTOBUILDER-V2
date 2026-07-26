import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const forwardPath = path.join(root, 'supabase/migrations/20260726023000_xab_v3_queue_and_approval_hardening.sql')
const rollbackPath = path.join(root, 'supabase/rollback/20260726023000_xab_v3_queue_and_approval_hardening.down.sql')

const requiredForward = [
  'for update skip locked',
  'xab_v3_claim_workflow_job',
  'xab_v3_heartbeat_workflow_job',
  'xab_v3_finish_workflow_job',
  'xab_v3_approve_option',
  'to service_role',
  'production_locked',
]

const requiredRollback = [
  'drop function if exists public.xab_v3_claim_workflow_job',
  'drop function if exists public.xab_v3_heartbeat_workflow_job',
  'drop function if exists public.xab_v3_finish_workflow_job',
  'drop function if exists public.xab_v3_approve_option',
  'drop policy if exists xab_v3_projects_owner_read',
]

const forbiddenTablePatterns = [
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?uasf_/i,
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?factory_jobs_v/i,
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?autonomous_builds/i,
  /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?xab_base44_bridge_jobs/i,
]

async function main() {
  const [forward, rollback, migrationNames] = await Promise.all([
    readFile(forwardPath, 'utf8'),
    readFile(rollbackPath, 'utf8'),
    readdir(path.join(root, 'supabase/migrations')),
  ])

  const normalizedForward = forward.toLowerCase()
  const normalizedRollback = rollback.toLowerCase()
  const errors = []

  for (const fragment of requiredForward) {
    if (!normalizedForward.includes(fragment.toLowerCase())) {
      errors.push(`Forward migration is missing required contract: ${fragment}`)
    }
  }

  for (const fragment of requiredRollback) {
    if (!normalizedRollback.includes(fragment.toLowerCase())) {
      errors.push(`Rollback migration is missing required contract: ${fragment}`)
    }
  }

  for (const pattern of forbiddenTablePatterns) {
    if (pattern.test(forward)) errors.push(`Forward migration contains forbidden parallel data-plane table: ${pattern}`)
  }

  const duplicateQueueMigrations = migrationNames.filter((name) =>
    name !== path.basename(forwardPath) &&
    (/xab_v3_runtime_queue_activation/i.test(name) || /base44_bridge_queue/i.test(name))
  )
  if (duplicateQueueMigrations.length) {
    errors.push(`Duplicate queue migrations remain: ${duplicateQueueMigrations.join(', ')}`)
  }

  if (!/^\s*begin;/i.test(forward) || !/commit;\s*$/i.test(forward)) {
    errors.push('Forward migration must be wrapped in BEGIN/COMMIT')
  }
  if (!/^\s*begin;/i.test(rollback) || !/commit;\s*$/i.test(rollback)) {
    errors.push('Rollback migration must be wrapped in BEGIN/COMMIT')
  }

  if (errors.length) {
    for (const error of errors) console.error(`MIGRATION_VALIDATION_ERROR ${error}`)
    process.exitCode = 1
    return
  }

  console.log('MIGRATION_VALIDATION_PASS')
  console.log(`Forward: ${path.relative(root, forwardPath)}`)
  console.log(`Rollback: ${path.relative(root, rollbackPath)}`)
  console.log('Canonical data plane: xab_v3_*')
  console.log('Production mutation: false')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
