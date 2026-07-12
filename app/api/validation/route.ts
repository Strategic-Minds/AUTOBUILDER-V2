import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';

export async function GET(req: NextRequest) {
  const authError = authorizeInternalRequest(req);
  if (authError) return authError;
  return NextResponse.json({
    validation_system: 'active',
    last_run: new Date().toISOString(),
    status: 'AWAITING_CI_RUNNER',
    note: 'Only CI_RUNNER writes count toward official score'
  });
}

export async function POST(req: NextRequest) {
  const authError = authorizeInternalRequest(req);
  if (authError) return authError;
  const body = await req.json();
  return NextResponse.json({
    received: true,
    validation_id: `VAL-${Date.now()}`,
    source: body.source || 'UNKNOWN',
    timestamp: new Date().toISOString()
  });
}
