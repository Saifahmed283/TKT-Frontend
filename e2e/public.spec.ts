import { test, expect } from '@playwright/test'

test.describe('TKT E2E — public site', () => {
  test('public nav links to key sections', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await nav.getByRole('link', { name: /Upcoming events/i }).first().click()
    await expect(page).toHaveURL(/\/upcoming/)
    await page.getByRole('navigation').getByRole('link', { name: /Past works/i }).click()
    await expect(page).toHaveURL(/\/past/)
    await page.getByRole('navigation').getByRole('link', { name: /Contact/i }).click()
    await expect(page).toHaveURL(/\/contact/)
    await page.getByRole('navigation').getByRole('link', { name: /About/i }).click()
    await expect(page).toHaveURL(/\/about/)
    await page.getByRole('link', { name: 'TKT home' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('upcoming events feed lists published events with open reservations', async ({ page }) => {
    await page.goto('/upcoming')
    await expect(page.getByRole('heading', { name: /Upcoming/i }).first()).toBeVisible()
    await expect(page.getByText('Egypt Tech Summit 2026')).toBeVisible()
    await expect(page.getByText('Cairo Sound Festival 2026')).toBeVisible()
    await expect(page.getByText(/Reservations open/i).first()).toBeVisible()
  })

  test('reserve flow confirms a seat with a code', async ({ page }) => {
    await page.goto('/upcoming')
    await page.getByText('Nile Valley Film Nights').first().waitFor()
    const card = page.locator('article', { hasText: 'Nile Valley Film Nights' })
    await card.getByRole('button', { name: /Reserve/i }).click()
    await page.getByLabel(/Full name/i).fill('E2E Tester')
    await page.getByLabel(/Email/i).fill('e2e.tester@example.com')
    await page.getByLabel(/Phone/i).fill('+20 100 000 0000')
    await page.getByRole('button', { name: /Confirm reservation/i }).click()
    await expect(page.getByText(/Reservation confirmed|Reservation pending/i)).toBeVisible()
    await expect(page.getByText(/Reservation code/i)).toBeVisible()
  })

  test('past works page shows completed and archived events', async ({ page }) => {
    await page.goto('/past')
    await expect(page.getByRole('heading', { name: /Past/i }).first()).toBeVisible()
    await expect(page.getByText('Startup Expo 2025')).toBeVisible()
    await expect(page.getByText('Alexandria Marathon 2025')).toBeVisible()
    await expect(page.getByText(/Completed/i).first()).toBeVisible()
  })

  test('contact form submits and confirms', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByRole('heading', { name: /plan/i }).first()).toBeVisible()
    await page.getByLabel(/Full name/i).fill('E2E Organizer')
    await page.getByLabel(/Email/i).fill('org@example.com')
    await page.getByLabel(/Message/i).fill('We want to run a 5,000-person conference with full gate operations and credentials.')
    await page.getByRole('button', { name: /Send message/i }).click()
    await expect(page.getByText(/Message sent/i)).toBeVisible({ timeout: 15_000 })
  })

  test('about page shows mission and values', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByRole('heading', { name: /event entry|About/i }).first()).toBeVisible()
    await expect(page.getByText(/Our mission/i)).toBeVisible()
    await expect(page.getByText(/Why TKT/i)).toBeVisible()
  })

  test('landing directs users to upcoming events', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Browse upcoming events/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Upcoming events/i }).first()).toBeVisible()
  })
})
