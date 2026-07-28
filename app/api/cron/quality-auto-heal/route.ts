import { NextResponse, type NextRequest } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { run as reflect } from '@/workers/adapters/auto-reflect'
import { run as fix } from '@/workers/adapters/auto-fix'
import { run as heal } from '@/workers/adapters/auto-heal'
import { run as harden } from '@/workers/adapters/auto-harden'
import { normalizeSchemaDriftResult } from '@/workers/adapters/schema-drift'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

const EXPECTED_SCHEDULE = '*/5 * * * *'

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'jobs:heal')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_mutation: false },
      { status: auth.http_status },
    )
  }

  const schedule = req.headers.get('x-vercel-cron-schedule')
  if (schedule && schedule !== EXPECTED_SCHEDULE) {
    return NextResponse.json(
      { ok: false, state: 'FORBIDDEN_SCHEDULE', expected_schedule: EXPECTED_SCHEDULE, production_mutation: false },
      { status: 403 },
    )
  }

  const results: Record<string, unknown> = {}
  const steps = [
    ['auto-reflect', reflect],
    ['auto-fix', fix],
    ['auto-heal', heal],
    ['auto-harden', harden],
  ] as const

  for (const [name, runner] of steps) {
    try {
      const rawResult = await runner()
      results[name] = normalizeSchemaDriftResult(rawResult)
    } catch (error) {
      results[name] = { status: 'error', error: error instanceof Error ? error.message : String(error) }
    }
  }

  const normalizedResults = Object.entries(results).map(([adapter, result]) => {
    const typed = result as {
      status?: unknown
      details?: { missing_relations?: unknown; missing_columns?: unknown }
    }
    const missingRelations = Array.isArray(typed.details?.missing_relations)
      ? typed.details.missing_relations.filter((value): value is string => typeof value === 'string')
      : []
    const missingColumns = Array.isArray(typed.details?.missing_columns)
      ? typed.details.missing_columns.filter((value): value is string => typeof value === 'string')
      : []
    return {
      adapter,
      status: String(typed.status || 'unknown'),
      missing_relations: missingRelations,
      missing_columns: missingColumns,
    }
  })
  const states = normalizedResults.map((result) => result.status)
  const missingSchemaDependencies = [...new Set(normalizedResults.flatMap((result) => [
    ...result.missing_relations,
    ...result.missing_columns,
  ]))]
  const ok = !states.includes('error')
  const state = ok
    ? (states.includes('blocked') ? 'BLOCKED_SCHEMA_OR_REPAIR_REQUIRED' : 'CYCLE_COMPLETE')
    : 'DEGRADED'

  console.info('QUALITY_AUTO_HEAL_CYCLE', JSON.stringify({
    state,
    schedule: EXPECTED_SCHEDULE,
    adapters: normalizedResults,
    missing_schema_dependencies: missingSchemaDependencies,
    production_mutation: false,
  }))

  return NextResponse.json({
    ok,
    state,
    schedule: EXPECTED_SCHEDULE,
    request_id: auth.request_id,
    results,
    missing_schema_dependencies: missingSchemaDependencies,
    migration_required: missingSchemaDependencies.length > 0,
    production_mutation: false,
    timestamp: new Date().toISOString(),
  }, { status: ok ? 200 : 503 })
}
