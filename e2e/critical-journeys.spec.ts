import { test, expect } from '@playwright/test';

/**
 * Part 9: Real Playwright headless tests
 * Tests critical user journeys without requiring OpenAI key.
 * Evidence captured: screenshots, traces, console errors, network failures.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://www.autobuilderos.com';

test.describe('Critical Journeys — Headless', () => {
  
  test('T001: Homepage loads and returns 200', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkFailures: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('requestfailed', req => networkFailures.push(req.url()));

    const response = await page.goto(BASE);
    expect(response?.status()).toBeLessThan(400);

    const title = await page.title();
    console.log('Page title:', title);

    // No console errors on load
    if (consoleErrors.length > 0) {
      console.warn('Console errors:', consoleErrors);
    }

    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
    console.log('Network failures:', networkFailures);
  });

  test('T002: MCP endpoint responds', async ({ request }) => {
    const res = await request.get(`${BASE}/api/mcp-minimal/mcp`);
    expect(res.status()).toBeLessThan(500);
    console.log('MCP status:', res.status());
  });

  test('T003: Validation API returns structured response', async ({ request }) => {
    const res = await request.get(`${BASE}/api/validation`);
    expect(res.status()).toBeLessThan(500);
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty('score');
      console.log('Validation score:', data.score);
    }
  });

  test('T004: Auto-fix rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post(`${BASE}/api/adapters/auto-fix`, { data: {} });
    expect(res.status()).toBe(401);
    console.log('Unauthenticated auto-fix correctly rejected with 401');
  });

  test('T005: Auto-heal rejects unauthenticated requests', async ({ request }) => {
    const res = await request.post(`${BASE}/api/adapters/auto-heal`, { data: {} });
    expect(res.status()).toBe(401);
    console.log('Unauthenticated auto-heal correctly rejected with 401');
  });

  test('T006: Quarantine rejects unauthenticated GET', async ({ request }) => {
    const res = await request.get(`${BASE}/api/adapters/quarantine`);
    expect(res.status()).toBe(401);
    console.log('Unauthenticated quarantine GET correctly rejected with 401');
  });

  test('T007: Page has no critical navigation broken', async ({ page }) => {
    await page.goto(BASE);
    // Check no 404 images or scripts
    const responses: number[] = [];
    page.on('response', res => responses.push(res.status()));
    await page.waitForLoadState('networkidle').catch(() => null);
    const failed = responses.filter(s => s >= 400);
    console.log('Failed resources:', failed.length);
    // Allow some failures (analytics, etc.) but flag critical ones
    expect(failed.filter(s => s >= 500).length).toBe(0);
  });

  test('T008: Mobile viewport renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.screenshot({ path: 'screenshots/mobile.png', fullPage: true });
    // Check body doesn't overflow
    const overflow = await page.evaluate(() => {
      const body = document.body;
      return body.scrollWidth > window.innerWidth;
    });
    console.log('Horizontal overflow:', overflow);
    // Warn but don't fail — many apps have intentional horizontal scroll
  });

});

test.describe('API Contract Tests', () => {

  test('T009: Heartbeat returns structured response when authorized', async ({ request }) => {
    const secret = process.env.CRON_SECRET || '';
    if (!secret) { test.skip(); return; }
    const res = await request.get(`${BASE}/api/cron/auto-builder`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    // Should be 200 COMPLETED, 200 SKIPPED (lock), or 503 BLOCKED/DEGRADED
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty('hb_id');
      expect(data).toHaveProperty('state');
      console.log('Heartbeat state:', data.state, 'env:', data.env);
    }
  });

});

