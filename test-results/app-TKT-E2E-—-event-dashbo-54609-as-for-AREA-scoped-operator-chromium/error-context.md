# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> TKT E2E — event dashboard & modules >> scanner page scopes areas for AREA-scoped operator
- Location: e2e\app.spec.ts:46:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('select').nth(1).locator('option')
Timeout: 10000ms
- Expected  - 1
+ Received  + 0

  Array [
    "Select gate area…",
-   "Main Gate",
  ]

Call log:
  - Expect "toHaveText" with timeout 10000ms
  - waiting for locator('select').nth(1).locator('option')
    23 × locator resolved to 1 element

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - link [ref=e6] [cursor=pointer]:
        - /url: /app
        - img "TKT" [ref=e8]
      - generic [ref=e9]: v2.0
    - link "Back to site" [ref=e12] [cursor=pointer]:
      - /url: /upcoming
    - generic [ref=e16]:
      - paragraph [ref=e17]:
        - generic [ref=e18]: //
        - text: Workspace
      - navigation [ref=e19]:
        - link "Overview" [ref=e20] [cursor=pointer]:
          - /url: /app
        - link "Events" [ref=e26] [cursor=pointer]:
          - /url: /app/events
        - link "Organizations" [ref=e29] [cursor=pointer]:
          - /url: /app/organizations
        - link "Scanner" [active] [ref=e34] [cursor=pointer]:
          - /url: /app/scanner
        - link "Guide" [ref=e41] [cursor=pointer]:
          - /url: /app/guide
    - generic [ref=e44]:
      - button "MO Mohamed Omar mohamed@tkt.local" [ref=e46]:
        - generic [ref=e47]: MO
        - generic [ref=e48]:
          - generic [ref=e49]: Mohamed Omar
          - generic [ref=e50]: mohamed@tkt.local
      - paragraph [ref=e53]: Live
  - main [ref=e55]:
    - generic [ref=e56]:
      - button "Jump to anything… Ctrl K" [ref=e57]:
        - generic [ref=e61]: Jump to anything…
        - generic [ref=e62]:
          - generic [ref=e63]: Ctrl
          - generic [ref=e64]: K
      - generic [ref=e65]:
        - link "Back to site" [ref=e66] [cursor=pointer]:
          - /url: /upcoming
        - button "ع" [ref=e70]
        - button "Toggle theme" [ref=e75]
        - generic [ref=e82]: 18:40:42 UTC
        - generic [ref=e83]: API stable
        - generic [ref=e85]: SSE live
    - generic [ref=e93]:
      - generic [ref=e95]:
        - paragraph [ref=e96]: TKT · Control center
        - heading "Gate Scanner" [level=1] [ref=e98]
        - paragraph [ref=e99]: Validate credentials at the gate.
      - generic [ref=e100]:
        - combobox [ref=e101]:
          - option "Tech Frontier 2026 · Access / Scanner Staff" [selected]
        - combobox [ref=e102]:
          - option "Select gate area…" [selected]
        - generic [ref=e103]: Online
      - generic [ref=e110]:
        - generic [ref=e111]:
          - paragraph [ref=e112]: Register this device
          - paragraph [ref=e113]: Enables signed offline scans that sync when the network returns.
        - button "Register device" [ref=e114] [cursor=pointer]
      - generic [ref=e115]:
        - generic [ref=e116]:
          - heading "Scan credential" [level=2] [ref=e117]
          - generic [ref=e118]:
            - textbox "Paste or type the credential code…" [ref=e119]
            - button "Validate" [disabled] [ref=e120]
          - button "Use camera" [disabled] [ref=e126]
        - generic [ref=e132]:
          - heading "Offline queue" [level=2] [ref=e134]
          - paragraph [ref=e135]: When offline, denied scans are signed locally and queued. 0 pending.
          - paragraph [ref=e137]: Queue empty — all decisions synced.
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
  38 |     await expect(page).toHaveURL(/\/app/)
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
> 56 |     await expect(areaSelect.locator('option')).toHaveText(['Select gate area…', 'Main Gate'], { timeout: 10_000 })
     |                                                ^ Error: expect(locator).toHaveText(expected) failed
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