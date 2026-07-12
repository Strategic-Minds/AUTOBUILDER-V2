import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authError = authorizeInternalRequest(req)
  if (authError) return authError

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

export async function GET(req: NextRequest) {
  const authError = authorizeInternalRequest(req)
  if (authError) return authError

  return NextResponse.json({
    ok: true,
    status: 'supervisor-active',
    queue_depth: 0,
    agents_active: 0,
    timestamp: new Date().toISOString()
  })
}
