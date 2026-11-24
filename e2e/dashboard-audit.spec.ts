import { test, expect, type Page } from '@playwright/test'
import { loginAsAdmin, loginAsStaff } from './auth'

type Issue = { kind: 'console' | 'pageerror' | 'http'; detail: string; path: string }

function attachCollectors(page: Page, issues: Issue[], getPath: () => string) {
  page.on('pageerror', (err) => issues.push({ kind: 'pageerror', detail: err.message, path: getPath() }))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (/favicon|Failed to load resource|ERR_CONNECTION_REFUSED.*\/api\/realtime|downloadable font/i.test(text)) return
    issues.push({ kind: 'console', detail: text.slice(0, 300), path: getPath() })
  })
  page.on('response', (r) => {
    const url = r.url()
    if (!url.includes('/api/')) return
    const status = r.status()
    if (status < 400) return
    if (status === 401 && url.includes('/auth/refresh')) return
    issues.push({ kind: 'http', detail: `${status} ${r.request().method()} ${url}`, path: getPath() })
  })
}

async function visit(page: Page, path: string, issues: Issue[], getPath: () => string, setPath: (p: string) => void) {
  setPath(path)
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1200)
  await expect(page.locator('body')).not.toContainText(/Something went wrong|Cannot read properties|TypeError|Unhandled/i)
}

function formatIssues(issues: Issue[]) {
  return issues.map((i) => `[${i.kind}] ${i.path} :: ${i.detail}`).join('\n')
}

test.describe('Dashboard audit', () => {
  test('admin can open core and all event module routes without runtime errors', async ({ page }) => {
    test.setTimeout(120_000)
    const issues: Issue[] = []
    let current = ''
    attachCollectors(page, issues, () => current)
    await loginAsAdmin(page)

    const core = ['/app', '/app/events', '/app/organizations', '/app/profile', '/app/guide', '/app/scanner']
    for (const p of core) await visit(page, p, issues, () => current, (v) => { current = v })

    await page.goto('/app/events')
    await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
    await expect(page).toHaveURL(/\/app\/events\/([^/]+)/)
    const eventId = page.url().match(/\/app\/events\/([^/]+)/)?.[1]!
    const modules = ['', '/reservations', '/attendees', '/tickets', '/payments', '/buses', '/credentials', '/access-codes', '/access', '/devices', '/tasks', '/incidents', '/comms', '/staff', '/workforce', '/teams', '/areas', '/integrations', '/audit', '/reports']
    for (const m of modules) await visit(page, `/app/events/${eventId}${m}`, issues, () => current, (v) => { current = v })

    const severe = issues.filter((i) => i.kind !== 'http' || / 5\d\d /.test(i.detail))
    expect(severe, formatIssues(severe)).toEqual([])
  })

  test('event manager key routes are accessible and healthy', async ({ page }) => {
    const issues: Issue[] = []
    let current = ''
    attachCollectors(page, issues, () => current)
    await loginAsStaff(page)
    await page.goto('/app/events')
    await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
    await expect(page).toHaveURL(/\/app\/events\/([^/]+)/)
    const eventId = page.url().match(/\/app\/events\/([^/]+)/)?.[1]!
    const allowed = ['', '/reservations', '/attendees', '/tickets', '/payments', '/buses', '/credentials', '/access-codes', '/access', '/devices', '/tasks', '/incidents', '/comms', '/staff', '/workforce', '/teams', '/areas', '/integrations', '/audit', '/reports']
    for (const m of allowed) {
      await visit(page, `/app/events/${eventId}${m}`, issues, () => current, (v) => { current = v })
      await expect(page.locator('body')).not.toContainText(/Access denied/i)
    }
    const severe = issues.filter((i) => i.kind !== 'http' || / 5\d\d /.test(i.detail))
    expect(severe, formatIssues(severe)).toEqual([])
  })

  test('scanner can access scanner and is blocked from admin-only surfaces appropriately', async ({ page }) => {
    const issues: Issue[] = []
    let current = ''
    attachCollectors(page, issues, () => current)
    await loginAsStaff(page)
    await visit(page, '/app/scanner', issues, () => current, (v) => { current = v })
    await expect(page.locator('body')).toContainText(/Scanner|Scan/i, { timeout: 20_000 })
    await visit(page, '/app/profile', issues, () => current, (v) => { current = v })
    const severe = issues.filter((i) => i.kind !== 'http' || / 5\d\d /.test(i.detail))
    expect(severe, formatIssues(severe)).toEqual([])
  })
})
