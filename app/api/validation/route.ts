import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'receipts:write');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false }), { status: auth.http_status });
  return NextResponse.json({ validation_system: 'active', last_run: new Date().toISOString(), status: 'CI_RUNNER_REQUIRED' });
}

export async function POST(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'receipts:write');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false }), { status: auth.http_status });
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ received: true, validation_id: `VAL-${Date.now()}`, source: body.source || 'UNKNOWN', timestamp: new Date().toISOString() });
}
