import { defineConfig, devices } from '@playwright/test';

/**
 * Part 9: Real Playwright config
 * Headless by default for CI. Headful when PW_HEADED=1.
 * Does NOT require OpenAI key.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'playwright-junit.xml' }],
  ],
  use: {
    headless: process.env.PW_HEADED !== '1',
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://www.autobuilderos.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-headless',
      use: { ...devices['Desktop Chrome'], headless: true },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});

