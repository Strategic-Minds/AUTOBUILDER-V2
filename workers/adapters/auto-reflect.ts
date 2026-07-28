import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, type AdapterContext } from './base'

type Finding = {
  id: string
  project_id: string | null
  category: string | null
  severity: string | null
  auto_fixable: boolean | null
  fix_applied: boolean | null
  created_at?: string | null
}

type RepairJob = {
  id: string
  project_id: string | null
  finding_id: string | null
  repair_type: string | null
  status: string | null
  created_at?: string | null
}

const severityWeight: Record<string, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 1,
}

function normalize(value: string | null | undefined, fallback: string) {
  return value?.trim().toLowerCase() || fallback
}

function reflectionFor(projectId: string, findings: Finding[], repairs: RepairJob[]) {
  const openFindings = findings.filter((finding) => finding.project_id === projectId && finding.fix_applied !== true)
  const openRepairs = repairs.filter((repair) => repair.project_id === projectId && !['completed', 'cancelled', 'superseded'].includes(normalize(repair.status, 'unknown')))
  const risk = openFindings.reduce((total, finding) => total + (severityWeight[normalize(finding.severity, 'info')] || 1), 0)
  const critical = openFindings.filter((finding) => normalize(finding.severity, 'info') === 'critical').length
  const high = openFindings.filter((finding) => normalize(finding.severity, 'info') === 'high').length
  const autoFixable = openFindings.filter((finding) => finding.auto_fixable === true).length
  const score = Math.max(0, 100 - risk)

  return {
    project_id: projectId,
    score,
    state: critical > 0 ? 'BLOCKED' : high > 0 ? 'REPAIR_REQUIRED' : openFindings.length > 0 ? 'HARDENING_REQUIRED' : 'STABLE',
    open_findings: openFindings.length,
    critical_findings: critical,
    high_findings: high,
    auto_fixable_findings: autoFixable,
    open_repair_jobs: openRepairs.length,
    recommended_sequence: [
      ...(autoFixable > 0 ? ['auto-fix'] : []),
      ...(openRepairs.length > 0 ? ['auto-heal'] : []),
      'auto-harden',
      'validate',
    ],
    production_mutation_allowed: false,
  }
}

/**
 * Read-only reflection pass. It examines current quality findings and repair
 * jobs, calculates a deterministic health score, and returns the smallest
 * safe next-action sequence. The runAdapter wrapper writes the durable
 * receipt. No code, deployment, secret, payment, message, or production state
 * is changed by this adapter.
 */
export async function runAutoReflect(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const [{ data: findings, error: findingsError }, { data: repairs, error: repairsError }] = await Promise.all([
    supabase
      .from('factory_quality_findings')
      .select('id,project_id,category,severity,auto_fixable,fix_applied,created_at')
      .order('created_at', { ascending: false })
      .limit(Math.max(ctx.limit * 20, 100)),
    supabase
      .from('factory_repair_jobs')
      .select('id,project_id,finding_id,repair_type,status,created_at')
      .order('created_at', { ascending: false })
      .limit(Math.max(ctx.limit * 20, 100)),
  ])

  const errors = [findingsError?.message, repairsError?.message].filter(Boolean) as string[]
  if (errors.length) return { status: 'error' as const, processed: 0, skipped: 0, errors, details: {} }

  const typedFindings = (findings || []) as Finding[]
  const typedRepairs = (repairs || []) as RepairJob[]
  const projectIds = [...new Set([
    ...typedFindings.map((finding) => finding.project_id),
    ...typedRepairs.map((repair) => repair.project_id),
  ].filter((value): value is string => Boolean(value)))].slice(0, ctx.limit)

  if (projectIds.length === 0) {
    return {
      status: 'ok' as const,
      processed: 0,
      skipped: 0,
      errors: [],
      details: { reason: 'no_projects_with_findings_or_repairs', production_mutation: false },
    }
  }

  const reflections = projectIds.map((projectId) => reflectionFor(projectId, typedFindings, typedRepairs))
  const blocked = reflections.filter((reflection) => reflection.state === 'BLOCKED').length

  return {
    status: blocked > 0 ? 'blocked' as const : 'ok' as const,
    processed: reflections.length,
    skipped: 0,
    errors: [],
    details: {
      reflections,
      dry_run: ctx.dryRun,
      next_adapter: blocked > 0 ? 'operator-escalation' : 'auto-fix',
      production_mutation: false,
    },
  }
}

export const run = () => runAdapter('auto-reflect', runAutoReflect)
