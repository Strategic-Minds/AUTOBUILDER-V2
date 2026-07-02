import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/** Summarizes template adoption: which template/component/variant combos get
 * approved vs rejected, so the template library can be pruned/prioritized. */
export async function runTemplateIntel(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('factory_template_choices')
    .select('component, variant, approved')
    .limit(1000)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_template_choices_yet' } }

  const stats: Record<string, { approved: number; rejected: number }> = {}
  for (const row of rows) {
    const key = `${row.component}:${row.variant}`
    stats[key] = stats[key] || { approved: 0, rejected: 0 }
    if (row.approved) stats[key].approved++
    else stats[key].rejected++
  }

  const supabase2 = getServiceClient()
  const { error: insErr } = await supabase2.from('receipts').insert({
    receipt_type: 'template_intel_summary',
    status: 'ok',
    summary: `analyzed ${rows.length} template choices across ${Object.keys(stats).length} component/variant pairs`,
    payload: { stats },
  })

  return {
    status: (insErr ? 'partial' : 'ok') as 'ok' | 'partial',
    processed: rows.length,
    skipped: 0,
    errors: insErr ? [insErr.message] : [],
    details: { stats, table: 'factory_template_choices' },
  }
}

export const run = () => runAdapter('template-intel', runTemplateIntel)
