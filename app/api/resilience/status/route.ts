import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { getResilienceSnapshot } from '@/lib/resilience/engine'
import { executeLiveResilienceCycle } from '@/lib/resilience/live-cycle'
import { latestRun } from '@/lib/resilience/store'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      snapshot: getResilienceSnapshot(),
      latestRun: await latestRun(),
    })
  } catch (error) {
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      snapshot: getResilienceSnapshot(),
      latestRun: null,
      persistenceWarning: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const forwardedHost = request.headers.get('x-forwarded-host')
    const host = forwardedHost || request.headers.get('host')
    if (!host) return NextResponse.json({ ok: false, error: 'Unable to resolve validation target.' }, { status: 400 })
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const targetUrl = `${protocol}://${host}`
    const execution = await executeLiveResilienceCycle(targetUrl)
    return NextResponse.json({
      ok: execution.result.releaseGate === 'PREVIEW_ACCEPTABLE',
      generatedAt: new Date().toISOString(),
      snapshot: getResilienceSnapshot(),
      ...execution,
    }, { status: execution.result.releaseGate === 'PREVIEW_ACCEPTABLE' ? 200 : 422 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      productionMutation: false,
    }, { status: 500 })
  }
}
