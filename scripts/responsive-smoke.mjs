import { chromium } from '@playwright/test'

const baseURL = process.env.TKT_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const routes = ['/', '/upcoming', '/past', '/about', '/contact', '/login', '/app', '/reservation/TKT-RESPONSIVE-CHECK', '/my-ticket']
const viewports = [
  { name: 'small-mobile', width: 360, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'compact-desktop', width: 1100, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide-desktop', width: 1920, height: 1080 },
]

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
let failures = 0
try {
  const utilityContext = await browser.newContext()
  const robotsResponse = await utilityContext.request.get(new URL('/robots.txt', baseURL).toString())
  const robotsText = await robotsResponse.text()
  if (!robotsResponse.ok() || !robotsResponse.headers()['content-type']?.includes('text/plain') || !robotsText.includes('User-agent: *') || !robotsText.includes('Sitemap:')) {
    console.error('FAIL robots.txt: expected a valid plain-text crawler policy with a sitemap reference')
    failures++
  } else {
    console.log('PASS robots.txt content and content type')
  }

  const sitemapResponse = await utilityContext.request.get(new URL('/sitemap.xml', baseURL).toString())
  const sitemapText = await sitemapResponse.text()
  if (!sitemapResponse.ok() || !sitemapResponse.headers()['content-type']?.includes('xml') || !sitemapText.includes('<urlset') || !sitemapText.includes('/upcoming') || !sitemapText.includes('/contact')) {
    console.error('FAIL sitemap.xml: expected valid XML with public site routes')
    failures++
  } else {
    console.log('PASS sitemap.xml content and content type')
  }
  const manifestResponse = await utilityContext.request.get(new URL('/manifest.webmanifest', baseURL).toString())
  const manifestText = await manifestResponse.text()
  if (!manifestResponse.ok() || !manifestText.includes('"start_url": "/my-ticket"') || !manifestText.includes('"display": "standalone"')) {
    console.error('FAIL manifest.webmanifest: expected an installable standalone TKT ticket app')
    failures++
  } else {
    console.log('PASS PWA manifest and standalone ticket start URL')
  }

  const workerResponse = await utilityContext.request.get(new URL('/sw.js', baseURL).toString())
  const workerText = await workerResponse.text()
  if (!workerResponse.ok() || !workerText.includes('PRECACHE_STATIC') || !workerText.includes("url.pathname.startsWith('/api/')") || !workerText.includes("url.pathname.startsWith('/public/')")) {
    console.error('FAIL sw.js: expected static asset precaching without caching private API traffic')
    failures++
  } else {
    console.log('PASS PWA service worker excludes private API responses')
  }

  const iconResponse = await utilityContext.request.get(new URL('/apple-touch-icon.png', baseURL).toString())
  if (!iconResponse.ok() || !iconResponse.headers()['content-type']?.includes('image/png') || (await iconResponse.body()).length < 100) {
    console.error('FAIL apple-touch-icon.png: expected a valid home-screen PNG icon')
    failures++
  } else {
    console.log('PASS Apple home-screen icon is served as PNG')
  }

  await utilityContext.close()
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.width <= 390 ? 2 : 1, hasTouch: viewport.name.startsWith('tablet') })
    const page = await context.newPage()
    for (const route of routes) {
      const response = await page.goto(new URL(route, baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!response || !response.ok()) {
        console.error(`FAIL ${viewport.name} ${route}: HTTP ${response?.status() ?? 'no response'}`)
        failures++
        continue
      }
      await page.waitForTimeout(350)
      if (route === '/') {
        // The first-visit intro intentionally covers the site; test the hero
        // after the intro has finished and relinquished pointer input.
        await page.locator('.tkt-intro').waitFor({ state: 'detached', timeout: 5000 })
      }
      const metrics = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
        pathname: window.location.pathname,
        mainCount: document.querySelectorAll('main').length,
        heroRenderer: document.querySelector('[data-testid="hero-emblem"]')?.getAttribute('data-renderer') ?? null,
        heroPointerEvents: (() => {
          const hero = document.querySelector('[data-testid="hero-emblem"]')
          return hero ? getComputedStyle(hero).pointerEvents : 'missing'
        })(),
        heroHitInside: (() => {
          const hero = document.querySelector('[data-testid="hero-emblem"]')
          if (!hero) return false
          const rect = hero.getBoundingClientRect()
          const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
          return Boolean(hit && (hit === hero || hero.contains(hit)))
        })(),
        heroHitStack: (() => {
          const hero = document.querySelector('[data-testid="hero-emblem"]')
          if (!hero) return []
          const rect = hero.getBoundingClientRect()
          return document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
            .slice(0, 6)
            .map((element) => ({
              tag: element.tagName,
              id: element.id,
              className: typeof element.className === 'string' ? element.className : '',
              pointerEvents: getComputedStyle(element).pointerEvents,
              testId: element.getAttribute('data-testid'),
            }))
        })(),
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
      }))
      const expectedPath = route === '/app' ? metrics.pathname : route
      const validAppPath = route !== '/app' || metrics.pathname === '/app' || metrics.pathname === '/login'
      const expects3D = viewport.width >= 1024 && !viewport.name.startsWith('tablet')
      const expectsVisual = viewport.width >= 640
      const expectedRenderer = expects3D ? '3d' : expectsVisual ? 'static' : null
      if (route === '/' && metrics.heroRenderer !== expectedRenderer) {
        console.error(`FAIL ${viewport.name} /: expected ${expectedRenderer ?? 'no hero visual on mobile'}, found ${metrics.heroRenderer ?? 'missing'}`)
        failures++
      } else if (route === '/' && expects3D && (metrics.heroPointerEvents !== 'auto' || !metrics.heroHitInside)) {
        console.error(`FAIL ${viewport.name} /: 3D hero is not reachable by pointer (pointer-events=${metrics.heroPointerEvents}, hitInside=${metrics.heroHitInside}, hitStack=${JSON.stringify(metrics.heroHitStack)})`)
        failures++
      } else if (route === '/' && metrics.scrollHeight > metrics.innerHeight + 2) {
        console.error(`FAIL ${viewport.name} /: home page scrolls vertically (${metrics.scrollHeight}px content in ${metrics.innerHeight}px viewport)`)
        failures++
      } else if (metrics.documentWidth > metrics.viewportWidth + 1) {
        console.error(`FAIL ${viewport.name} ${route}: horizontal overflow ${metrics.documentWidth}px > ${metrics.viewportWidth}px`)
        failures++
      } else if (!validAppPath || metrics.pathname !== expectedPath || new URL(metrics.canonical, baseURL).pathname !== expectedPath) {
        console.error(`FAIL ${viewport.name} ${route}: current route or canonical URL is incorrect (path=${metrics.pathname}, canonical=${metrics.canonical})`)
        failures++
      } else if ((route.startsWith('/app') || route.startsWith('/reservation/') || route === '/my-ticket' || route === '/login') && metrics.robots !== 'noindex, nofollow') {
        console.error(`FAIL ${viewport.name} ${route}: private route must be noindex, nofollow`)
        failures++
      } else if (route === '/' && metrics.mainCount !== 1) {
        console.error(`FAIL ${viewport.name} /: expected exactly one main landmark, found ${metrics.mainCount}`)
        failures++
      } else {
        console.log(`PASS ${viewport.name} ${route} (${metrics.viewportWidth}px)`)
      }
    }

    if (viewport.width >= 1024 && !viewport.name.startsWith('tablet')) {
      await page.goto(new URL('/', baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.locator('.tkt-intro').waitFor({ state: 'detached', timeout: 5000 })
      const interactionSurface = page.locator('[data-testid="hero-emblem-interaction-surface"]')
      await interactionSurface.waitFor({ state: 'visible', timeout: 10000 })
      const center = await interactionSurface.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      })
      await page.mouse.move(center.x, center.y)
      await page.mouse.down()
      await page.mouse.move(center.x + 36, center.y + 22, { steps: 4 })
      const dragging = await interactionSurface.getAttribute('data-dragging')
      await page.mouse.up()
      if (dragging !== 'true') {
        console.error(`FAIL ${viewport.name} /: mouse drag did not reach the 3D hero model`)
        failures++
      } else {
        console.log(`PASS ${viewport.name} /: 3D hero accepts mouse drag`)
      }
    }

    await context.close()
  }

  async function checkDashboardDrawer(viewport) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.width <= 390 ? 2 : 1,
      hasTouch: true,
    })
    await context.route('**/api/auth/refresh', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          token: 'responsive-smoke-token',
          user: {
            id: 'u-responsive',
            name: 'Responsive Smoke',
            email: 'responsive@test.tkt',
            phone: null,
            platformRole: 'super_admin',
            orgMemberships: [],
            eventMemberships: [],
          },
        },
      }),
    }))
    await context.route('**/api/dashboard', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          kpis: {
            events: 0, totalGuests: 0, checkedIn: 0, pendingEntry: 0,
            totalDevices: 0, activeDevices: 0, todayScans: 0, validScans: 0, invalidScans: 0,
          },
          reservations: [],
          recentActivity: [],
        },
      }),
    }))
    const page = await context.newPage()
    const response = await page.goto(new URL('/app', baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (!response?.ok()) {
      console.error(`FAIL ${viewport.name} /app: HTTP ${response?.status() ?? 'no response'}`)
      failures++
      await context.close()
      return
    }
    await page.locator('.tkt-intro').waitFor({ state: 'detached', timeout: 5000 })
    const hamburger = page.getByRole('button', { name: 'Open navigation' })
    await hamburger.waitFor({ state: 'visible', timeout: 10000 })

    const mainWidth = await page.locator('main').evaluate((el) => el.getBoundingClientRect().width)
    const sidebar = page.locator('aside')
    const closedX = await sidebar.evaluate((el) => el.getBoundingClientRect().x)
    if (mainWidth < viewport.width - 2) {
      console.error(`FAIL ${viewport.name} /app: main content is only ${mainWidth}px wide in a ${viewport.width}px viewport`)
      failures++
    } else if (closedX > -1) {
      console.error(`FAIL ${viewport.name} /app: sidebar is not off-canvas before opening (x=${closedX})`)
      failures++
    } else {
      await hamburger.click()
      await page.waitForTimeout(250)
      const openX = await sidebar.evaluate((el) => el.getBoundingClientRect().x)
      const backdropVisible = await page.getByRole('button', { name: 'Close navigation' }).first().isVisible()
      if (openX < -1 || !backdropVisible) {
        console.error(`FAIL ${viewport.name} /app: drawer did not open (x=${openX}, backdrop=${backdropVisible})`)
        failures++
      } else {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(250)
        const escapeX = await sidebar.evaluate((el) => el.getBoundingClientRect().x)
        if (escapeX > -1) {
          console.error(`FAIL ${viewport.name} /app: Escape did not close the drawer (x=${escapeX})`)
          failures++
        } else {
          console.log(`PASS ${viewport.name} /app drawer opens, exposes content, and closes with Escape`)
        }
      }
    }
    await context.close()
  }

  for (const viewport of viewports.filter((v) => v.width < 1024)) {
    await checkDashboardDrawer(viewport)
  }

  const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const reducedPage = await reducedContext.newPage()
  await reducedPage.emulateMedia({ reducedMotion: 'reduce' })
  await reducedPage.goto(new URL('/', baseURL).toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
  await reducedPage.waitForTimeout(350)
  const reducedRenderer = await reducedPage.locator('[data-testid="hero-emblem"]').getAttribute('data-renderer')
  if (reducedRenderer !== 'static') {
    console.error(`FAIL reduced-motion desktop: expected static hero emblem, found ${reducedRenderer ?? 'missing'}`)
    failures++
  } else {
    console.log('PASS reduced-motion desktop keeps static hero emblem')
  }
  await reducedContext.close()
} finally {
  await browser.close()
}
if (failures) throw new Error(`Responsive smoke test found ${failures} failure(s)`)
console.log(`Responsive smoke passed: ${viewports.length} viewports × ${routes.length} routes, dashboard drawer, home no-scroll, PWA assets, and reduced-motion checks`)
