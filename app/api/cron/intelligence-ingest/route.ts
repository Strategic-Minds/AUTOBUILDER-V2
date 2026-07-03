import { NextResponse } from 'next/server'

// Intelligence ingest: rolls up intelligence/competitor/template signals.
// Was declared in vercel.json but had no route file.
// Safe dry-run only; no external writes performed here.
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
    route: '/api/cron/intelligence-ingest',
    action: 'intelligence_rollup_ingest',
    production_mutation: false,
  })
}
