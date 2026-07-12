import { defineConfig, devices } from '@playwright/test';

/**
 * WP-3: Preview-only Playwright config.
 * PLAYWRIGHT_BASE_URL MUST be explicitly supplied — no production fallback.
 * Fails workflow if absent.
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL) {
  throw new Error(
    'PLAYWRIGHT_BASE_URL is required. ' +
    'Provide a Vercel preview URL or dedicated test URL. ' +
    'Production testing requires a separate approved smoke-test plan.'
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'playwright-junit.xml' }],
    ['list'],
  ],
  use: {
    headless: true,
    baseURL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], headless: true } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});

