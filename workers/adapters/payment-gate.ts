import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/**
 * Payment gate: validates + gates payment requests against approvals.
 * HARD RULE: never creates a live Stripe session or marks anything "sent"
 * or "paid" here, regardless of dry-run flag — that requires a dedicated,
 * explicitly-approved live payment integration, not this adapter.
 */
export async function runPaymentGate(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('factory_payment_requests')
    .select('*')
    .eq('status', 'pending')
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'queue_empty' } }

  let processed = 0
  let blocked = 0
  const errors: string[] = []
  for (const row of rows) {
    if (!row.amount_cents || row.amount_cents <= 0) {
      blocked++
      continue
    }
    const { data: approval } = await supabase
      .from('factory_approvals')
      .select('*')
      .eq('project_id', row.project_id)
      .eq('action', 'payment')
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle()

    const nextStatus = approval ? 'approved_pending_send' : 'awaiting_approval'
    const { error: updErr } = await supabase.from('factory_payment_requests').update({ status: nextStatus }).eq('id', row.id)
    if (updErr) { errors.push(`${row.id}: ${updErr.message}`); continue }
    if (approval) processed++
    else blocked++
  }
  return {
    status: (errors.length ? 'partial' : blocked > 0 ? 'blocked' : 'ok') as 'ok' | 'partial' | 'blocked',
    processed,
    skipped: blocked,
    errors,
    details: { table: 'factory_payment_requests', note: 'never sends/charges — validates + gates only, requires factory_approvals row' },
  }
}

export const run = () => runAdapter('payment-gate', runPaymentGate)
