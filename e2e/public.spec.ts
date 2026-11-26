import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { getAdminCredentials } from './auth'

const API = 'http://localhost:4000'

async function seedPublicEvent(request: APIRequestContext, name: string): Promise<string> {
  const credentials = getAdminCredentials()
  const login = await request.post(`${API}/auth/login`, { data: credentials })
  expect(login.ok()).toBeTruthy()
  const token = (await login.json()).data?.token ?? ''
  expect(token).toBeTruthy()
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

async function seedPaidTransportEvent(request: APIRequestContext, name: string) {
  const credentials = getAdminCredentials()
  const login = await request.post(`${API}/auth/login`, { data: credentials })
  expect(login.ok()).toBeTruthy()
  const token = (await login.json()).data?.token ?? ''
  expect(token).toBeTruthy()
  const headers = { Authorization: `Bearer ${token}` }
  const orgs = await request.get(`${API}/organizations`, { headers })
  const orgId = (await orgs.json()).data[0].id
  const created = await request.post(`${API}/events`, {
    headers,
    data: { organizationId: orgId, name, startAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), venueName: 'E2E Venue' },
  })
  expect(created.ok()).toBeTruthy()
  const eventId = (await created.json()).data.id
  const patch = await request.patch(`${API}/events/${eventId}`, { headers, data: { settings: { registration: { enabled: true, open: true } } } })
  expect(patch.ok()).toBeTruthy()
  const type = await request.post(`${API}/events/${eventId}/tickets/types`, {
    headers,
    data: { name: 'Conference + Bus', price: 100, quota: 100, isPublic: true, transportIncluded: true },
  })
  expect(type.ok()).toBeTruthy()
  const provider = await request.post(`${API}/events/${eventId}/payments/providers`, {
    headers,
    data: {
      name: 'Bank Transfer',
      accountName: 'TKT Events',
      accountNumber: '123456789',
      paymentPhone: '+20 100 000 0000',
      instructions: 'Transfer the total to the account, then upload the receipt and enter the transaction reference.',
      isActive: true,
    },
  })
  expect(provider.ok()).toBeTruthy()
  const busRes = await request.post(`${API}/events/${eventId}/buses`, {
    headers,
    data: { name: 'E2E Shuttle', layout: { template: 'grid', rows: 2, cols: 2 }, seatPrice: 20, currency: 'EGP' },
  })
  expect(busRes.ok()).toBeTruthy()
  for (const status of ['READY', 'PUBLISHED']) {
    const res = await request.post(`${API}/events/${eventId}/status`, { headers, data: { status } })
    expect(res.ok()).toBeTruthy()
  }
  return eventId
}

async function findUpcomingEvent(page: Page, name: string) {
  await page.getByRole('searchbox', { name: /Search events|ابحث في الفعاليات/i }).fill(name)
  const card = page.locator('article', { hasText: name }).first()
  await card.waitFor({ timeout: 20_000 })
  return card
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
    await expect(page.getByText(/Moments worth|لحظات تستحق|Upcoming/i).first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('searchbox', { name: /Search events|ابحث في الفعاليات/i }).fill(name)
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Reservations open|الحجز مفتوح|Reserve|احجز/i).first()).toBeVisible({ timeout: 20_000 })
  })

  test('free reserve wizard requires phone, review, then confirms with a code', async ({ page, request }) => {
    const name = `E2E Film Nights ${Date.now()}`
    await seedPublicEvent(request, name)
    const email = `e2e.tester+${Date.now()}@example.com`
    await page.goto('/upcoming')
    const card = await findUpcomingEvent(page, name)
    await card.getByRole('button', { name: /Reserve|احجز/i }).first().click()
    await expect(page.getByTestId('wizard-step-ticket')).toBeVisible()
    await page.getByTestId('ticket-option').first().click()
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-step-details')).toBeVisible()
    await page.getByLabel(/Full name|الاسم/i).fill('E2E Tester')
    await page.getByLabel(/Email|البريد/i).fill(email)
    await page.getByTestId('reservation-phone').fill('123')
    await expect(page.getByTestId('wizard-next')).toBeDisabled()
    await page.getByTestId('reservation-phone').fill('+20 100 000 0000')
    await page.getByTestId('reservation-notes').fill('Window seat if possible')
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-review')).toBeVisible()
    await expect(page.getByTestId('wizard-review')).toContainText('E2E Tester')
    await expect(page.getByTestId('wizard-review')).toContainText('+20 100 000 0000')
    await page.getByTestId('wizard-back').click()
    await expect(page.getByTestId('wizard-step-details')).toBeVisible()
    await expect(page.getByTestId('reservation-phone')).toHaveValue('+20 100 000 0000')
    await page.getByTestId('wizard-next').click()
    await page.getByTestId('wizard-submit').click()
    await expect(page.getByText(/Reservation confirmed|Reservation pending|Ticket ready|تم تأكيد|قيد المراجعة/i).first()).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText(/Reservation code|رمز الحجز|TKT-/i).first()).toBeVisible({ timeout: 25_000 })
  })

  test('transport reserve wizard requires one seat and payment details', async ({ page, request }) => {
    const name = `E2E Transport Summit ${Date.now()}`
    await seedPaidTransportEvent(request, name)
    const email = `e2e.transport+${Date.now()}@example.com`
    await page.goto('/upcoming')
    const card = await findUpcomingEvent(page, name)
    await card.getByRole('button', { name: /Reserve|احجز/i }).first().click()
    await expect(page.getByTestId('wizard-step-ticket')).toBeVisible()
    await page.getByTestId('ticket-option').filter({ hasText: 'Conference + Bus' }).click()
    await page.getByTestId('wizard-next').click()
    await page.getByLabel(/Full name|الاسم/i).fill('E2E Transit')
    await page.getByLabel(/Email|البريد/i).fill(email)
    await page.getByTestId('reservation-phone').fill('+20 100 000 0001')
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-step-seats')).toBeVisible()
    await expect(page.getByTestId('wizard-next')).toBeDisabled()
    const seats = page.getByTestId('seat-option')
    await seats.nth(0).click()
    await seats.nth(1).click()
    await expect(page.getByTestId('wizard-next')).toBeDisabled()
    await seats.nth(0).click()
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-step-payment')).toBeVisible()
    await expect(page.getByTestId('payment-instructions')).toContainText('Transfer the total to the account')
    await expect(page.getByTestId('wizard-next')).toBeDisabled()
    await page.getByTestId('payment-reference').fill('E2E-TRANSFER-REF')
    await page.getByTestId('wizard-next').click()
    await expect(page.getByTestId('wizard-review')).toBeVisible()
    await expect(page.getByTestId('wizard-review')).toContainText('Conference + Bus')
    await expect(page.getByTestId('wizard-review')).toContainText('120')
    await page.getByTestId('wizard-submit').click()
    await expect(page.getByText(/Reservation pending|قيد المراجعة/i).first()).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText(/Reservation code|رمز الحجز|TKT-/i).first()).toBeVisible({ timeout: 25_000 })
  })

  test('past works page shows completed and archived events', async ({ page }) => {
    await page.goto('/past')
    await expect(page.getByText(/Nights we’ve|ليالٍ|Past|Archive/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('body')).toContainText(/Completed|Archived|مكتمل|مؤرشف|No past events/i)
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

  test('wizard confirms before discarding entered details', async ({ page, request }) => {
    const name = `E2E Discard Guard ${Date.now()}`
    await seedPublicEvent(request, name)
    await page.goto('/upcoming')
    const card = await findUpcomingEvent(page, name)
    await card.getByRole('button', { name: /Reserve|احجز/i }).first().click()
    await page.getByTestId('ticket-option').first().click()
    await page.getByTestId('wizard-next').click()
    await page.getByLabel(/Full name|الاسم/i).fill('E2E Guard')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('wizard-discard-confirm')).toBeVisible()
    await page.getByTestId('wizard-discard-cancel').click()
    await expect(page.getByTestId('wizard-discard-confirm')).toBeHidden()
    await expect(page.getByTestId('wizard-step-details')).toBeVisible()

    await dialog.getByRole('button', { name: /Close dialog|إغلاق النافذة/i }).click()
    await expect(page.getByTestId('wizard-discard-confirm')).toBeVisible()
    await page.getByTestId('wizard-discard-accept').click()
    await expect(dialog).toBeHidden()
  })

  test('pending reservation auto-polls until approval', async ({ page, request }) => {
    const name = `E2E Auto Poll ${Date.now()}`
    await seedPublicEvent(request, name)
    const code = 'TKT-E2E-POLL'
    let statusCalls = 0

    await page.route('**/public/events/*/reservations', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ data: { attendeeId: 'poll-attendee', ticketId: 'poll-ticket', reservationCode: code, price: '0', approval: 'PENDING', qr: null, seats: [] } }),
      })
    })
    await page.route('**/public/events/*/reservations/status**', async (route) => {
      statusCalls += 1
      const approved = statusCalls > 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            reservationCode: code,
            ticketId: 'poll-ticket',
            attendeeId: 'poll-attendee',
            approval: approved ? 'APPROVED' : 'PENDING',
            paymentStatus: 'NOT_REQUIRED',
            deliveryStatus: null,
            ticketStatus: 'CONFIRMED',
            price: '0',
            ticketName: 'General Admission',
            attendeeName: 'E2E Poller',
            qr: approved ? 'TKT-E2E-POLL-QR' : null,
            seats: [],
          },
        }),
      })
    })

    await page.goto('/upcoming')
    const card = await findUpcomingEvent(page, name)
    await card.getByRole('button', { name: /Reserve|احجز/i }).first().click()
    await page.getByTestId('ticket-option').first().click()
    await page.getByTestId('wizard-next').click()
    await page.getByLabel(/Full name|الاسم/i).fill('E2E Poller')
    await page.getByLabel(/Email|البريد/i).fill(`e2e.poll+${Date.now()}@example.com`)
    await page.getByTestId('reservation-phone').fill('+20 100 000 0002')
    await page.getByTestId('wizard-next').click()
    await page.getByTestId('wizard-submit').click()

    await expect(page.getByText(/Reservation pending|قيد المراجعة/i).first()).toBeVisible({ timeout: 10_000 })
    await expect.poll(() => statusCalls).toBeGreaterThanOrEqual(2)
    await expect(page.getByText(/Ticket ready|تذكرتك جاهزة/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('seat hold failure offers a retry that enables the wizard', async ({ page, request }) => {
    const name = `E2E Hold Retry ${Date.now()}`
    await seedPaidTransportEvent(request, name)
    let holdCalls = 0

    await page.route('**/public/events/*/buses/*/hold', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      holdCalls += 1
      if (holdCalls === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'HOLD_FAILED', message: 'Simulated hold failure' }, data: null }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { holdToken: 'e2e-hold', holdExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(), seats: [] } }),
      })
    })

    await page.goto('/upcoming')
    const card = await findUpcomingEvent(page, name)
    await card.getByRole('button', { name: /Reserve|احجز/i }).first().click()
    await page.getByTestId('ticket-option').filter({ hasText: 'Conference + Bus' }).click()
    await page.getByTestId('wizard-next').click()
    await page.getByLabel(/Full name|الاسم/i).fill('E2E Hold Retry')
    await page.getByLabel(/Email|البريد/i).fill(`e2e.hold+${Date.now()}@example.com`)
    await page.getByTestId('reservation-phone').fill('+20 100 000 0003')
    await page.getByTestId('wizard-next').click()
    await page.getByTestId('seat-option').first().click()

    await expect(page.getByTestId('retry-hold')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('wizard-next')).toBeDisabled()
    await page.getByTestId('retry-hold').click()
    await expect.poll(() => holdCalls).toBeGreaterThanOrEqual(2)
    await expect(page.getByTestId('wizard-next')).toBeEnabled({ timeout: 10_000 })
    await expect(page.getByTestId('wizard-summary')).toContainText(/Held until|محجوز حتى/i)
  })
})
