import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, Quote, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'
import { Corners } from '../../components/instruments'
import { ErrorBanner, Spinner } from '../../components/ui'
import { useLanguage } from '../../lib/i18n'
import { useAboutContent, type AboutContent, type LocalizedText } from '../../lib/public'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import ShinyText from '../../components/reactbits/ShinyText'
import BlurText from '../../components/reactbits/BlurText'
import { PageAccents } from '../../components/public/PlayfulBits'
import { resolveUploadPreviewUrl } from '../../components/ui/file-upload'

// Keeps the page intact if the content API is briefly unavailable. Editors
// change the live copy from /app/site-content.
const FALLBACK_ABOUT_CONTENT: AboutContent = {
  copy: {
    team: {
      eyebrow: { en: 'The Team', ar: 'الفريق' },
      titleA: { en: 'The people behind ', ar: 'الأشخاص خلف ' },
      titleB: { en: 'the experience', ar: 'TKT' },
      badge: { en: 'Built with intention', ar: 'صُنعت بشغف ودقة' },
    },
    partners: {
      eyebrow: { en: 'Our Partners', ar: 'شركاؤنا' },
      titleA: { en: 'Trusted by the teams', ar: 'موثوق من الفرق' },
      titleB: { en: 'who build the night.', ar: 'التي تصنع الليلة.' },
    },
    reports: {
      eyebrow: { en: 'Field Reports', ar: 'آراء من الميدان' },
      titleA: { en: 'Voices from', ar: 'أصوات من' },
      titleB: { en: 'the floor.', ar: 'قلب الحدث.' },
    },
  },
  members: [
    {
      id: 'team-founder',
      name: { en: 'Founder Name', ar: 'اسم المؤسس' },
      role: { en: 'Founder & CEO', ar: 'المؤسس والرئيس التنفيذي' },
      bio: {
        en: 'Leads the vision behind TKT, shaping premium experiences from concept to unforgettable entry.',
        ar: 'يقود رؤية TKT ويصنع تجارب استثنائية من الفكرة حتى لحظة الدخول.',
      },
    },
    {
      id: 'team-operations',
      name: { en: 'Team Member', ar: 'اسم عضو الفريق' },
      role: { en: 'Operations Lead', ar: 'قائد العمليات' },
      bio: {
        en: 'Builds the systems and on-ground flow that keep every event smooth, secure, and precise.',
        ar: 'يبني الأنظمة وسير العمل الميداني ليبقى كل حدث سلساً وآمناً ودقيقاً.',
      },
    },
    {
      id: 'team-experience',
      name: { en: 'Team Member', ar: 'اسم عضو الفريق' },
      role: { en: 'Experience Designer', ar: 'مصمم التجربة' },
      bio: {
        en: 'Crafts the visual and human details that make every TKT moment feel intentional.',
        ar: 'يصمم التفاصيل البصرية والإنسانية التي تجعل كل لحظة في TKT مدروسة ومميزة.',
      },
    },
  ],
  partners: ['NOVA EVENTS', 'SIGNALWORKS', 'MERIDIAN STAGES', 'AXIS MEDIA', 'HALCYON PROD', 'ORBITAL SOUND'].map((name, index) => ({
    id: `partner-${index + 1}`,
    name: { en: name, ar: name },
  })),
  reports: [],
  updatedAt: null,
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

type AboutReport = AboutContent['reports'][number]

function FieldReportsSlider({ reports }: { reports: AboutReport[] }) {
  const reduce = useReducedMotion()
  const { lang } = useLanguage()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)

  const pick = (value: LocalizedText) => (lang === 'ar' ? value.ar : value.en)

  useEffect(() => {
    if (index >= reports.length) setIndex(0)
  }, [index, reports.length])

  useEffect(() => {
    if (reduce || paused || reports.length <= 1) return
    const t = setInterval(() => {
      setDir(1)
      setIndex((i) => (i + 1) % reports.length)
    }, 5500)
    return () => clearInterval(t)
  }, [paused, reduce, reports.length])

  const go = (next: number) => {
    const target = (next + reports.length) % reports.length
    setDir(target >= index ? 1 : -1)
    setIndex(target)
  }

  const current = reports[index]
  const eventName = current ? pick(current.eventName) : ''
  const role = current ? pick(current.role) : ''
  const variants = {
    enter: (d: number) => (reduce ? { opacity: 1 } : { opacity: 0, x: d * 40, filter: 'blur(6px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -40, filter: 'blur(6px)' }),
  }

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <SpotlightCard
        className="!rounded-none !border !border-line-soft !bg-raised/45 !p-0 !shadow-none backdrop-blur-sm"
        spotlightColor="rgba(232, 208, 139, 0.14)"
      >
        <div className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
          <Corners />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-signal)_7%,transparent),transparent_45%)]" />
          <Quote size={44} className="absolute top-6 end-6 text-signal/15 sm:top-8 sm:end-10" aria-hidden="true" />

          <div className="relative min-h-[220px] sm:min-h-[190px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.figure
                key={current.id}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                {eventName && (
                  <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-signal-dim">{eventName}</p>
                )}
                <blockquote className="max-w-4xl font-display text-xl font-medium leading-[1.5] tracking-tight text-ink-0 sm:text-2xl lg:text-[2rem]">
                  <span className="text-signal">"</span>
                  {pick(current.content)}
                  <span className="text-signal">"</span>
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center border border-signal/25 bg-signal/10 font-mono text-[11px] font-semibold text-signal">
                    {pick(current.author).split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-0">{pick(current.author)}</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3">{role || (lang === 'ar' ? 'ضيف' : 'Guest')}</p>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="relative mt-8 flex items-center justify-between gap-4 border-t border-line-soft pt-5">
            <div className="flex items-center gap-2">
              {reports.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => go(i)}
                  aria-label={`${lang === 'ar' ? 'عرض مراجعة' : 'Show report'} ${i + 1}`}
                  className={`h-1.5 transition-all duration-300 ${i === index ? 'w-8 bg-signal' : 'w-2 bg-line-soft hover:bg-signal/40'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => go(index - 1)} aria-label={lang === 'ar' ? 'السابق' : 'Previous'} className="inline-flex h-10 w-10 items-center justify-center border border-line-soft text-ink-2 transition-all duration-200 hover:border-signal/40 hover:text-signal active:scale-[0.97]">
                <ChevronLeft size={16} className="rtl:rotate-180" />
              </button>
              <button onClick={() => go(index + 1)} aria-label={lang === 'ar' ? 'التالي' : 'Next'} className="inline-flex h-10 w-10 items-center justify-center border border-line-soft text-ink-2 transition-all duration-200 hover:border-signal/40 hover:text-signal active:scale-[0.97]">
                <ChevronRight size={16} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  )
}

export default function About() {
  const siteContent = useAboutContent()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'
  const content = siteContent.data ?? FALLBACK_ABOUT_CONTENT
  const pick = (value: LocalizedText) => (isAr ? value.ar : value.en)

  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,color-mix(in_srgb,var(--color-signal)_10%,transparent),transparent_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-raised)_35%,transparent),transparent_30%)]" />
      </div>
      <PageAccents />

      <PublicNav />

      <header className="relative px-4 pb-14 pt-28 sm:px-6 sm:pb-18 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-soft to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
              <ShinyText text={t('aboutEyebrow')} className="text-[11px] font-medium uppercase tracking-[0.24em]" color="var(--color-signal-dim)" shineColor="var(--color-signal)" speed={3.2} />
            </div>
            <div className="max-w-4xl font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink-0 sm:text-5xl lg:text-7xl">
              <BlurText text={t('aboutTitleA')} delay={55} animateBy="words" direction="bottom" className="block" />
              <BlurText text={t('aboutTitleB')} delay={75} animateBy="words" direction="bottom" className="block text-signal" />
            </div>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{t('aboutBody')}</p>
          </Reveal>
        </div>
      </header>

      <section className="relative px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{pick(content.copy.team.eyebrow)}</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-5xl">
                  {pick(content.copy.team.titleA)}
                  <span className="text-signal">{pick(content.copy.team.titleB)}</span>
                </h2>
              </div>
              <ShinyText
                text={pick(content.copy.team.badge)}
                className="text-[11px] font-medium uppercase tracking-[0.2em]"
                color="var(--color-ink-3)"
                shineColor="var(--color-signal)"
                speed={2.8}
              />
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            {content.members.map((member, i) => (
              <Reveal key={member.id} delay={i * 0.09}>
                <SpotlightCard
                  className="!rounded-none !border !border-line-soft !bg-raised/45 !p-0 !shadow-none backdrop-blur-sm h-full"
                  spotlightColor="rgba(232, 208, 139, 0.18)"
                >
                  <div className="group relative flex h-full min-h-[320px] flex-col p-6 sm:p-7">
                    <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/0 to-transparent transition-all duration-500 group-hover:via-signal/45" />

                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden border border-signal/20 bg-signal/[0.07] text-signal">
                        {member.imageUrl ? (
                          <img src={resolveUploadPreviewUrl(member.imageUrl)} alt={pick(member.name)} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <UserRound size={28} strokeWidth={1.5} />
                        )}
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">0{i + 1}</span>
                    </div>

                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-signal-dim">{pick(member.role)}</p>
                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-0">{pick(member.name)}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-ink-2">{pick(member.bio)}</p>

                    <div className="mt-auto pt-6">
                      <div className="h-px w-12 bg-signal/40 transition-all duration-300 group-hover:w-20 group-hover:bg-signal/70" />
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{pick(content.copy.partners.eyebrow)}</p>
            </div>
            <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink-0 sm:text-5xl">
              {pick(content.copy.partners.titleA)} <span className="text-signal">{pick(content.copy.partners.titleB)}</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-px border border-line-soft bg-line-soft sm:grid-cols-3 lg:grid-cols-6">
            {content.partners.map((partner, i) => (
              <Reveal key={partner.id} delay={i * 0.04}>
                <div className="flex min-h-28 flex-col items-center justify-center gap-3 bg-paper/90 px-4 py-6 text-center transition-colors duration-200 hover:bg-raised/60">
                  {partner.imageUrl && <img src={resolveUploadPreviewUrl(partner.imageUrl)} alt="" className="max-h-12 max-w-full object-contain" loading="lazy" />}
                  <p className="font-display text-xs font-semibold tracking-[0.18em] text-ink-2 sm:text-sm">{pick(partner.name)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{pick(content.copy.reports.eyebrow)}</p>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink-0 sm:text-5xl">
                {pick(content.copy.reports.titleA)} <span className="text-signal">{pick(content.copy.reports.titleB)}</span>
              </h2>
            </div>
          </Reveal>

          {siteContent.isLoading && <Spinner label={t('loading')} />}
          {siteContent.error && (
            <div className="panel relative p-5">
              <Corners />
              <ErrorBanner error={siteContent.error} />
            </div>
          )}

          {content.reports.length > 0 && <FieldReportsSlider reports={content.reports} />}
        </div>
      </section>

      <section className="relative px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="relative overflow-hidden border border-line-soft bg-raised/45 px-6 py-14 text-center sm:px-10 sm:py-16">
              <Corners />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-signal)_8%,transparent),transparent_60%)]" />
              <p className="relative text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{t('thankYouTitle')}</p>
              <h2 className="relative mt-4 font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-5xl">{t('thankYouTitle')}</h2>
              <p className="relative mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">{t('thankYouBody')}</p>
              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/upcoming" className="btn-primary !px-6 !py-3">
                  {t('browseUpcoming')}
                  <ArrowUpRight size={15} className="rtl:-scale-x-100" />
                </Link>
                <Link to="/contact" className="btn-ghost !px-6 !py-3">
                  {t('contactUs')}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
