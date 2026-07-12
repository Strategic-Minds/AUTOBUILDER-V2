import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Node 20 runtime polyfill: @supabase/supabase-js's realtime client expects a
// native WebSocket global (Node 22+). This repo targets Node 20 LTS in CI/sandbox,
// so we polyfill it with `ws`. Harmless in Node 22+ environments (the check just
// won't fire there).
if (typeof globalThis.WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.WebSocket = require('ws')
}

let cached: SupabaseClient | null = null

/**
 * Service-role Supabase client for adapter/server use only.
 * Never import this into client components.
 */
export function getServiceClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured. Set them in the environment before running adapters.')
  }
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}

/** True when the system is NOT allowed to perform live/production side effects. */
export function isDryRun(): boolean {
  return (process.env.AUTO_BUILDER_MODE || 'dry_run') !== 'live'
}
