/**
 * AUTO BUILDER V2 — Unified Heartbeat (Runtime Corrected)
 * WP-1: Fail-close on missing deps, bearer-only auth
 * WP-2: Atomic lock via idempotency key constraint (conflict=409)
 * WP-3: No hardcoded production URL — enqueue jobs instead
 * WP-4: Truthful DB ops with status/error capture
 * WP-5: Schedule cadence routing to correct queues
 * WP-8: Workforce supervisor integration
 */
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

// WP-1: Validate all required env vars
function validateEnv() {
  const missing: string[] = [];
  if (!process.env.CRON_SECRET)               missing.push('CRON_SECRET');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)  missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  const mode = process.env.AUTO_BUILDER_MODE || '';
  const knownModes = ['dry_run','test','preview','production'];
  if (mode && !knownModes.includes(mode)) missing.push('AUTO_BUILDER_MODE must be one of: ' + knownModes.join(', '));
  return {
    valid: missing.length === 0,
    missing,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    mode: mode || 'dry_run',
  };
}

const SB   = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY  = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;
const hdrs = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json', Prefer: 'return=representation' });

// WP-4: Honest Supabase helper — never silently swallows errors
async function sbOp<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; data: T | null; status: number; error: string | null }> {
  try {
    const res = await fetch(`${SB()}/rest/v1/${path}`, { method, headers: hdrs(), body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data: T | null = null;
    try { data = JSON.parse(text) as T; } catch { /* non-JSON */ }
    return { ok: res.ok, data, status: res.status, error: res.ok ? null : text.slice(0, 400) };
  } catch (e) {
    return { ok: false, data: null, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

// WP-2: Atomic lock via unique idempotency constraint (INSERT fails with 409 if duplicate)
async function acquireLock(hbId: string): Promise<{ acquired: boolean; reason?: string }> {
  const windowKey = `hb-lock-${Math.floor(Date.now() / 270_000)}`; // 4.5-min window
  const res = await sbOp('factory_jobs', 'POST', {
    job_type: 'heartbeat-lock', queue_name: 'system',
    title: `Heartbeat Lock ${hbId}`, status: 'leased',
    lease_owner: hbId,
    lease_expires_at: new Date(Date.now() + 270_000).toISOString(),
    idempotency_key: windowKey, priority: 1,
  });
  if (res.ok) return { acquired: true };
  if (res.status === 409) return { acquired: false, reason: 'already_running' };
  return { acquired: false, reason: `lock_error: ${res.error}` };
}

async function releaseLock(hbId: string): Promise<void> {
  await sbOp(`factory_jobs?job_type=eq.heartbeat-lock&lease_owner=eq.${hbId}`, 'PATCH', { status: 'completed', completed_at: new Date().toISOString() });
}

// WP-3: Enqueue as queue job — no HTTP call to hardcoded domain
async function enqueueJob(opts: { jobType: string; queue: string; hbId: string; env: string; priority?: number }): Promise<'enqueued' | 'duplicate' | 'error'> {
  const ikey = `${opts.jobType}-${opts.env}-${Math.floor(Date.now() / 300_000)}`;
  const res = await sbOp('factory_jobs', 'POST', {
    job_type: opts.jobType, queue_name: opts.queue,
    title: `[${opts.hbId}] ${opts.jobType}`, status: 'queued',
    idempotency_key: ikey, priority: opts.priority ?? 5,
    input_payload: { source: 'heartbeat', hb_id: opts.hbId, environment: opts.env },
  });
  if (res.ok) return 'enqueued';
  if (res.status === 409) return 'duplicate';
  return 'error';
}

// WP-5: Calculate next_run from actual cadence
function nextRun(cadenceSec: number): string {
  return new Date(Date.now() + cadenceSec * 1_000).toISOString();
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const hbId = `HB-${t0}-${Math.random().toString(36).slice(2,6)}`;

  // WP-1: Fail closed — env check first
  const env = validateEnv();
  if (!env.valid) {
    return NextResponse.json({ ok: false, state: 'BLOCKED', hb_id: hbId, missing: env.missing }, { status: 503 });
  }

  // WP-1: Bearer-only auth — no query-string
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, state: 'UNAUTHORIZED' }, { status: 401 });
  }

  // WP-4: Verify DB accessible before proceeding
  const dbCheck = await sbOp('factory_jobs?limit=0');
  if (!dbCheck.ok) {
    return NextResponse.json({ ok: false, state: 'DEGRADED', hb_id: hbId, db_error: dbCheck.error }, { status: 503 });
  }

  // WP-2: Atomic lock
  const lock = await acquireLock(hbId);
  if (!lock.acquired) {
    return NextResponse.json({ ok: true, state: 'SKIPPED', hb_id: hbId, reason: lock.reason, duration_ms: Date.now()-t0 });
  }

  const actions: { step: string; result: string; ms: number; error?: string }[] = [];

  try {
    // WP-8: Lease recovery
    const t1 = Date.now();
    const expired = await sbOp<Array<{ id: string; attempt_count: number; job_id: string }>>(
      `factory_jobs?status=eq.leased&lease_expires_at=lt.${new Date().toISOString()}&limit=20&job_type=neq.heartbeat-lock`
    );
    let recovered = 0;
    if (expired.ok && Array.isArray(expired.data)) {
      for (const j of expired.data) {
        const newStatus = (j.attempt_count + 1) >= 3 ? 'failed' : 'queued';
        const upd = await sbOp(`factory_jobs?id=eq.${j.id}`, 'PATCH', { status: newStatus, lease_owner: null, lease_expires_at: null, last_error: 'lease_expired_at_heartbeat' });
        if (upd.ok) recovered++;
      }
    }
    actions.push({ step: 'lease_recovery', result: `${recovered} recovered`, ms: Date.now()-t1 });

    // WP-5: Read schedules, dispatch to correct queues
    const t2 = Date.now();
    const scheds = await sbOp<Array<{ id: string; job_type: string; queue_name: string; cadence_seconds: number; environment: string }>>(
      `schedule_registry?enabled=eq.true&next_run_at=lt.${new Date().toISOString()}&limit=15`
    );
    let dispatched = 0; let dupes = 0; const errs: string[] = [];
    if (scheds.ok && Array.isArray(scheds.data)) {
      for (const s of scheds.data) {
        if (s.environment === 'production' && env.env !== 'production') continue;
        const r = await enqueueJob({ jobType: s.job_type, queue: s.queue_name, hbId, env: env.env, priority: s.job_type.includes('security') ? 2 : 5 });
        if (r === 'enqueued') {
          dispatched++;
          await sbOp(`schedule_registry?id=eq.${s.id}`, 'PATCH', { last_run_at: new Date().toISOString(), last_run_status: 'dispatched', next_run_at: nextRun(s.cadence_seconds) });
        } else if (r === 'duplicate') { dupes++; }
        else { errs.push(`${s.job_type}: enqueue_error`); }
      }
    }
    actions.push({ step: 'schedule_dispatch', result: `${dispatched} enqueued, ${dupes} dupes`, ms: Date.now()-t2, error: errs.join('; ') || undefined });

    // WP-8: Workforce supervisor — ensure one is queued
    const supCheck = await sbOp<{ id: string }[]>('factory_jobs?job_type=eq.workforce-supervisor&status=in.(queued,leased)&limit=1');
    if (supCheck.ok && Array.isArray(supCheck.data) && supCheck.data.length === 0) {
      await enqueueJob({ jobType: 'workforce-supervisor', queue: 'system', hbId, env: env.env, priority: 1 });
    }

    // WP-4: Write receipt only after operations — capture write result
    const receiptWrite = await sbOp<{ receipt_id: string }[]>('factory_receipts', 'POST', {
      receipt_type: 'heartbeat', status: errs.length > 0 ? 'failure' : 'success',
      produced_by: 'auto-builder-cron',
      action_summary: `HB ${hbId}: ${recovered} recovered, ${dispatched} dispatched, env=${env.env}`,
      evidence: { hb_id: hbId, recovered, dispatched, dupes, errors: errs, env: env.env, mode: env.mode, duration_ms: Date.now()-t0 },
      rollback_available: false,
    });
    const receiptId = receiptWrite.ok && Array.isArray(receiptWrite.data) ? receiptWrite.data[0]?.receipt_id : null;
    if (!receiptWrite.ok) {
      actions.push({ step: 'write_receipt', result: 'FAILED', ms: 0, error: receiptWrite.error || 'unknown' });
    }

    return NextResponse.json({
      ok: true, state: 'COMPLETED', hb_id: hbId,
      env: env.env, mode: env.mode,
      recovered_leases: recovered, dispatched_jobs: dispatched, duplicate_suppressed: dupes,
      dispatch_errors: errs, receipt_id: receiptId, receipt_written: receiptWrite.ok,
      duration_ms: Date.now()-t0, actions,
    });

  } finally {
    await releaseLock(hbId);
  }
}
