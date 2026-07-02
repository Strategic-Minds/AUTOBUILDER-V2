import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

const HOOK_TEMPLATES = [
  (kw: string) => `Stop scrolling if you care about ${kw}.`,
  (kw: string) => `Here's what nobody tells you about ${kw}.`,
  (kw: string) => `3 things we learned doing ${kw} the hard way.`,
]
const CTA_TEMPLATES = ['Book a free consult', 'Get your quote today', 'See before/afters', 'DM us to get started']

/** Deterministic draft generator. No LLM call from a backend adapter — this is
 * template-based so it works with zero external API keys configured; if
 * AI_GATEWAY_API_KEY is present a future iteration can swap in a real model call. */
function draftFor(row: { content_type: string; channel: string; metadata?: Record<string, unknown> }) {
  const keyword = (row.metadata?.keyword as string) || row.content_type || 'this project'
  const hook = HOOK_TEMPLATES[Math.floor(Math.random() * HOOK_TEMPLATES.length)](keyword)
  const cta = CTA_TEMPLATES[Math.floor(Math.random() * CTA_TEMPLATES.length)]
  const caption = `${hook} Built for ${row.channel}. #${keyword.replace(/\s+/g, '')}`
  return { hook, cta, caption }
}

export async function runContentGen(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('content_queue')
    .select('*')
    .eq('status', 'queued')
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'queue_empty' } }

  let processed = 0
  const errors: string[] = []
  for (const row of rows) {
    const draft = draftFor(row)
    const { error: updErr } = await supabase
      .from('content_queue')
      .update({ hook: draft.hook, cta: draft.cta, caption: draft.caption, status: 'draft_ready', updated_at: new Date().toISOString() })
      .eq('id', row.id)
    if (updErr) errors.push(`${row.id}: ${updErr.message}`)
    else processed++
  }
  return { status: errors.length ? ('partial' as const) : ('ok' as const), processed, skipped: rows.length - processed, errors, details: { table: 'content_queue' } }
}

export const run = () => runAdapter('content-gen', runContentGen)
