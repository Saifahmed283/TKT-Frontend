import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RefreshCw, Users, UserCheck, Clock, Smartphone, ScanLine, CheckCircle2, XCircle, CalendarDays, ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { StatCard } from '../components/dashboard/StatCard'
import { ReservationsChart } from '../components/dashboard/ReservationsChart'
import { LiveActivityFeed, type FeedActivity } from '../components/dashboard/LiveActivityFeed'
import { FullPageSpinner, InlineError } from '../components/ui/spinner'
import { Corners, Blink } from '../components/instruments'
import { useLanguage } from '../lib/i18n'
import { useState } from 'react'

type DashboardData = {
  kpis: {
    events: number
    totalGuests: number
    checkedIn: number
    pendingEntry: number
    totalDevices: number
    activeDevices: number
    todayScans: number
    validScans: number
    invalidScans: number
  }
  reservations: { date: string; count: number }[]
  recentActivity: FeedActivity[]
}

const REFRESH_MS = 30_000

export default function Dashboard() {
  const { t } = useLanguage()
  const [showChart, setShowChart] = useState(false)

  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: ({ signal }) => api.get<DashboardData>('/dashboard', { signal }),
    refetchInterval: REFRESH_MS,
  })

  if (q.isLoading) return <FullPageSpinner label="Loading control room…" />
  if (q.isError) return <InlineError message="Could not load the dashboard." onRetry={() => q.refetch()} />

  const { kpis, reservations, recentActivity } = q.data!

  return (
    <div className="animate-fade-in space-y-6">
      <div className="panel relative flex flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-signal/10 blur-3xl" />
        <Corners />
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-ink-0">{t('overview')}</h1>
          <p className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">
            <Blink className="bg-ok" />
            {kpis.events} event{kpis.events === 1 ? '' : 's'} · {t('dashboardSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/app/events" className="btn-ghost !py-1.5 text-xs">
            All events <ArrowRight size={13} />
          </Link>
          <button className="btn-ghost !py-1.5 text-xs" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={`size-3.5 ${q.isFetching ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>

      {kpis.events === 0 ? (
        <div className="panel relative flex flex-col items-center gap-4 px-6 py-20 text-center">
          <Corners />
          <div className="grid h-14 w-14 place-items-center border border-signal/30 bg-signal/10 text-signal">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-ink-0">No events yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">
              Create your first event and the dashboard lights up — guests, scans and reservations in real time.
            </p>
          </div>
          <Link to="/app/events" className="btn-primary">
            Create an event
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t('totalGuests')} value={kpis.totalGuests.toLocaleString()} icon={<Users className="size-5 sm:size-6" />} variant="primary" />
            <StatCard title={t('checkedIn')} value={kpis.checkedIn.toLocaleString()} icon={<UserCheck className="size-5 sm:size-6" />} variant="success" />
            <StatCard
              title={t('pendingEntry')}
              value={kpis.pendingEntry.toLocaleString()}
              icon={<Clock className="size-5 sm:size-6" />}
              variant="warning"
              onClick={() => setShowChart((s) => !s)}
            />
            <StatCard title={t('activeDevices')} value={`${kpis.activeDevices}/${kpis.totalDevices}`} icon={<Smartphone className="size-5 sm:size-6" />} />
          </div>

          {showChart && <ReservationsChart data={reservations} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title={t('todayScans')} value={kpis.todayScans.toLocaleString()} icon={<ScanLine className="size-5 sm:size-6" />} variant="primary" />
            <StatCard title={t('validScans')} value={kpis.validScans.toLocaleString()} icon={<CheckCircle2 className="size-5 sm:size-6" />} variant="success" />
            <StatCard title={t('invalidScans')} value={kpis.invalidScans.toLocaleString()} icon={<XCircle className="size-5 sm:size-6" />} variant="danger" />
          </div>

          <LiveActivityFeed activities={recentActivity} />
        </>
      )}
    </div>
  )
}