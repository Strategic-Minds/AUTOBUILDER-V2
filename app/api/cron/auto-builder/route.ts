import { NextResponse } from 'next/server'
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const mode = process.env.AUTO_BUILDER_MODE || 'dry_run'
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ ok: true, mode, route: '/api/cron/auto-builder', action: 'heartbeat', production_mutation: false })
}
