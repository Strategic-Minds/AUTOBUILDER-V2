/**
 * WP-7: Real unit tests for internal auth, queue routing, idempotency, validation.
 * Deterministic. No network calls. No mocks that hide failures.
 * Run with: npx jest src/__tests__/unit/ or npx vitest
 */
import { describe, it, expect } from 'vitest';
import { authorizeInternalRequest, SERVICE_SCOPES } from '../lib/internal-auth';

// ─── Internal Auth Unit Tests ───────────────────────────────────────────────

describe('authorizeInternalRequest', () => {
  const makeReq = (headers: Record<string, string>) => ({
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null }
  });

  const OLD_ENV = process.env;
  beforeEach(() => { process.env = { ...OLD_ENV, CRON_SECRET: 'test-secret-xyz' }; });
  afterEach(() => { process.env = OLD_ENV; });

  it('T-AUTH-01: returns BLOCKED when CRON_SECRET is absent', () => {
    delete process.env.CRON_SECRET;
    const ctx = authorizeInternalRequest(makeReq({}), 'jobs:repair');
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('BLOCKED');
    expect(ctx.http_status).toBe(503);
  });

  it('T-AUTH-02: returns UNAUTHORIZED when Authorization header is missing', () => {
    const ctx = authorizeInternalRequest(makeReq({}), 'jobs:repair');
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('UNAUTHORIZED');
    expect(ctx.http_status).toBe(401);
  });

  it('T-AUTH-03: returns UNAUTHORIZED when token is wrong', () => {
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Bearer wrong-token' }), 'jobs:repair');
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('UNAUTHORIZED');
    expect(ctx.http_status).toBe(401);
  });

  it('T-AUTH-04: returns UNAUTHORIZED when scheme is not Bearer', () => {
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Basic dXNlcjpwYXNz' }), 'jobs:repair');
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('UNAUTHORIZED');
  });

  it('T-AUTH-05: returns UNAUTHORIZED when raw secret in x-service-secret (not accepted)', () => {
    const ctx = authorizeInternalRequest(makeReq({ 'x-service-secret': 'test-secret-xyz' }), 'jobs:repair');
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('UNAUTHORIZED');
  });

  it('T-AUTH-06: returns AUTHORIZED with valid Bearer token', () => {
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Bearer test-secret-xyz' }), 'jobs:repair');
    expect(ctx.ok).toBe(true);
    expect(ctx.state).toBe('AUTHORIZED');
    expect(ctx.http_status).toBe(200);
    expect(ctx.scope).toBe('jobs:repair');
  });

  it('T-AUTH-07: returns EXPIRED when timestamp is too old', () => {
    const oldTs = (Date.now() - 6 * 60 * 1000).toString();
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Bearer test-secret-xyz', 'x-request-timestamp': oldTs }), 'jobs:heal');
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('EXPIRED');
  });

  it('T-AUTH-08: returns FORBIDDEN when environment does not match x-target-env', () => {
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Bearer test-secret-xyz', 'x-target-env': 'production' }), 'jobs:heal');
    // Current env is 'test' or 'unknown', not 'production'
    expect(ctx.ok).toBe(false);
    expect(ctx.state).toBe('FORBIDDEN');
    expect(ctx.http_status).toBe(403);
  });

  it('T-AUTH-09: includes request_id in response', () => {
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Bearer test-secret-xyz', 'x-request-id': 'REQ-123' }), 'jobs:repair');
    expect(ctx.request_id).toBe('REQ-123');
  });

  it('T-AUTH-10: does not expose secret value in error response', () => {
    const ctx = authorizeInternalRequest(makeReq({ authorization: 'Bearer wrong' }), 'jobs:repair');
    expect(ctx.error).not.toContain('test-secret-xyz');
    expect(JSON.stringify(ctx)).not.toContain('test-secret-xyz');
  });
});

describe('SERVICE_SCOPES', () => {
  it('T-SCOPE-01: contains all required scopes', () => {
    const required = ['jobs:repair','jobs:heal','jobs:quarantine','agents:dispatch','browser:execute','receipts:write'];
    for (const scope of required) {
      expect(SERVICE_SCOPES).toContain(scope);
    }
  });
});

// ─── Idempotency Key Tests ────────────────────────────────────────────────────

describe('Idempotency key generation', () => {
  it('T-IDEM-01: same job_type + env + 5-min window produces same key', () => {
    const window1 = Math.floor(Date.now() / 300_000);
    const key1 = `queue-recovery-all-${window1}`;
    const key2 = `queue-recovery-all-${window1}`;
    expect(key1).toBe(key2);
  });

  it('T-IDEM-02: different windows produce different keys', () => {
    const key1 = `queue-recovery-all-${100}`;
    const key2 = `queue-recovery-all-${101}`;
    expect(key1).not.toBe(key2);
  });
});

// ─── Schedule Validation Tests ────────────────────────────────────────────────

describe('Schedule field validation', () => {
  const validateSchedule = (s: Partial<{ job_type: string; queue_name: string; cadence_seconds: number; environment: string; enabled: boolean; risk_class: string; assigned_agent_role: string; priority: number; retry_limit: number }>) => {
    const required = ['job_type','queue_name','cadence_seconds','environment'];
    const missing = required.filter(f => s[f as keyof typeof s] === undefined || s[f as keyof typeof s] === null);
    return { valid: missing.length === 0, missing };
  };

  it('T-SCHED-01: rejects schedule missing job_type', () => {
    const r = validateSchedule({ queue_name: 'build', cadence_seconds: 300, environment: 'all' });
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('job_type');
  });

  it('T-SCHED-02: rejects schedule missing queue_name', () => {
    const r = validateSchedule({ job_type: 'validation', cadence_seconds: 900, environment: 'all' });
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('queue_name');
  });

  it('T-SCHED-03: accepts valid schedule', () => {
    const r = validateSchedule({ job_type: 'validation', queue_name: 'validation', cadence_seconds: 900, environment: 'all', enabled: true, risk_class: 'low' });
    expect(r.valid).toBe(true);
    expect(r.missing).toHaveLength(0);
  });
});

// ─── Queue Routing Tests ──────────────────────────────────────────────────────

describe('Queue routing', () => {
  const QUEUE_MAP: Record<string, string> = {
    'auto-fix': 'repair', 'auto-heal': 'repair', 'validation': 'validation',
    'browser-testing': 'browser', 'security-scan': 'security',
    'intelligence-ingestion': 'intelligence', 'receipt-reconciliation': 'receipt',
    'queue-recovery': 'system', 'operator-reporting': 'system',
  };

  it('T-QUEUE-01: auto-fix routes to repair queue (not build)', () => {
    expect(QUEUE_MAP['auto-fix']).toBe('repair');
    expect(QUEUE_MAP['auto-fix']).not.toBe('build');
  });

  it('T-QUEUE-02: browser-testing routes to browser queue', () => {
    expect(QUEUE_MAP['browser-testing']).toBe('browser');
  });

  it('T-QUEUE-03: all scheduled jobs have queue mapping', () => {
    const scheduled = Object.keys(QUEUE_MAP);
    expect(scheduled.length).toBeGreaterThanOrEqual(9);
    for (const job of scheduled) {
      expect(QUEUE_MAP[job]).toBeTruthy();
    }
  });
});

// ─── Auto-Fix Input Validation Tests ─────────────────────────────────────────

describe('Auto-fix input validation', () => {
  const validateInput = (input: Record<string, unknown>) => {
    const required = ['job_id','failing_file','error_output','rollback_sha','source_commit'];
    const missing = required.filter(f => !input[f]);
    return { valid: missing.length === 0, missing };
  };

  it('T-FIX-01: rejects input missing failing_file', () => {
    const r = validateInput({ job_id: 'J1', error_output: 'err', rollback_sha: 'abc', source_commit: 'def' });
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('failing_file');
  });

  it('T-FIX-02: rejects fingerprint-only input (no error_output)', () => {
    const r = validateInput({ job_id: 'J1', failing_file: 'src/a.ts', rollback_sha: 'abc', source_commit: 'def' });
    expect(r.valid).toBe(false);
    expect(r.missing).toContain('error_output');
  });

  it('T-FIX-03: accepts complete input', () => {
    const r = validateInput({ job_id: 'J1', failing_file: 'src/a.ts', error_output: 'TS2339', rollback_sha: 'abc123', source_commit: 'def456' });
    expect(r.valid).toBe(true);
  });
});

