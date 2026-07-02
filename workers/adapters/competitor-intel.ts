import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/** Scores queued (unscored) competitor_benchmarks rows using only the public
 * signals already stored on the row — does not perform any new outbound
 * fetch, keeping this adapter safe to run unattended/on cron. */
function scoreSignals(signals: Record<string, unknown> | null | undefined) {
  if (!signals) return 0
  const keys = Object.keys(signals)
  // more captured public signals = more complete intel; capped heuristic score
  return Math.min(100, keys.length * 12)
}

export async function runCompetitorIntel(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('competitor_benchmarks')
    .select('*')
    .is('benchmark_score', null)
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_unscored_rows' } }

  let processed = 0
  const errors: string[] = []
  for (const row of rows) {
    const score = scoreSignals(row.public_signals)
    const { error: updErr } = await supabase.from('competitor_benchmarks').update({ benchmark_score: score }).eq('id', row.id)
    if (updErr) errors.push(`${row.id}: ${updErr.message}`)
    else processed++
  }
  return { status: (errors.length ? 'partial' : 'ok') as 'ok' | 'partial', processed, skipped: 0, errors, details: { table: 'competitor_benchmarks' } }
}

export const run = () => runAdapter('competitor-intel', runCompetitorIntel)
