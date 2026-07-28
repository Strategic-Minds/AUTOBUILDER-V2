import { getServiceClient } from '@/packages/clients/supabase'
import { runAdapter, type AdapterContext } from './base'

type Finding = {
  id: string
  project_id: string
  category: string | null
  severity: string | null
  fix_recipe: unknown
  description?: string | null
}

type ExistingRepair = {
  id: string
  finding_id: string | null
  status: string | null
}

const TERMINAL_REPAIR_STATES = new Set(['completed', 'cancelled', 'superseded', 'failed'])

/**
 * Turns auto-fixable findings into deterministic, reviewable repair recipes.
 * The insert is compatible with the existing factory_repair_jobs contract and
 * the additive quality-schema migration. It never edits source, deploys,
 * merges, changes secrets, or mutates a production application.
 */
export async function runAutoFix(ctx: AdapterContext) {
  const supabase = getServiceClient()
  const { data: findings, error } = await supabase
    .from('factory_quality_findings')
    .select('id,project_id,category,severity,fix_recipe,description')
    .eq('auto_fixable', true)
    .eq('fix_applied', false)
    .order('created_at', { ascending: true })
    .limit(ctx.limit)

  if (error) return { status: 'error' as const, processed: 0, skipped: 0, errors: [error.message], details: {} }
  if (!findings || findings.length === 0) {
    return { status: 'ok' as const, processed: 0, skipped: 0, errors: [], details: { reason: 'no_auto_fixable_findings', production_mutation: false } }
  }

  const typedFindings = findings as Finding[]
  const findingIds = typedFindings.map((finding) => finding.id)
  const { data: existing, error: existingError } = await supabase
    .from('factory_repair_jobs')
    .select('id,finding_id,status')
    .in('finding_id', findingIds)

  if (existingError) return { status: 'error' as const, processed: 0, skipped: 0, errors: [existingError.message], details: {} }

  const activeByFinding = new Map<string, ExistingRepair>()
  for (const repair of (existing || []) as ExistingRepair[]) {
    if (repair.finding_id && !TERMINAL_REPAIR_STATES.has((repair.status || '').toLowerCase())) {
      activeByFinding.set(repair.finding_id, repair)
    }
  }

  let processed = 0
  let skipped = 0
  const errors: string[] = []
  const planned: Array<Record<string, unknown>> = []

  for (const finding of typedFindings) {
    const alreadyActive = activeByFinding.get(finding.id)
    if (alreadyActive) {
      skipped += 1
      planned.push({ finding_id: finding.id, state: 'existing_repair_job', repair_job_id: alreadyActive.id })
      continue
    }

    const category = finding.category || 'general'
    const repair = {
      repair_id: `fix_${finding.id}`,
      project_id: finding.project_id,
      finding_id: finding.id,
      repair_type: category,
      failure_fingerprint: `quality_finding:${finding.id}`,
      defect_description: finding.description || `${category} quality finding ${finding.id}`,
      repair_strategy: 'deterministic_reviewable_recipe',
      assigned_agent: 'base44_superagent',
      status: 'recipe_ready',
      recipe: {
        fix_recipe: finding.fix_recipe || 'manual_evidence_required',
        severity: finding.severity || 'unknown',
        execution_boundary: 'branch_only',
        independent_validation_required: true,
        production_mutation_allowed: false,
      },
      evidence: {
        source: 'factory_quality_findings',
        finding_id: finding.id,
        production_mutation: false,
      },
    }

    planned.push({ finding_id: finding.id, state: ctx.dryRun ? 'planned' : 'recipe_ready', repair_id: repair.repair_id })
    if (ctx.dryRun) {
      processed += 1
      continue
    }

    const { error: insertError } = await supabase.from('factory_repair_jobs').insert(repair)
    if (insertError) {
      errors.push(`${finding.id}: ${insertError.message}`)
      continue
    }
    processed += 1
  }

  return {
    status: errors.length ? 'partial' as const : 'ok' as const,
    processed,
    skipped,
    errors,
    details: {
      planned,
      table: 'factory_repair_jobs',
      note: 'Creates deterministic repair recipes only; no source or deployment mutation.',
      production_mutation: false,
    },
  }
}

export const run = () => runAdapter('auto-fix', runAutoFix)
