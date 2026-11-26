import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth'
import App from './App'
import { ToastProvider } from '@/components/ui/toast'
import { ConfirmProvider } from '@/components/ui/dialog'
import { LanguageProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/theme'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <ToastProvider>
                <ConfirmProvider>
                  <App />
                </ConfirmProvider>
              </ToastProvider>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)

// Cache the app shell and the same-origin static assets already loaded by this app.
// API responses and reservation/credential data are deliberately excluded.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready
        const urls = performance.getEntriesByType('resource')
          .map((entry) => {
            try {
              const url = new URL(entry.name)
              if (url.origin !== window.location.origin) return null
              if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/public/')) return null
              return /\\.(?:js|css|png|svg|webp|woff2?)$/i.test(url.pathname) ? url.pathname : null
            } catch {
              return null
            }
          })
          .filter((value): value is string => Boolean(value))
        registration.active?.postMessage({ type: 'PRECACHE_STATIC', urls })
      } catch {
        // A service-worker failure must never block the normal ticket site.
      }
    })()
  })
}
