/**
 * lib/internal-auth.ts
 * WP-1: Shared internal service authorization module.
 * ALL privileged routes MUST call authorizeInternalRequest() before any DB/GH/mutation operation.
 * Fail-closed: returns error object on ANY missing or invalid credential.
 * Bearer-only: does NOT accept raw secret in x-service-secret or query string.
 * Does NOT log or return secret values.
 */

export const SERVICE_SCOPES = [
  'jobs:repair', 'jobs:heal', 'jobs:quarantine',
  'agents:dispatch', 'browser:execute', 'receipts:write',
  'projects:write',
] as const;

export type ServiceScope = typeof SERVICE_SCOPES[number];

export interface AuthContext {
  ok: boolean;
  state: 'AUTHORIZED' | 'UNAUTHORIZED' | 'BLOCKED' | 'FORBIDDEN' | 'EXPIRED';
  service_id: string;
  environment: string;
  request_id: string;
  correlation_id: string;
  idempotency_key: string | null;
  scope: ServiceScope | null;
  error?: string;
  http_status: 200 | 401 | 403 | 503;
}

export function authorizeInternalRequest(
  req: { headers: { get: (k: string) => string | null } },
  requiredScope: ServiceScope
): AuthContext {
  const requestId      = req.headers.get('x-request-id')      || `req-${Date.now()}`;
  const correlationId  = req.headers.get('x-correlation-id')  || `cor-${Date.now()}`;
  const idempotencyKey = req.headers.get('x-idempotency-key') || null;
  const serviceId      = req.headers.get('x-service-id')      || 'unknown';
  const environment    = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';

  const base: Omit<AuthContext, 'ok' | 'state' | 'error' | 'http_status'> = {
    service_id: serviceId, environment,
    request_id: requestId, correlation_id: correlationId,
    idempotency_key: idempotencyKey, scope: requiredScope,
  };

  // 1. Server secret must exist — fail closed
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ...base, ok: false, state: 'BLOCKED', http_status: 503, error: 'Server not configured: CRON_SECRET absent' };
  }

  // 2. Bearer token — ONLY from Authorization header, never raw value, never query string
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ...base, ok: false, state: 'UNAUTHORIZED', http_status: 401, error: 'Authorization header missing or not Bearer scheme' };
  }
  const token = authHeader.slice(7); // strip 'Bearer '
  if (token !== secret) {
    return { ...base, ok: false, state: 'UNAUTHORIZED', http_status: 401, error: 'Bearer token invalid' };
  }

  // 3. Request timestamp expiry (optional — if provided, must be within 5 min)
  const ts = req.headers.get('x-request-timestamp');
  if (ts) {
    const age = Date.now() - Number.parseInt(ts, 10);
    if (Number.isNaN(age) || age > 5 * 60 * 1000 || age < 0) {
      return { ...base, ok: false, state: 'EXPIRED', http_status: 401, error: 'Request timestamp expired or invalid' };
    }
  }

  // 4. Environment binding — if x-target-env header is present, must match
  const targetEnv = req.headers.get('x-target-env');
  if (targetEnv && targetEnv !== environment) {
    return { ...base, ok: false, state: 'FORBIDDEN', http_status: 403, error: `Environment mismatch: caller targets ${targetEnv}, server is ${environment}` };
  }

  // Authorized
  return { ...base, ok: true, state: 'AUTHORIZED', http_status: 200 };
}

export function makeUnauthorizedResponse(ctx: AuthContext): Response {
  // Never include secret or token in response
  return new Response(JSON.stringify({
    ok: false, state: ctx.state, error: ctx.error,
    request_id: ctx.request_id, scope: ctx.scope,
  }), { status: ctx.http_status, headers: { 'Content-Type': 'application/json' } });
}
