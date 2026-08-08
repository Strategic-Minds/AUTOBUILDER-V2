import { describe, it, expect } from '@jest/globals';
import { canonicalHash } from '../pipeline/idempotency';
import { Errors } from '../pipeline/errors';
import { evaluatePolicy } from '../policy/engine';

describe('canonicalHash', () => {
  it('is deterministic', () => {
    expect(canonicalHash({ b: 2, a: 1 })).toBe(canonicalHash({ a: 1, b: 2 }));
  });
  it('produces a 64-char hex string', () => {
    expect(canonicalHash('test')).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('PipelineErrors', () => {
  it('ambiguousWorkbook is not retryable', () => {
    const e = Errors.ambiguousWorkbook({ missingSheets: ['X'] });
    expect(e.retryable).toBe(false);
    expect(e.code).toBe('AMBIGUOUS_WORKBOOK');
  });
  it('providerTransient is retryable', () => {
    const e = Errors.providerTransient('github', {});
    expect(e.retryable).toBe(true);
  });
});

describe('evaluatePolicy', () => {
  it('denies production when productionEnabled=false', () => {
    const r = evaluatePolicy({ action: 'deploy_production', environment: 'production', approvedActions: ['deploy_production'], actorRoles: ['operator'], productionEnabled: false });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe('PRODUCTION_DISABLED');
  });
  it('denies protected action without approval', () => {
    const r = evaluatePolicy({ action: 'create_repository', environment: 'preview', approvedActions: [], actorRoles: ['operator'], productionEnabled: true });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe('APPROVAL_REQUIRED');
  });
  it('allows approved protected action', () => {
    const r = evaluatePolicy({ action: 'create_repository', environment: 'preview', approvedActions: ['create_repository'], actorRoles: ['operator'], productionEnabled: true });
    expect(r.allow).toBe(true);
  });
});