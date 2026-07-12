/**
 * Part C + WP-2 + WP-10: Workforce Supervisor with internal auth.
 * Uses claim_factory_job() ONLY — never read-then-PATCH pattern.
 * Dispatch is NOT execution — tracked separately.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

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

// WP-10: ONLY atomic claim — never read-then-PATCH
async function atomicClaim(agentSlug: string, queueName?: string): Promise<{ claimed: boolean; job_id?: string; job_type?: string; queue_name?: string; input_payload?: unknown; reason?: string }> {
  const res = await fetch(`${SB}/rest/v1/rpc/claim_factory_job`, {
    method: 'POST', headers: sbH,
    body: JSON.stringify({ p_agent_slug: agentSlug, p_queue_name: queueName ?? null, p_lease_seconds: 300 }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return { claimed: false, reason: 'rpc_error' };
  return data as { claimed: boolean; job_id?: string; job_type?: string; queue_name?: string; input_payload?: unknown; reason?: string };
}

export async function POST(req: NextRequest) {
  // WP-2: Auth FIRST
  const auth = authorizeInternalRequest(req, 'agents:dispatch');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, state: auth.state, error: auth.error }), { status: auth.http_status });

  const supRunId = `SUP-${Date.now()}`;

  // Read available agents
  const agents = await sbOp<Array<{ slug: string; name: string; cell: string; allowed_queues: string[] }>>('agent_runtime_registry?status=eq.standby&limit=15');
  const available = Array.isArray(agents.data) ? agents.data : [];

  // WP-10: Use atomic claim only — one per agent, bounded to 3 per cycle
  const dispatched: Array<{ agent: string; job_id: string; job_type: string; status: 'DISPATCHED' }> = [];
  const agentsToDispatch = available.slice(0, 3);

  for (const agent of agentsToDispatch) {
    const queues = agent.allowed_queues && agent.allowed_queues.length > 0 ? agent.allowed_queues : [null as unknown as string];
    for (const queue of queues.slice(0, 1)) {
      const claim = await atomicClaim(agent.slug, queue || undefined);
      if (claim.claimed && claim.job_id) {
        // Mark agent busy
        await sbOp(`agent_runtime_registry?slug=eq.${agent.slug}`, 'PATCH', { status: 'busy', current_job_id: claim.job_id, last_active_at: new Date().toISOString() });
        // Create DISPATCHED receipt (not EXECUTED — dispatch ≠ execution)
        await sbOp('factory_receipts', 'POST', { receipt_type: 'agent-dispatch', status: 'success', produced_by: 'workforce-supervisor', job_id: claim.job_id, action_summary: `DISPATCHED ${agent.slug} → ${claim.job_id} [${queue}] — status: DISPATCHED (not yet EXECUTING)`, evidence: { supervisor_run: supRunId, agent: agent.slug, queue, job_type: claim.job_type, dispatch_status: 'DISPATCHED' }, rollback_available: true, rollback_ref: `Release lease on ${claim.job_id}` });
        dispatched.push({ agent: agent.slug, job_id: claim.job_id, job_type: claim.job_type || 'unknown', status: 'DISPATCHED' });
        break;
      }
    }
  }

  // Release completed agents back to standby
  const completed = await sbOp<Array<{ job_id: string; lease_owner: string }>>(`factory_jobs?status=eq.completed&completed_at=gt.${new Date(Date.now()-300_000).toISOString()}&select=job_id,lease_owner&limit=20`);
  if (Array.isArray(completed.data)) {
    for (const done of completed.data) {
      if (done.lease_owner) await sbOp(`agent_runtime_registry?slug=eq.${done.lease_owner}&status=eq.busy`, 'PATCH', { status: 'standby', current_job_id: null });
    }
  }

  // Write supervisor cycle receipt
  const rcp = await sbOp<Array<{ receipt_id: string }>>('factory_receipts', 'POST', { receipt_type: 'supervisor-cycle', status: 'success', produced_by: 'workforce-supervisor', action_summary: `Supervisor ${supRunId}: ${dispatched.length} dispatched (DISPATCHED status, not yet EXECUTING)`, evidence: { supervisor_run: supRunId, dispatched, agents_available: available.length, note: 'dispatch≠execution: see WP-11 for execution proof requirements' }, rollback_available: false });

  return NextResponse.json({ ok: true, supervisor_run: supRunId, agents_available: available.length, dispatched: dispatched.length, dispatch_log: dispatched, note: 'DISPATCHED status only — agent execution proof is a separate WP-11 requirement', request_id: auth.request_id });
}

export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'agents:dispatch');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, state: auth.state }), { status: auth.http_status });
  const recent = await sbOp('factory_receipts?receipt_type=eq.supervisor-cycle&order=created_at.desc&limit=3&select=receipt_id,action_summary,created_at');
  return NextResponse.json({ supervisor: 'active', recent_cycles: recent.data, request_id: auth.request_id });
}

