import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Bus, Calendar, Lock, MapPin, Ticket, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'
import ReservationModal from '../../components/public/ReservationModal'
import { Corners, Blink } from '../../components/instruments'
import { ErrorBanner, Spinner } from '../../components/ui'
import { useLanguage } from '../../lib/i18n'
import { usePublicEvents, type PublicEvent, type PublicTicketType, type ReservationAvailability } from '../../lib/public'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import BlurText from '../../components/reactbits/BlurText'
import ShinyText from '../../components/reactbits/ShinyText'

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
          {i > 0 && <span className="text-ink-3/60">:</span>}
          <span className="border border-line-soft bg-canvas/50 px-2 py-1 text-[11px] font-semibold tabular-nums text-signal">
            {v}
            <span className="ms-0.5 text-[9px] font-normal text-ink-3">{l}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

function money(price: string, lang: string, currency = 'EGP') {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return lang === 'ar' ? 'مجاني' : 'Free'
  return `${currency} ${n.toLocaleString()}`
}

function AvailabilityBadge({ availability }: { availability: ReservationAvailability }) {
  const { t } = useLanguage()
  const map = {
    open: { label: t('reservationsOpen'), cls: 'badge badge-ok', blink: true },
    upcoming: { label: t('openingSoon'), cls: 'badge badge-signal', blink: true },
    sold_out: { label: t('soldOut'), cls: 'badge badge-err', blink: false },
    locked: { label: t('reservationsLocked'), cls: 'badge badge-err', blink: false },
    closed: { label: t('reservationsClosed'), cls: 'badge badge-err', blink: false },
  } as const
  const cfg = map[availability]
  return (
    <span className={cfg.cls}>
      {cfg.blink ? <Blink className={availability === 'open' ? 'bg-ok' : 'bg-signal'} /> : <Lock size={10} />}
      {cfg.label}
    </span>
  )
}

function TicketCapacity({ ticket }: { ticket: PublicTicketType }) {
  const { t } = useLanguage()
  if (ticket.quota == null) return null
  const pct = Math.min(100, Math.round((ticket.sold / ticket.quota) * 100))
  return (
    <div className="mt-2.5">
      <div className="h-px w-full overflow-hidden bg-line-soft">
        <div className={`h-full transition-all duration-500 ${pct >= 100 ? 'bg-danger' : 'bg-signal'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3">
        {ticket.sold}/{ticket.quota} {t('reserved')}
      </p>
    </div>
  )
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function EventCard({ e, i, onReserve, onBusTickets }: { e: PublicEvent; i: number; onReserve: (e: PublicEvent) => void; onBusTickets?: (e: PublicEvent) => void }) {
  const { t, lang } = useLanguage()
  const avail = e.registration.availability
  const canReserve = avail === 'open'
  const opensSoon = avail === 'upcoming' && e.registration.window.start
  const date = new Date(e.startAt)
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US'

  return (
    <Reveal delay={i * 0.06}>
      <SpotlightCard
        className="!rounded-none !border !border-line-soft !bg-raised/60 !p-0 !shadow-none backdrop-blur-sm transition-all duration-300 hover:!border-signal/30"
        spotlightColor="rgba(232, 208, 139, 0.13)"
      >
        <article className="group relative overflow-hidden">
          <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/0 to-transparent transition-all duration-500 group-hover:via-signal/40" />

          <div className="grid gap-0 lg:grid-cols-[200px_1fr_220px]">
        {/* Date column */}
        <div className="relative border-b border-line-soft/70 p-5 sm:p-6 lg:border-b-0 lg:border-e lg:border-line-soft/70">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">EVT-{String(i + 1).padStart(2, '0')}</p>
          <div className="mt-4 flex items-end gap-3 lg:block">
            <p className="font-display text-5xl font-semibold leading-none tracking-tight text-ink-0 tabular-nums sm:text-6xl">
              {date.getDate()}
            </p>
            <div className="pb-1 lg:mt-2 lg:pb-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
                {date.toLocaleDateString(locale, { month: 'short' })}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">
                {date.toLocaleDateString(locale, { year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="mt-4 lg:mt-6">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('doorsOpen')}</p>
            <LiveCountdown startAt={e.startAt} compact />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-signal">{e.type.replace('_', ' ')}</span>
            <span className="badge badge-neutral">{e.organization.name}</span>
            <AvailabilityBadge availability={avail} />
          </div>

          <h2 className="mt-4 font-display text-2xl font-semibold leading-[1.15] tracking-tight text-ink-0 sm:text-3xl lg:text-[2rem]">
            {e.name || t('untitledEvent')}
          </h2>
          {e.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 line-clamp-2">{e.description}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-[12px] text-ink-2">
            <span className="inline-flex items-center gap-2">
              <Calendar size={14} className="shrink-0 text-signal-dim" />
              {date.toLocaleString(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-signal-dim" />
              <span className="truncate">{e.venueName || t('venueTba')}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Users size={14} className="shrink-0 text-signal-dim" />
              {e.attendeeCount} {t('attendeeCount')}
            </span>
          </div>

          {e.ticketTypes.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">{t('ticketOptions')}</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {e.ticketTypes.slice(0, 3).map((tt) => (
                  <div
                    key={tt.id}
                    className={`border px-3.5 py-3 transition-colors ${
                      tt.soldOut ? 'border-danger/20 bg-danger/[0.03]' : 'border-line-soft/80 bg-canvas/30 hover:border-signal/20'
                    }`}
                  >
                    <p className={`flex items-center justify-between gap-3 text-[12px] ${tt.soldOut ? 'text-ink-3' : 'text-ink-1'}`}>
                      <span className={`inline-flex items-center gap-2 font-medium ${tt.soldOut ? 'line-through' : ''}`}>
                        <Ticket size={12} className={tt.soldOut ? 'text-ink-3' : 'text-signal-dim'} />
                        <span className="truncate">{tt.name}</span>
                      </span>
                      <span className={`shrink-0 font-mono text-[11px] ${tt.soldOut ? 'text-ink-3' : 'text-signal'}`}>
                        {money(tt.price, lang, tt.currency ?? 'EGP')}
                      </span>
                    </p>
                    <TicketCapacity ticket={tt} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action column */}
        <div className="flex flex-col justify-between gap-4 border-t border-line-soft/70 p-5 sm:p-6 lg:border-s-0 lg:border-t-0 lg:border-s lg:border-line-soft/70">
          <div className="space-y-3">
            {(e.buses?.length ?? 0) > 0 ? (
              <>
                {canReserve && (
                  <button onClick={() => onReserve(e)} className="btn-primary group/btn w-full !py-3.5">
                    {t('reserve')}
                    <ArrowUpRight size={14} className="transition-transform duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 rtl:-scale-x-100" />
                  </button>
                )}
                {canReserve && onBusTickets && (
                  <button onClick={() => onBusTickets(e)} className="btn-ghost group/btn w-full !py-3.5 border border-signal/30 text-signal hover:bg-signal/5">
                    <Bus size={14} className="transition-transform duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 rtl:-scale-x-100" />
                    {t('busTickets') ?? 'Bus tickets'}
                  </button>
                )}
                {!canReserve && (
                  <button disabled className="btn-ghost w-full !py-3.5 !cursor-default !opacity-60">
                    {avail === 'upcoming' ? t('openingSoon') : avail === 'sold_out' ? t('soldOut') : t('locked')}
                  </button>
                )}
                {opensSoon && (
                  <div className="border border-signal/15 bg-signal/[0.04] px-3 py-3 text-center">
                    <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('openingSoon')}</p>
                    <div className="flex justify-center">
                      <LiveCountdown startAt={opensSoon} compact />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {canReserve ? (
                  <button onClick={() => onReserve(e)} className="btn-primary group/btn w-full !py-3.5">
                    {t('reserve')}
                    <ArrowUpRight size={14} className="transition-transform duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 rtl:-scale-x-100" />
                  </button>
                ) : (
                  <button disabled className="btn-ghost w-full !py-3.5 !cursor-default !opacity-60">
                    {avail === 'upcoming' ? t('openingSoon') : avail === 'sold_out' ? t('soldOut') : t('locked')}
                  </button>
                )}
                {opensSoon && (
                  <div className="border border-signal/15 bg-signal/[0.04] px-3 py-3 text-center">
                    <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('openingSoon')}</p>
                    <div className="flex justify-center">
                      <LiveCountdown startAt={opensSoon} compact />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <p className="text-center text-[9px] font-medium uppercase tracking-[0.16em] text-ink-3 lg:text-start">
            {t('secureBooking')}
          </p>
        </div>
          </div>
        </article>
      </SpotlightCard>
    </Reveal>
  )
}

export default function UpcomingEvents() {
  const [reserving, setReserving] = useState<PublicEvent | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()
  const { data: events, isLoading, error } = usePublicEvents('upcoming')
  const preselectedEventId = searchParams.get('event')

  useEffect(() => {
    if (!preselectedEventId || !events) return
    const event = events.find((e) => e.id === preselectedEventId)
    if (event) {
      setReserving(event)
      setSearchParams({}, { replace: true })
    }
  }, [preselectedEventId, events, setSearchParams])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,color-mix(in_srgb,var(--color-signal)_9%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-raised)_35%,transparent),transparent_28%)]" />
      </div>

      <PublicNav />

      <header className="relative px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-soft to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{t('upcomingEyebrow')}</p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink-0 sm:text-5xl lg:text-7xl">
                  <BlurText text={t('upcomingTitleA')} delay={55} animateBy="words" direction="bottom" className="block" />
                  <BlurText text={t('upcomingTitleB')} delay={75} animateBy="words" direction="bottom" className="block text-signal" />
                </div>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{t('upcomingBody')}</p>
              </div>

              {events && events.length > 0 && (
                <div className="flex items-center gap-4 border border-line-soft/70 bg-raised/40 px-5 py-4 backdrop-blur-sm lg:mb-2">
                  <p className="font-display text-4xl font-semibold tabular-nums text-[color:var(--upcoming-count-label)]">{events.length}</p>
                  <ShinyText text={t('eventsAvailable')} className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--upcoming-count-label)]" color="var(--upcoming-count-label)" shineColor="var(--color-signal)" speed={2.8} />
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </header>

      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          {isLoading && <Spinner label={t('loadingEvents')} />}
          {error && (
            <div className="panel relative p-5">
              <Corners />
              <ErrorBanner error={error} />
            </div>
          )}
          {events && (
            <div className="space-y-4 sm:space-y-5">
              {events.length === 0 ? (
                <div className="panel relative overflow-hidden px-6 py-16 text-center sm:py-20">
                  <Corners />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,208,139,0.06),transparent_55%)]" />
                  <p className="relative font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-4xl">{t('noUpcomingTitle')}</p>
                  <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-3">{t('noUpcomingBody')}</p>
                </div>
              ) : (
                events.map((e, i) => (
                  <EventCard
                    key={e.id}
                    e={e}
                    i={i}
                    onReserve={setReserving}
                    onBusTickets={e.buses?.length ? (e) => setReserving(e) : undefined}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
      {reserving && <ReservationModal event={reserving} onClose={() => setReserving(null)} />}
    </div>
  )
}