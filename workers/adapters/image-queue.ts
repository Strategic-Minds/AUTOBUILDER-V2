import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

const REQUIRED_FIELDS = ['prompt_text', 'finish_type', 'space_type', 'asset_purpose'] as const

export async function runImageQueue(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('factory_image_jobs')
    .select('*')
    .eq('status', 'queued')
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'queue_empty' } }

  let processed = 0
  let skipped = 0
  const errors: string[] = []
  for (const row of rows) {
    const missing = REQUIRED_FIELDS.filter((f) => !row[f])
    if (missing.length > 0) {
      const { error: updErr } = await supabase
        .from('factory_image_jobs')
        .update({ status: 'blocked', metadata: { ...(row.metadata || {}), blocked_reason: `missing: ${missing.join(', ')}` } })
        .eq('id', row.id)
      if (updErr) errors.push(`${row.id}: ${updErr.message}`)
      else skipped++
      continue
    }
    const { error: updErr } = await supabase
      .from('factory_image_jobs')
      .update({ status: 'ready_for_review', qa_status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (updErr) errors.push(`${row.id}: ${updErr.message}`)
    else processed++
  }
  return { status: errors.length ? ('partial' as const) : ('ok' as const), processed, skipped, errors, details: { table: 'factory_image_jobs' } }
}

export const run = () => runAdapter('image-queue', runImageQueue)
