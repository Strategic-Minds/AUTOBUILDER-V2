import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';

export async function POST(req: NextRequest) {
  const authCtx = authorizeInternalRequest(req, 'agents:dispatch');
  if (!authCtx.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  return NextResponse.json({
    dispatched: true,
    jobId: body.jobId,
    agentId: body.agentId,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const authCtx = authorizeInternalRequest(req, 'agents:dispatch');
  if (!authCtx.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({
    status: 'supervisor-active',
    queue: [],
  });
}
