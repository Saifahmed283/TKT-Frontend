import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
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
  const { t, lang, toggle } = useLanguage()
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-line-soft/70 bg-paper/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0 flex items-center gap-2.5" aria-label="TKT home" onClick={() => setOpen(false)}>
          <BrandLogo imageClassName="h-10 sm:h-11" />
          <span className="font-display text-[1.35rem] font-semibold tracking-[0.08em] text-ink-0">TKT</span>
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

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            aria-label={lang === 'en' ? 'Switch language to Arabic' : 'التبديل إلى الإنجليزية'}
            className="inline-flex items-center justify-center border border-line-soft px-3 py-2 font-sans text-[11px] font-medium tracking-[0.02em] text-ink-2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-signal/40 hover:text-signal active:translate-y-0 active:scale-[0.97]"
          >
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            title={t('theme')}
            className="inline-flex items-center justify-center border border-line-soft p-2 text-ink-2 transition-all duration-200 ease-out hover:-translate-y-px hover:border-signal/40 hover:text-signal active:translate-y-0 active:scale-[0.97] active:rotate-12"
          >
            {theme === 'dark' ? <Sun size={14} className="text-signal transition-transform duration-300" /> : <Moon size={14} className="text-signal transition-transform duration-300" />}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex border border-line-soft p-2 text-ink-2 transition-all duration-200 ease-out hover:border-signal/40 hover:text-signal active:scale-[0.95] lg:hidden"
            aria-label={t('menu')}
            aria-expanded={open}
          >
            <span className={`transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`}>{open ? <X size={16} /> : <Menu size={16} />}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line-soft bg-paper/96 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.99] ${
                    isActive ? 'text-signal' : 'text-ink-2 hover:translate-x-1 rtl:hover:-translate-x-1 hover:text-signal'
                  }`
                }
              >
                {t(l.label)}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}