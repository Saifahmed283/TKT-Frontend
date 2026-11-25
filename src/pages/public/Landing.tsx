import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PublicNav from '../../components/public/PublicNav'
import { Bloom, FloatingChip, OrbitRing, Sparkles, TicketFrame } from '../../components/public/PlayfulBits'
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

/** Lightweight, framed hero sculpture for phones and tablets (no WebGL). */
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[224px] sm:max-w-[290px] lg:max-w-[340px]">
      <Bloom className="inset-[6%] opacity-70" />
      <OrbitRing inset="2%" second />
      <Sparkles count={8} />
      <TicketFrame className="absolute inset-[16%] p-3">
        <HeroEmblemFallback />
      </TicketFrame>
      <FloatingChip className="start-[-4%] bottom-[16%]" delay="0.4s">TKT · 01</FloatingChip>
      <FloatingChip className="end-[-2%] top-[10%]" delay="1.3s">LIVE</FloatingChip>
    </div>
  )
}

export default function Landing() {
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [desktop3D, setDesktop3D] = useState(false)

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

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-paper text-ink">
      <a href="#main-content" className="sr-only z-[100] bg-paper px-4 py-3 text-ink focus:fixed focus:left-4 focus:top-4 focus:not-sr-only">
        {lang === 'ar' ? 'تخطي إلى المحتوى الرئيسي' : 'Skip to main content'}
      </a>
      <PublicNav />

      <main id="main-content" className="relative min-h-[100svh]">
        <header className="relative flex min-h-[100svh] items-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
          <style>{`
            .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%,rgba(11,11,12,.08) 0%,rgba(11,11,12,.48) 48%,rgba(11,11,12,.78) 78%,var(--color-canvas) 100%)}
            :root[data-theme='light'] .tkt-hero-vignette{background:radial-gradient(circle at 68% 45%,rgba(247,244,238,0) 0%,rgba(247,244,238,.12) 42%,rgba(247,244,238,.42) 70%,var(--color-canvas) 100%)}
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
            <div className="absolute inset-x-0 top-[4.5rem] h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent" />
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
            <div aria-hidden="true" className="pointer-events-none absolute bottom-[7%] end-[6%] z-[2] hidden items-center gap-2 border border-signal/25 bg-raised/70 px-3 py-2 text-[9px] font-medium uppercase tracking-[0.2em] text-signal backdrop-blur-sm lg:flex">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal" />
              {t('dragToExplore')}
            </div>
          )}

          <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 py-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] sm:gap-6 lg:grid-cols-[minmax(0,620px)_1fr] lg:py-0">
            {!desktop3D && (
              <div aria-hidden="true" data-testid="hero-emblem" data-renderer="static" className="order-1 w-full sm:order-2 sm:justify-self-end">
                <HeroVisual />
              </div>
            )}

            <div className="tkt-hero-copy pointer-events-auto order-2 max-w-[620px] sm:order-1">
              <div className="mb-4 flex items-center gap-3 sm:mb-[18px]">
                <span className="h-px w-7 bg-signal-dim" aria-hidden="true" />
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-signal-dim">{t('heroEyebrow')}</p>
              </div>

              <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.6rem)] font-normal leading-[1.12] tracking-[-0.01em] text-ink-0">
                <span className="block">{t('heroTitleA')}</span>
                <span className="block text-signal">{t('heroTitleB')}</span>
              </h1>

              <p className="mt-5 max-w-[500px] text-[14px] leading-[1.7] text-ink-2/90 sm:mt-6 sm:text-[15.5px] sm:leading-[1.75]">
                {t('heroBody')}
              </p>

              <div className="mt-7 sm:mt-9">
                <Link to="/upcoming" className="btn-primary !px-7 !py-3.5 text-[11px] shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-signal)_45%,transparent)] sm:text-xs">
                  {t('browseUpcoming')}
                  <ArrowRight size={15} className="rtl:rotate-180" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="order-2 hidden lg:block" aria-hidden="true" />
          </div>
        </header>
      </main>
    </div>
  )
}
