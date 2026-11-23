import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 })
}

test.describe('TKT E2E — user journeys', () => {
  test('profile page loads and logout works', async ({ page }) => {
    await login(page, 'admin@tkt.local', 'Admin12345!')
    await page.goto('/app/profile')
    await expect(page.getByText(/admin@tkt.local/i).first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /Sign out/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('scanner role can access scanner page', async ({ page }) => {
    await login(page, 'mohamed@tkt.local', 'Staff12345!')
    await page.goto('/app/scanner')
    await expect(page.locator('body')).not.toContainText(/Could not load|Access denied/i)
    await expect(page.locator('select').first()).toBeVisible({ timeout: 15_000 })
  })
})
