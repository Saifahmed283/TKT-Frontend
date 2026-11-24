import { test, expect } from '@playwright/test'
import { getAdminEmail, loginAsAdmin, loginAsStaff } from './auth'

test.describe('TKT E2E — user journeys', () => {
  test('profile page loads and logout works', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/app/profile')
    await expect(page.getByText(getAdminEmail(), { exact: false }).first()).toBeVisible({ timeout: 15_000 })
    await Promise.all([
      page.waitForURL(/\/login/, { timeout: 15_000 }),
      page.getByRole('button', { name: /Sign out/i }).click(),
    ])
  })

  test('scanner role can access scanner page', async ({ page }) => {
    await loginAsStaff(page)
    await page.goto('/app/scanner')
    await expect(page.locator('body')).not.toContainText(/Could not load|Access denied/i)
    await expect(page.locator('select').first()).toBeVisible({ timeout: 15_000 })
  })
})
