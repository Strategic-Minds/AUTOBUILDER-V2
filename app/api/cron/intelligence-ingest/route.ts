import { NextResponse } from 'next/server'

const route = '/api/cron/intelligence-ingest'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const mode = process.env.AUTO_BUILDER_MODE || 'dry_run'
  const schedule = req.headers.get('x-vercel-cron-schedule') || '0 * * * *'

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, route, error: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    route,
    mode,
    schedule,
    action: 'intelligence_ingest_cycle',
    production_mutation: false,
    source_truth_order: [
      'runtime_request',
      'memory',
      'drive_docs',
      'github_repos',
      'supabase_registry',
      'provider_docs',
      'public_research'
    ],
    proposed_actions: [
      'refresh_source_registry',
      'classify_new_artifacts',
      'prepare_pgvector_embedding_jobs',
      'update_template_performance_intelligence',
      'detect_repo_drive_memory_drift',
      'prepare_morning_summary'
    ],
    blocked: [
      'pgvector_tables_not_verified',
      'embedding_provider_budget_not_verified',
      'live_intelligence_writes_disabled_until_rls_verified'
    ],
    receipt: {
      required: true,
      target: 'intelligence_registry',
      fallback: '03_Bridge_Receipts/discovery'
    },
    timestamp: new Date().toISOString()
  })
}
