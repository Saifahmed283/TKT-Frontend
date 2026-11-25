import { chromium } from '@playwright/test'

const baseURL = process.env.TKT_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const routes = ['/', '/upcoming', '/past', '/about', '/contact', '/reservation/TKT-RESPONSIVE-CHECK']
const viewports = [
  { name: 'small-mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide-desktop', width: 1920, height: 1080 },
]

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
let failures = 0
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.width <= 390 ? 2 : 1 })
    const page = await context.newPage()
    for (const route of routes) {
      const response = await page.goto(new URL(route, baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!response || !response.ok()) {
        console.error(`FAIL ${viewport.name} ${route}: HTTP ${response?.status() ?? 'no response'}`)
        failures++
        continue
      }
      await page.waitForTimeout(350)
      const metrics = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
        title: document.title,
        heroRenderer: document.querySelector('[data-testid="hero-emblem"]')?.getAttribute('data-renderer') ?? null,
      }))
      if (route === '/' && metrics.heroRenderer !== (viewport.width >= 1280 ? '3d' : 'static')) {
        console.error(`FAIL ${viewport.name} /: expected ${viewport.width >= 1280 ? '3D' : 'static'} hero emblem, found ${metrics.heroRenderer ?? 'missing'}`)
        failures++
      } else if (metrics.documentWidth > metrics.viewportWidth + 1) {
        console.error(`FAIL ${viewport.name} ${route}: horizontal overflow ${metrics.documentWidth}px > ${metrics.viewportWidth}px`)
        failures++
      } else {
        console.log(`PASS ${viewport.name} ${route} (${metrics.viewportWidth}px)`)
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}
if (failures) throw new Error(`Responsive smoke test found ${failures} failure(s)`)
console.log(`Responsive smoke passed: ${viewports.length} viewports × ${routes.length} public routes`)
