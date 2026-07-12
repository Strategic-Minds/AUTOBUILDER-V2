import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';

export async function GET(req: NextRequest) {
  const authCtx = authorizeInternalRequest(req, 'receipts:write');
  if (!authCtx.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({
    validation_system: 'active',
    last_run: new Date().toISOString(),
    status: 'CI_REQUIRED',
  });
}

export async function POST(req: NextRequest) {
  const authCtx = authorizeInternalRequest(req, 'receipts:write');
  if (!authCtx.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  return NextResponse.json({
    received: true,
    validation_id: `VAL-${Date.now()}`,
    ...body,
  });
}
