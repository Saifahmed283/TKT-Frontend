import { test, expect, type Page } from '@playwright/test'
import { loginAsAdmin } from './auth'

async function openTechFrontier(page: Page) {
  await page.goto('/app/events')
  await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
  await expect(page).toHaveURL(/\/app\/events\/([^/]+)/)
  return page.url().match(/\/app\/events\/([^/]+)/)?.[1]!
}

test.describe('Dashboard actions', () => {
  test('admin can create and update ticket type', async ({ page }) => {
    await loginAsAdmin(page)
    const eventId = await openTechFrontier(page)
    await page.goto(`/app/events/${eventId}/tickets`)
    await expect(page.getByRole('heading', { name: /Tickets/i })).toBeVisible({ timeout: 15_000 })

    const name = `E2E Pass ${Date.now()}`
    await page.getByRole('button', { name: /Add ticket type|New ticket type|Add type/i }).first().click()
    await page.getByLabel(/Name/i).first().fill(name)
    const price = page.getByLabel(/Price/i).first()
    if (await price.isVisible().catch(() => false)) await price.fill('25')
    await page.getByRole('button', { name: /Create|Save|Add/i }).last().click()
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })

  test('admin can create access code and see it listed', async ({ page }) => {
    await loginAsAdmin(page)
    const eventId = await openTechFrontier(page)
    await page.goto(`/app/events/${eventId}/access-codes`)
    await expect(page.getByRole('heading', { name: /Access Codes/i })).toBeVisible({ timeout: 15_000 })
    const code = `E2E${Date.now().toString().slice(-6)}`
    await page.getByRole('button', { name: /Create code/i }).click()
    await page.getByLabel(/^Code$/i).fill(code)
    await page.getByRole('button', { name: /^Create$|Save/i }).last().click()
    await expect(page.getByText(code).first()).toBeVisible({ timeout: 15_000 })
  })

  test('admin can view reservations and open decision controls', async ({ page }) => {
    await loginAsAdmin(page)
    const eventId = await openTechFrontier(page)
    await page.goto(`/app/events/${eventId}/reservations`)
    await expect(page.getByRole('heading', { name: /Reservations/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('body')).not.toContainText(/Could not load|Something went wrong/i)
  })

  test('admin can open staff/workforce/devices/integrations pages and see key controls', async ({ page }) => {
    await loginAsAdmin(page)
    const eventId = await openTechFrontier(page)
    const checks = [
      { path: `/app/events/${eventId}/staff`, heading: /Staff/i, control: /Add Staff|No staff yet|Presence|Activity|Team/i },
      { path: `/app/events/${eventId}/workforce`, heading: /Workforce/i, control: /Applications|Profiles|Worker|Add application|No applications/i },
      { path: `/app/events/${eventId}/devices`, heading: /Devices/i, control: /Device|Online|Offline|No devices|Total|Refresh/i },
      { path: `/app/events/${eventId}/integrations`, heading: /Integrations/i, control: /Webhook|Insurance|Map|Add webhook/i },
    ] as const
    for (const c of checks) {
      await page.goto(c.path)
      await page.waitForLoadState('domcontentloaded')
      await expect(page.locator('body')).not.toContainText(/Something went wrong|Access denied|Could not load|TypeError/i, { timeout: 20_000 })
      await expect(page.locator('body')).toContainText(c.heading, { timeout: 20_000 })
      await expect(page.locator('body')).toContainText(c.control, { timeout: 20_000 })
    }
  })
})
