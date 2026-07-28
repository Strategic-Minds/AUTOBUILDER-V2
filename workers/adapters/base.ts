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
 * Every adapter run is wrapped so callers receive a structured result and the
 * existing factory_receipts table receives a durable, schema-compatible
 * receipt. Receipt failure never masks the adapter result, but it is surfaced
 * in details for the controller and operator.
 */
export async function runAdapter(
  adapterName: string,
  fn: (ctx: AdapterContext) => Promise<Omit<AdapterResult, 'adapter' | 'dry_run'>>,
  opts: { limit?: number } = {},
): Promise<AdapterResult> {
  const dryRun = isDryRun()
  const ctx: AdapterContext = { limit: opts.limit ?? 10, dryRun }
  const startedAt = new Date()

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

export function buildFactoryReceipt(adapterName: string, result: AdapterResult, startedAt: Date) {
  const finishedAt = new Date()
  return {
    receipt_id: `${adapterName}_${startedAt.toISOString()}_${Math.random().toString(36).slice(2, 8)}`,
    receipt_type: 'adapter_run',
    status: result.status,
    produced_by: 'base44_superagent',
    action_summary: `adapter_run:${adapterName}`,
    evidence: {
      ...result,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      production_mutated: false,
      execution_mode: result.dry_run ? 'dry_run' : 'live',
    },
    rollback_available: false,
    duration_ms: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
  }
}

async function writeReceipt(adapterName: string, result: AdapterResult, startedAt: Date) {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase.from('factory_receipts').insert(buildFactoryReceipt(adapterName, result, startedAt))
    if (error) result.details.receipt_write_error = error.message
  } catch (err) {
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
      if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
    }
  }
  throw lastErr
}
