import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Sun, Moon, Languages, ArrowUpRight } from 'lucide-react'
import { Blink } from '../instruments'
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
        <Link to="/" className="shrink-0" aria-label="TKT home" onClick={() => setOpen(false)}>
          <BrandLogo imageClassName="h-10 sm:h-11" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 text-[12px] font-medium transition-colors ${
                  isActive ? 'bg-signal/10 text-signal' : 'text-ink-2 hover:bg-raised hover:text-ink-0'
                }`
              }
            >
              {t(l.label)}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 border border-line-soft px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 xl:flex">
            <Blink className="bg-ok" />
            {t('allSystemsNominal')}
          </div>
          <button
            onClick={toggle}
            title={t('language')}
            className="inline-flex items-center gap-1.5 border border-line-soft px-2.5 py-2 text-[11px] text-ink-2 transition-colors hover:border-signal/40 hover:text-ink-0"
          >
            <Languages size={13} className="text-signal" />
            <span className="font-mono uppercase tracking-[0.12em]">{lang === 'en' ? 'AR' : 'EN'}</span>
          </button>
          <button
            onClick={toggleTheme}
            title={t('theme')}
            className="inline-flex items-center justify-center border border-line-soft p-2 text-ink-2 transition-colors hover:border-signal/40 hover:text-ink-0"
          >
            {theme === 'dark' ? <Sun size={14} className="text-signal" /> : <Moon size={14} className="text-signal" />}
          </button>
          <Link to="/upcoming" className="btn-primary hidden !px-4 !py-2 sm:inline-flex">
            {t('upcomingEvents')}
            <ArrowUpRight size={14} />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex border border-line-soft p-2 text-ink-2 transition-colors hover:bg-raised hover:text-ink-0 lg:hidden"
            aria-label={t('menu')}
            aria-expanded={open}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
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
                  `block rounded-md px-3 py-3 text-sm font-medium ${
                    isActive ? 'bg-signal/10 text-signal' : 'text-ink-2 hover:bg-raised hover:text-ink-0'
                  }`
                }
              >
                {t(l.label)}
              </NavLink>
            ))}
            <Link to="/upcoming" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full !py-3">
              {t('browseUpcoming')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}