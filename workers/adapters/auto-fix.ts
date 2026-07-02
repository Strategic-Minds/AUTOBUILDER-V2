import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/** Turns auto-fixable findings into repair jobs. Does not execute arbitrary
 * code changes — creates a structured, human/CI-reviewable repair job with
 * a recipe. Actually applying a repair to a live site/repo requires a
 * separate, explicitly-approved deploy step. */
export async function runAutoFix(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: findings, error } = await supabase
    .from('factory_quality_findings')
    .select('*')
    .eq('auto_fixable', true)
    .eq('fix_applied', false)
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!findings || findings.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_auto_fixable_findings' } }

  let processed = 0
  const errors: string[] = []
  for (const finding of findings) {
    const { error: insErr } = await supabase.from('factory_repair_jobs').insert({
      repair_id: `fix_${finding.id}_${Date.now()}`,
      project_id: finding.project_id,
      finding_id: finding.id,
      repair_type: finding.category || 'general',
      status: 'recipe_ready',
      recipe: { fix_recipe: finding.fix_recipe || 'no_recipe_provided', severity: finding.severity },
    })
    if (insErr) { errors.push(`${finding.id}: ${insErr.message}`); continue }
    const { error: updErr } = await supabase.from('factory_quality_findings').update({ fix_applied: false }).eq('id', finding.id)
    if (updErr) errors.push(`${finding.id}: ${updErr.message}`)
    else processed++
  }
  return { status: (errors.length ? 'partial' : 'ok') as 'ok' | 'partial', processed, skipped: 0, errors, details: { table: 'factory_repair_jobs', note: 'creates repair recipes only — does not execute deploys' } }
}

export const run = () => runAdapter('auto-fix', runAutoFix)
