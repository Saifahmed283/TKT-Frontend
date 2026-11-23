# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> TKT E2E — event dashboard & modules >> event overview shows live KPIs
- Location: e2e\app.spec.ts:33:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/app/
Received string:  "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en" dir="ltr" class="dark" data-lang="en" data-theme="dark">…</html>
       - unexpected value "http://localhost:5173/login"

```

```yaml
- link "TKT home":
  - /url: /
  - img "TKT"
- paragraph: Staff access
- heading "Sign in to TKT" [level=1]
- paragraph: Use your staff account to access the control room.
- text: Email
- textbox "Email":
  - /placeholder: you@company.com
  - text: ahmed@tkt.local
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
  - text: Staff12345!
- button "Signing in…" [disabled]
- link "Back to home":
  - /url: /
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('TKT E2E — landing & auth', () => {
  4  |   test('landing page renders and routes to upcoming events', async ({ page }) => {
  5  |     await page.goto('/')
  6  |     await expect(page).toHaveTitle(/TKT/)
  7  |     const explore = page.getByRole('link', { name: /Explore Events|استكشف الفعاليات/i }).first()
  8  |     await expect(explore).toBeVisible()
  9  |     await explore.click()
  10 |     await expect(page).toHaveURL(/\/upcoming/)
  11 |   })
  12 | 
  13 |   test('login with demo staff works and lands in app shell', async ({ page }) => {
  14 |     await page.goto('/login')
  15 |     await page.getByLabel('Email').fill('ahmed@tkt.local')
  16 |     await page.getByLabel('Password').fill('Staff12345!')
  17 |     await page.getByRole('button', { name: 'Sign in' }).click()
  18 |     await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
  19 |     await expect(page.getByText('Ahmed Hassan')).toBeVisible()
  20 |     await expect(page.getByRole('link', { name: /Events|الفعاليات/i }).first()).toBeVisible({ timeout: 20_000 })
  21 |   })
  22 | 
  23 |   test('wrong password shows error', async ({ page }) => {
  24 |     await page.goto('/login')
  25 |     await page.getByLabel('Email').fill('ahmed@tkt.local')
  26 |     await page.getByLabel('Password').fill('wrong-password')
  27 |     await page.getByRole('button', { name: 'Sign in' }).click()
  28 |     await expect(page.getByText('Invalid email or password')).toBeVisible()
  29 |   })
  30 | })
  31 | 
  32 | test.describe('TKT E2E — event dashboard & modules', () => {
  33 |   test('event overview shows live KPIs', async ({ page }) => {
  34 |     await page.goto('/login')
  35 |     await page.getByLabel('Email').fill('ahmed@tkt.local')
  36 |     await page.getByLabel('Password').fill('Staff12345!')
  37 |     await page.getByRole('button', { name: 'Sign in' }).click()
> 38 |     await expect(page).toHaveURL(/\/app/)
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  39 |     await page.goto('/app/events')
  40 |     await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
  41 |     await expect(page).toHaveURL(/\/app\/events\//)
  42 |     await expect(page.getByText('Attendees', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  43 |     await expect(page.getByText(/Check-in rate|Check in|KPI/i).first()).toBeVisible({ timeout: 30_000 })
  44 |   })
  45 | 
  46 |   test('scanner page scopes areas for AREA-scoped operator', async ({ page }) => {
  47 |     await page.goto('/login')
  48 |     await page.getByLabel('Email').fill('mohamed@tkt.local')
  49 |     await page.getByLabel('Password').fill('Staff12345!')
  50 |     await page.getByRole('button', { name: 'Sign in' }).click()
  51 |     await expect(page).toHaveURL(/\/app/, { timeout: 20_000 })
  52 |     await page.getByRole('link', { name: 'Scanner' }).click()
  53 |     await expect(page).toHaveURL(/\/app\/scanner/)
  54 |     const areaSelect = page.locator('select').nth(1)
  55 |     await expect(areaSelect).toBeEnabled()
  56 |     await expect(areaSelect.locator('option')).toHaveText(['Select gate area…', 'Main Gate'], { timeout: 10_000 })
  57 |   })
  58 | 
  59 |   test('modules render for event manager', async ({ page }) => {
  60 |     await page.goto('/login')
  61 |     await page.getByLabel('Email').fill('ahmed@tkt.local')
  62 |     await page.getByLabel('Password').fill('Staff12345!')
  63 |     await page.getByRole('button', { name: 'Sign in' }).click()
  64 |     await expect(page).toHaveURL(/\/app/, { timeout: 15_000 })
  65 |     await page.goto('/app/events')
  66 |     await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
  67 |     await expect(page).toHaveURL(/\/app\/events\//)
  68 |     for (const label of ['Attendees', 'Tickets', 'Credentials', 'Access log', 'Tasks', 'Incidents', 'Comms', 'Reports']) {
  69 |       await expect(page.getByRole('link', { name: new RegExp(label, 'i') }).first()).toBeVisible()
  70 |     }
  71 |   })
  72 | })
```