import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';
import { redactedConnectionSummary } from '@/lib/autonomy/connection-registry';
import { listAutonomyJobs } from '@/lib/autonomy/store';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const auth=authorizeInternalRequest(req,'agents:dispatch');if(!auth.ok)return NextResponse.json({ok:false,state:auth.state,error:auth.error},{status:auth.http_status});const connections=redactedConnectionSummary();const jobs=await listAutonomyJobs(100).catch(()=>[]);const counts=jobs.reduce<Record<string,number>>((acc,job)=>{acc[job.status]=(acc[job.status]||0)+1;return acc;},{});return NextResponse.json({ok:connections.ready,service:'autobuilder-v2-autonomy',connections,queue:{total:jobs.length,counts},canonical_mcp:'https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp',timestamp:new Date().toISOString()});}
