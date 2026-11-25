import { chromium } from '@playwright/test'

const baseURL = process.env.TKT_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const routes = ['/', '/upcoming', '/past', '/about', '/contact', '/login', '/app', '/reservation/TKT-RESPONSIVE-CHECK']
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
      }))
      const expectedPath = route === '/app' ? metrics.pathname : route
      const validAppPath = route !== '/app' || metrics.pathname === '/app' || metrics.pathname === '/login'
      const expects3D = viewport.width >= 1024 && !viewport.name.startsWith('tablet')
      if (route === '/' && metrics.heroRenderer !== (expects3D ? '3d' : 'static')) {
        console.error(`FAIL ${viewport.name} /: expected ${expects3D ? '3D' : 'static'} hero emblem, found ${metrics.heroRenderer ?? 'missing'}`)
        failures++
      } else if (route === '/' && expects3D && (metrics.heroPointerEvents !== 'auto' || !metrics.heroHitInside)) {
        console.error(`FAIL ${viewport.name} /: 3D hero is not reachable by pointer (pointer-events=${metrics.heroPointerEvents}, hitInside=${metrics.heroHitInside})`)
        failures++
      } else if (metrics.documentWidth > metrics.viewportWidth + 1) {
        console.error(`FAIL ${viewport.name} ${route}: horizontal overflow ${metrics.documentWidth}px > ${metrics.viewportWidth}px`)
        failures++
      } else if (!validAppPath || metrics.pathname !== expectedPath || new URL(metrics.canonical, baseURL).pathname !== expectedPath) {
        console.error(`FAIL ${viewport.name} ${route}: current route or canonical URL is incorrect (path=${metrics.pathname}, canonical=${metrics.canonical})`)
        failures++
      } else if ((route.startsWith('/app') || route.startsWith('/reservation/') || route === '/login') && metrics.robots !== 'noindex, nofollow') {
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
console.log(`Responsive smoke passed: ${viewports.length} viewports × ${routes.length} public routes, plus reduced-motion check`)
