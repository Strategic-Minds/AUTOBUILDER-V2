import { NextResponse } from 'next/server'

const route = '/api/cron/enterprise-kernel'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const mode = process.env.AUTO_BUILDER_MODE || 'dry_run'
  const schedule = req.headers.get('x-vercel-cron-schedule') || '*/5 * * * *'

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, route, error: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    route,
    mode,
    schedule,
    action: 'enterprise_kernel_heartbeat',
    production_mutation: false,
    checked_registries: [
      'SystemRegistry',
      'AgentRegistry',
      'ProjectRegistry',
      'WorkflowRegistry',
      'QueueRegistry',
      'JobRegistry',
      'ApprovalQueue',
      'ValidationRegistry',
      'ScoringRegistry',
      'CronRegistry'
    ],
    proposed_actions: [
      'rehydrate_current_queue_state',
      'refresh_approval_queue',
      'detect_stale_jobs',
      'propose_safe_low_risk_next_steps',
      'write_receipt_after_supabase_registry_is_verified'
    ],
    blocked: [
      'live_supabase_schema_rls_not_verified',
      'validator_authority_tables_not_verified',
      'production_mutation_requires_explicit_approval'
    ],
    receipt: {
      required: true,
      target: 'receipt_registry',
      fallback: '03_Bridge_Receipts/mcp'
    },
    timestamp: new Date().toISOString()
  })
}
