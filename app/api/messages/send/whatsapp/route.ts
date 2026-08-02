import { NextResponse, NextRequest } from 'next/server';
import { rateLimit, handleRateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // RATE LIMIT — strict: outbound WhatsApp messages
  const rl = rateLimit(request, 5, 60000)
  if (!rl.success) return handleRateLimitResponse(rl)
  // AUTH: require internal service token
  const token = request.headers.get('x-service-token')
  const expected = process.env.AUTO_BUILDER_BRIDGE_TOKEN
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}));
  // Gate order: tenant -> sender -> consent -> opt-out -> template -> budget -> human approval -> provider send.
  return NextResponse.json({ ok: true, dry_run: true, blocked_until_approved: true, channel: 'whatsapp', body_keys: Object.keys(body) });
}