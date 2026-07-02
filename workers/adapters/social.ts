import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/** Social queue validator/gate. Never posts — marks items ready for a human
 * or a separately-approved live publisher to pick up. */
export async function runSocial(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('factory_social_queue')
    .select('*')
    .eq('status', 'queued')
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'queue_empty' } }

  let processed = 0
  let skipped = 0
  const errors: string[] = []
  for (const row of rows) {
    const hasContent = !!row.content && row.content.trim().length > 0
    const hasSchedule = !!row.scheduled_at
    if (!hasContent || !hasSchedule) { skipped++; continue }
    const { error: updErr } = await supabase.from('factory_social_queue').update({ status: 'approved_pending_post' }).eq('id', row.id)
    if (updErr) errors.push(`${row.id}: ${updErr.message}`)
    else processed++
  }
  return { status: (errors.length ? 'partial' : 'ok') as 'ok' | 'partial', processed, skipped, errors, details: { table: 'factory_social_queue', note: 'never posts — gates for human/live publisher' } }
}

export const run = () => runAdapter('social', runSocial)
