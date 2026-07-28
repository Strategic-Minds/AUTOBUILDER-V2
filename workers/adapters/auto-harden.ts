import { runAdapter, type AdapterContext } from './base'
import { scanForSecrets, checkEnvCoverage } from '@/packages/security/hardening'

/**
 * Runs read-only repository security checks. The shared runAdapter wrapper
 * writes the durable, schema-compatible factory receipt, so this adapter does
 * not depend on a parallel mcp_audit_log table.
 */
export async function runAutoHarden(_ctx: AdapterContext) {
  const secretFindings = await scanForSecrets(process.cwd())
  const envCoverage = await checkEnvCoverage(process.cwd())
  const riskLevel = secretFindings.length > 0 ? 'high' : envCoverage.missing.length > 0 ? 'medium' : 'low'

  return {
    status: (secretFindings.length > 0 ? 'blocked' : 'ok') as 'ok' | 'blocked',
    processed: 1,
    skipped: 0,
    errors: [],
    details: {
      secretFindings,
      envCoverage,
      riskLevel,
      audit_surface: 'factory_receipts',
      production_mutation: false,
    },
  }
}

export const run = () => runAdapter('auto-harden', runAutoHarden)
