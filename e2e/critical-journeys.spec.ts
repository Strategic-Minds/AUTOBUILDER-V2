import { test, expect } from '@playwright/test'

/**
 * Preview-only browser acceptance tests.
 * Evidence: desktop, tablet, mobile, PWA assets, API contracts,
 * unauthenticated security boundaries, console output and network failures.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL as string

function collectBrowserEvidence(page: import('@playwright/test').Page) {
  const consoleErrors: string[] = []
  const networkFailures: string[] = []
  const serverErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => networkFailures.push(request.url()))
  page.on('response', (response) => {
    if (response.status() >= 500 && response.url().startsWith(BASE)) {
      serverErrors.push(`${response.status()} ${response.url()}`)
    }
  })

  return { consoleErrors, networkFailures, serverErrors }
}

test.describe('Critical Journeys — Preview', () => {
  test('T001: Homepage loads and returns 200', async ({ page }) => {
    const evidence = collectBrowserEvidence(page)
    const response = await page.goto(BASE, { waitUntil: 'domcontentloaded' })

    expect(response?.status()).toBeLessThan(400)
    expect(await page.title()).not.toBe('')
    expect(evidence.serverErrors).toEqual([])

    await page.screenshot({ path: 'screenshots/homepage-desktop.png', fullPage: true })
    console.log('Console errors:', evidence.consoleErrors)
    console.log('Network failures:', evidence.networkFailures)
  })

  test('T002: MCP endpoint responds', async ({ request }) => {
    const response = await request.get(`${BASE}/api/mcp-minimal/mcp`)
    expect(response.status()).toBeLessThan(500)
  })

  test('T003: Validation API returns its active CI contract', async ({ request }) => {
    const response = await request.get(`${BASE}/api/validation`)
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toMatchObject({
      ok: true,
      validation_system: 'active',
      status: 'CI_REQUIRED',
    })
    expect(typeof data.timestamp).toBe('string')
  })

  test('T004: Auto-fix rejects unauthenticated requests', async ({ request }) => {
    const response = await request.post(`${BASE}/api/adapters/auto-fix`, { data: {} })
    expect(response.status()).toBe(401)
  })

  test('T005: Auto-heal rejects unauthenticated requests', async ({ request }) => {
    const response = await request.post(`${BASE}/api/adapters/auto-heal`, { data: {} })
    expect(response.status()).toBe(401)
  })

  test('T006: Quarantine rejects unauthenticated GET', async ({ request }) => {
    const response = await request.get(`${BASE}/api/adapters/quarantine`)
    expect(response.status()).toBe(401)
  })

  test('T007: Homepage has no same-origin server failures', async ({ page }) => {
    const evidence = collectBrowserEvidence(page)
    await page.goto(BASE, { waitUntil: 'networkidle' })
    expect(evidence.serverErrors).toEqual([])
  })

  test('T008: Tablet viewport renders without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const response = await page.goto(`${BASE}/factory`, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
    await page.screenshot({ path: 'screenshots/factory-tablet.png', fullPage: true })
  })

  test('T009: Mobile viewport renders without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const response = await page.goto(`${BASE}/factory`, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
    await page.screenshot({ path: 'screenshots/factory-mobile.png', fullPage: true })
  })

  test('T010: Factory operator surface loads', async ({ page }) => {
    const response = await page.goto(`${BASE}/factory`, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)
    await expect(page.getByRole('heading', { name: /finished system/i })).toBeVisible()
    await page.screenshot({ path: 'screenshots/factory-desktop.png', fullPage: true })
  })

  test('T011: PWA manifest and service worker are deployable', async ({ request }) => {
    const manifestResponse = await request.get(`${BASE}/manifest.webmanifest`)
    expect(manifestResponse.status()).toBe(200)
    const manifest = await manifestResponse.json()
    expect(manifest.name).toBe('Xtreme AI Builder')
    expect(manifest.start_url).toBe('/factory')
    expect(manifest.display).toBe('standalone')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)

    const workerResponse = await request.get(`${BASE}/sw.js`)
    expect(workerResponse.status()).toBe(200)
    expect(await workerResponse.text()).toContain("const CACHE_NAME = 'xab-v2'")
  })

  test('T012: Factory APIs remain authenticated', async ({ request }) => {
    const projects = await request.get(`${BASE}/api/factory/projects`)
    expect(projects.status()).toBe(401)

    const worker = await request.get(`${BASE}/api/cron/factory`)
    expect(worker.status()).toBe(401)
  })
})

test.describe('Authenticated API Contract', () => {
  test('T013: Heartbeat returns a governed response when a test secret exists', async ({ request }) => {
    const secret = process.env.CRON_SECRET || ''
    test.skip(!secret, 'PLAYWRIGHT_TEST_SECRET is not configured for this preview run')

    const response = await request.get(`${BASE}/api/cron/auto-builder`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    expect([200, 503]).toContain(response.status())

    const data = await response.json()
    expect(typeof data.state).toBe('string')
  })
})
