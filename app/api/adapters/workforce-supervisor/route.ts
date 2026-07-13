import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest, makeUnauthorizedResponse } from '@/lib/internal-auth'
import { rateLimit, handleRateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<Response> {
  const limitRes = rateLimit(req, 100, 60000)
  if (!limitRes.success) {
    return handleRateLimitResponse(limitRes)
  }

  const authCtx = authorizeInternalRequest(req, 'agents:dispatch')
  if (!authCtx.ok) return makeUnauthorizedResponse(authCtx)

  try {
    const body = await req.json()
    return NextResponse.json({
      ok: true,
      dispatched: true,
      jobId: body.jobId,
      agentId: body.agentId,
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const authCtx = authorizeInternalRequest(req, 'agents:dispatch')
  if (!authCtx.ok) return makeUnauthorizedResponse(authCtx)

  return NextResponse.json({
    ok: true,
    status: 'supervisor-active',
    queue_depth: 0,
    agents_active: 0,
    timestamp: new Date().toISOString()
  })
}
