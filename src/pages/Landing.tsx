import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PublicNav from '../components/public/PublicNav'
import BlurText from '../components/reactbits/BlurText'
import { useLanguage } from '../lib/i18n'
import { useTheme } from '../lib/theme'

const HeroKeystone = lazy(() => import('../components/public/HeroKeystone'))
const LightRays = lazy(() => import('../components/reactbits/LightRays'))

export default function Landing() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const reduce = useReducedMotion()

  const fadeUp = reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } }

  return (
    <div className="h-[100dvh] overflow-hidden bg-paper text-ink">
      <PublicNav />

      <header className="relative h-full overflow-hidden px-4 pt-[4.5rem] sm:px-6 lg:px-8">
        <style>{`
          .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%, rgba(11,11,12,0.08) 0%, rgba(11,11,12,0.68) 48%, rgba(11,11,12,0.92) 78%, var(--color-canvas) 100%);}
          :root[data-theme='light'] .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%, rgba(247,244,238,0) 0%, rgba(247,244,238,0.22) 42%, rgba(247,244,238,0.56) 70%, var(--color-canvas) 100%);}
        `}</style>

        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <Suspense fallback={null}>
            <LightRays
              raysOrigin="top-center"
              raysColor={isLight ? '#B8892E' : '#C8A25C'}
              raysSpeed={0.35}
              lightSpread={0.95}
              rayLength={isLight ? 1.55 : 1.4}
              fadeDistance={1.1}
              saturation={isLight ? 1.05 : 0.85}
              followMouse={false}
              noiseAmount={0.05}
              distortion={0.06}
              lightMode={isLight}
              intensity={isLight ? 0.9 : 1}
              className={isLight ? 'opacity-55 mix-blend-multiply' : 'opacity-45'}
            />
          </Suspense>
        </div>
        <div className={`pointer-events-none absolute inset-0 z-[1] ${isLight ? 'bg-[radial-gradient(ellipse_at_28%_18%,rgba(184,137,46,0.14),transparent_32%),radial-gradient(ellipse_at_72%_58%,rgba(200,162,92,0.1),transparent_38%),linear-gradient(180deg,rgba(255,253,250,0.35),transparent_35%)]' : 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,208,139,0.07),transparent_28%),radial-gradient(ellipse_at_70%_55%,rgba(200,162,92,0.05),transparent_34%),linear-gradient(180deg,rgba(250,248,244,0.015),transparent_30%)]'}`} />
        <div className="tkt-hero-vignette pointer-events-none absolute inset-0 z-[1]" />
        <div className={`pointer-events-none absolute inset-x-0 top-[4.5rem] z-[2] h-px bg-gradient-to-r from-transparent ${isLight ? 'via-signal/35' : 'via-signal/25'} to-transparent`} />

        <div className="absolute inset-y-0 end-0 z-[3] hidden w-[58%] overflow-hidden pt-[4.5rem] lg:block xl:w-[54%]" aria-hidden="true">
          <Suspense fallback={null}>
            <HeroKeystone />
          </Suspense>
        </div>

        <div className="pointer-events-none relative z-10 mx-auto grid h-full max-w-7xl items-center gap-8 py-6 lg:grid-cols-[minmax(0,620px)_1fr] lg:gap-6">
          <motion.div {...fadeUp} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="pointer-events-auto relative max-w-[620px]">
            <div className="mb-4 flex items-center gap-3 sm:mb-[18px]">
              <span className="h-px w-7 bg-signal-dim" aria-hidden="true" />
              <BlurText
                text={t('heroEyebrow')}
                delay={35}
                animateBy="words"
                direction="top"
                className="text-[11px] font-medium uppercase tracking-[0.22em] text-signal-dim"
              />
            </div>

            <div className="font-display text-[clamp(2.25rem,5.5vw,4.6rem)] font-normal leading-[1.12] tracking-[-0.01em] text-ink-0">
              <BlurText text={t('heroTitleA')} delay={55} animateBy="words" direction="bottom" className="block" />
              <BlurText text={t('heroTitleB')} delay={75} animateBy="words" direction="bottom" className="block text-signal" />
            </div>

            <BlurText
              text={t('heroBody')}
              delay={18}
              animateBy="words"
              direction="bottom"
              stepDuration={0.28}
              className="mt-5 max-w-[500px] text-[14px] leading-[1.7] text-ink-2/90 sm:mt-6 sm:text-[15.5px] sm:leading-[1.75]"
            />

            <div className="mt-7 sm:mt-9">
              <Link to="/upcoming" className="btn-primary !px-7 !py-3.5 text-[11px] sm:text-xs shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-signal)_45%,transparent)]">
                {t('browseUpcoming')}
                <ArrowRight size={15} className="rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </header>
    </div>
  )
}
