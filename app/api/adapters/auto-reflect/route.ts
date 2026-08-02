import { NextRequest, NextResponse } from 'next/server'
import { authorizeInternalRequest } from '@/lib/internal-auth'
import { rateLimit, handleRateLimitResponse } from '@/lib/rate-limit'
import { run } from '@/workers/adapters/auto-reflect'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

export async function GET() {
  return NextResponse.json({ adapter: 'auto-reflect', ready: true, production_mutation: false })
}

export async function POST(req: NextRequest) {
  // RATE LIMIT
  const rl = rateLimit(req, 20, 60000)
  if (!rl.success) return handleRateLimitResponse(rl)
  const auth = authorizeInternalRequest(req, 'jobs:repair')
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, state: auth.state, error: auth.error, production_mutation: false },
      { status: auth.http_status },
    )
  }
  const result = await run()
  const statusCode = result.status === 'error' ? 500 : 200
  return NextResponse.json(result, { status: statusCode })
}
