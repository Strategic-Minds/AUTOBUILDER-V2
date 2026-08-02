import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/workers/adapters/auto-harden'
import { rateLimit, handleRateLimitResponse } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ adapter: 'auto-harden', ready: true })
}

export async function POST(req: NextRequest) {
  // RATE LIMIT
  const rl = rateLimit(req, 30, 60000)
  if (!rl.success) return handleRateLimitResponse(rl)
  // AUTH: strict cron secret check (fail-closed)
  const secret = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await run()
  const statusCode = result.status === 'error' ? 500 : 200
  return NextResponse.json(result, { status: statusCode })
}
