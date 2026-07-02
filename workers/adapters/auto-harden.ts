import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, AdapterContext } from './base'
import { scanForSecrets, checkEnvCoverage } from '@/packages/security/hardening'

/** Runs the repo-level security hardening checks and logs the result to
 * mcp_audit_log. Read-only against the codebase — never mutates files. */
export async function runAutoHarden(_ctx: AdapterContext) {
  const secretFindings = await scanForSecrets(process.cwd())
  const envCoverage = await checkEnvCoverage(process.cwd())

  const riskLevel = secretFindings.length > 0 ? 'high' : envCoverage.missing.length > 0 ? 'medium' : 'low'

  const supabase = getServiceClient()
  const { error } = await supabase.from('mcp_audit_log').insert({
    audit_id: `harden_${Date.now()}`,
    event_type: 'auto_harden_scan',
    caller_agent: 'base44_superagent',
    caller_type: 'agent',
    action_taken: 'repo_secret_and_env_scan',
    input_summary: `scanned ${process.cwd()}`,
    output_summary: `secrets_found=${secretFindings.length} env_missing=${envCoverage.missing.length}`,
    risk_level: riskLevel,
    flagged: riskLevel !== 'low',
  })

  return {
    status: (secretFindings.length > 0 ? 'blocked' : 'ok') as 'ok' | 'blocked',
    processed: 1,
    skipped: 0,
    errors: error ? [error.message] : [],
    details: { secretFindings, envCoverage, riskLevel },
  }
}

export const run = () => runAdapter('auto-harden', runAutoHarden)
