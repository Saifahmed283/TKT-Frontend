import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PublicNav from '../../components/public/PublicNav'
import { useLanguage } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'

export default function Landing() {
  const { t, lang } = useLanguage()
  const { theme } = useTheme()
  const isLight = theme === 'light'

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
            .tkt-hero-seal{animation:tktSealFloat 8s ease-in-out infinite;transform-origin:center}
            .tkt-hero-orbit{animation:tktSealRotate 48s linear infinite;transform-origin:center}
            @keyframes tktHeroEnter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
            @keyframes tktSealFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
            @keyframes tktSealRotate{to{transform:rotate(360deg)}}
            @media(prefers-reduced-motion:reduce){.tkt-hero-copy,.tkt-hero-seal,.tkt-hero-orbit{animation:none!important}}
          `}</style>

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className={`absolute inset-0 ${isLight
              ? 'bg-[radial-gradient(ellipse_at_28%_18%,rgba(184,137,46,0.14),transparent_32%),radial-gradient(ellipse_at_72%_58%,rgba(200,162,92,0.10),transparent_38%)]'
              : 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,208,139,0.07),transparent_28%),radial-gradient(ellipse_at_70%_55%,rgba(200,162,92,0.05),transparent_34%)]'
            }`} />
            <div className="tkt-hero-vignette absolute inset-0" />
            <div className="absolute inset-x-0 top-[4.5rem] h-px bg-gradient-to-r from-transparent via-signal/30 to-transparent" />
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute end-[-4%] top-[48%] z-[1] w-[58%] max-w-[560px] -translate-y-1/2 opacity-20 sm:end-0 sm:w-[48%] sm:opacity-35 lg:end-[3%] lg:w-[46%] lg:opacity-90">
            <svg viewBox="0 0 480 480" className="tkt-hero-seal h-auto w-full overflow-visible">
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
              <circle className="tkt-hero-orbit" cx="240" cy="240" r="209" fill="none" stroke="#C8A25C" strokeWidth="3" strokeDasharray="1 15" strokeLinecap="round" opacity=".9" />
              <g stroke="url(#tktHeroGold)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M240 125V355M158 125H322M158 355H322M158 172L322 308M158 308L322 172" />
              </g>
              <circle cx="240" cy="240" r="8" fill="#E8D08B" />
            </svg>
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,620px)_1fr] lg:gap-6">
            <div className="tkt-hero-copy relative max-w-[620px]">
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
            <div className="hidden lg:block" aria-hidden="true" />
          </div>
        </header>
      </main>
    </div>
  )
}
