import { test, expect, type Page } from '@playwright/test'
import { loginAsAdmin } from './auth'

async function expectHealthy(page: Page) {
  await expect(page.locator('body')).not.toContainText(
    /Could not load|Something went wrong|Access denied|404/i,
    { timeout: 15_000 },
  )
}

test.describe('TKT E2E — dashboard smoke', () => {
  test('admin can open core app pages and event modules', async ({ page }) => {
    await loginAsAdmin(page)

    const core = ['/app', '/app/events', '/app/organizations', '/app/profile']
    for (const path of core) {
      await page.goto(path)
      await expectHealthy(page)
    }

    await page.goto('/app/events')
    await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
    await expect(page).toHaveURL(/\/app\/events\//)
    const eventId = page.url().match(/\/app\/events\/([^/]+)/)?.[1]
    expect(eventId).toBeTruthy()

    const modules = [
      '',
      '/reservations',
      '/attendees',
      '/tickets',
      '/payments',
      '/credentials',
      '/access-codes',
      '/access',
      '/devices',
      '/tasks',
      '/incidents',
      '/comms',
      '/staff',
      '/workforce',
      '/teams',
      '/areas',
      '/integrations',
      '/audit',
      '/reports',
    ]
    for (const mod of modules) {
      await page.goto(`/app/events/${eventId}${mod}`)
      await expectHealthy(page)
      await expect(page.locator('main, [role="main"], .pb-16, .animate-fade-in').first()).toBeVisible({
        timeout: 15_000,
      })
    }
  })
})
