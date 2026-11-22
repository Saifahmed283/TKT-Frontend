import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, Quote, UserRound } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import PublicNav from '../components/public/PublicNav'
import PublicFooter from '../components/public/PublicFooter'
import { Corners } from '../components/instruments'
import { ErrorBanner, Spinner } from '../components/ui'
import { useLanguage } from '../lib/i18n'
import { usePublicReviews } from '../lib/public'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import ShinyText from '../components/reactbits/ShinyText'
import BlurText from '../components/reactbits/BlurText'

const TEAM = [
  {
    name: { en: 'Founder Name', ar: 'اسم المؤسس' },
    role: { en: 'Founder & CEO', ar: 'المؤسس والرئيس التنفيذي' },
    bio: {
      en: 'Leads the vision behind TKT, shaping premium experiences from concept to unforgettable entry.',
      ar: 'يقود رؤية TKT ويصنع تجارب استثنائية من الفكرة حتى لحظة الدخول.',
    },
  },
  {
    name: { en: 'Team Member', ar: 'اسم عضو الفريق' },
    role: { en: 'Operations Lead', ar: 'قائد العمليات' },
    bio: {
      en: 'Builds the systems and on-ground flow that keep every event smooth, secure, and precise.',
      ar: 'يبني الأنظمة وسير العمل الميداني ليبقى كل حدث سلساً وآمناً ودقيقاً.',
    },
  },
  {
    name: { en: 'Team Member', ar: 'اسم عضو الفريق' },
    role: { en: 'Experience Designer', ar: 'مصمم التجربة' },
    bio: {
      en: 'Crafts the visual and human details that make every TKT moment feel intentional.',
      ar: 'يصمم التفاصيل البصرية والإنسانية التي تجعل كل لحظة في TKT مدروسة ومميزة.',
    },
  },
] as const

const PARTNERS = ['NOVA EVENTS', 'SIGNALWORKS', 'MERIDIAN STAGES', 'AXIS MEDIA', 'HALCYON PROD', 'ORBITAL SOUND']

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

type ReviewItem = { id: string; author: string; role: string | null; content: string; eventName: string | null }

function FieldReportsSlider({ reviews }: { reviews: ReviewItem[] }) {
  const reduce = useReducedMotion()
  const { lang } = useLanguage()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused || reviews.length <= 1) return
    const t = setInterval(() => {
      setDir(1)
      setIndex((i) => (i + 1) % reviews.length)
    }, 5500)
    return () => clearInterval(t)
  }, [paused, reduce, reviews.length])

  const go = (next: number) => {
    setDir(next > index ? 1 : -1)
    setIndex((next + reviews.length) % reviews.length)
  }

  const current = reviews[index]
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
                {current.eventName && (
                  <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-signal-dim">{current.eventName}</p>
                )}
                <blockquote className="max-w-4xl font-display text-xl font-medium leading-[1.5] tracking-tight text-ink-0 sm:text-2xl lg:text-[2rem]">
                  <span className="text-signal">"</span>
                  {current.content}
                  <span className="text-signal">"</span>
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center border border-signal/25 bg-signal/10 font-mono text-[11px] font-semibold text-signal">
                    {current.author.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-0">{current.author}</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-3">{current.role ?? (lang === 'ar' ? 'ضيف' : 'Guest')}</p>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="relative mt-8 flex items-center justify-between gap-4 border-t border-line-soft pt-5">
            <div className="flex items-center gap-2">
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => go(i)}
                  aria-label={`${lang === 'ar' ? 'عرض مراجعة' : 'Show review'} ${i + 1}`}
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
  const reviews = usePublicReviews()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'

  return (
    <div className="relative min-h-screen overflow-x-clip bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,color-mix(in_srgb,var(--color-signal)_10%,transparent),transparent_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-raised)_35%,transparent),transparent_30%)]" />
      </div>

      <PublicNav />

      <header className="relative px-4 pb-14 pt-28 sm:px-6 sm:pb-18 sm:pt-32 lg:px-8 lg:pb-20 lg:pt-36">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line-soft to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-signal-dim" aria-hidden="true" />
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{t('aboutEyebrow')}</p>
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
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{isAr ? 'الفريق' : 'The Team'}</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink-0 sm:text-5xl">
                  {isAr ? 'الأشخاص خلف ' : 'The people behind '}
                  <span className="text-signal">{isAr ? 'TKT' : 'the experience'}</span>
                </h2>
              </div>
              <ShinyText
                text={isAr ? 'صُنعت بشغف ودقة' : 'Built with intention'}
                className="text-[11px] font-medium uppercase tracking-[0.2em]"
                color="var(--color-ink-3)"
                shineColor="var(--color-signal)"
                speed={2.8}
              />
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-3 md:gap-5">
            {TEAM.map((member, i) => (
              <Reveal key={i} delay={i * 0.09}>
                <SpotlightCard
                  className="!rounded-none !border !border-line-soft !bg-raised/45 !p-0 !shadow-none backdrop-blur-sm h-full"
                  spotlightColor="rgba(232, 208, 139, 0.18)"
                >
                  <div className="group relative flex h-full min-h-[320px] flex-col p-6 sm:p-7">
                    <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/0 to-transparent transition-all duration-500 group-hover:via-signal/45" />

                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="grid h-16 w-16 place-items-center border border-signal/20 bg-signal/[0.07] text-signal">
                        <UserRound size={28} strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">0{i + 1}</span>
                    </div>

                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-signal-dim">{member.role[lang]}</p>
                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-0">{member.name[lang]}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-ink-2">{member.bio[lang]}</p>

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
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{t('ourPartners')}</p>
            </div>
            <h2 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink-0 sm:text-5xl">
              {t('partnersTitleA')} <span className="text-signal">{t('partnersTitleB')}</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-px border border-line-soft bg-line-soft sm:grid-cols-3 lg:grid-cols-6">
            {PARTNERS.map((p, i) => (
              <Reveal key={p} delay={i * 0.04}>
                <div className="bg-paper/90 px-4 py-6 text-center transition-colors duration-200 hover:bg-raised/60">
                  <p className="font-display text-xs font-semibold tracking-[0.18em] text-ink-2 sm:text-sm">{p}</p>
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
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-signal-dim">{t('testimonials')}</p>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink-0 sm:text-5xl">
                {t('testimonialsTitleA')} <span className="text-signal">{t('testimonialsTitleB')}</span>
              </h2>
            </div>
          </Reveal>

          {reviews.isLoading && <Spinner label={t('loading')} />}
          {reviews.error && (
            <div className="panel relative p-5">
              <Corners />
              <ErrorBanner error={reviews.error} />
            </div>
          )}

          {reviews.data && reviews.data.length > 0 && <FieldReportsSlider reviews={reviews.data} />}
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