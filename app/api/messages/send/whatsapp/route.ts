import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // Gate order: tenant -> sender -> consent -> opt-out -> template -> budget -> human approval -> provider send.
  return NextResponse.json({ ok: true, dry_run: true, blocked_until_approved: true, channel: 'whatsapp', body_keys: Object.keys(body) });
}
