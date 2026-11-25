import { Activity, Calendar, MapPin, Ticket, Users } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'
import { Corners } from '../../components/instruments'
import { ErrorBanner, Spinner, CountUp } from '../../components/ui'
import { usePublicEvents } from '../../lib/public'
import { useLanguage } from '../../lib/i18n'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import BlurText from '../../components/reactbits/BlurText'
import ShinyText from '../../components/reactbits/ShinyText'
import { PageAccents } from '../../components/public/PlayfulBits'

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

export default function PastWorks() {
  const { data: events, isLoading, error } = usePublicEvents('past')
  const { t, lang } = useLanguage()
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US'

  const totals = (events ?? []).reduce(
    (acc, e) => ({ attendees: acc.attendees + e.attendeeCount, tickets: acc.tickets + e.ticketCount, scans: acc.scans + e.scanCount }),
    { attendees: 0, tickets: 0, scans: 0 },
  )

  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,color-mix(in_srgb,var(--color-signal)_9%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-raised)_35%,transparent),transparent_28%)]" />
      </div>
      <PageAccents />

      <PublicNav />

      <header className="relative px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-soft to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
              <ShinyText text={t('pastEyebrow')} className="text-[11px] font-medium uppercase tracking-[0.24em]" color="var(--color-signal-dim)" shineColor="var(--color-signal)" speed={3.2} />
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink-0 sm:text-5xl lg:text-7xl">
                  <BlurText text={t('pastTitleA')} delay={55} animateBy="words" direction="bottom" className="block" />
                  <BlurText text={t('pastTitleB')} delay={75} animateBy="words" direction="bottom" className="block text-signal" />
                </div>
                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{t('pastBody')}</p>
              </div>

            </div>
          </Reveal>
        </div>
      </header>

      <section className="relative px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          {isLoading && <Spinner label={t('loadingArchive')} />}
          {error && (
            <div className="panel relative p-5">
              <Corners />
              <ErrorBanner error={error} />
            </div>
          )}

          {events && events.length > 0 && (
            <div className="mb-8 grid gap-px border border-line-soft bg-line-soft sm:grid-cols-3">
              {[
                [t('eventsOnRecord'), events.length],
                [t('attendeesServed'), totals.attendees],
                [t('gateScans'), totals.scans],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-paper/90 px-5 py-5 sm:px-6">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">{label}</p>
                  <p className="mt-2 font-display text-3xl font-semibold text-signal tabular-nums sm:text-4xl">
                    <CountUp value={Number(value)} />
                  </p>
                </div>
              ))}
            </div>
          )}

          {events && (
            <div className="space-y-4 sm:space-y-5">
              {events.length === 0 ? (
                <div className="panel relative overflow-hidden px-6 py-16 text-center sm:py-20">
                  <Corners />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-signal)_7%,transparent),transparent_55%)]" />
                  <p className="relative font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-4xl">{t('archiveEmptyTitle')}</p>
                  <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-3">{t('archiveEmptyBody')}</p>
                </div>
              ) : (
                events.map((e, i) => {
                  const done = e.status === 'COMPLETED'
                  const date = new Date(e.startAt)
                  return (
                    <Reveal key={e.id} delay={i * 0.05}>
                      <SpotlightCard
                        className="!rounded-none !border !border-line-soft !bg-raised/60 !p-0 !shadow-none backdrop-blur-sm transition-all duration-300 hover:!border-signal/30"
                        spotlightColor="rgba(232, 208, 139, 0.13)"
                      >
                        <article className="group relative overflow-hidden">
                          <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/0 to-transparent transition-all duration-500 group-hover:via-signal/40" />

                          <div className="grid gap-0 lg:grid-cols-[180px_1fr_280px]">
                        <div className="border-b border-line-soft/70 p-5 sm:p-6 lg:border-b-0 lg:border-e lg:border-line-soft/70">
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">ARC-{String(i + 1).padStart(2, '0')}</p>
                          <p className="mt-4 font-display text-5xl font-semibold leading-none tracking-tight text-ink-0 tabular-nums">{date.getDate()}</p>
                          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-signal">{date.toLocaleDateString(locale, { month: 'short' })}</p>
                          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">{date.toLocaleDateString(locale, { year: 'numeric' })}</p>
                        </div>

                        <div className="min-w-0 p-5 sm:p-6 lg:p-7">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`badge ${done ? 'badge-ok' : 'badge-neutral'}`}>{done ? t('completed') : t('archived')}</span>
                            <span className="badge badge-signal">{e.type.replace('_', ' ')}</span>
                            <span className="badge badge-neutral">{e.organization.name}</span>
                          </div>
                          <h2 className="mt-4 font-display text-2xl font-semibold leading-[1.15] tracking-tight text-ink-0 sm:text-3xl">{e.name}</h2>
                          {e.description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 line-clamp-2">{e.description}</p>}
                          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-[12px] text-ink-2">
                            <span className="inline-flex items-center gap-2"><Calendar size={14} className="shrink-0 text-signal-dim" />{date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="inline-flex items-center gap-2"><MapPin size={14} className="shrink-0 text-signal-dim" /><span className="truncate">{e.venueName || t('venueTba')}</span></span>
                          </div>
                        </div>

                        <div className="border-t border-line-soft/70 p-5 sm:p-6 lg:border-s lg:border-t-0 lg:border-line-soft/70">
                          <div className="grid grid-cols-3 gap-px border border-line-soft bg-line-soft">
                            {[
                              { Icon: Users, value: e.attendeeCount, label: t('attendeeCount') },
                              { Icon: Ticket, value: e.ticketCount, label: t('tickets') },
                              { Icon: Activity, value: e.scanCount, label: t('scanCount') },
                            ].map(({ Icon, value, label }) => (
                              <div key={label} className="bg-paper/80 px-3 py-3.5">
                                <Icon size={13} className="text-signal-dim" />
                                <p className="mt-2 font-display text-xl font-semibold text-ink-0 tabular-nums">{Number(value).toLocaleString()}</p>
                                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-ink-3">{label}</p>
                              </div>
                            ))}
                          </div>
                          <p className="mt-4 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-ink-3 lg:text-start">{t('recordSealed')}</p>
                        </div>
                          </div>
                        </article>
                      </SpotlightCard>
                    </Reveal>
                  )
                })
              )}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}