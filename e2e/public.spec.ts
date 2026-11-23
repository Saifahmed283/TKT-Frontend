import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:4000'

/** Seed a real published future event with open registration through the admin API. */
async function seedPublicEvent(request: APIRequestContext, name: string): Promise<string> {
  const login = await request.post(`${API}/auth/login`, { data: { email: 'admin@tkt.local', password: 'Admin12345!' } })
  expect(login.ok()).toBeTruthy()
  const token = (await login.json()).data.token
  const headers = { Authorization: `Bearer ${token}` }
  const orgs = await request.get(`${API}/organizations`, { headers })
  const orgId = (await orgs.json()).data[0].id
  const startAt = new Date(Date.now() + 30 * 86_400_000).toISOString()
  const created = await request.post(`${API}/events`, { headers, data: { organizationId: orgId, name, startAt, venueName: 'E2E Venue' } })
  expect(created.ok()).toBeTruthy()
  const eventId = (await created.json()).data.id
  const patch = await request.patch(`${API}/events/${eventId}`, { headers, data: { settings: { registration: { enabled: true, open: true } } } })
  expect(patch.ok()).toBeTruthy()
  const type = await request.post(`${API}/events/${eventId}/tickets/types`, { headers, data: { name: 'General Admission', price: 0, quota: 100, isPublic: true } })
  expect(type.ok()).toBeTruthy()
  for (const status of ['READY', 'PUBLISHED']) {
    const res = await request.post(`${API}/events/${eventId}/status`, { headers, data: { status } })
    expect(res.ok()).toBeTruthy()
  }
  return eventId
}

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

  test('upcoming events feed lists published events with open reservations', async ({ page, request }) => {
    const name = `E2E Summit ${Date.now()}`
    await seedPublicEvent(request, name)
    await page.goto('/upcoming')
    await expect(page.getByText(/Moments worth|لحظات تستحق/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Reservations open|الحجز مفتوح/i).first()).toBeVisible()
  })

  test('reserve flow confirms a seat with a code', async ({ page, request }) => {
    const name = `E2E Film Nights ${Date.now()}`
    await seedPublicEvent(request, name)
    const email = `e2e.tester+${Date.now()}@example.com`
    await page.goto('/upcoming')
    await page.getByText(name).first().waitFor({ timeout: 15_000 })
    const card = page.locator('article', { hasText: name })
    await card.getByRole('button', { name: /Reserve/i }).click()
    await page.getByLabel(/Full name/i).fill('E2E Tester')
    await page.getByLabel(/Email/i).fill(email)
    await page.getByLabel(/Phone/i).fill('+20 100 000 0000')
    await page.getByRole('button', { name: /Confirm reservation/i }).click()
    await expect(page.getByText(/Reservation confirmed|Reservation pending|Ticket ready/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Reservation code/i).first()).toBeVisible()
  })

  test('past works page shows completed and archived events', async ({ page }) => {
    await page.goto('/past')
    await expect(page.getByText(/Nights we’ve|ليالٍ/i).first()).toBeVisible()
    await expect(page.getByText('Startup Expo 2025')).toBeVisible()
    await expect(page.getByText('Alexandria Marathon 2025')).toBeVisible()
    await expect(page.getByText(/Completed|مكتمل/i).first()).toBeVisible()
  })

  test('contact form submits and confirms', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.getByText(/From zero|من الفكرة/i).first()).toBeVisible()
    await page.getByLabel(/Your name|الاسم الكامل/i).fill('E2E Organizer')
    await page.getByLabel(/^Email|البريد الإلكتروني/i).fill('org@example.com')
    await page.getByLabel(/The brief|رسالتك/i).fill('We want to run a 5,000-person conference with full gate operations and credentials.')
    await page.getByRole('button', { name: /Send message|إرسال الرسالة/i }).click()
    await expect(page.getByText(/Message sent|تم إرسال الرسالة|Message logged/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('about page shows mission and values', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText(/We run the night|ندير الليلة/i).first()).toBeVisible()
    await expect(page.getByText(/Field Reports|آراء من الميدان/i).first()).toBeVisible()
    await expect(page.getByText(/Trusted by the teams|موثوق من الفرق/i).first()).toBeVisible()
  })

  test('landing directs users to upcoming events', async ({ page }) => {
    await page.goto('/')
    const intro = page.getByRole('dialog', { name: /TKT Brand Introduction/i })
    if (await intro.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /Enter Experience|دخول/i }).click()
    }
    await expect(page.getByRole('link', { name: /Explore Events|استكشف الفعاليات/i }).first()).toBeVisible()
    await expect(page.getByText(/Every Entrance|كل دخول/i).first()).toBeVisible()
  })
})
