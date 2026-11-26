import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Users, Ticket, QrCode, ScanLine, ListTodo,
  AlertTriangle, Megaphone, Shield, LogOut, Radio, ChevronDown,
  UserCog, Building2, BookOpen, Search, ClipboardCheck, Sun, Moon, Languages, Globe, Plug,
  CreditCard, KeyRound, Smartphone, BriefcaseBusiness, FileText, Radar, MapPinned, Layers, BusFront, Menu, X,
} from 'lucide-react'
import { useAuth, usePermissions } from '../../lib/auth'
import { CommandPalette } from './CommandPalette'
import { Corners, Blink } from '../instruments'
import { useLanguage } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'
import BrandLogo from '../public/BrandLogo'

const nav: { to: string; end: boolean; icon: typeof LayoutDashboard; label: string; perm?: string }[] = [
  { to: '/app', end: true, icon: LayoutDashboard, label: 'overview' },
  { to: '/app/events', end: false, icon: CalendarDays, label: 'events' },
  { to: '/app/organizations', end: false, icon: Building2, label: 'organizations' },
  { to: '/app/site-content', end: false, icon: Globe, label: 'siteContent', perm: 'platform.manage' },
  { to: '/app/scanner', end: false, icon: ScanLine, label: 'scanner' },
  { to: '/app/guide', end: false, icon: BookOpen, label: 'guide' },
]

const eventNavGroups = [
  {
    label: 'operations',
    items: [
      { to: 'tasks', icon: ListTodo, label: 'tasks', perm: 'task.view' },
      { to: 'incidents', icon: AlertTriangle, label: 'incidents', perm: 'incident.view' },
      { to: 'comms', icon: Megaphone, label: 'comms', perm: 'message.send' },
      { to: 'teams', icon: Layers, label: 'teams', perm: 'team.view' },
      { to: 'areas', icon: MapPinned, label: 'areas', perm: 'area.view' },
    ],
  },
  {
    label: 'people',
    items: [
      { to: 'attendees', icon: Users, label: 'attendees', perm: 'attendee.view' },
      { to: 'reservations', icon: ClipboardCheck, label: 'reservations', perm: 'ticket.view' },
      { to: 'staff', icon: UserCog, label: 'staff', perm: 'event.members.view' },
      { to: 'workforce', icon: BriefcaseBusiness, label: 'workforce', perm: 'workforce.view' },
    ],
  },
  {
    label: 'accessControl',
    items: [
      { to: 'credentials', icon: QrCode, label: 'credentials', perm: 'credential.view' },
      { to: 'access-codes', icon: KeyRound, label: 'accessCodes', perm: 'access_code.view' },
      { to: 'access', icon: Shield, label: 'accessLog', perm: 'access.logs.view' },
      { to: 'devices', icon: Smartphone, label: 'devices', perm: 'device.view' },
    ],
  },
  {
    label: 'revenue',
    items: [
      { to: 'tickets', icon: Ticket, label: 'tickets', perm: 'ticket.view' },
      { to: 'payments', icon: CreditCard, label: 'payments', perm: 'payment.view' },
      { to: 'buses', icon: BusFront, label: 'buses', perm: 'bus.view' },
    ],
  },
  {
    label: 'admin',
    items: [
      { to: 'integrations', icon: Plug, label: 'integrations', perm: 'integration.view' },
      { to: 'audit', icon: FileText, label: 'audit', perm: 'audit.view' },
      { to: 'reports', icon: Radar, label: 'reports', perm: 'report.view' },
    ],
  },
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="font-mono text-[11px] tabular-nums tracking-[0.15em] text-ink-2">
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())} UTC
    </span>
  )
}

export default function Shell() {
  const { user, logout } = useAuth()
  const { has } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang, toggle: toggleLang } = useLanguage()
  const { theme, toggle: toggleTheme } = useTheme()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeEvent = useMemo(() => {
    const m = location.pathname.match(/\/app\/events\/([^/]+)/)
    return m ? { id: m[1], name: user?.eventMemberships?.find((em) => em.event.id === m[1])?.event.name } : null
  }, [location.pathname, user])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A navigation tap should close the mobile drawer so the new page is visible.
  useEffect(() => {
    setSidebarOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  async function onLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          aria-label={t('closeNavigation')}
          className="fixed inset-0 z-40 bg-canvas/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-line-soft bg-canvas transition-transform duration-200 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l rtl:border-line-soft lg:z-40 lg:w-64 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
<div className="flex h-16 items-center gap-2.5 border-b border-line-soft px-5">
  <Link to="/app" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
    <BrandLogo imageClassName="h-8" />
  </Link>
  <button
    type="button"
    aria-label={t('closeNavigation')}
    className="ms-auto grid h-11 w-11 place-items-center text-ink-2 lg:hidden"
    onClick={() => setSidebarOpen(false)}
  >
    <X size={18} />
  </button>
  <span className="hidden items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-ink-3 sm:ms-auto sm:flex">
    <Blink className="bg-ok" />
    v2.0
  </span>
</div>

        <div className="border-b border-line-soft px-3 py-2.5">
          <Link
            to="/upcoming"
            onClick={() => setSidebarOpen(false)}
            className="group flex min-h-11 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-signal"
          >
            <Globe size={12} className="text-ink-3 transition-colors group-hover:text-signal" />
            {t('backToSite')}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 flex items-center gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">
            <span className="text-signal">//</span> {t('workspace')}
          </p>
          <nav className="space-y-0.5">
            {nav.filter((item) => !item.perm || has(item.perm)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group relative flex min-h-11 items-center gap-3 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors ${
                    isActive ? 'bg-signal-soft text-signal' : 'text-ink-2 hover:bg-raised hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-signal rtl:left-auto rtl:right-0" />}
                    <item.icon size={15} className={isActive ? 'text-signal' : 'text-ink-3 group-hover:text-ink'} />
                    {t(item.label)}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {activeEvent && (
            <>
              <p className="mb-2 mt-6 flex items-center gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">
                <span className="text-signal">//</span> {t('event')}
                <span className="min-w-0 break-words text-signal/70" title={activeEvent.name}>{activeEvent.name}</span>
              </p>
              <div className="space-y-4">
                {eventNavGroups.map((group) => {
                  const items = group.items.filter((item) => has(item.perm, activeEvent.id))
                  if (items.length === 0) return null
                  return (
                    <div key={group.label}>
                      <p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3/80">{t(group.label)}</p>
                      <nav className="space-y-0.5">
                        {items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={`/app/events/${activeEvent.id}/${item.to}`}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `group relative flex min-h-11 items-center gap-3 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                                isActive ? 'bg-signal-soft text-signal' : 'text-ink-2 hover:bg-raised hover:text-ink'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {isActive && <span className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-signal rtl:left-auto rtl:right-0" />}
                                <item.icon size={14} className={isActive ? 'text-signal' : 'text-ink-3 group-hover:text-ink'} />
                                {t(item.label)}
                              </>
                            )}
                          </NavLink>
                        ))}
                      </nav>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="border-t border-line-soft px-3 py-3">
          <div className="relative">
            <button
              className="flex min-h-11 w-full items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-raised"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="relative grid h-9 w-9 shrink-0 place-items-center border border-signal/30 bg-signal/10 font-mono text-xs font-bold text-signal">
                {user ? initials(user.name) : '?'}
                <Corners className="h-2 w-2" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[12px] font-semibold text-ink-0">{user?.name}</span>
                <span className="block truncate font-mono text-[10px] text-ink-3">{user?.email}</span>
              </span>
              <ChevronDown size={14} className={`text-ink-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 border border-line-soft bg-elevated p-1 shadow-float">
                <Link
                  to="/app/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                >
                  <UserCog size={14} />
                  Profile
                </Link>
                <button
                  className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 font-mono text-[12px] uppercase tracking-[0.1em] text-danger transition-colors hover:bg-danger/10"
                  onClick={onLogout}
                >
                  <LogOut size={14} />
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 flex items-center gap-2 border-t border-line-soft pt-2.5 px-2 text-[9px] font-medium uppercase tracking-[0.18em] text-ink-3">
            <Blink className="bg-signal" />
            {t('allSystemsNominal')}
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 lg:ml-64 rtl:ml-0 rtl:lg:mr-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line-soft bg-canvas/85 px-3 backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-6">
          <button
            type="button"
            aria-label={t('openNavigation')}
            className="grid h-11 w-11 shrink-0 place-items-center border border-line-soft bg-raised text-ink-2 transition-colors hover:border-signal/40 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label={t('jumpTo')}
            className="group flex h-11 min-w-11 items-center justify-center gap-3 border border-line-soft bg-raised px-3 transition-colors hover:border-signal/40 md:h-auto md:w-56 md:justify-start md:px-3.5 md:py-2 xl:w-72"
          >
            <Search size={14} className="text-ink-3 group-hover:text-signal" />
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.15em] text-ink-3 md:inline">
              {t('jumpTo')}
            </span>
            <span className="ms-auto hidden items-center gap-1 font-mono text-[9px] text-ink-3 md:flex">
              <span className="border border-line-soft bg-elevated px-1.5 py-0.5">Ctrl</span>
              <span className="border border-line-soft bg-elevated px-1.5 py-0.5">K</span>
            </span>
          </button>
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] sm:gap-4">
            <Link
              to="/upcoming"
              aria-label={t('backToSite')}
              className="flex h-11 items-center gap-1.5 border border-line-soft bg-raised px-2.5 text-ink-2 transition-colors hover:border-signal/40 hover:text-ink sm:px-2.5 sm:py-1.5"
            >
              <Globe size={12} className="text-signal" />
              <span className="hidden sm:inline">{t('backToSite')}</span>
            </Link>
            <button
              onClick={toggleLang}
              title="Toggle language"
              aria-label="Toggle language"
              className="flex h-11 items-center gap-1.5 border border-line-soft bg-raised px-2.5 text-ink-2 transition-colors hover:border-signal/40 hover:text-ink sm:h-auto sm:py-1.5"
            >
              <Languages size={12} className="text-signal" />
              {lang === 'en' ? 'ع' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
              className="flex h-11 w-11 items-center justify-center border border-line-soft bg-raised text-ink-2 transition-colors hover:border-signal/40 hover:text-ink sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5"
            >
              {theme === 'dark' ? <Sun size={12} className="text-signal" /> : <Moon size={12} className="text-signal" />}
            </button>
            <span className="hidden xl:inline"><Clock /></span>
            <span className="hidden items-center gap-1.5 text-ink-3 lg:flex">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-ok" />
              {t('apiStable')}
            </span>
            <span className="hidden items-center gap-1.5 text-ink-3 md:flex">
              <Radio size={12} className="text-signal" />
              {t('sseLive')}
            </span>
          </div>
        </header>
        <div className="min-w-0 px-3 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}