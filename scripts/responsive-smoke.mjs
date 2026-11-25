import { chromium } from '@playwright/test'

const baseURL = process.env.TKT_PREVIEW_URL ?? 'http://127.0.0.1:4173'
const routes = ['/', '/upcoming', '/past', '/about', '/contact', '/login', '/app', '/reservation/TKT-RESPONSIVE-CHECK']
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
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
        pathname: window.location.pathname,
        mainCount: document.querySelectorAll('main').length,
        heroRenderer: document.querySelector('[data-testid="hero-emblem"]')?.getAttribute('data-renderer') ?? null,
      }))
      const expectedPath = route === '/app' ? metrics.pathname : route
      const validAppPath = route !== '/app' || metrics.pathname === '/app' || metrics.pathname === '/login'
      if (route === '/' && metrics.heroRenderer !== (viewport.width >= 1280 ? '3d' : 'static')) {
        console.error(`FAIL ${viewport.name} /: expected ${viewport.width >= 1280 ? '3D' : 'static'} hero emblem, found ${metrics.heroRenderer ?? 'missing'}`)
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
    await context.close()
  }
} finally {
  await browser.close()
}
if (failures) throw new Error(`Responsive smoke test found ${failures} failure(s)`)
console.log(`Responsive smoke passed: ${viewports.length} viewports × ${routes.length} public routes`)
