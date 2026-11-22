import { test, expect } from '@playwright/test'

test.describe('TKT E2E — landing & auth', () => {
  test('landing page renders and routes to upcoming events', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/TKT/)
    await expect(page.getByRole('link', { name: /Browse upcoming events/i }).first()).toBeVisible()
    await page.getByRole('link', { name: /Browse upcoming events/i }).first().click()
    await expect(page).toHaveURL(/\/upcoming/)
  })

  test('login with demo staff works and lands in app shell', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('ahmed@tkt.local')
    await page.getByLabel('Password').fill('Staff12345!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
    await expect(page.getByText('Ahmed Hassan')).toBeVisible()
    await expect(page.getByText('Tech Frontier 2026').first()).toBeVisible({ timeout: 20_000 })
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
    await page.goto('/login')
    await page.getByLabel('Email').fill('ahmed@tkt.local')
    await page.getByLabel('Password').fill('Staff12345!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/)
    await page.getByText('Tech Frontier 2026').first().click()
    await expect(page).toHaveURL(/\/app\/events\//)
    await expect(page.getByText('Attendees')).toBeVisible()
    await expect(page.getByText('Check-in rate')).toBeVisible()
    await expect(page.getByText(/10|9|8|7/).first()).toBeVisible()
  })

  test('scanner page scopes areas for AREA-scoped operator', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('mohamed@tkt.local')
    await page.getByLabel('Password').fill('Staff12345!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/app/)
    await page.getByRole('link', { name: 'Scanner' }).click()
    await expect(page).toHaveURL(/\/app\/scanner/)
    const areaSelect = page.locator('select').nth(1)
    await expect(areaSelect).toBeEnabled()
    await expect(areaSelect.locator('option')).toHaveText(['Select gate area…', 'Main Gate'], { timeout: 10_000 })
  })

  test('modules render for event manager', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('ahmed@tkt.local')
    await page.getByLabel('Password').fill('Staff12345!')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.getByText('Tech Frontier 2026').first().click()
    await expect(page).toHaveURL(/\/app\/events\//)
    for (const label of ['Attendees', 'Tickets', 'Credentials', 'Access log', 'Tasks', 'Incidents', 'Comms', 'Reports']) {
      await expect(page.getByRole('link', { name: new RegExp(label) }).first()).toBeVisible()
    }
  })
})