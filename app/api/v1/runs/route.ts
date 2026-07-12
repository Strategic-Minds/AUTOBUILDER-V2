import { NextRequest, NextResponse } from 'next/server';
import { canonicalHash } from '@/lib/pipeline/idempotency';
import { evaluatePolicy } from '@/lib/policy/engine';

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (!idempotencyKey) return NextResponse.json({ error: 'Idempotency-Key header required' }, { status: 400 });
    const body = await req.json();
    const policy = evaluatePolicy({
      action: 'create_pipeline_run',
      environment: 'preview',
      approvedActions: [],
      actorRoles: ['operator'],
      productionEnabled: false
    });
    if (!policy.allow) return NextResponse.json({ error: policy.reason }, { status: 403 });
    const requestHash = canonicalHash(body);
    return NextResponse.json({
      success: true,
      run_id: `run_${Date.now()}`,
      request_hash: requestHash,
      status: 'queued',
      idempotency_key: idempotencyKey
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}