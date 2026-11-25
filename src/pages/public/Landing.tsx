import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PublicNav from '../../components/public/PublicNav'
import { useLanguage } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'

const HeroKeystone = lazy(() => import('../../components/public/HeroKeystone'))

export default function Landing() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [desktop3D, setDesktop3D] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px) and (prefers-reduced-motion: no-preference)')
    const update = () => setDesktop3D(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <div className="h-[100dvh] overflow-hidden bg-paper text-ink">
      <PublicNav />

      <main id="main-content" className="relative h-full overflow-hidden px-4 pt-[4.5rem] sm:px-6 lg:px-8">
        <style>{`
          .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%, rgba(11,11,12,0.08) 0%, rgba(11,11,12,0.68) 48%, rgba(11,11,12,0.92) 78%, var(--color-canvas) 100%);}
          :root[data-theme='light'] .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%, rgba(247,244,238,0) 0%, rgba(247,244,238,0.22) 42%, rgba(247,244,238,0.56) 70%, var(--color-canvas) 100%);}
        `}</style>

        <div className={`pointer-events-none absolute inset-0 z-0 ${isLight ? 'bg-[radial-gradient(ellipse_at_72%_38%,rgba(184,137,46,0.12),transparent_45%),radial-gradient(ellipse_at_32%_72%,rgba(200,162,92,0.08),transparent_42%)]' : 'bg-[radial-gradient(ellipse_at_72%_38%,rgba(232,208,139,0.09),transparent_45%),radial-gradient(ellipse_at_32%_72%,rgba(200,162,92,0.06),transparent_42%)]'}`} aria-hidden="true" />
        <div className={`pointer-events-none absolute inset-0 z-[1] ${isLight ? 'bg-[radial-gradient(ellipse_at_28%_18%,rgba(184,137,46,0.14),transparent_32%),radial-gradient(ellipse_at_72%_58%,rgba(200,162,92,0.1),transparent_38%),linear-gradient(180deg,rgba(255,253,250,0.35),transparent_35%)]' : 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,208,139,0.07),transparent_28%),radial-gradient(ellipse_at_70%_55%,rgba(200,162,92,0.05),transparent_34%),linear-gradient(180deg,rgba(250,248,244,0.015),transparent_30%)]'}`} />
        <div className="tkt-hero-vignette pointer-events-none absolute inset-0 z-[1]" />
        <div className={`pointer-events-none absolute inset-x-0 top-[4.5rem] z-[2] h-px bg-gradient-to-r from-transparent ${isLight ? 'via-signal/35' : 'via-signal/25'} to-transparent`} />

        <div className="absolute inset-y-0 end-0 z-[3] hidden w-[58%] overflow-hidden pt-[4.5rem] lg:block xl:w-[54%]" aria-hidden="true">
          {desktop3D ? (
            <Suspense fallback={null}>
              <HeroKeystone />
            </Suspense>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 240 240" className="h-[min(430px,38vw)] w-[min(430px,38vw)] overflow-visible opacity-90">
                <defs><linearGradient id="tktHeroFallbackGold" gradientUnits="userSpaceOnUse" x1="36" y1="36" x2="204" y2="204"><stop offset="0%" stopColor="#C8A25C" /><stop offset="50%" stopColor="#E8D08B" /><stop offset="100%" stopColor="#C8A25C" /></linearGradient></defs>
                <circle cx="120" cy="120" r="94" fill="none" stroke="url(#tktHeroFallbackGold)" strokeWidth="2.6" />
                <circle cx="120" cy="120" r="84" fill="none" stroke="url(#tktHeroFallbackGold)" strokeWidth="1.2" />
                <g stroke="url(#tktHeroFallbackGold)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <line x1="120" y1="67" x2="120" y2="173" /><line x1="82" y1="67" x2="158" y2="67" /><line x1="82" y1="173" x2="158" y2="173" /><line x1="82" y1="90" x2="158" y2="150" /><line x1="82" y1="150" x2="158" y2="90" />
                </g>
              </svg>
            </div>
          )}
        </div>

        <div className="pointer-events-none relative z-10 mx-auto grid h-full max-w-7xl items-center gap-8 py-6 lg:grid-cols-[minmax(0,620px)_1fr] lg:gap-6">
          <div className="pointer-events-auto relative max-w-[620px]">
            <div className="mb-4 flex items-center gap-3 sm:mb-[18px]">
              <span className="h-px w-7 bg-signal-dim" aria-hidden="true" />
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-signal-dim">{t('heroEyebrow')}</span>
            </div>

            <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.6rem)] font-normal leading-[1.12] tracking-[-0.01em] text-ink-0">
              <span className="block">{t('heroTitleA')}</span>
              <span className="block text-signal">{t('heroTitleB')}</span>
            </h1>

            <p className="mt-5 max-w-[500px] text-[14px] leading-[1.7] text-ink-2/90 sm:mt-6 sm:text-[15.5px] sm:leading-[1.75]">{t('heroBody')}</p>

            <div className="mt-7 sm:mt-9">
              <Link to="/upcoming" className="btn-primary !px-7 !py-3.5 text-[11px] sm:text-xs shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-signal)_45%,transparent)]">
                {t('browseUpcoming')}
                <ArrowRight size={15} className="rtl:rotate-180" />
              </Link>
            </div>
          </div>

          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      </main>
    </div>
  )
}
