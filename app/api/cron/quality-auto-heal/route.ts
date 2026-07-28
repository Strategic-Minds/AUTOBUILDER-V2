import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { run as reflect } from '@/workers/adapters/auto-reflect'
import { run as fix } from '@/workers/adapters/auto-fix'
import { run as heal } from '@/workers/adapters/auto-heal'
import { run as harden } from '@/workers/adapters/auto-harden'

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
      results[name] = await runner()
    } catch (error) {
      results[name] = { status: 'error', error: error instanceof Error ? error.message : String(error) }
    }
  }

  const states = Object.values(results).map((result) => String((result as { status?: unknown })?.status || 'unknown'))
  const ok = !states.includes('error')

  return NextResponse.json({
    ok,
    state: ok ? (states.includes('blocked') ? 'BLOCKED_REPAIR_REQUIRED' : 'CYCLE_COMPLETE') : 'DEGRADED',
    schedule: EXPECTED_SCHEDULE,
    request_id: auth.request_id,
    results,
    production_mutation: false,
    timestamp: new Date().toISOString(),
  }, { status: ok ? 200 : 503 })
}
