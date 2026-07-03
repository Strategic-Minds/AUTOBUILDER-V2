import { NextResponse } from 'next/server'

// Enterprise kernel heartbeat: registry/queue consistency check.
// Was declared in vercel.json but had no route file - caused live 404s.
// Safe dry-run only; no production mutation performed here.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const mode = process.env.AUTO_BUILDER_MODE || 'dry_run'
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    mode,
    route: '/api/cron/enterprise-kernel',
    action: 'registry_consistency_heartbeat',
    production_mutation: false,
  })
}
