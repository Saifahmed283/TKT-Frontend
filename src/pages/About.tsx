import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import { Corners, Blink, CountUp } from '../components/instruments'
import { ErrorBanner, Spinner } from '../components/ui'
import { usePublicReviews, usePublicStats } from '../lib/public'

const PARTNERS = ['NOVA EVENTS', 'SIGNALWORKS', 'MERIDIAN STAGES', 'AXIS MEDIA', 'HALCYON PROD', 'ORBITAL SOUND']

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= rating ? 'fill-signal text-signal' : 'text-ink-600'} />
      ))}
    </div>
  )
}

export default function About() {
  const stats = usePublicStats()
  const reviews = usePublicReviews()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicNav />

      <header className="bg-blueprint relative overflow-hidden px-5 pb-16 pt-36 sm:px-8">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute right-8 top-28 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3/70 lg:block">
            ABOUT · UNIT TKT
          </span>
          <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full border border-signal/10" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-ink-2">
            <Blink className="bg-signal" />
            About us
            <span className="text-ink-3">/ unit briefing</span>
          </div>
          <h1 className="mt-5 font-display text-6xl font-bold uppercase leading-[0.92] tracking-tight text-ink-0 sm:text-7xl">
            We run the night
            <br />
            <span className="text-outline">so you don't have to.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            TKT is the operations layer for live events — the people behind the gates, the screens, and the
            seamless entry of thousands of guests. Born from production floors, built for them.
          </p>
        </div>
      </header>

      {stats.isLoading && <div className="py-10"><Spinner label="Compiling unit stats" /></div>}
      {stats.error && (
        <section className="px-5 pt-10 sm:px-8">
          <div className="panel relative mx-auto max-w-7xl p-5">
            <Corners />
            <ErrorBanner error={stats.error} />
          </div>
        </section>
      )}

      {stats.data && (
        <>
          <section className="px-5 py-16 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ['Events run', stats.data.eventsTotal, '', 0],
                    ['Attendees served', stats.data.attendees, '+', 0],
                    ['Gate scans', stats.data.scans, '', 0],
                    ['Avg. review score', Math.round(stats.data.reviews.average * 10), '★', 1],
                  ] as const
                ).map(([label, value, suffix, decimals]) => (
                  <div key={label} className="group relative bg-paper p-7 transition-colors duration-300 hover:bg-raised">
                    <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">{label}</p>
                    <p className="mt-2 font-display text-5xl font-bold leading-none tracking-tight text-ink-0 tabular-nums">
                      <CountUp value={value} suffix={suffix} scale={decimals > 0 ? 10 : 1} decimals={decimals} />
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
                      {stats.data.reviews.count} verified reviews
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-line-soft px-5 py-20 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-signal">
                <span className="text-ink-3">02</span>
                <span className="h-px w-12 bg-signal/40" />
                <span>Most popular shots</span>
              </div>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0 sm:text-5xl">
                The records
                <span className="text-outline"> speak first.</span>
              </h2>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.data.topEvents.map((e, i) => (
                  <div key={e.id} className="group relative border border-line-soft bg-raised p-6 transition-colors duration-300 hover:border-signal/40">
                    <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-outline-ink font-display text-5xl font-bold leading-none">0{i + 1}</span>
                      <span className="badge badge-signal">{e.type.replace('_', ' ')}</span>
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold uppercase tracking-wide text-ink-0">{e.name}</h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
                      {e.venueName ?? 'Venue TBA'} · {new Date(e.startAt).getFullYear()}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-px border border-line-soft bg-line-soft">
                      <div className="bg-ink-900 px-3 py-2.5">
                        <p className="font-display text-xl font-bold text-signal tabular-nums">{e.attendeeCount.toLocaleString()}</p>
                        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-3">attendees</p>
                      </div>
                      <div className="bg-ink-900 px-3 py-2.5">
                        <p className="font-display text-xl font-bold text-signal tabular-nums">{e.scanCount.toLocaleString()}</p>
                        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-3">scans</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-signal">
            <span className="text-ink-3">03</span>
            <span className="h-px w-12 bg-signal/40" />
            <span>Partners</span>
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0 sm:text-5xl">
            Trusted by the
            <span className="text-outline"> people who build.</span>
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-px border border-line-soft bg-line-soft sm:grid-cols-3 lg:grid-cols-6">
            {PARTNERS.map((p) => (
              <div key={p} className="bg-paper px-4 py-6 text-center">
                <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-ink-2">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-signal">
            <span className="text-ink-3">04</span>
            <span className="h-px w-12 bg-signal/40" />
            <span>Field reports</span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0 sm:text-5xl">
              From the
              <span className="text-outline"> floor.</span>
            </h2>
            {reviews.data && reviews.data.length > 0 && (
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">
                {reviews.data.length} reports · avg{' '}
                <span className="text-signal">{(reviews.data.reduce((a, r) => a + r.rating, 0) / reviews.data.length).toFixed(1)}</span>★
              </p>
            )}
          </div>

          {reviews.isLoading && <div className="py-8"><Spinner label="Loading field reports" /></div>}
          {reviews.error && (
            <div className="panel relative mt-6 p-5">
              <Corners />
              <ErrorBanner error={reviews.error} />
            </div>
          )}

          {reviews.data && (
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.data.map((r) => (
                <figure key={r.id} className="group relative border border-line-soft bg-raised p-6 transition-colors duration-300 hover:border-signal/40">
                  <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-center justify-between">
                    <Stars rating={r.rating} />
                    {r.eventName && <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">{r.eventName}</span>}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink-2">"{r.content}"</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-line-soft pt-4">
                    <span className="grid h-8 w-8 place-items-center border border-signal/30 bg-signal/10 font-mono text-[10px] text-signal">
                      {r.author.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </span>
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-0">{r.author}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">{r.role ?? 'Guest'}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-blueprint relative overflow-hidden border-t border-line-soft px-5 py-24 sm:px-8">
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-outline-ink font-display text-7xl font-bold uppercase leading-none tracking-tight">THANK YOU</p>
          <p className="mt-8 text-base leading-relaxed text-ink-2 sm:text-lg">
            To every organizer, gate agent, and guest who trusted us with their night — this system exists
            because of you. The next event is already on its way.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/upcoming" className="btn-primary px-6 py-3 text-base">
              See what's coming
              <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn-ghost px-6 py-3 text-base">
              Start a production
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}