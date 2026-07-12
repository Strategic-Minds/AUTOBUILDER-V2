import { test, expect } from '@playwright/test'

test('dashboard loads and exposes command center', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Enterprise Agent Command Dashboard')).toBeVisible()
  await expect(page.getByText('AI Gateway Chat UI')).toBeVisible()
  await expect(page.getByText('Scoreboard')).toBeVisible()
})
