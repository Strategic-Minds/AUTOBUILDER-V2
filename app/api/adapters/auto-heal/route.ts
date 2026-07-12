/**
 * WP-10 + WP-2: Executable Auto-Heal Engine with internal auth guard.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function sbOp<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${SB}/rest/v1/${path}`, { method, headers: sbH, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data: T | null = null;
    try { data = text ? JSON.parse(text) as T : null; } catch { data = text as unknown as T; }
    return { ok: res.ok, status: res.status, data, error: res.ok ? null : text.slice(0, 400) };
  } catch (e) { return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) }; }
}

interface HealResult { trigger: string; job_id: string; before: Record<string,unknown>; after: Record<string,unknown>; receipt_id: string | null; verified: boolean; }
interface LeasedJob { id: string; job_id: string; lease_owner: string; attempt_count: number; max_attempts: number; }
interface StatusRow { status: string; lease_owner?: string | null; }

export async function POST(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'jobs:heal');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, state: auth.state, error: auth.error }), { status: auth.http_status });

  const body = await req.json().catch(() => ({}));
  const runId = `AH-${Date.now()}`;
  const healed: HealResult[] = [];
  const failed: string[] = [];

  // Scenario 1: Expired leases
  const expired = await sbOp<LeasedJob[]>(
    `factory_jobs?status=eq.leased&lease_expires_at=lt.${new Date().toISOString()}&limit=10&job_type=neq.heartbeat-lock`
  );
  if (expired.ok && Array.isArray(expired.data)) {
    for (const job of expired.data) {
      const before = { status: 'leased', lease_owner: job.lease_owner };
      const newStatus = (job.attempt_count + 1) >= job.max_attempts ? 'failed' : 'queued';
      await sbOp(`factory_jobs?id=eq.${job.id}`, 'PATCH', { status: newStatus, lease_owner: null, lease_expires_at: null, last_error: 'lease_expired_auto_healed' });
      const verify = await sbOp<StatusRow[]>(`factory_jobs?id=eq.${job.id}&select=status,lease_owner`);
      const afterRow: StatusRow = Array.isArray(verify.data) && verify.data[0] ? verify.data[0] : { status: '', lease_owner: undefined };
      const after: Record<string,unknown> = afterRow;
      const verified = afterRow.status === newStatus && afterRow.lease_owner === null;
      const rcp = await sbOp<Array<{ receipt_id: string }>>('factory_receipts', 'POST', {
        receipt_type: 'auto-heal', status: verified ? 'success' : 'failure', produced_by: 'auto-heal-engine',
        action_summary: `Healed expired lease: ${job.job_id} → ${newStatus}`,
        evidence: { run_id: runId, job_id: job.job_id, before, after, verified, compensation: `PATCH factory_jobs SET status='leased',lease_owner='${job.lease_owner}' WHERE job_id='${job.job_id}'` },
        rollback_available: true,
      });
      healed.push({ trigger: 'expired_lease', job_id: job.job_id, before, after, receipt_id: Array.isArray(rcp.data) ? rcp.data[0]?.receipt_id : null, verified });
    }
  }

  // Scenario 2: Retryable failed jobs
  const retryable = await sbOp<Array<{ id: string; job_id: string; attempt_count: number; max_attempts: number }>>(`factory_jobs?status=eq.failed&limit=5`);
  if (retryable.ok && Array.isArray(retryable.data)) {
    for (const job of retryable.data) {
      if (job.attempt_count < job.max_attempts) {
        const before = { status: 'failed', attempt_count: job.attempt_count };
        await sbOp(`factory_jobs?id=eq.${job.id}`, 'PATCH', { status: 'queued', last_error: null });
        const verify = await sbOp<StatusRow[]>(`factory_jobs?id=eq.${job.id}&select=status`);
        const afterRow: StatusRow = Array.isArray(verify.data) && verify.data[0] ? verify.data[0] : { status: '' };
        const after: Record<string,unknown> = afterRow;
        const verified = afterRow.status === 'queued';
        const rcp = await sbOp<Array<{ receipt_id: string }>>('factory_receipts', 'POST', { receipt_type: 'auto-heal', status: verified ? 'success' : 'failure', produced_by: 'auto-heal-engine', action_summary: `Requeued: ${job.job_id}`, evidence: { run_id: runId, job_id: job.job_id, before, after, verified }, rollback_available: true });
        healed.push({ trigger: 'retryable_failure', job_id: job.job_id, before, after, receipt_id: Array.isArray(rcp.data) ? rcp.data[0]?.receipt_id : null, verified });
      }
    }
  }

  await sbOp('auto_heal_runs', 'POST', { job_id: body.job_id || null, iteration: 1, diagnosis: `Scan: ${healed.length} healed, ${failed.length} failed`, status: failed.length === 0 ? 'resolved' : 'blocked', actions_taken: healed.map(h => `${h.trigger}:${h.job_id}`), evidence: { run_id: runId, healed: healed.length, failed: failed.length } });

  return NextResponse.json({ ok: true, run_id: runId, healed_count: healed.length, failed_count: failed.length, all_verified: healed.every(h => h.verified), healed, request_id: auth.request_id });
}

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'jobs:heal');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, state: auth.state }), { status: auth.http_status });
  const recent = await sbOp('auto_heal_runs?order=created_at.desc&limit=5&select=id,status,diagnosis,created_at');
  return NextResponse.json({ engine: 'WP-10 Auto-Heal', recent: recent.data, request_id: auth.request_id });
}
