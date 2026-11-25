import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowUpRight, Check, Mail, MapPin, Phone, Radio } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'
import { Corners, Blink } from '../../components/instruments'
import { ErrorBanner } from '../../components/ui'
import { api } from '../../lib/api'
import { FALLBACK_TAXONOMY } from '../../lib/taxonomy'
import { useLanguage } from '../../lib/i18n'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import BlurText from '../../components/reactbits/BlurText'
import ShinyText from '../../components/reactbits/ShinyText'
import { PageAccents } from '../../components/public/PlayfulBits'

const SERVICE_STEPS = [
  { n: '01', en: 'Consult', ar: 'استشارة', enBody: 'Tell us about the event — size, venue, timeline, and your team.', arBody: 'أخبرنا عن الفعالية — الحجم، المكان، الجدول الزمني، وفريقك.' },
  { n: '02', en: 'Blueprint', ar: 'التخطيط', enBody: 'We model your structure: teams, areas, ticket types, and roles.', arBody: 'نصمم الهيكل: الفرق، المناطق، أنواع التذاكر، والأدوار.' },
  { n: '03', en: 'Operate', ar: 'التشغيل', enBody: 'Your control room goes live with credentials, gates, and realtime ops.', arBody: 'تعمل غرفة التحكم مباشرة مع الاعتمادات، البوابات، والمتابعة اللحظية.' },
  { n: '04', en: 'Report', ar: 'التقرير', enBody: 'Post-event analytics, attendance records, and a sealed audit trail.', arBody: 'تحليلات ما بعد الحدث، سجلات الحضور، ومسار تدقيق موثق.' },
]

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

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState<{ id: string } | null>(null)
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'

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
    <div className="relative min-h-screen overflow-x-clip bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,color-mix(in_srgb,var(--color-signal)_10%,transparent),transparent_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-raised)_35%,transparent),transparent_30%)]" />
      </div>
      <PageAccents />

      <PublicNav />

      <header className="relative px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-soft to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
              <ShinyText text={t('contactEyebrow')} className="text-[11px] font-medium uppercase tracking-[0.24em]" color="var(--color-signal-dim)" shineColor="var(--color-signal)" speed={3.2} />
            </div>
            <div className="max-w-4xl font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink-0 sm:text-5xl lg:text-7xl">
              <BlurText text={t('contactTitleA')} delay={55} animateBy="words" direction="bottom" className="block" />
              <BlurText text={t('contactTitleB')} delay={75} animateBy="words" direction="bottom" className="block text-signal" />
            </div>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{t('contactBody')}</p>
          </Reveal>
        </div>
      </header>

      <section className="relative px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{isAr ? 'كيف نعمل' : 'How we work'}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-4xl">
                {isAr ? 'حدثك، ' : 'Your event, '}
                <span className="text-signal">{isAr ? 'بكل دقة.' : 'fully instrumented.'}</span>
              </h2>
            </Reveal>

            <div className="mt-8 space-y-3">
              {SERVICE_STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.07}>
                  <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/40 !p-0 !shadow-none" spotlightColor="rgba(232, 208, 139, 0.12)">
                    <div className="group relative flex gap-4 p-5">
                      <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="font-display text-3xl font-semibold leading-none text-signal/60">{step.n}</span>
                      <div>
                        <h3 className="font-display text-lg font-semibold tracking-tight text-ink-0">{isAr ? step.ar : step.en}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-ink-2">{isAr ? step.arBody : step.enBody}</p>
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2} className="mt-8 border border-line-soft bg-raised/30 p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">{t('directChannels')}</p>
              <div className="mt-4 space-y-3.5 text-sm">
                <a href="mailto:hello@tkt.local" className="flex items-center gap-3 text-ink-2 transition-colors hover:text-signal"><Mail size={14} className="text-signal-dim" /> hello@tkt.local</a>
                <a href="tel:+201000000000" className="flex items-center gap-3 text-ink-2 transition-colors hover:text-signal"><Phone size={14} className="text-signal-dim" /> +20 100 000 0000</a>
                <p className="flex items-center gap-3 text-ink-2"><MapPin size={14} className="text-signal-dim" /> 31.778°N · 35.235°E</p>
                <p className="flex items-center gap-3 text-ink-2"><Radio size={14} className="text-signal-dim" /> {t('responseWindow')}</p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.08}>
              {sent ? (
                <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/45 !p-0 !shadow-none" spotlightColor="rgba(232, 208, 139, 0.12)">
                  <div className="relative p-8 sm:p-10">
                    <Corners />
                    <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-ok">
                      <Check size={14} /> {t('transmissionReceived')}
                    </div>
                    <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-4xl">{t('messageLogged')}</h3>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
                      {t('messageLoggedBody')} <span className="text-signal">{email}</span> {t('within24')}
                    </p>
                    <div className="mt-6 inline-block border border-signal/25 bg-signal/5 px-4 py-3 font-mono text-lg tracking-[0.2em] text-signal">
                      MSG-{sent.id.slice(-8).toUpperCase()}
                    </div>
                    <div className="mt-8">
                      <button onClick={() => setSent(null)} className="btn-ghost !px-5 !py-2.5">{t('sendAnother')}</button>
                    </div>
                  </div>
                </SpotlightCard>
              ) : (
                <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/45 !p-0 !shadow-none" spotlightColor="rgba(232, 208, 139, 0.1)">
                  <form onSubmit={onSubmit} className="relative p-6 sm:p-8">
                    <Corners />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">{t('briefingForm')}</p>
                      <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ok"><Blink className="bg-ok" /> {isAr ? 'آمن' : 'secure'}</span>
                    </div>

                    {submit.error && <div className="mt-5"><ErrorBanner error={submit.error} /></div>}

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="label mb-1.5 block" htmlFor="ct-name">{t('yourName')}</label>
                        <input id="ct-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label mb-1.5 block" htmlFor="ct-email">{t('email')}</label>
                        <input id="ct-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label mb-1.5 block" htmlFor="ct-org">{t('organization')} <span className="text-ink-3 normal-case tracking-normal">({t('optional')})</span></label>
                        <input id="ct-org" className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                      </div>
                      <div>
                        <label className="label mb-1.5 block" htmlFor="ct-type">{t('eventType')}</label>
                        <select id="ct-type" className="input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                          <option value="">{t('selectOption')}</option>
                          {FALLBACK_TAXONOMY.eventFormats.map((opt) => <option key={opt.code} value={opt.code}>{opt.label}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label mb-1.5 block" htmlFor="ct-date">{t('eventDate')} <span className="text-ink-3 normal-case tracking-normal">({t('optional')})</span></label>
                        <input id="ct-date" type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label mb-1.5 block" htmlFor="ct-msg">{t('brief')}</label>
                        <textarea id="ct-msg" className="input min-h-32 resize-y" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('briefPlaceholder')} required />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-6">
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('freeConsultation')}</p>
                      <button type="submit" disabled={submit.isPending} className="btn-primary !px-7 !py-3">
                        {submit.isPending ? t('sending') : t('sendMessage')}
                        {!submit.isPending && <ArrowUpRight size={15} className="rtl:-scale-x-100" />}
                      </button>
                    </div>
                  </form>
                </SpotlightCard>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}