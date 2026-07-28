import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, type AdapterContext } from './base'

const MAX_ITERATIONS = Number(process.env.MAX_AUTO_HEAL_ITERATIONS || 5)

type RepairJob = {
  id: string
  project_id: string
  finding_id: string | null
  repair_type: string | null
  status: string
  recipe: Record<string, unknown> | null
}

type HealRun = {
  id: string
  project_id: string
  iteration: number
  status: string
}

function branchName(projectId: string, iteration: number) {
  return `auto-heal/${projectId.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}/iter-${iteration}`.slice(0, 120)
}

/**
 * Builds bounded branch-only heal work packets from repair recipes. It does not
 * apply arbitrary patches, merge branches, deploy, change credentials, or
 * touch production. Patch execution and validation remain separate governed
 * steps with receipts and rollback references.
 */
export async function runAutoHeal(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: repairJobs, error } = await supabase
    .from('factory_repair_jobs')
    .select('id,project_id,finding_id,repair_type,status,recipe')
    .eq('status', 'recipe_ready')
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }

  const jobs = (repairJobs || []) as RepairJob[]
  const projectIds = [...new Set(jobs.map((job) => job.project_id).filter(Boolean))].slice(0, ctx.limit)
  if (projectIds.length === 0) {
    return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_pending_repairs', production_mutation: false } }
  }

  const { data: previousRuns, error: previousError } = await supabase
    .from('auto_heal_runs')
    .select('id,project_id,iteration,status')
    .in('project_id', projectIds)
    .order('iteration', { ascending: false })

  if (previousError) return { status: 'error' as const, processed: 0, skipped: 0, errors: [previousError.message], details: {} }

  const latestByProject = new Map<string, HealRun>()
  for (const run of (previousRuns || []) as HealRun[]) {
    if (!latestByProject.has(run.project_id)) latestByProject.set(run.project_id, run)
  }

  let processed = 0
  let blocked = 0
  let skipped = 0
  const errors: string[] = []
  const workPackets: Array<Record<string, unknown>> = []

  for (const projectId of projectIds) {
    const projectJobs = jobs.filter((job) => job.project_id === projectId)
    const previous = latestByProject.get(projectId)

    if (previous && ['healing', 'validating'].includes(previous.status)) {
      skipped += 1
      workPackets.push({ project_id: projectId, state: 'existing_active_heal', heal_run_id: previous.id, iteration: previous.iteration })
      continue
    }

    const iteration = (previous?.iteration || 0) + 1
    if (iteration > MAX_ITERATIONS) {
      blocked += 1
      const blockedPacket = {
        project_id: projectId,
        iteration,
        state: 'blocked',
        reason: `exceeded MAX_AUTO_HEAL_ITERATIONS=${MAX_ITERATIONS}`,
        repair_job_ids: projectJobs.map((job) => job.id),
        production_mutation: false,
      }
      workPackets.push(blockedPacket)
      if (!ctx.dryRun) {
        const { error: insertError } = await supabase.from('auto_heal_runs').insert({
          project_id: projectId,
          iteration,
          diagnosis: 'max_iterations_exceeded',
          status: 'blocked',
          blockers: [blockedPacket],
        })
        if (insertError) errors.push(`${projectId}: ${insertError.message}`)
      }
      continue
    }

    const patchBranch = branchName(projectId, iteration)
    const packet = {
      project_id: projectId,
      iteration,
      state: ctx.dryRun ? 'planned' : 'healing',
      patch_branch: patchBranch,
      repair_jobs: projectJobs.map((job) => ({
        repair_job_id: job.id,
        finding_id: job.finding_id,
        repair_type: job.repair_type,
        recipe: job.recipe,
      })),
      required_receipts: ['branch_commit', 'unit_validation', 'integration_validation', 'browserworker_validation', 'rollback'],
      blocked_actions: ['merge_protected_branch', 'production_deploy', 'secret_mutation', 'database_migration', 'customer_message'],
      production_mutation: false,
    }
    workPackets.push(packet)

    if (ctx.dryRun) {
      processed += 1
      continue
    }

    const { error: insertError } = await supabase.from('auto_heal_runs').insert({
      project_id: projectId,
      iteration,
      diagnosis: 'open_repair_jobs_present',
      patch_branch: patchBranch,
      status: 'healing',
      blockers: [],
    })
    if (insertError) errors.push(`${projectId}: ${insertError.message}`)
    else processed += 1
  }

  return {
    status: errors.length ? 'partial' as const : blocked > 0 ? 'blocked' as const : 'ok' as const,
    processed,
    skipped: skipped + blocked,
    errors,
    details: {
      work_packets: workPackets,
      max_iterations: MAX_ITERATIONS,
      next_step: 'evidence-driven branch patch then independent validation',
      production_mutation: false,
    },
  }
}

export const run = () => runAdapter('auto-heal', runAutoHeal)
