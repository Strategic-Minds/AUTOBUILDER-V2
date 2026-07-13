import { describe, it, expect } from 'vitest';
import { authorizeInternalRequest, SERVICE_SCOPES } from '@/lib/internal-auth';

describe('internal-auth', () => {
  it('should authorize valid requests with correct scope', () => {
    // Setup environment
    process.env.CRON_SECRET = 'valid-token';
    process.env.VERCEL_ENV = 'production';

    const mockReq = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          if (k === 'authorization') {
            return 'Bearer valid-token';
          }
          if (k === 'x-service-id') {
            return 'test-service';
          }
          return null;
        },
      },
    } as any;
    
    const result = authorizeInternalRequest(mockReq, 'jobs:repair');
    expect(result.ok).toBe(true);
    expect(result.state).toBe('AUTHORIZED');
    expect(result.http_status).toBe(200);
    expect(result.service_id).toBe('test-service');
    expect(result.scope).toBe('jobs:repair');
  });
  
  it('should reject requests without auth header', () => {
    process.env.CRON_SECRET = 'valid-token';

    const mockReq = {
      headers: {
        get: () => null,
      },
    } as any;
    
    const result = authorizeInternalRequest(mockReq, 'jobs:repair');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('UNAUTHORIZED');
    expect(result.http_status).toBe(401);
    expect(result.error).toContain('Authorization header missing');
  });

  it('should reject requests when CRON_SECRET is absent (fail-closed)', () => {
    delete process.env.CRON_SECRET;

    const mockReq = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          if (k === 'authorization') {
            return 'Bearer valid-token';
          }
          return null;
        },
      },
    } as any;

    const result = authorizeInternalRequest(mockReq, 'jobs:repair');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('BLOCKED');
    expect(result.http_status).toBe(503);
    expect(result.error).toContain('CRON_SECRET absent');
  });

  it('should reject invalid bearer token', () => {
    process.env.CRON_SECRET = 'valid-token';

    const mockReq = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          if (k === 'authorization') {
            return 'Bearer wrong-token';
          }
          return null;
        },
      },
    } as any;

    const result = authorizeInternalRequest(mockReq, 'jobs:repair');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('UNAUTHORIZED');
    expect(result.http_status).toBe(401);
    expect(result.error).toContain('token invalid');
  });

  it('should reject expired request timestamp', () => {
    process.env.CRON_SECRET = 'valid-token';

    const mockReq = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          if (k === 'authorization') {
            return 'Bearer valid-token';
          }
          if (k === 'x-request-timestamp') {
            // Expired timestamp (e.g. 10 minutes ago)
            return String(Date.now() - 10 * 60 * 1000);
          }
          return null;
        },
      },
    } as any;

    const result = authorizeInternalRequest(mockReq, 'jobs:repair');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('EXPIRED');
    expect(result.http_status).toBe(401);
    expect(result.error).toContain('timestamp expired');
  });

  it('should reject target environment mismatch', () => {
    process.env.CRON_SECRET = 'valid-token';
    process.env.VERCEL_ENV = 'production';

    const mockReq = {
      headers: {
        get: (key: string) => {
          const k = key.toLowerCase();
          if (k === 'authorization') {
            return 'Bearer valid-token';
          }
          if (k === 'x-target-env') {
            return 'staging';
          }
          return null;
        },
      },
    } as any;

    const result = authorizeInternalRequest(mockReq, 'jobs:repair');
    expect(result.ok).toBe(false);
    expect(result.state).toBe('FORBIDDEN');
    expect(result.http_status).toBe(403);
    expect(result.error).toContain('Environment mismatch');
  });
});
