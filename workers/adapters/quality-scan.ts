import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/** Reads recent findings for a project and computes a composite quality
 * score (0-100). Grade thresholds mirror docs/20_Final_Audit/FINAL_ENTERPRISE_SCORECARD.md. */
function grade(score: number) {
  if (score >= 95) return 'A'
  if (score >= 80) return 'B'
  if (score >= 60) return 'C'
  return 'F'
}

export async function runQualityScan(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: projects, error } = await supabase
    .from('factory_quality_findings')
    .select('project_id')
    .is('resolved_at', null)
    .limit(500)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }

  const projectIds = [...new Set((projects || []).map((p) => p.project_id).filter(Boolean))].slice(0, ctx.limit)
  if (projectIds.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_open_findings' } }

  let processed = 0
  const errors: string[] = []
  for (const projectId of projectIds) {
    const { data: findings, error: findErr } = await supabase
      .from('factory_quality_findings')
      .select('*')
      .eq('project_id', projectId)
      .is('resolved_at', null)

    if (findErr) { errors.push(`${projectId}: ${findErr.message}`); continue }

    const weights: Record<string, number> = { critical: 25, high: 15, medium: 7, low: 2 }
    const deduction = (findings || []).reduce((sum, f) => sum + (weights[f.severity] ?? 5), 0)
    const score = Math.max(0, 100 - deduction)

    const { error: insErr } = await supabase.from('factory_quality_scores').insert({
      score_id: `qs_${projectId}_${Date.now()}`,
      project_id: projectId,
      score_type: 'composite',
      score,
      grade: grade(score),
      checked_at: new Date().toISOString(),
      details: { open_findings: findings?.length ?? 0, deduction },
    })
    if (insErr) errors.push(`${projectId}: ${insErr.message}`)
    else processed++
  }
  return { status: (errors.length ? 'partial' : 'ok') as 'ok' | 'partial', processed, skipped: 0, errors, details: { table: 'factory_quality_scores', scored_projects: projectIds } }
}

export const run = () => runAdapter('quality-scan', runQualityScan)
