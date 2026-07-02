import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  retries: 1,
  reporter: [['html'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } }
  ]
})
