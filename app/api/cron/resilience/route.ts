import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authorizeInternalRequest } from '@/lib/internal-auth'
import { executeLiveResilienceCycle } from '@/lib/resilience/live-cycle'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const auth = authorizeInternalRequest(request, 'browser:execute')
  if (!auth.ok) {
    return NextResponse.json({ ok: false, state: auth.state, error: auth.error }, { status: auth.http_status })
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || request.headers.get('host')
  if (!host) return NextResponse.json({ ok: false, state: 'TARGET_UNRESOLVED' }, { status: 400 })
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const execution = await executeLiveResilienceCycle(`${protocol}://${host}`)

  return NextResponse.json({
    ok: execution.result.releaseGate === 'PREVIEW_ACCEPTABLE',
    state: execution.result.releaseGate,
    run_id: execution.runId,
    score: execution.result.score,
    evidence: execution.evidence,
    timestamp: new Date().toISOString(),
  }, { status: execution.result.releaseGate === 'PREVIEW_ACCEPTABLE' ? 200 : 422 })
}
