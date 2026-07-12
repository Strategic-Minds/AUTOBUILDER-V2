import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';

export async function POST(req: NextRequest) {
  const authError = authorizeInternalRequest(req);
  if (authError) return authError;
  const { agentId, reason, jobId } = await req.json();
  return NextResponse.json({ quarantined: true, agentId, reason, jobId, timestamp: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  const authError = authorizeInternalRequest(req);
  if (authError) return authError;
  return NextResponse.json({ status: 'quarantine-active', agents: [] });
}
