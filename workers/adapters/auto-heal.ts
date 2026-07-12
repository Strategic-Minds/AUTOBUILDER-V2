import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

const MAX_ITERATIONS = Number(process.env.MAX_AUTO_HEAL_ITERATIONS || 3)

/** Drives the auto-heal loop: for projects with open (not-blocked) repair
 * jobs, records a heal iteration and flips status once all repair jobs for
 * that project are no longer 'recipe_ready'. Never deploys anything itself. */
export async function runAutoHeal(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: repairJobs, error } = await supabase
    .from('factory_repair_jobs')
    .select('project_id')
    .eq('status', 'recipe_ready')
    .limit(500)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }

  const projectIds = [...new Set((repairJobs || []).map((r) => r.project_id).filter(Boolean))].slice(0, ctx.limit)
  if (projectIds.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_pending_repairs' } }

  let processed = 0
  let blocked = 0
  const errors: string[] = []
  for (const projectId of projectIds) {
    const { count } = await supabase
      .from('auto_heal_runs')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    const iteration = (count || 0) + 1
    if (iteration > MAX_ITERATIONS) {
      const { error: insErr } = await supabase.from('auto_heal_runs').insert({
        project_id: projectId, iteration, diagnosis: 'max_iterations_exceeded', status: 'blocked',
        blockers: [{ reason: `exceeded MAX_AUTO_HEAL_ITERATIONS=${MAX_ITERATIONS}` }],
      })
      if (insErr) errors.push(`${projectId}: ${insErr.message}`)
      else blocked++
      continue
    }

    const { error: insErr } = await supabase.from('auto_heal_runs').insert({
      project_id: projectId,
      iteration,
      diagnosis: 'open_repair_jobs_present',
      patch_branch: `auto-heal/${projectId}/iter-${iteration}`,
      status: 'healing',
      blockers: [],
    })
    if (insErr) errors.push(`${projectId}: ${insErr.message}`)
    else processed++
  }
  return { status: (errors.length ? 'partial' : blocked > 0 ? 'blocked' : 'ok') as 'ok' | 'partial' | 'blocked', processed, skipped: blocked, errors, details: { table: 'auto_heal_runs', max_iterations: MAX_ITERATIONS } }
}

export const run = () => runAdapter('auto-heal', runAutoHeal)
