import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '')
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const base44Configured = Boolean(process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY)
  const cronConfigured = Boolean(process.env.CRON_SECRET)
  const supabaseRef = (() => {
    try { return new URL(supabaseUrl).hostname.split('.')[0] || null } catch { return null }
  })()

  const status: Record<string, unknown> = {
    ok: false,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    supabase_url_configured: Boolean(supabaseUrl),
    supabase_service_role_configured: Boolean(supabaseKey),
    supabase_ref: supabaseRef,
    base44_configured: base44Configured,
    cron_secret_configured: cronConfigured,
    database_reachable: false,
    queue_table_reachable: false,
    queued_jobs: null,
    timestamp: new Date().toISOString(),
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ...status, error: 'database_configuration_missing' }, { status: 503 })
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/xab_base44_bridge_jobs?select=job_key,state&state=eq.queued&limit=5`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })
    const text = await response.text()
    if (!response.ok) {
      return NextResponse.json({ ...status, database_reachable: response.status !== 0, database_status: response.status, error: text.slice(0, 300) }, { status: 503 })
    }
    const rows = JSON.parse(text) as Array<{ job_key: string; state: string }>
    return NextResponse.json({ ...status, ok: true, database_reachable: true, queue_table_reachable: true, queued_jobs: rows.length, queued_job_keys: rows.map((row) => row.job_key) })
  } catch (error) {
    return NextResponse.json({ ...status, error: error instanceof Error ? error.message : String(error) }, { status: 503 })
  }
}
