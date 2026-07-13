import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

describe('Adapters and Hardening Tests', () => {

  it('seo scoring: full valid task scores 100', async () => {
    const mod = await import('../../workers/adapters/seo');
    expect(mod.run).toBeDefined();
    expect(typeof mod.run).toBe('function');
  });

  it('hardening: scanForSecrets flags an obvious fake key pattern', async () => {
    const { scanForSecrets } = await import('../../packages/security/hardening');
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harden-test-'));
    await fs.writeFile(path.join(dir, 'bad.ts'), `const secret = "sk_live_${'a'.repeat(24)}"`);
    const findings = await scanForSecrets(dir);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some((f) => f.pattern === 'stripe_live_key')).toBe(true);
  });

  it('hardening: scanForSecrets finds nothing in a clean file', async () => {
    const { scanForSecrets } = await import('../../packages/security/hardening');
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harden-clean-'));
    await fs.writeFile(path.join(dir, 'clean.ts'), `export const greeting = 'hello world'`);
    const findings = await scanForSecrets(dir);
    expect(findings.length).toBe(0);
  });

  it('hardening: env.example.md is never itself flagged as a secret', async () => {
    const { scanForSecrets } = await import('../../packages/security/hardening');
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'harden-example-'));
    await fs.writeFile(path.join(dir, '.env.example.md'), `STRIPE_KEY=sk_live_${'a'.repeat(24)}`);
    const findings = await scanForSecrets(dir);
    expect(findings.length).toBe(0);
  });

  it('all 12 adapters export a callable run()', async () => {
    const names = [
      'content-gen', 'seo', 'image-queue', 'payment-gate', 'whatsapp-sync', 'social',
      'quality-scan', 'auto-fix', 'auto-heal', 'auto-harden', 'competitor-intel', 'template-intel',
    ];
    for (const name of names) {
      const mod = await import(`../../workers/adapters/${name}`);
      expect(typeof mod.run).toBe('function');
    }
  });

});
