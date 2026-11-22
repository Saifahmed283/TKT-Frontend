import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, QrCode, ShieldCheck, Ticket } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import ReservationModal from '../components/public/ReservationModal'
import { EventCard } from './UpcomingEvents'
import { Corners, Blink } from '../components/instruments'
import { Spinner, ErrorBanner } from '../components/ui'
import { useLanguage } from '../lib/i18n'
import { usePublicEvents, type PublicEvent } from '../lib/public'

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative border border-line-soft bg-raised/50 p-5">
      <Corners className="opacity-50" />
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">{n}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide text-ink-0">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-3">{body}</p>
    </div>
  )
}

export default function Landing() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const { data: events, isLoading, error } = usePublicEvents('upcoming')
  const [reserving, setReserving] = useState<PublicEvent | null>(null)
  const featured = (events ?? []).slice(0, 3)

  const fadeUp = reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicNav />

      <header className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,162,92,0.16),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(200,162,92,0.08),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <motion.div {...fadeUp} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 border border-line-soft bg-raised/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-2">
              <Blink className="bg-signal" />
              {t('heroEyebrow')}
            </div>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight text-ink-0 sm:text-6xl lg:text-7xl">
              {t('heroTitleA')}
              <br />
              <span className="text-outline">{t('heroTitleB')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">{t('heroBody')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/upcoming" className="btn-primary !px-6 !py-3 text-sm sm:text-[13px]">
                {t('browseUpcoming')}
                <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-ghost !px-6 !py-3 text-sm sm:text-[13px]">{t('howItWorks')}</a>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: QrCode, title: t('trustSigned'), body: t('trustSignedBody') },
                { icon: Ticket, title: t('trustFast'), body: t('trustFastBody') },
                { icon: ShieldCheck, title: t('trustSecure'), body: t('trustSecureBody') },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={reduce ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.08 }}
                  className="group border border-line-soft/80 bg-raised/35 p-4 backdrop-blur-sm transition-colors hover:border-signal/35 hover:bg-raised/55"
                >
                  <item.icon size={16} className="text-signal transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-1">{item.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.55, delay: reduce ? 0 : 0.08 }} className="relative">
            <div className="panel relative overflow-hidden p-5 sm:p-6">
              <Corners />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent" />
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-3">{t('upcomingEvents')}</p>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ok"><Blink className="bg-ok" />{t('reservationsOpen')}</span>
              </div>
              <div className="mt-5 space-y-4">
                {(featured.length ? featured : [{ id: 'skeleton' } as any]).slice(0, 2).map((e: any, idx: number) => (
                  <div key={e.id ?? idx} className="border border-line-soft bg-elevated/25 p-4">
                    {e.id === 'skeleton' ? (
                      <div className="animate-pulse space-y-3"><div className="h-3 w-24 bg-line-soft" /><div className="h-6 w-3/4 bg-line-soft" /><div className="h-3 w-1/2 bg-line-soft" /></div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">{new Date(e.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            <p className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-ink-0">{e.name}</p>
                            <p className="mt-1 text-xs text-ink-3">{e.venueName || t('venueTba')}</p>
                          </div>
                          <CalendarDays size={16} className="text-signal" />
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">{e.ticketTypes?.[0] ? `${t('from')} ${Number(e.ticketTypes[0].price) === 0 ? t('free') : `$${Number(e.ticketTypes[0].price).toLocaleString()}`}` : t('tickets')}</span>
                          <button onClick={() => setReserving(e)} className="btn-primary !px-4 !py-2 text-[11px]">{t('reserve')}</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-line-soft pt-4">
                <Link to="/upcoming" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-signal transition-colors hover:text-signal-300">
                  {t('viewAllEvents')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-signal">{t('featuredEvents')}</p>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0 sm:text-5xl">{t('upcomingEvents')}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-3">{t('featuredEventsBody')}</p>
            </div>
            <Link to="/upcoming" className="btn-ghost !px-4 !py-2.5">{t('viewAllEvents')}</Link>
          </div>

          <div className="mt-10">
            {isLoading && <Spinner label={t('loadingEvents')} />}
            {error && <div className="panel relative p-5"><Corners /><ErrorBanner error={error} /></div>}
            {!isLoading && !error && featured.length === 0 && (
              <div className="panel relative p-10 text-center"><Corners /><p className="font-display text-3xl font-bold uppercase text-ink-0">{t('noUpcomingTitle')}</p><p className="mt-3 text-sm text-ink-3">{t('noUpcomingBody')}</p></div>
            )}
            <div className="space-y-5">
              {featured.map((e, i) => <EventCard key={e.id} e={e} i={i} onReserve={setReserving} />)}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-line-soft px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-signal">{t('simpleSteps')}</p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0 sm:text-5xl">{t('howItWorks')}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-3">{t('simpleStepsBody')}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[{ n: '01', title: t('step1Title'), body: t('step1Body') }, { n: '02', title: t('step2Title'), body: t('step2Body') }, { n: '03', title: t('step3Title'), body: t('step3Body') }].map((s, i) => (
              <motion.div key={s.n} initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay: i * 0.08 }}>
                <Step n={s.n} title={s.title} body={s.body} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
      {reserving && <ReservationModal event={reserving} onClose={() => setReserving(null)} />}
    </div>
  )
}
