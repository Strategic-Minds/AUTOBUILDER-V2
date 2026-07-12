import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';

export async function POST(req: NextRequest) {
  const authCtx = authorizeInternalRequest(req, 'jobs:quarantine');
  if (!authCtx.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { agentId, reason, jobId } = await req.json();
  return NextResponse.json({
    quarantined: true,
    agentId,
    reason,
    jobId,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  const authCtx = authorizeInternalRequest(req, 'jobs:quarantine');
  if (!authCtx.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({
    status: 'quarantine-active',
    agents: [],
  });
}
