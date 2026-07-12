import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) return new Response(JSON.stringify({ok:false}), {status: auth.http_status});
  return NextResponse.json({status: 'active', timestamp: new Date().toISOString()});
}

export async function POST(req: NextRequest) {
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) return new Response(JSON.stringify({ok:false}), {status: auth.http_status});
  return NextResponse.json({received: true, timestamp: new Date().toISOString()});
}
