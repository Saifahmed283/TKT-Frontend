import { test, expect, type Page } from '@playwright/test'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app/, { timeout: 20_000 })
}

async function assertHealthy(page: Page, path: string) {
  const badResponses: string[] = []
  page.on('response', (r) => {
    const url = r.url()
    if (!url.includes('/api/')) return
    if (r.status() >= 400 && !url.includes('/auth/refresh')) badResponses.push(`${r.status()} ${url}`)
  })
  await page.goto(path)
  await expect(page.locator('body')).not.toContainText(/Something went wrong/i, { timeout: 15_000 })
  await expect(page.locator('body')).not.toContainText(/Cannot read properties|TypeError/i)
  // give async widgets a moment
  await page.waitForTimeout(800)
  await expect(page.locator('body')).not.toContainText(/Something went wrong/i)
  return badResponses
}

test.describe('Dashboard audit', () => {
  test('admin can open every main dashboard route', async ({ page }) => {
    await login(page, 'admin@tkt.local', 'Admin12345!')
    const core = ['/app', '/app/events', '/app/organizations', '/app/profile', '/app/guide', '/app/scanner']
    for (const p of core) {
      await assertHealthy(page, p)
    }

    await page.goto('/app/events')
    await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
    await expect(page).toHaveURL(/\/app\/events\/([^/]+)/)
    const eventId = page.url().match(/\/app\/events\/([^/]+)/)?.[1]!
    const modules = ['', '/reservations', '/attendees', '/tickets', '/payments', '/credentials', '/access-codes', '/access', '/devices', '/tasks', '/incidents', '/comms', '/staff', '/workforce', '/teams', '/areas', '/integrations', '/audit', '/reports']
    for (const m of modules) {
      const path = `/app/events/${eventId}${m}`
      const bad: string[] = []
      const onResp = (r: any) => { const u = r.url(); if (u.includes('/api/') && r.status() >= 500) bad.push(`${r.status()} ${u}`) }
      page.on('response', onResp)
      await page.goto(path)
      await page.waitForTimeout(1000)
      await expect(page.locator('body')).not.toContainText(/Something went wrong|TypeError|Cannot read properties/i)
      page.off('response', onResp)
      expect(bad, `5xx on ${path}: ${bad.join(', ')}`).toEqual([])
    }
  })

  test('event manager can open key event routes', async ({ page }) => {
    await login(page, 'ahmed@tkt.local', 'Staff12345!')
    await page.goto('/app/events')
    await page.getByRole('link', { name: /Tech Frontier 2026/i }).first().click()
    const eventId = page.url().match(/\/app\/events\/([^/]+)/)?.[1]!
    for (const m of ['', '/reservations', '/staff', '/credentials', '/access-codes', '/devices', '/workforce', '/integrations', '/payments']) {
      await page.goto(`/app/events/${eventId}${m}`)
      await page.waitForTimeout(900)
      await expect(page.locator('body')).not.toContainText(/Something went wrong|TypeError|Cannot read properties/i)
      await expect(page.locator('body')).not.toContainText(/Access denied/i)
    }
  })
})
