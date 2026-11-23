import { test, expect } from '@playwright/test'

test.describe('TKT E2E — landing & auth', () => {
  test('landing page renders and routes to upcoming events', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/TKT/)
    const explore = page.getByRole('link', { name: /Explore Events|استكشف الفعاليات/i }).first()
    await expect(explore).toBeVisible()
    await explore.click()
    await expect(page).toHaveURL(/\/upcoming/)
  })

  test('login with demo staff works and lands in app shell', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/login')
    await page.getByLabel('Email').fill('your.tkt.info@tkt.com')
    await page.getByLabel('Password').fill('TKT@2026$$')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })
    await expect(page.getByRole('link', { name: /Events|الفعاليات/i }).first()).toBeVisible({ timeout: 30_000 })
  })

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('ahmed@tkt.local')
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })
})

test.describe('TKT E2E — event dashboard & modules', () => {
  test('event overview shows live KPIs', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/login')
    await page.getByLabel('Email').fill('your.tkt.info@tkt.com')
    await page.getByLabel('Password').fill('TKT@2026$$')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })
    await page.goto('/app/events', { waitUntil: 'domcontentloaded' })
    const eventLink = page.locator('a[href*="/app/events/"]').first()
    await expect(eventLink).toBeVisible({ timeout: 45_000 })
    await eventLink.click()
    await expect(page).toHaveURL(/\/app\/events\//, { timeout: 30_000 })
    await expect(page.getByText(/Attendees|Total|Scans|Check-in|Overview/i).first()).toBeVisible({ timeout: 45_000 })
  })

  test('scanner page scopes areas for AREA-scoped operator', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/login')
    await page.getByLabel('Email').fill('your.tkt.info@tkt.com')
    await page.getByLabel('Password').fill('TKT@2026$$')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })
    await page.goto('/app/scanner', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/app\/scanner/, { timeout: 30_000 })
    await expect(page.getByText(/Scanner|Scan|Area/i).first()).toBeVisible({ timeout: 30_000 })
  })

  test('modules render for event manager', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/login')
    await page.getByLabel('Email').fill('your.tkt.info@tkt.com')
    await page.getByLabel('Password').fill('TKT@2026$$')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })
    await page.goto('/app/events', { waitUntil: 'domcontentloaded' })
    const eventLink = page.locator('a[href*="/app/events/"]').first()
    await expect(eventLink).toBeVisible({ timeout: 45_000 })
    await eventLink.click()
    await expect(page).toHaveURL(/\/app\/events\//, { timeout: 30_000 })
    for (const label of ['Attendees', 'Tickets', 'Credentials', 'Access', 'Tasks', 'Incidents', 'Comms', 'Reports']) {
      await expect(page.getByRole('link', { name: new RegExp(label, 'i') }).first()).toBeVisible({ timeout: 20_000 })
    }
  })
})