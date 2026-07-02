import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/** Heuristic SEO scorer — no external crawling. Scores what's already on the
 * task record (keyword present, target_url present, task_type known). Real
 * on-page crawling can be added later behind an explicit opt-in env flag. */
function scoreTask(task: { keyword?: string; target_url?: string; task_type: string }) {
  let score = 0
  const notes: string[] = []
  if (task.keyword && task.keyword.length > 2) { score += 40 } else { notes.push('missing or too-short keyword') }
  if (task.target_url && /^https?:\/\//.test(task.target_url)) { score += 30 } else { notes.push('missing or invalid target_url') }
  const knownTypes = ['title_tag', 'meta_description', 'h1_audit', 'internal_links', 'schema_markup']
  if (knownTypes.includes(task.task_type)) { score += 30 } else { notes.push(`unrecognized task_type: ${task.task_type}`) }
  return { score, notes }
}

export async function runSeo(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('factory_seo_tasks')
    .select('*')
    .eq('status', 'pending')
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'queue_empty' } }

  let processed = 0
  const errors: string[] = []
  for (const row of rows) {
    const { score, notes } = scoreTask(row)
    const { error: updErr } = await supabase
      .from('factory_seo_tasks')
      .update({ status: score >= 70 ? 'scored' : 'needs_input', result: { score, notes }, completed_at: new Date().toISOString() })
      .eq('id', row.id)
    if (updErr) errors.push(`${row.id}: ${updErr.message}`)
    else processed++
  }
  return { status: errors.length ? ('partial' as const) : ('ok' as const), processed, skipped: rows.length - processed, errors, details: { table: 'factory_seo_tasks' } }
}

export const run = () => runAdapter('seo', runSeo)
