import { getServiceClient, isDryRun } from '@/packages/clients/supabase'

export type AdapterResult = {
  adapter: string
  status: 'ok' | 'partial' | 'blocked' | 'error'
  dry_run: boolean
  processed: number
  skipped: number
  errors: string[]
  details: Record<string, unknown>
}

export type AdapterContext = {
  limit: number
  dryRun: boolean
}

/**
 * Every adapter run gets wrapped: idempotency-safe, always writes a receipt
 * to factory_receipts, never throws past this boundary (errors are captured
 * and returned so callers/cron get a structured result instead of a 500).
 */
export async function runAdapter(
  adapterName: string,
  fn: (ctx: AdapterContext) => Promise<Omit<AdapterResult, 'adapter' | 'dry_run'>>,
  opts: { limit?: number } = {}
): Promise<AdapterResult> {
  const dryRun = isDryRun()
  const ctx: AdapterContext = { limit: opts.limit ?? 10, dryRun }
  const startedAt = new Date().toISOString()

  let result: Omit<AdapterResult, 'adapter' | 'dry_run'>
  try {
    result = await fn(ctx)
  } catch (err) {
    result = {
      status: 'error',
      processed: 0,
      skipped: 0,
      errors: [err instanceof Error ? err.message : String(err)],
      details: {},
    }
  }

  const full: AdapterResult = { adapter: adapterName, dry_run: dryRun, ...result }

  await writeReceipt(adapterName, full, startedAt)
  return full
}

async function writeReceipt(adapterName: string, result: AdapterResult, startedAt: string) {
  try {
    const supabase = getServiceClient()
    await supabase.from('factory_receipts').insert({
      receipt_id: `${adapterName}_${startedAt}_${Math.random().toString(36).slice(2, 8)}`,
      action: `adapter_run:${adapterName}`,
      status: result.status,
      payload: { ...result, started_at: startedAt },
      production_mutated: false,
      execution_mode: result.dry_run ? 'dry_run' : 'live',
      caller_agent: 'base44_superagent',
    })
  } catch (err) {
    // Receipt failure must never crash the adapter run itself; surface it in details.
    result.details.receipt_write_error = err instanceof Error ? err.message : String(err)
  }
}

/** Shared retry wrapper for flaky external calls (never used for payment/messaging sends). */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 250): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
    }
  }
  throw lastErr
}
