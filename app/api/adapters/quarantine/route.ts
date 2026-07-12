import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authError = authorizeInternalRequest(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const { agentId, reason, jobId } = body

    return NextResponse.json({
      ok: true,
      quarantined: true,
      agentId,
      reason,
      jobId,
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
    status: 'quarantine-active',
    quarantined_agents: [],
    timestamp: new Date().toISOString()
  })
}
