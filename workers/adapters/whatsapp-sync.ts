import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'

/**
 * WhatsApp sync: processes inbound messages and checks consent for anything
 * that would need an outbound reply. HARD RULE: never sends a message here —
 * this adapter only classifies/marks-processed and checks wa_consent_ledger.
 */
export async function runWhatsappSync(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: rows, error } = await supabase
    .from('factory_whatsapp_messages')
    .select('*')
    .eq('direction', 'inbound')
    .eq('status', 'received')
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!rows || rows.length === 0) return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'queue_empty' } }

  let processed = 0
  let consentBlocked = 0
  const errors: string[] = []
  for (const row of rows) {
    const { data: consent } = await supabase
      .from('wa_consent_ledger')
      .select('*')
      .eq('contact_phone', row.from_number)
      .eq('verified', true)
      .is('revoked_at', null)
      .limit(1)
      .maybeSingle()

    const nextStatus = consent ? 'processed_consented' : 'processed_no_consent_reply_blocked'
    const { error: updErr } = await supabase.from('factory_whatsapp_messages').update({ status: nextStatus }).eq('id', row.id)
    if (updErr) { errors.push(`${row.id}: ${updErr.message}`); continue }
    if (consent) processed++
    else consentBlocked++
  }
  return {
    status: (errors.length ? 'partial' : 'ok') as 'ok' | 'partial',
    processed,
    skipped: consentBlocked,
    errors,
    details: { table: 'factory_whatsapp_messages', consent_table: 'wa_consent_ledger', note: 'classification only — never sends a reply' },
  }
}

export const run = () => runAdapter('whatsapp-sync', runWhatsappSync)
