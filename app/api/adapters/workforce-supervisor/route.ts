/**
 * PART C: Workforce Supervisor Worker
 * Claims supervisor job atomically, reads eligible work,
 * assigns agents, starts runs, monitors, routes output.
 */
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function sbOp(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: sbH, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { ok: r.ok, status: r.status, data: text ? JSON.parse(text) : null };
}

async function claimJobAtomically(agentSlug: string, queue: string): Promise<Record<string, unknown> | null> {
  // Call the claim_factory_job() Postgres function
  const res = await fetch(`${SB}/rest/v1/rpc/claim_factory_job`, {
    method: 'POST', headers: sbH,
    body: JSON.stringify({ p_agent_slug: agentSlug, p_queue_name: queue, p_lease_seconds: 300 }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.claimed) return null;
  return data;
}

export async function POST(req: NextRequest) {
  const supId = `SUP-${Date.now()}`;
  const body = await req.json().catch(() => ({}));

  // 1. Claim supervisor job
  const supJob = await claimJobAtomically('workforce-supervisor', 'system');

  const evidence: Record<string, unknown> = {
    supervisor_run_id: supId,
    supervisor_job: supJob ? supJob.job_id : 'none_pending',
    ts: new Date().toISOString(),
  };

  // 2. Read agents available
  const agents = await sbOp('agent_runtime_registry?status=eq.standby&select=slug,name,cell,allowed_queues,autonomy_level&limit=15');
  const availableAgents: Array<{ slug: string; name: string; cell: string; allowed_queues: string[]; autonomy_level: string }> =
    Array.isArray(agents.data) ? agents.data : [];

  // 3. Read eligible queued work
  const queued = await sbOp(
    'factory_jobs?status=eq.queued&job_type=neq.heartbeat-lock&job_type=neq.workforce-supervisor&order=priority.asc,queued_at.asc&limit=10'
  );
  const eligibleJobs: Array<Record<string, unknown>> = Array.isArray(queued.data) ? queued.data : [];

  const dispatched: Array<Record<string, unknown>> = [];

  // 4. Match jobs to agents and dispatch
  for (const job of eligibleJobs.slice(0, 3)) { // bounded: max 3 dispatches per cycle
    const queue = String(job.queue_name || 'build');

    // Find agent capable of this queue
    const agent = availableAgents.find(a =>
      !a.allowed_queues || a.allowed_queues.length === 0 || a.allowed_queues.includes(queue)
    );
    if (!agent) continue;

    // Claim the specific job
    const claim = await sbOp(`factory_jobs?id=eq.${job.id}`, 'PATCH', {
      status: 'leased', lease_owner: agent.slug,
      lease_expires_at: new Date(Date.now() + 300_000).toISOString(),
      leased_at: new Date().toISOString(), heartbeat_at: new Date().toISOString(),
      attempt_count: (Number(job.attempt_count) || 0) + 1,
    });

    if (claim.ok) {
      // Mark agent as busy
      await sbOp(`agent_runtime_registry?slug=eq.${agent.slug}`, 'PATCH', {
        status: 'busy', current_job_id: job.job_id, last_active_at: new Date().toISOString(),
      });

      // Create agent run record
      await sbOp('factory_receipts', 'POST', {
        receipt_type: 'agent-dispatch', status: 'success',
        produced_by: 'workforce-supervisor',
        action_summary: `Dispatched ${agent.slug} → job ${job.job_id} [${queue}]`,
        job_id: String(job.job_id), evidence: { agent: agent.slug, queue, job_type: job.job_type },
        rollback_available: true, rollback_ref: `Release lease on ${job.job_id}`,
      });

      dispatched.push({ job_id: job.job_id, job_type: job.job_type, agent: agent.slug, queue });
    }
  }

  // 5. Complete supervisor job if we claimed one
  if (supJob) {
    await sbOp(`factory_jobs?job_id=eq.${supJob.job_id}`, 'PATCH', {
      status: 'completed', completed_at: new Date().toISOString(),
      output_payload: { dispatched_count: dispatched.length, dispatched },
    });
    // Release agents that completed work this cycle (mark standby)
    const completed = await sbOp('factory_jobs?status=eq.completed&completed_at=gt.' + new Date(Date.now()-300_000).toISOString() + '&select=job_id,lease_owner&limit=20');
    if (Array.isArray(completed.data)) {
      for (const done of completed.data) {
        if (done.lease_owner) {
          await sbOp(`agent_runtime_registry?slug=eq.${done.lease_owner}&status=eq.busy`, 'PATCH', { status: 'standby', current_job_id: null });
        }
      }
    }
  }

  // Write supervisor receipt
  await sbOp('factory_receipts', 'POST', {
    receipt_type: 'supervisor-cycle', status: 'success',
    produced_by: 'workforce-supervisor',
    action_summary: `Supervisor ${supId}: ${dispatched.length} jobs dispatched, ${eligibleJobs.length} eligible found`,
    evidence: { ...evidence, dispatched, eligible: eligibleJobs.length, agents_available: availableAgents.length },
    rollback_available: false,
  });

  return NextResponse.json({
    ok: true, supervisor_run: supId,
    supervisor_job_claimed: !!supJob,
    agents_available: availableAgents.length,
    eligible_jobs: eligibleJobs.length,
    dispatched: dispatched.length,
    dispatch_log: dispatched,
    next_cycle: 'supervisor re-queued by heartbeat in 5min',
  });
}

export async function GET() {
  const recent = await sbOp('factory_receipts?receipt_type=eq.supervisor-cycle&order=created_at.desc&limit=5');
  return NextResponse.json({ supervisor: 'WP-8 active', recent_cycles: recent.data });
}

