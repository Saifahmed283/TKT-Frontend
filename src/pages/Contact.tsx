import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Mail, MapPin, Phone, Radio, Ticket } from 'lucide-react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import { Corners, Blink } from '../components/instruments'
import { ErrorBanner } from '../components/ui'
import { api } from '../lib/api'

const SERVICE_STEPS = [
  ['01', 'Consult', 'Tell us about the event — size, venue, timeline, and your team.'],
  ['02', 'Blueprint', 'We model your structure: teams, areas, ticket types, and roles.'],
  ['03', 'Operate', 'Your control room goes live with credentials, gates, and realtime ops.'],
  ['04', 'Report', 'Post-event analytics, attendance records, and a sealed audit trail.'],
]

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState<{ id: string } | null>(null)

  const submit = useMutation({
    mutationFn: () =>
      api.post<{ id: string; status: string }>('/public/contact', {
        name,
        email,
        orgName: orgName || undefined,
        eventType: eventType || undefined,
        eventDate: eventDate || undefined,
        message,
      }),
    onSuccess: (data) => setSent({ id: data.id }),
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || message.trim().length < 10) return
    submit.mutate()
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <PublicNav />

      <header className="bg-blueprint relative overflow-hidden px-5 pb-16 pt-36 sm:px-8">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute right-8 top-28 hidden font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3/70 lg:block">
            CHANNEL OPEN
          </span>
          <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full border border-signal/10" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-ink-2">
            <Blink className="bg-signal" />
            Contact us
            <span className="text-ink-3">/ channel open</span>
          </div>
          <h1 className="mt-5 font-display text-6xl font-bold uppercase leading-[0.92] tracking-tight text-ink-0 sm:text-7xl">
            From zero
            <br />
            <span className="text-outline">to hero.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            Planning an event and don't know where to start? We take your idea from a blank page to a running
            control room — production, credentials, gates, and reporting included.
          </p>
        </div>
      </header>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-signal">
              <span className="text-ink-3">01</span>
              <span className="h-px w-12 bg-signal/40" />
              <span>How we take over</span>
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0">
              Your event,
              <br />
              <span className="text-outline">fully instrumented.</span>
            </h2>

            <div className="mt-10 space-y-6">
              {SERVICE_STEPS.map(([n, title, body]) => (
                <div key={n} className="flex gap-4">
                  <span className="text-outline-ink shrink-0 font-display text-4xl font-bold leading-none">{n}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-ink-0">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-3">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 space-y-4 border-t border-line-soft pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">Direct channels</p>
              <a href="mailto:hello@tkt.local" className="flex items-center gap-3 text-sm text-ink-2 transition-colors hover:text-signal">
                <Mail size={14} className="text-signal" /> hello@tkt.local
              </a>
              <a href="tel:+201000000000" className="flex items-center gap-3 text-sm text-ink-2 transition-colors hover:text-signal">
                <Phone size={14} className="text-signal" /> +20 100 000 0000
              </a>
              <p className="flex items-center gap-3 text-sm text-ink-2">
                <MapPin size={14} className="text-signal" /> 31.778°N · 35.235°E
              </p>
              <p className="flex items-center gap-3 text-sm text-ink-2">
                <Radio size={14} className="text-signal" /> Response window: under 24 hours
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            {sent ? (
              <div className="panel animate-fade-in relative p-10">
                <Corners />
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ok">
                  <Check size={14} /> Transmission received
                </div>
                <h3 className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-tight text-ink-0">
                  Message logged.
                </h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
                  Your request is in the queue — our team reads every channel personally and will reply to{' '}
                  <span className="text-signal">{email}</span> within 24 hours.
                </p>
                <div className="mt-6 inline-block border border-signal/25 bg-signal/5 px-4 py-3 font-mono text-lg tracking-[0.2em] text-signal">
                  MSG-{sent.id.slice(-8).toUpperCase()}
                </div>
                <div className="mt-8">
                  <button onClick={() => setSent(null)} className="btn-ghost">
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="panel relative p-6 sm:p-8">
                <Corners />
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">Briefing form</p>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ok">
                    <Blink className="bg-ok" /> secure
                  </span>
                </div>

                {submit.error && (
                  <div className="mt-5">
                    <ErrorBanner error={submit.error} />
                  </div>
                )}

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="label mb-1.5 block" htmlFor="ct-name">Your name</label>
                    <input id="ct-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
                  </div>
                  <div>
                    <label className="label mb-1.5 block" htmlFor="ct-email">Email</label>
                    <input id="ct-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                  </div>
                  <div>
                    <label className="label mb-1.5 block" htmlFor="ct-org">Organization <span className="text-ink-3 normal-case tracking-normal">(optional)</span></label>
                    <input id="ct-org" className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Company or brand" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="label mb-1.5 block" htmlFor="ct-type">Event type</label>
                      <select id="ct-type" className="input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                        <option value="">Select…</option>
                        <option>CONFERENCE</option>
                        <option>CONCERT</option>
                        <option>WEDDING</option>
                        <option>SPORTS</option>
                        <option>EXHIBITION</option>
                        <option>CHARITY</option>
                        <option>CORPORATE</option>
                        <option>UNIVERSITY</option>
                        <option>OTHER</option>
                      </select>
                    </div>
                    <div>
                      <label className="label mb-1.5 block" htmlFor="ct-date">Date</label>
                      <input id="ct-date" type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label mb-1.5 block" htmlFor="ct-msg">The brief</label>
                    <textarea
                      id="ct-msg"
                      className="input min-h-32 resize-y"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about the event — audience, scale, venue, and what keeps you up at night."
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-6">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
                    <Ticket size={12} className="text-signal" />
                    Free consultation · no strings
                  </p>
                  <button type="submit" disabled={submit.isPending} className="btn-primary px-7 py-3">
                    {submit.isPending ? 'Transmitting…' : 'Send the brief'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}