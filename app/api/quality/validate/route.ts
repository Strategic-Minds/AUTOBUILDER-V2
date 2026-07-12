import { NextResponse } from 'next/server'
export async function POST() {
  return NextResponse.json({ ok: true, mode: 'dry_run', score: 0, message: 'Validation scaffold. Wire to Playwright, build, lint, security, and route checks.' })
}
