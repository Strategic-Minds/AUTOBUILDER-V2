import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function configured(name: string) {
  return Boolean(process.env[name]?.trim())
}

export async function GET() {
  const checks = {
    supabase_url: configured('SUPABASE_URL') || configured('NEXT_PUBLIC_SUPABASE_URL'),
    supabase_service_role: configured('SUPABASE_SERVICE_ROLE_KEY'),
    cron_secret: configured('CRON_SECRET'),
    github_token: configured('GITHUB_TOKEN'),
    vercel_token: configured('VERCEL_TOKEN'),
    vercel_team_id: configured('VERCEL_TEAM_ID'),
    browser_worker_url: configured('BROWSER_WORKER_URL'),
    browser_worker_secret: configured('BROWSER_WORKER_SECRET'),
    base44_outbound: configured('BASE44_SERVICE_TOKEN') || configured('BASE44_API_KEY'),
    base44_inbound: configured('AUTO_BUILDER_BRIDGE_TOKEN') || configured('CRON_SECRET'),
  }

  const canonicalQueueReady = [
    checks.supabase_url,
    checks.supabase_service_role,
    checks.cron_secret,
  ].every(Boolean)
  const nativeBuildReady = [
    checks.github_token,
    checks.vercel_token,
    checks.vercel_team_id,
  ].every(Boolean)
  const browserEvidenceReady = [
    checks.browser_worker_url,
    checks.browser_worker_secret,
  ].every(Boolean)
  const base44BridgeReady = checks.base44_outbound && checks.base44_inbound

  return NextResponse.json({
    ok: true,
    checks,
    readiness: {
      canonical_queue_configuration: canonicalQueueReady,
      native_build_configuration: nativeBuildReady,
      browser_evidence_configuration: browserEvidenceReady,
      base44_bridge_configuration: base44BridgeReady,
      automatic_production_pipeline: canonicalQueueReady && nativeBuildReady && browserEvidenceReady && base44BridgeReady,
    },
    creation_controls: {
      output_repository_creation_enabled: process.env.XAB_ALLOW_OUTPUT_REPO_CREATE === 'true',
      vercel_project_creation_enabled: process.env.XAB_ALLOW_VERCEL_PROJECT_CREATE === 'true',
    },
    release_policy: {
      target: 'production',
      preview_role: 'internal_validation_only',
      separate_preview_approval_required: false,
      automatic_production_after_gates: true,
      production_locked_until_gates_pass: true,
      required_gates: [
        'dependency_audit',
        'secret_scan',
        'lint',
        'unit_tests',
        'typecheck',
        'migration_validation',
        'build',
        'desktop_tablet_mobile',
        'functional_validation',
        'visual_parity',
        'rollback_ready',
        'production_smoke_test',
      ],
    },
    migration_required: '20260726023000_xab_v3_queue_and_approval_hardening.sql',
    values_exposed: false,
    production_target: true,
    production_locked_until_gates_pass: true,
    timestamp: new Date().toISOString(),
  })
}
