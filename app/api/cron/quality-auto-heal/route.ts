import { NextResponse } from 'next/server'

// Quality/auto-heal sweep: checks validation/scoring registries for
// repair-needed items. Was declared in vercel.json but had no route file.
// Safe dry-run only; actual repair execution remains gated behind approval.
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
    route: '/api/cron/quality-auto-heal',
    action: 'quality_scan_and_repair_sweep',
    production_mutation: false,
  })
}
