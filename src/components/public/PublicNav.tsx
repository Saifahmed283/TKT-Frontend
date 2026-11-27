import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useLanguage } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'
import BrandLogo from './BrandLogo'

const LINKS = [
  { to: '/', label: 'home' },
  { to: '/upcoming', label: 'upcomingEvents' },
  { to: '/past', label: 'pastWorks' },
  { to: '/about', label: 'aboutUs' },
  { to: '/contact', label: 'contactUs' },
] as const

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)
  const location = useLocation()
  const { t, lang, toggle } = useLanguage()
  const { theme, toggle: toggleTheme } = useTheme()

  // Close the sheet whenever the route changes, even when a link is opened
  // through browser history or a keyboard activation.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-line-soft/70 bg-paper/92 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[3.75rem] max-w-7xl items-center justify-between gap-2 px-3 sm:h-[4.5rem] sm:gap-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          aria-label="TKT home"
          onClick={() => setOpen(false)}
        >
          <BrandLogo imageClassName="h-8 w-auto transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-11" />
          <span className="font-display text-[1.05rem] font-semibold tracking-[0.06em] text-ink-0 sm:text-[1.35rem] sm:tracking-[0.08em]">
            TKT
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `group relative px-3 py-2 text-[12px] font-medium transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] ${
                  isActive ? 'text-signal' : 'text-ink-2 hover:text-ink-0'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative z-[1]">{t(l.label)}</span>
                  <span
                    className={`absolute inset-x-2 bottom-1 h-px origin-left bg-signal transition-transform duration-300 ease-out ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggle}
            title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            aria-label={lang === 'en' ? 'عربي' : 'EN'}
            className="inline-flex h-8 items-center justify-center border border-line-soft px-2.5 py-0 font-sans text-[10px] font-medium tracking-[0.02em] text-ink-2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-signal/40 hover:text-signal active:translate-y-0 active:scale-[0.97] sm:h-auto sm:px-3 sm:py-2 sm:text-[11px]"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            title={t('theme')}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'light'}
            className="inline-flex h-8 w-8 items-center justify-center border border-line-soft text-ink-2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-signal/40 hover:text-signal active:translate-y-0 active:scale-[0.97] active:rotate-12 sm:h-auto sm:w-auto sm:p-2"
          >
            {theme === 'dark' ? (
              <Sun size={14} className="text-signal transition-transform duration-300" />
            ) : (
              <Moon size={14} className="text-signal transition-transform duration-300" />
            )}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center border border-line-soft text-ink-2 transition-all duration-200 ease-out hover:border-signal/40 hover:text-signal active:scale-[0.95] sm:h-auto sm:w-auto sm:p-2 lg:hidden"
            aria-label={open ? t('closeNavigation') : t('menu')}
            aria-expanded={open}
            aria-controls="tkt-mobile-nav"
          >
            <span className={`transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`}>
              {open ? <X size={16} /> : <Menu size={16} />}
            </span>
          </button>
        </div>
      </div>

      <div
        id="tkt-mobile-nav"
        className={`max-h-[calc(100svh-3.75rem)] overflow-y-auto border-t border-line-soft bg-paper/97 backdrop-blur-xl animate-slide-up sm:max-h-[calc(100svh-4.5rem)] lg:hidden ${open ? 'block' : 'hidden'}`}
      >
        <div className="mx-auto max-w-7xl px-3 pb-3 pt-2 sm:px-6 sm:pb-4">
          <div className="mb-2 flex items-center justify-between border-b border-line-soft/70 pb-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-3">
              {t('menu')}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-signal-dim">TKT / 01</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LINKS.map((l, index) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-[54px] flex-col justify-between gap-1 border px-3 py-2.5 transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? 'border-signal/50 bg-signal/10 text-signal'
                      : 'border-line-soft bg-raised/70 text-ink-2 hover:border-signal/30 hover:bg-elevated hover:text-ink-0'
                  }`
                }
              >
                <span className="font-mono text-[9px] text-ink-3">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] font-medium leading-tight">{t(l.label)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
