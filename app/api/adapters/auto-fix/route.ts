import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/workers/adapters/auto-fix'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ adapter: 'auto-fix', ready: true })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await run()
  const statusCode = result.status === 'error' ? 500 : 200
  return NextResponse.json(result, { status: statusCode })
}
