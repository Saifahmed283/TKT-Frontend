import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PublicNav from '../../components/public/PublicNav'
import { Bloom, FloatingChip, OrbitRing, Sparkles } from '../../components/public/PlayfulBits'
import { useLanguage } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'

const HeroKeystone = lazy(() => import('../../components/public/HeroKeystone'))
const LightRays = lazy(() => import('../../components/reactbits/LightRays'))

function HeroEmblemFallback() {
  return (
    <svg viewBox="0 0 480 480" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id="tktHeroGold" gradientUnits="userSpaceOnUse" x1="72" y1="70" x2="410" y2="414">
          <stop offset="0%" stopColor="#C8A25C" />
          <stop offset="50%" stopColor="#E8D08B" />
          <stop offset="100%" stopColor="#A77B38" />
        </linearGradient>
        <radialGradient id="tktHeroGlow">
          <stop offset="0%" stopColor="#C8A25C" stopOpacity=".16" />
          <stop offset="100%" stopColor="#C8A25C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="240" cy="240" r="226" fill="url(#tktHeroGlow)" />
      <circle cx="240" cy="240" r="190" fill="none" stroke="url(#tktHeroGold)" strokeWidth="2.5" opacity=".9" />
      <circle cx="240" cy="240" r="170" fill="none" stroke="url(#tktHeroGold)" strokeWidth="1.4" opacity=".7" />
      <circle cx="240" cy="240" r="209" fill="none" stroke="#C8A25C" strokeWidth="3" strokeDasharray="1 15" strokeLinecap="round" opacity=".9" />
      <g stroke="url(#tktHeroGold)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M240 125V355M158 125H322M158 355H322M158 172L322 308M158 308L322 172" />
      </g>
      <circle cx="240" cy="240" r="8" fill="#E8D08B" />
    </svg>
  )
}

/** Lightweight, animated circular sculpture for tablet (no WebGL). */
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[272px] lg:max-w-[340px]">
      <Bloom className="inset-[6%] opacity-70" />
      <OrbitRing inset="2%" second />
      <Sparkles count={8} />
      <div className="absolute inset-[12%] grid place-items-center rounded-full">
        <HeroEmblemFallback />
      </div>
      <FloatingChip className="start-[2%] bottom-[12%]" delay="0.4s">TKT · 01</FloatingChip>
      <FloatingChip className="end-[0%] top-[8%]" delay="1.3s">LIVE</FloatingChip>
    </div>
  )
}

export default function Landing() {
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [desktop3D, setDesktop3D] = useState(false)
  // Phones get copy only; the static sculpture is reserved for tablet widths.
  const [showStaticHero, setShowStaticHero] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)')
    const update = () => setShowStaticHero(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    // Keep WebGL off phones and tablets; only request the 3D model and the
    // nav-sourced light rays on large screens with a fine pointer that have
    // not asked the browser to reduce motion.
    const media = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    const update = () => setDesktop3D(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    // Home is a single fixed screen on phones. Locking html/body prevents the
    // small overscroll caused by browser chrome and touch momentum.
    const root = document.documentElement
    const body = document.body
    root.classList.add('tkt-home-locked')
    body.classList.add('tkt-home-locked')
    return () => {
      root.classList.remove('tkt-home-locked')
      body.classList.remove('tkt-home-locked')
    }
  }, [])

  return (
    <div className="overflow-x-hidden bg-paper text-ink">
      <a href="#main-content" className="sr-only z-[100] bg-paper px-4 py-3 text-ink focus:fixed focus:left-4 focus:top-4 focus:not-sr-only">
        {lang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>
      <PublicNav />

      <main id="main-content" className="relative">
        {/* The hero is the whole first screen on every breakpoint. Mobile uses
            a compact centered composition; desktop keeps its 3D sculpture. */}
        <header className="relative flex h-[100svh] min-h-0 flex-col justify-center overflow-x-clip px-4 pb-6 pt-[4.5rem] sm:px-6 sm:pb-12 sm:pt-28 lg:px-8 lg:pb-16 lg:pt-32">
          <style>{`
            .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%,rgba(11,11,12,.08) 0%,rgba(11,11,12,.48) 48%,rgba(11,11,12,.78) 78%,var(--color-canvas) 100%)}
            :root[data-theme='light'] .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%,rgba(247,244,238,0) 0%,rgba(247,244,238,.12) 42%,rgba(247,244,238,.42) 70%,var(--color-canvas) 100%)}
            @media(max-width:639px){.tkt-hero-vignette{background:radial-gradient(circle at 50% 45%,rgba(11,11,12,.1) 0%,rgba(11,11,12,.42) 58%,var(--color-canvas) 100%)}:root[data-theme='light'] .tkt-hero-vignette{background:radial-gradient(circle at 50% 45%,rgba(247,244,238,0) 0%,rgba(247,244,238,.2) 58%,var(--color-canvas) 100%)}}
            .tkt-hero-copy{animation:tktHeroEnter .65s cubic-bezier(.22,1,.36,1) both}
            @keyframes tktHeroEnter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
            @media(prefers-reduced-motion:reduce){.tkt-hero-copy{animation:none!important}}
          `}</style>

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className={`absolute inset-0 ${isLight
              ? 'bg-[radial-gradient(ellipse_at_28%_18%,rgba(184,137,46,0.14),transparent_32%),radial-gradient(ellipse_at_72%_58%,rgba(200,162,92,0.10),transparent_38%)]'
              : 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,208,139,0.07),transparent_28%),radial-gradient(ellipse_at_70%_55%,rgba(200,162,92,0.05),transparent_34%)]'
            }`} />
            <Bloom className="-end-[12%] -top-[16%] h-[380px] w-[380px] opacity-60 sm:h-[480px] sm:w-[480px]" />
            <Bloom tone="warm" className="start-[6%] bottom-[-18%] h-[320px] w-[320px] opacity-45" />
            <Sparkles count={7} className="opacity-55" />
            <div className="tkt-hero-vignette absolute inset-0" />
            <div aria-hidden="true" className="pointer-events-none absolute -end-[18%] top-[12%] z-0 w-[210px] opacity-[0.14] sm:hidden">
              <HeroEmblemFallback />
            </div>
            <div className="absolute inset-x-0 top-[3.75rem] h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent sm:top-[4.5rem]" />
          </div>

          {desktop3D && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
              <Suspense fallback={null}>
                <LightRays
                  raysOrigin="top-center"
                  raysColor={isLight ? '#B8892E' : '#C8A25C'}
                  raysSpeed={0.3}
                  lightSpread={0.9}
                  rayLength={isLight ? 1.5 : 1.35}
                  fadeDistance={1.1}
                  saturation={isLight ? 1.05 : 0.85}
                  followMouse
                  mouseInfluence={0.16}
                  cursorShadow
                  clickPulse={false}
                  noiseAmount={0.04}
                  distortion={0.05}
                  lightMode={isLight}
                  intensity={isLight ? 0.75 : 0.9}
                  opacity={isLight ? 0.5 : 0.42}
                  maxDevicePixelRatio={1.5}
                  className={isLight ? 'mix-blend-multiply' : ''}
                />
              </Suspense>
            </div>
          )}

          {desktop3D && (
            <div
              aria-hidden="true"
              data-testid="hero-emblem"
              data-renderer="3d"
              className="pointer-events-auto absolute end-[3%] top-[48%] z-[1] aspect-square w-[46%] max-w-[560px] -translate-y-1/2 opacity-90"
            >
              <Suspense fallback={<HeroEmblemFallback />}>
                <HeroKeystone />
              </Suspense>
            </div>
          )}

          {desktop3D && (
            <div aria-hidden="true" className="pointer-events-none absolute bottom-[7%] end-[6%] z-[2] hidden items-center gap-2 border border-signal/25 bg-raised/70 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-signal backdrop-blur-sm lg:flex">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal" />
              {t('dragToExplore')}
            </div>
          )}

          <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-7xl shrink-0 items-center gap-4 py-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] sm:gap-6 lg:grid-cols-[minmax(0,620px)_1fr] lg:py-0">
            {!desktop3D && showStaticHero && (
              <div aria-hidden="true" data-testid="hero-emblem" data-renderer="static" className="order-2 w-full sm:order-2 sm:justify-self-center">
                <HeroVisual />
              </div>
            )}

            <div className="tkt-hero-copy pointer-events-auto order-1 max-w-[620px] sm:order-1">
              <div className="mb-3 flex items-center gap-2.5 sm:mb-[18px] sm:gap-3">
                <span className="h-px w-5 bg-signal-dim sm:w-7" aria-hidden="true" />
                <p className="text-[10px] font-medium uppercase leading-snug tracking-[0.14em] text-signal-dim sm:text-[11px] sm:tracking-[0.22em]">
                  {t('heroEyebrow')}
                </p>
              </div>

              <h1 className="font-display text-[clamp(2rem,8.8vw,2.75rem)] font-normal leading-[1.08] tracking-[-0.01em] text-ink-0 sm:text-[clamp(2.5rem,5.5vw,4.6rem)] sm:leading-[1.12]">
                <span className="block">{t('heroTitleA')}</span>
                <span className="block text-signal">{t('heroTitleB')}</span>
              </h1>

              <p className="mt-3 max-w-[500px] text-[13px] leading-[1.55] text-ink-2/90 sm:hidden">
                {t('heroBodyShort')}
              </p>
              <p className="mt-5 hidden max-w-[500px] text-[14px] leading-[1.7] text-ink-2/90 sm:mt-6 sm:block sm:text-[15.5px] sm:leading-[1.75]">
                {t('heroBody')}
              </p>

              <div className="mt-5 sm:mt-9">
                <Link
                  to="/upcoming"
                  className="btn-primary !px-6 !py-3 text-[10px] shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-signal)_45%,transparent)] sm:!px-7 sm:!py-3.5 sm:text-xs"
                >
                  {t('browseUpcoming')}
                  <ArrowRight size={15} className="rtl:rotate-180" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-3 sm:hidden" aria-hidden="true">
                <span className="h-px w-8 bg-signal/40" />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">TKT · Access</span>
              </div>
            </div>
            <div className="order-2 hidden lg:block" aria-hidden="true" />
          </div>
        </header>
      </main>
    </div>
  )
}
