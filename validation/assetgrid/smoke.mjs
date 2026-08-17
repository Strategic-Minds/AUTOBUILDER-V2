import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const cases = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
]

const browser = await chromium.launch({ headless: true })
fs.mkdirSync('/tmp/assetgrid-smoke-artifacts', { recursive: true })

for (const device of cases) {
  const context = await browser.newContext({ viewport: { width: device.width, height: device.height } })
  const page = await context.newPage()

  await page.route('**/api/**', async route => {
    const url = route.request().url()
    if (url.includes('public-settings')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: '6a828314b20a50cdd61fb765', public_settings: {} }),
      })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await page.getByText('Find the right asset. License it clearly. Keep building.').waitFor({ state: 'visible' })
  await page.getByRole('link', { name: 'AssetGrid home' }).waitFor({ state: 'visible' })
  await page.screenshot({ path: path.join('/tmp/assetgrid-smoke-artifacts', `${device.name}-home.png`), fullPage: true })

  await page.goto('http://127.0.0.1:4173/browse?category=graphics&sort=price&q=grid', { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Browse AssetGrid' }).waitFor({ state: 'visible' })
  const category = page.getByRole('button', { name: 'graphics' })
  await category.waitFor({ state: 'visible' })
  if ((await category.getAttribute('aria-pressed')) !== 'true') {
    throw new Error(`${device.name}: graphics category did not retain aria-pressed=true`)
  }
  const search = page.getByRole('textbox', { name: 'Search marketplace items' })
  if ((await search.inputValue()) !== 'grid') {
    throw new Error(`${device.name}: query parameter was not restored into search input`)
  }
  const url = page.url()
  for (const expected of ['category=graphics', 'sort=price', 'q=grid']) {
    if (!url.includes(expected)) throw new Error(`${device.name}: missing persisted URL state ${expected}`)
  }
  await page.screenshot({ path: path.join('/tmp/assetgrid-smoke-artifacts', `${device.name}-browse.png`), fullPage: true })
  await context.close()
}

await browser.close()
console.log('ASSETGRID_RESPONSIVE_SMOKE_PASS desktop tablet mobile')
