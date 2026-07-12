import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { cancelBuild, getBuild, getEvents, getJobs, retryBuild } from '@/lib/autonomy/build-store';

export const dynamic='force-dynamic';
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requireAuth();const{id}=await params;const[build,events,jobs]=await Promise.all([getBuild(id),getEvents(id),getJobs(id)]);return NextResponse.json({build,events,jobs})}catch(err){if(err instanceof NextResponse)return err;return NextResponse.json({error:err instanceof Error?err.message:'Failed to load build'},{status:500})}}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const user=await requireAuth();const{id}=await params;const body=await req.json();if(body.action==='cancel')return NextResponse.json({ok:true,result:await cancelBuild(id,user.id)});if(body.action==='retry')return NextResponse.json({ok:true,result:await retryBuild(id,user.id)});return NextResponse.json({error:'action must be cancel or retry'},{status:400})}catch(err){if(err instanceof NextResponse)return err;return NextResponse.json({error:err instanceof Error?err.message:'Build control failed'},{status:500})}}
