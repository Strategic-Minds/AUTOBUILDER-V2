import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Meta webhook verification scaffold. Configure VERIFY_TOKEN in secure env.
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_META_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 });
  }
  return new Response('forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  // TODO: verify signature, normalize inbound message, write webhook receipt, route to inbox queue.
  return NextResponse.json({ ok: true, dry_run: true, provider: 'meta', received: Boolean(body) });
}
