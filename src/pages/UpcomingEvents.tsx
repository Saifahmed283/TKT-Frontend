import { useEffect, useState } from 'react'
import { Calendar, Lock, MapPin, Ticket, Users } from 'lucide-react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import ReservationModal from '../components/public/ReservationModal'
import { Corners, Blink } from '../components/instruments'
import { ErrorBanner, Spinner } from '../components/ui'
import { useLanguage } from '../lib/i18n'
import { usePublicEvents, type PublicEvent, type PublicTicketType, type ReservationAvailability } from '../lib/public'

function LiveCountdown({ startAt, compact = false }: { startAt: string; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const diff = Math.max(0, new Date(startAt).getTime() - now)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const cells = compact ? [[pad(h + d * 24), 'h'], [pad(m), 'm']] : [[pad(d), 'd'], [pad(h), 'h'], [pad(m), 'm']]
  return (
    <div className="flex items-center gap-1.5 font-mono">
      {cells.map(([v, l], i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-3">:</span>}
          <span className="border border-line-soft bg-elevated/40 px-2 py-1 text-[11px] font-semibold tabular-nums text-signal">{v}<span className="ms-0.5 text-[9px] text-ink-3">{l}</span></span>
        </span>
      ))}
    </div>
  )
}

function money(price: string, lang: string) {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return lang === 'ar' ? 'مجاني' : 'Free'
  return `$${n.toLocaleString()}`
}

function AvailabilityBadge({ availability }: { availability: ReservationAvailability }) {
  const { t } = useLanguage()
  const map = {
    open: { label: t('reservationsOpen'), cls: 'badge badge-ok', blink: true },
    upcoming: { label: t('openingSoon'), cls: 'badge badge-neutral', blink: true },
    sold_out: { label: t('soldOut'), cls: 'badge badge-err', blink: false },
    locked: { label: t('reservationsLocked'), cls: 'badge badge-err', blink: false },
    closed: { label: t('reservationsClosed'), cls: 'badge badge-err', blink: false },
  } as const
  const cfg = map[availability]
  return <span className={cfg.cls}>{cfg.blink ? <Blink className={availability === 'open' ? 'bg-ok' : 'bg-signal'} /> : <Lock size={10} />}{cfg.label}</span>
}

function TicketCapacity({ ticket }: { ticket: PublicTicketType }) {
  const { t } = useLanguage()
  if (ticket.quota == null) return null
  const pct = Math.min(100, Math.round((ticket.sold / ticket.quota) * 100))
  return (
    <div className="mt-2">
      <div className="h-1 w-full overflow-hidden bg-ink-800/60"><div className={`h-full ${pct >= 100 ? 'bg-danger' : 'bg-signal'}`} style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">{ticket.sold}/{ticket.quota} {t('reserved')}</p>
    </div>
  )
}

export function EventCard({ e, i, onReserve }: { e: PublicEvent; i: number; onReserve: (e: PublicEvent) => void }) {
  const { t, lang } = useLanguage()
  const avail = e.registration.availability
  const canReserve = avail === 'open'
  const opensSoon = avail === 'upcoming' && e.registration.window.start
  return (
    <article className="group relative overflow-hidden border border-line-soft bg-raised/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-signal/35 hover:shadow-[0_20px_60px_-30px_rgba(0,0,0,.7)]">
      <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[180px_1fr_auto] lg:items-start lg:gap-8">
        <div className="flex items-end justify-between gap-4 lg:block">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-3">EVT-{String(i + 1).padStart(2, '0')}</p>
            <p className="mt-2 font-display text-5xl font-bold leading-none tracking-tight text-ink-0 tabular-nums">{new Date(e.startAt).getDate()}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">{new Date(e.startAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="lg:mt-4"><LiveCountdown startAt={e.startAt} compact /></div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-signal">{e.type.replace('_', ' ')}</span>
            <span className="badge badge-neutral">{e.organization.name}</span>
            <AvailabilityBadge availability={avail} />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink-0 sm:text-3xl">{e.name || t('untitledEvent')}</h2>
          {e.description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 line-clamp-2">{e.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-3">
            <span className="inline-flex items-center gap-2"><Calendar size={13} className="text-signal" />{new Date(e.startAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={13} className="text-signal" />{e.venueName || t('venueTba')}</span>
            <span className="inline-flex items-center gap-2"><Users size={13} className="text-signal" />{e.attendeeCount} {t('attendeeCount')}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {e.ticketTypes.slice(0, 3).map((tt) => (
              <div key={tt.id} className={`border px-3 py-3 ${tt.soldOut ? 'border-danger/25 bg-danger/5' : 'border-line-soft bg-elevated/20'}`}>
                <p className={`flex items-center justify-between gap-2 text-[11px] font-medium ${tt.soldOut ? 'text-ink-3 line-through' : 'text-ink-1'}`}>
                  <span className="inline-flex items-center gap-2"><Ticket size={12} className="text-signal" />{tt.name}</span>
                  <span className="font-mono text-signal">{money(tt.price, lang)}</span>
                </p>
                <TicketCapacity ticket={tt} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 lg:min-w-[180px] lg:items-end">
          {canReserve ? (
            <button onClick={() => onReserve(e)} className="btn-primary w-full !py-3 lg:w-auto">{t('reserve')}</button>
          ) : (
            <button disabled className="btn-ghost w-full !py-3 lg:w-auto">{avail === 'upcoming' ? t('openingSoon') : avail === 'sold_out' ? t('soldOut') : t('locked')}</button>
          )}
          {opensSoon && <div className="text-center lg:text-end"><p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">{t('openingSoon')}</p><LiveCountdown startAt={opensSoon} compact /></div>}
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3 lg:text-end">{t('secureBooking')}</p>
        </div>
      </div>
    </article>
  )
}

export default function UpcomingEvents() {
  const [reserving, setReserving] = useState<PublicEvent | null>(null)
  const { t } = useLanguage()
  const { data: events, isLoading, error } = usePublicEvents('upcoming')

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicNav />
      <header className="relative overflow-hidden px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,162,92,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-signal">{t('upcomingEyebrow')}</p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight text-ink-0 sm:text-6xl lg:text-7xl">
            {t('upcomingTitleA')} <span className="text-outline">{t('upcomingTitleB')}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">{t('upcomingBody')}</p>
        </div>
      </header>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {isLoading && <Spinner label={t('loadingEvents')} />}
          {error && <div className="panel relative p-5"><Corners /><ErrorBanner error={error} /></div>}
          {events && (
            <div className="space-y-5">
              {events.length === 0 ? (
                <div className="panel relative p-10 text-center">
                  <Corners />
                  <p className="font-display text-3xl font-bold uppercase tracking-wide text-ink-0">{t('noUpcomingTitle')}</p>
                  <p className="mt-3 text-sm text-ink-3">{t('noUpcomingBody')}</p>
                </div>
              ) : events.map((e, i) => <EventCard key={e.id} e={e} i={i} onReserve={setReserving} />)}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
      {reserving && <ReservationModal event={reserving} onClose={() => setReserving(null)} />}
    </div>
  )
}
