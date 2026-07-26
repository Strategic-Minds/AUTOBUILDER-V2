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

  const requiredForCanonicalQueue = [
    checks.supabase_url,
    checks.supabase_service_role,
    checks.cron_secret,
  ]
  const requiredForNativePreviewBuild = [
    checks.github_token,
    checks.vercel_token,
    checks.vercel_team_id,
  ]
  const requiredForBrowserEvidence = [
    checks.browser_worker_url,
    checks.browser_worker_secret,
  ]

  return NextResponse.json({
    ok: true,
    checks,
    readiness: {
      canonical_queue_configuration: requiredForCanonicalQueue.every(Boolean),
      native_preview_build_configuration: requiredForNativePreviewBuild.every(Boolean),
      browser_evidence_configuration: requiredForBrowserEvidence.every(Boolean),
      base44_bridge_configuration: checks.base44_outbound && checks.base44_inbound,
    },
    creation_controls: {
      output_repository_creation_enabled: process.env.XAB_ALLOW_OUTPUT_REPO_CREATE === 'true',
      vercel_project_creation_enabled: process.env.XAB_ALLOW_VERCEL_PROJECT_CREATE === 'true',
    },
    migration_required: '20260726023000_xab_v3_queue_and_approval_hardening.sql',
    values_exposed: false,
    production_target: false,
    production_locked: true,
    timestamp: new Date().toISOString(),
  })
}
