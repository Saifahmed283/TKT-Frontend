import { Activity, Calendar, MapPin, Ticket, Users } from 'lucide-react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import { Corners } from '../components/instruments'
import { ErrorBanner, Spinner, CountUp } from '../components/ui'
import { usePublicEvents } from '../lib/public'
import { useLanguage } from '../lib/i18n'

export default function PastWorks() {
  const { data: events, isLoading, error } = usePublicEvents('past')
  const { t, lang } = useLanguage()

  const totals = (events ?? []).reduce(
    (acc, e) => ({ attendees: acc.attendees + e.attendeeCount, tickets: acc.tickets + e.ticketCount, scans: acc.scans + e.scanCount }),
    { attendees: 0, tickets: 0, scans: 0 },
  )

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicNav />
      <header className="relative overflow-hidden px-4 pb-14 pt-32 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,162,92,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-signal">{t('pastEyebrow')}</p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight text-ink-0 sm:text-6xl lg:text-7xl">
            {t('pastTitleA')} <span className="text-outline">{t('pastTitleB')}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">{t('pastBody')}</p>
        </div>
      </header>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {isLoading && <Spinner label={t('loadingArchive')} />}
          {error && <div className="panel relative p-5"><Corners /><ErrorBanner error={error} /></div>}

          {events && events.length > 0 && (
            <div className="mb-10 grid gap-px border border-line-soft bg-line-soft sm:grid-cols-3">
              {[
                [t('eventsOnRecord'), events.length],
                [t('attendeesServed'), totals.attendees],
                [t('gateScans'), totals.scans],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-paper p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">{label}</p>
                  <p className="mt-2 font-display text-4xl font-bold text-signal tabular-nums"><CountUp value={Number(value)} /></p>
                </div>
              ))}
            </div>
          )}

          {events && (
            <div className="grid gap-5 md:grid-cols-2">
              {events.length === 0 && (
                <div className="panel relative p-10 text-center md:col-span-2">
                  <Corners />
                  <p className="font-display text-2xl font-bold uppercase tracking-wide text-ink-0">{t('archiveEmptyTitle')}</p>
                  <p className="mt-2 text-sm text-ink-3">{t('archiveEmptyBody')}</p>
                </div>
              )}
              {events.map((e) => {
                const done = e.status === 'COMPLETED'
                return (
                  <article key={e.id} className="group relative border border-line-soft bg-raised/70 p-6 transition-colors duration-300 hover:border-signal/40 sm:p-7">
                    <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex items-center justify-between gap-3">
                      <span className={`badge ${done ? 'badge-ok' : 'badge-neutral'}`}>{done ? t('completed') : t('archived')}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-3">{e.type.replace('_', ' ')}</span>
                    </div>
                    <h2 className="mt-4 font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink-0">{e.name}</h2>
                    {e.description && <p className="mt-2 text-sm leading-relaxed text-ink-3">{e.description}</p>}
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-ink-3">
                      <span className="inline-flex items-center gap-2"><Calendar size={13} className="text-signal" />{new Date(e.startAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="inline-flex items-center gap-2"><MapPin size={13} className="text-signal" />{e.venueName || t('venueTba')}</span>
                      <span>{e.organization.name}</span>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-px border border-line-soft bg-line-soft">
                      {[
                        { Icon: Users, value: e.attendeeCount, label: t('attendeeCount') },
                        { Icon: Ticket, value: e.ticketCount, label: t('tickets') },
                        { Icon: Activity, value: e.scanCount, label: t('scanCount') },
                      ].map(({ Icon, value, label }) => (
                        <div key={label} className="bg-elevated/30 px-3 py-3.5">
                          <Icon size={13} className="text-signal" />
                          <p className="mt-1.5 font-display text-2xl font-bold text-ink-0 tabular-nums">{Number(value).toLocaleString()}</p>
                          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">{label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">{t('recordSealed')}</p>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  )
}
