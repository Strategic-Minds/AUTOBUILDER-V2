import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ ok: true, dry_run: true, budgets: { ai_gateway: 'configure', browser_automation: 'configure', messaging: 'configure' } });
}
