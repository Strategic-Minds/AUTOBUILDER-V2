import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  // TODO: validate Twilio signature, normalize inbound WhatsApp message, write webhook receipt, route to inbox.
  return NextResponse.json({ ok: true, dry_run: true, provider: 'twilio', received: Boolean(form) });
}
