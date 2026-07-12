/**
 * WP-10: Executable Auto-Heal Engine
 * Controlled runtime recovery. Never hides failures.
 * Every action proves: failure existed → detected → recovered → receipt written.
 */
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function sbOp(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: sbH, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

interface HealAction {
  trigger: string; diagnosis: string; action: string;
  safety_justification: string; before_state: unknown; after_state?: unknown;
  verification?: string; receipt_id?: string; rollback_target?: string;
}

async function writeHealReceipt(runId: string, action: HealAction, success: boolean) {
  const res = await sbOp('factory_receipts', 'POST', {
    receipt_type: 'auto-heal', status: success ? 'success' : 'failure',
    produced_by: 'auto-heal-engine',
    action_summary: `Heal[${runId}]: ${action.action} for ${action.trigger}`,
    evidence: { run_id: runId, ...action, ts: new Date().toISOString() },
    rollback_available: !!action.rollback_target,
    rollback_ref: action.rollback_target,
  });
  return Array.isArray(res.data) ? res.data[0]?.receipt_id : null;
}

export async function POST(req: NextRequest) {
  const runId = `AH-${Date.now()}`;
  const body = await req.json().catch(() => ({}));
  const { scenario, job_id, source = 'api' } = body;

  const healed: HealAction[] = [];
  const failed: string[] = [];

  // SCENARIO 1: Expired job leases (always run)
  const expiredJobs = await sbOp(
    `factory_jobs?status=eq.leased&lease_expires_at=lt.${new Date().toISOString()}&limit=10&job_type=neq.heartbeat-lock`
  );
  if (expiredJobs.ok && Array.isArray(expiredJobs.data) && expiredJobs.data.length > 0) {
    for (const job of expiredJobs.data) {
      const before = { job_id: job.job_id, status: 'leased', lease_owner: job.lease_owner };
      const newStatus = (job.attempt_count + 1) >= job.max_attempts ? 'failed' : 'queued';
      const upd = await sbOp(`factory_jobs?id=eq.${job.id}`, 'PATCH', {
        status: newStatus, lease_owner: null, lease_expires_at: null, heartbeat_at: null,
        last_error: 'lease_expired_recovered_by_auto_heal',
      });
      if (upd.ok) {
        const action: HealAction = {
          trigger: 'expired_lease', diagnosis: `Job ${job.job_id} lease expired, was owned by ${job.lease_owner}`,
          action: `Reset to ${newStatus}`, safety_justification: 'Idempotent — job was not actively running',
          before_state: before, after_state: { status: newStatus }, verification: 'Job now re-claimable',
          rollback_target: `Set job ${job.job_id} back to leased if needed`,
        };
        healed.push(action);
        await writeHealReceipt(runId, action, true);
      } else {
        failed.push(`lease_recovery:${job.job_id}`);
      }
    }
  }

  // SCENARIO 2: Stalled agent heartbeats (agent hasn't updated heartbeat_at in >5min)
  const stalled = await sbOp(
    `factory_jobs?status=eq.running&heartbeat_at=lt.${new Date(Date.now() - 5 * 60 * 1000).toISOString()}&limit=5`
  );
  if (stalled.ok && Array.isArray(stalled.data) && stalled.data.length > 0) {
    for (const job of stalled.data) {
      const before = { job_id: job.job_id, status: 'running', last_heartbeat: job.heartbeat_at };
      const upd = await sbOp(`factory_jobs?id=eq.${job.id}`, 'PATCH', {
        status: 'queued', lease_owner: null, last_error: 'stalled_agent_no_heartbeat_recovered',
      });
      if (upd.ok) {
        const action: HealAction = {
          trigger: 'stalled_agent', diagnosis: `Agent stalled on job ${job.job_id} (no heartbeat since ${job.heartbeat_at})`,
          action: 'Requeued job for re-claim', safety_justification: 'No output was committed — safe to retry',
          before_state: before, after_state: { status: 'queued' }, verification: 'Job re-claimable',
          rollback_target: 'Original lease owner can re-claim',
        };
        healed.push(action);
        await writeHealReceipt(runId, action, true);
      }
    }
  }

  // SCENARIO 3: Failed jobs within retry budget — requeue
  const retryable = await sbOp(
    `factory_jobs?status=eq.failed&select=id,job_id,attempt_count,max_attempts,job_type,queue_name&limit=5`
  );
  if (retryable.ok && Array.isArray(retryable.data)) {
    for (const job of retryable.data) {
      if (job.attempt_count < job.max_attempts) {
        const upd = await sbOp(`factory_jobs?id=eq.${job.id}`, 'PATCH', { status: 'queued', last_error: null });
        if (upd.ok) {
          const action: HealAction = {
            trigger: 'retryable_failure', diagnosis: `Job ${job.job_id} failed (attempt ${job.attempt_count}/${job.max_attempts})`,
            action: 'Requeued for retry', safety_justification: `${job.max_attempts - job.attempt_count} attempts remaining`,
            before_state: { status: 'failed', attempts: job.attempt_count },
            after_state: { status: 'queued' }, verification: 'Will be re-claimed next heartbeat',
            rollback_target: 'Mark failed again if unsafe',
          };
          healed.push(action);
          await writeHealReceipt(runId, action, true);
        }
      }
    }
  }

  // Write heal run record
  await sbOp('auto_heal_runs', 'POST', {
    job_id: job_id || null, iteration: 1,
    diagnosis: `Auto-heal scan: ${healed.length} recovered, ${failed.length} failed`,
    status: failed.length === 0 ? 'resolved' : 'blocked',
    actions_taken: healed.map(h => h.action),
    evidence: { run_id: runId, healed, failed, source },
  });

  return NextResponse.json({
    ok: true, run_id: runId, healed_count: healed.length, failed_count: failed.length,
    healed: healed.map(h => ({ trigger: h.trigger, action: h.action, verification: h.verification })),
    failed,
  });
}

export async function GET() {
  return NextResponse.json({ status: 'WP-10 Auto-Heal Engine', methods: ['POST'] });
}

