/**
 * WP-11 + WP-2: Enforced Quarantine with internal auth guard.
 * Auth executes BEFORE all operations including synthetic tests.
 * GET returns count summary only — never raw internal records.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authorizeInternalRequest } from '@/lib/internal-auth';
export const dynamic = 'force-dynamic';

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

const QUARANTINE_TRIGGERS = ['secret_exposure','production_access_from_test','unauthorized_file_path','unauthorized_database_surface','cross_tenant_access','rls_failure','prompt_injection','ssrf_attempt','suspicious_dependency','unknown_binary','artifact_hash_mismatch','missing_provenance','repeated_repair_failure','cost_overrun','destructive_action_attempt'] as const;
type QuarantineTrigger = typeof QUARANTINE_TRIGGERS[number];

async function sb<T = unknown>(path: string, method = 'GET', body?: unknown): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${SB}/rest/v1/${path}`, { method, headers: sbH, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let data: T | null = null;
    try { data = text ? JSON.parse(text) as T : null; } catch { data = text as unknown as T; }
    return { ok: res.ok, status: res.status, data, error: res.ok ? null : text.slice(0, 400) };
  } catch (e) { return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) }; }
}

async function enforceQuarantine(jobId: string, trigger: QuarantineTrigger, severity: string, evidence: Record<string,unknown>, depIds: string[] = []) {
  // Stop the job
  await sb(`factory_jobs?job_id=eq.${jobId}`, 'PATCH', { status: 'quarantined', lease_owner: null, lease_expires_at: null, last_error: `QUARANTINED:${trigger}` });
  // Stop dependents
  for (const dep of depIds) await sb(`factory_jobs?job_id=eq.${dep}&status=in.(queued,leased,running)`, 'PATCH', { status: 'quarantined', last_error: `QUARANTINED:dependent_of_${jobId}` });
  // Create quarantine record
  const qrn = await sb<Array<{ quarantine_id: string }>>('factory_quarantine', 'POST', { job_id: jobId, trigger_rule: trigger, severity, evidence: { ...evidence, ts: new Date().toISOString() }, workspace_preserved: true, logs_preserved: true, promotion_blocked: true, status: 'active', remediation_packet: { required_clearance: 'independent_security_agent', steps: ['Preserve evidence','Root cause','Fix trigger','Independent review','Manual clearance'] } });
  const qrnId = Array.isArray(qrn.data) && qrn.data[0] ? qrn.data[0].quarantine_id : `QRN-${Date.now()}`;
  // Verify quarantine record exists and promotion IS blocked
  const verify = await sb<Array<{ status: string; promotion_blocked: boolean }>>(`factory_quarantine?quarantine_id=eq.${qrnId}&select=status,promotion_blocked`);
  const verified = Array.isArray(verify.data) && verify.data[0]?.promotion_blocked === true;
  // Write receipt
  const rcp = await sb<Array<{ receipt_id: string }>>('factory_receipts', 'POST', { receipt_type: 'quarantine', status: 'success', produced_by: 'quarantine-engine', action_summary: `QUARANTINE[${qrnId}]: ${trigger} — ${jobId}`, evidence: { quarantine_id: qrnId, trigger, job_id: jobId, promotion_blocked: true, verified }, rollback_available: false });
  const rcpId = Array.isArray(rcp.data) && rcp.data[0] ? rcp.data[0].receipt_id : null;
  return { quarantine_id: qrnId, blocked: true, verified, receipt_id: rcpId };
}

export async function POST(req: NextRequest) {
  // WP-2: Auth FIRST — before reading body, before synthetic tests, before any DB op
  const auth = authorizeInternalRequest(req, 'jobs:quarantine');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, state: auth.state, error: auth.error }), { status: auth.http_status });

  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  const body = await req.json().catch(() => ({}));
  const { job_id, trigger, severity = 'HIGH', evidence = {}, dependent_job_ids = [], test_scenario } = body;

  // Synthetic tests only in test/preview
  if (test_scenario) {
    if (!['test','preview','development'].includes(env)) {
      return NextResponse.json({ ok: false, error: 'Synthetic tests only allowed in test/preview environments', env }, { status: 403 });
    }
    const results: Record<string, unknown> = {};
    const scenarios = test_scenario === 'all' ? ['secret_exposure','repeated_repair_failure','unauthorized_path'] : [test_scenario];
    for (const sc of scenarios) {
      const tj = await sb<Array<{ job_id: string }>>('factory_jobs', 'POST', { job_type: `test-qrn-${sc}`, queue_name: 'build', title: `SYNTHETIC:${sc}`, status: 'running', idempotency_key: `qtest-${sc}-${Date.now()}`, input_payload: { test: true, scenario: sc } });
      const tjId = Array.isArray(tj.data) && tj.data[0] ? tj.data[0].job_id : null;
      if (tjId) {
        const r = await enforceQuarantine(tjId, sc as QuarantineTrigger, 'HIGH', { test: true, scenario: sc });
        results[sc] = { PASS: r.verified, ...r };
      }
    }
    return NextResponse.json({ ok: true, test_scenario, results, request_id: auth.request_id });
  }

  if (!job_id || !trigger) return NextResponse.json({ error: 'job_id and trigger required' }, { status: 400 });
  if (!QUARANTINE_TRIGGERS.includes(trigger)) return NextResponse.json({ error: `invalid trigger` }, { status: 400 });

  const result = await enforceQuarantine(job_id, trigger, severity, evidence, dependent_job_ids);
  return NextResponse.json({ ok: true, ...result, request_id: auth.request_id });
}

// WP-2: GET returns count summary only — NOT raw records
export async function GET(req: NextRequest) {
  const auth = authorizeInternalRequest(req, 'jobs:quarantine');
  if (!auth.ok) return new Response(JSON.stringify({ ok: false, state: auth.state }), { status: auth.http_status });
  const active = await sb<Array<unknown>>('factory_quarantine?status=eq.active&select=quarantine_id&limit=100');
  const cleared = await sb<Array<unknown>>('factory_quarantine?status=eq.cleared&select=quarantine_id&limit=100');
  return NextResponse.json({ quarantine_summary: { active_count: Array.isArray(active.data) ? active.data.length : 0, cleared_count: Array.isArray(cleared.data) ? cleared.data.length : 0 }, request_id: auth.request_id });
}

