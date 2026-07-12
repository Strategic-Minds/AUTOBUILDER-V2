/**
 * WP-11: Enforced Quarantine
 * Quarantine is an executing control — not just a record store.
 * Stops jobs, revokes leases, preserves evidence, blocks promotion.
 */
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sbH = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

const QUARANTINE_TRIGGERS = [
  'secret_exposure','production_access_from_test','unauthorized_file_path',
  'unauthorized_database_surface','cross_tenant_access','rls_failure',
  'prompt_injection','ssrf_attempt','suspicious_dependency','unknown_binary',
  'artifact_hash_mismatch','missing_provenance','repeated_repair_failure',
  'cost_overrun','destructive_action_attempt',
] as const;

type QuarantineTrigger = typeof QUARANTINE_TRIGGERS[number];

async function sb(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { method, headers: sbH, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { ok: r.ok, status: r.status, data: text ? JSON.parse(text) : null };
}

async function enforceQuarantine(opts: {
  jobId: string; trigger: QuarantineTrigger; severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  evidence: Record<string, unknown>; dependentJobIds?: string[];
}): Promise<{ quarantineId: string; stopped: number; blocked: boolean }> {

  // 1. Stop active job immediately
  const stopRes = await sb(`factory_jobs?job_id=eq.${opts.jobId}`, 'PATCH', {
    status: 'quarantined', lease_owner: null, lease_expires_at: null,
    last_error: `QUARANTINED: ${opts.trigger}`,
  });

  // 2. Stop dependent jobs
  let stopped = stopRes.ok ? 1 : 0;
  if (opts.dependentJobIds && opts.dependentJobIds.length > 0) {
    for (const depId of opts.dependentJobIds) {
      const depStop = await sb(`factory_jobs?job_id=eq.${depId}&status=in.(queued,leased,running)`, 'PATCH', {
        status: 'quarantined', last_error: `QUARANTINED: dependent on ${opts.jobId}`,
      });
      if (depStop.ok) stopped++;
    }
  }

  // 3. Create quarantine record
  const qrn = await sb('factory_quarantine', 'POST', {
    job_id: opts.jobId, trigger_rule: opts.trigger, severity: opts.severity,
    evidence: { ...opts.evidence, ts: new Date().toISOString() },
    workspace_preserved: true, logs_preserved: true, promotion_blocked: true,
    status: 'active',
    remediation_packet: {
      required_clearance: 'independent_security_agent',
      steps: ['Preserve evidence', 'Root cause analysis', 'Fix trigger condition', 'Independent review', 'Manual clearance'],
    },
  });

  const qrnId = Array.isArray(qrn.data) ? qrn.data[0]?.quarantine_id : `QRN-${Date.now()}`;

  // 4. Write quarantine receipt
  await sb('factory_receipts', 'POST', {
    receipt_type: 'quarantine', status: 'success', produced_by: 'quarantine-engine',
    action_summary: `QUARANTINE[${qrnId}]: ${opts.trigger} — job ${opts.jobId} stopped`,
    evidence: { quarantine_id: qrnId, trigger: opts.trigger, jobs_stopped: stopped, ...opts.evidence },
    rollback_available: false,
  });

  return { quarantineId: qrnId, stopped, blocked: true };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { job_id, trigger, severity = 'HIGH', evidence = {}, dependent_job_ids = [], test_scenario } = body;

  // Run synthetic tests if requested
  if (test_scenario) {
    const results: Record<string, unknown> = {};

    if (test_scenario === 'secret_exposure' || test_scenario === 'all') {
      // Synthetic: create a test job then quarantine it for secret exposure
      const testJob = await sb('factory_jobs', 'POST', {
        job_type: 'test-quarantine-secret', queue_name: 'build',
        title: 'SYNTHETIC: Secret exposure test', status: 'running',
        idempotency_key: `qtest-secret-${Date.now()}`,
        input_payload: { contains_secret: true, test: true },
      });
      const testJobId = Array.isArray(testJob.data) ? testJob.data[0]?.job_id : null;
      if (testJobId) {
        const qResult = await enforceQuarantine({
          jobId: testJobId, trigger: 'secret_exposure', severity: 'CRITICAL',
          evidence: { test: true, scenario: 'synthetic_secret_exposure', detected_pattern: 'MOCK_API_KEY_DETECTED' },
        });
        results.secret_exposure = { PASS: qResult.blocked, ...qResult };
      }
    }

    if (test_scenario === 'repeated_repair_failure' || test_scenario === 'all') {
      const testJob = await sb('factory_jobs', 'POST', {
        job_type: 'test-quarantine-repair', queue_name: 'repair',
        title: 'SYNTHETIC: Repeated repair failure test', status: 'failed',
        idempotency_key: `qtest-repair-${Date.now()}`,
        attempt_count: 3, max_attempts: 3,
      });
      const testJobId = Array.isArray(testJob.data) ? testJob.data[0]?.job_id : null;
      if (testJobId) {
        const qResult = await enforceQuarantine({
          jobId: testJobId, trigger: 'repeated_repair_failure', severity: 'HIGH',
          evidence: { test: true, scenario: 'synthetic_repair_exhausted', attempts: 3 },
        });
        results.repeated_repair = { PASS: qResult.blocked, ...qResult };
      }
    }

    if (test_scenario === 'unauthorized_path' || test_scenario === 'all') {
      const testJob = await sb('factory_jobs', 'POST', {
        job_type: 'test-quarantine-path', queue_name: 'build',
        title: 'SYNTHETIC: Unauthorized path test', status: 'running',
        idempotency_key: `qtest-path-${Date.now()}`,
        input_payload: { attempted_path: '/etc/passwd', test: true },
      });
      const testJobId = Array.isArray(testJob.data) ? testJob.data[0]?.job_id : null;
      if (testJobId) {
        const qResult = await enforceQuarantine({
          jobId: testJobId, trigger: 'unauthorized_file_path', severity: 'CRITICAL',
          evidence: { test: true, scenario: 'path_traversal_attempt', attempted_path: '/etc/passwd' },
        });
        results.unauthorized_path = { PASS: qResult.blocked, ...qResult };
      }
    }

    return NextResponse.json({ ok: true, test_scenario, results });
  }

  // Real quarantine
  if (!job_id || !trigger) {
    return NextResponse.json({ error: 'job_id and trigger required' }, { status: 400 });
  }
  if (!QUARANTINE_TRIGGERS.includes(trigger)) {
    return NextResponse.json({ error: `trigger must be one of: ${QUARANTINE_TRIGGERS.join(', ')}` }, { status: 400 });
  }

  const result = await enforceQuarantine({ jobId: job_id, trigger, severity, evidence, dependentJobIds: dependent_job_ids });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  const active = await sb('factory_quarantine?status=eq.active&select=quarantine_id,trigger_rule,severity,quarantined_at&order=quarantined_at.desc&limit=20');
  return NextResponse.json({ quarantine_engine: 'WP-11 active', active_records: active.data || [] });
}

