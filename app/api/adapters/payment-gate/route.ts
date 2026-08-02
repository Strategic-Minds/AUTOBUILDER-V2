import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/workers/adapters/payment-gate'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ adapter: 'payment-gate', ready: true })
}

export async function POST(req: NextRequest) {
  // AUTH: strict cron secret check (fail-closed)
  const secret = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // RATE LIMIT
  const { rateLimit, handleRateLimitResponse } = await import('@/lib/rate-limit')
  const rl = rateLimit(req, 30, 60000)
  if (!rl.success) return new Response(handleRateLimitResponse(rl).body, { status: 429, headers: { 'Content-Type': 'application/json' } })
  const result = await run()
  const statusCode = result.status === 'error' ? 500 : 200
  return NextResponse.json(result, { status: statusCode })
}
