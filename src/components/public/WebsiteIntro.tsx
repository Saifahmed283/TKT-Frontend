import { useEffect, useState } from 'react'
import { useLanguage } from '../../lib/i18n'

const SESSION_KEY = 'tkt_intro_seen'

// Exact coordinates from TKT-Resources/svg/tkt_dark_surface_gold_emblem_svg.svg
const HALO_DOTS = [
  { cx: 120.0, cy: 16.0 }, { cx: 138.06, cy: 17.58 }, { cx: 155.57, cy: 22.27 }, { cx: 172.0, cy: 29.92 },
  { cx: 186.8, cy: 40.3 }, { cx: 199.49, cy: 53.0 }, { cx: 209.68, cy: 67.8 }, { cx: 217.34, cy: 84.23 },
  { cx: 222.02, cy: 101.73 }, { cx: 223.6, cy: 119.79 }, { cx: 222.02, cy: 138.06 }, { cx: 217.34, cy: 155.57 },
  { cx: 209.68, cy: 172.0 }, { cx: 199.49, cy: 186.8 }, { cx: 186.8, cy: 199.49 }, { cx: 172.0, cy: 209.68 },
  { cx: 155.57, cy: 217.34 }, { cx: 138.06, cy: 222.02 }, { cx: 120.0, cy: 224.0 }, { cx: 101.94, cy: 222.02 },
  { cx: 84.43, cy: 217.34 }, { cx: 68.0, cy: 209.68 }, { cx: 53.2, cy: 199.49 }, { cx: 40.51, cy: 186.8 },
  { cx: 30.32, cy: 172.0 }, { cx: 22.66, cy: 155.57 }, { cx: 17.98, cy: 138.06 }, { cx: 16.4, cy: 120.0 },
  { cx: 17.98, cy: 101.94 }, { cx: 22.66, cy: 84.43 }, { cx: 30.32, cy: 68.0 }, { cx: 40.51, cy: 53.2 },
  { cx: 53.2, cy: 40.51 }, { cx: 68.0, cy: 30.32 }, { cx: 84.43, cy: 22.66 }, { cx: 101.94, cy: 17.98 },
].map((d, i) => ({ ...d, id: i, delay: 0.5 + i * 0.022 }))

export default function WebsiteIntro() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const { lang } = useLanguage()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (reduce) return
    if (!sessionStorage.getItem(SESSION_KEY)) setShow(true)
  }, [reduce])

  const finish = () => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setShow(false)
  }

  useEffect(() => {
    if (!show) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timeout = window.setTimeout(finish, 1550)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        window.clearTimeout(timeout)
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [show])

  const copy = lang === 'ar'
    ? { verifying: 'جاري التحقق', enter: 'ادخل التجربة', hint: 'اضغط Enter للدخول' }
    : { verifying: 'VERIFYING SEAL', enter: 'Enter Experience', hint: 'Press Enter to enter' }

  return (
    <>
      {show && (
        <div
          className="tkt-intro fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-[#0B0B0C] text-[#FAF8F4]"
          role="dialog"
          aria-label="TKT Brand Introduction"
        >
          <style>{`
            .tkt-intro { --ease-arch: cubic-bezier(0.22, 1, 0.36, 1); }
            .tkt-intro .intro-seal-svg { width: min(228px, 52vw); height: min(228px, 52vw); margin-bottom: 26px; overflow: visible; }
            .tkt-intro .seal-ring-outer { stroke-dasharray: 592; stroke-dashoffset: 592; transform-origin: 120px 120px; animation: tktDrawRing 1.35s var(--ease-arch) forwards; }
            .tkt-intro .seal-ring-inner { stroke-dasharray: 528; stroke-dashoffset: -528; transform-origin: 120px 120px; animation: tktDrawRing 1.35s 0.14s var(--ease-arch) forwards; }
            .tkt-intro .mono-stroke { stroke-dasharray: 1; stroke-dashoffset: 1; animation: tktDrawMono 1.05s 0.32s var(--ease-arch) forwards; }
            .tkt-intro .seal-static { opacity: 0; animation: tktFadeIn 0.01s 1.45s linear forwards; }
            .tkt-intro .halo-dot { opacity: 0; transform-box: fill-box; transform-origin: center; animation: tktPopDot 0.4s var(--ease-arch) forwards; }
            .tkt-intro .intro-wordmark { font-family: 'Poppins', 'Cairo', sans-serif; font-size: clamp(40px, 5.5vw, 60px); font-weight: 600; letter-spacing: 0.28em; padding-left: 0.28em; color: #E8D08B; opacity: 0; transform: translateY(14px); animation: tktFadeUp 0.9s 0.75s var(--ease-arch) forwards; text-transform: uppercase; }
            .tkt-intro .intro-hairline { width: 0; height: 1px; background: #C8A25C; margin: 14px 0 16px; opacity: 0; animation: tktLineGrow 0.8s 0.95s var(--ease-arch) forwards; }
            .tkt-intro .intro-descriptor { font-family: 'Poppins', 'Cairo', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.42em; padding-left: 0.42em; color: #FAF8F4; opacity: 0; transform: translateY(10px); animation: tktFadeUp 0.8s 1.05s var(--ease-arch) forwards; }
            .tkt-intro .intro-progress-track { width: min(280px, 70vw); height: 2px; background: #1C1B1B; margin-top: 40px; position: relative; overflow: hidden; }
            .tkt-intro .intro-progress-fill { width: 100%; height: 100%; background: linear-gradient(90deg, #C8A25C, #E8D08B); box-shadow: 0 0 12px rgba(232,208,139,0.35); transform: scaleX(0); transform-origin: left center; animation: tktProgress 1.55s linear forwards; }
            .tkt-intro .intro-counter { margin-top: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.28em; color: #6E6A62; text-transform: uppercase; }
            .tkt-intro .skip-btn { position: absolute; bottom: max(28px, env(safe-area-inset-bottom)); right: max(28px, env(safe-area-inset-right)); background: transparent; border: none; color: #6E6A62; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; padding: 10px 0; transition: color 0.25s; }
            .tkt-intro .skip-btn:hover, .tkt-intro .skip-btn:focus-visible { color: #E8D08B; outline: none; }
            @keyframes tktDrawRing { to { stroke-dashoffset: 0; } }
            @keyframes tktDrawMono { to { stroke-dashoffset: 0; } }
            @keyframes tktPopDot { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
            @keyframes tktFadeUp { to { opacity: 1; transform: translateY(0); } }
            @keyframes tktFadeIn { to { opacity: 1; } }
            @keyframes tktLineGrow { to { width: 72px; opacity: 1; } }
            @keyframes tktProgress { to { transform: scaleX(1); } }
            @media (prefers-reduced-motion: reduce) {
              .tkt-intro .seal-ring-outer, .tkt-intro .seal-ring-inner, .tkt-intro .mono-stroke, .tkt-intro .halo-dot, .tkt-intro .intro-wordmark, .tkt-intro .intro-hairline, .tkt-intro .intro-descriptor, .tkt-intro .seal-static { animation: none !important; opacity: 1 !important; transform: none !important; stroke-dashoffset: 0 !important; }
              .tkt-intro .intro-hairline { width: 72px !important; }
              .tkt-intro .intro-progress-fill { animation: none !important; transform: scaleX(1) !important; }
            }
          `}</style>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,208,139,0.06),transparent_45%,rgba(11,11,12,0.2)_100%)]" />

          <div className="intro-stage relative flex flex-col items-center px-6 text-center">
            <svg className="intro-seal-svg" viewBox="0 0 240 240" aria-hidden="true" role="img" aria-label="TKT Emblem">
              <defs>
                {/* Official gradient from TKT-Resources/svg/tkt_dark_surface_gold_emblem_svg.svg */}
                <linearGradient id="tktGoldGradIntro" gradientUnits="userSpaceOnUse" x1="36" y1="36" x2="204" y2="204">
                  <stop offset="0%" stopColor="#C8A25C" />
                  <stop offset="50%" stopColor="#E8D08B" />
                  <stop offset="100%" stopColor="#C8A25C" />
                </linearGradient>
              </defs>

              {/* Official double rings */}
              <circle className="seal-ring-outer" cx="120" cy="120" r="94" fill="none" stroke="url(#tktGoldGradIntro)" strokeWidth="2.6" />
              <circle className="seal-ring-inner" cx="120" cy="120" r="84" fill="none" stroke="url(#tktGoldGradIntro)" strokeWidth="1.2" />

              {/* Official 36-point celestial halo */}
              <g fill="url(#tktGoldGradIntro)">
                {HALO_DOTS.map((d) => (
                  <circle key={d.id} className="halo-dot" cx={d.cx} cy={d.cy} r="2.0" style={{ animationDelay: `${d.delay}s` }} />
                ))}
              </g>

              {/* Official T-K-T monogram — animated draw, then static fallback guarantees full render */}
              <g stroke="url(#tktGoldGradIntro)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <line className="mono-stroke" pathLength={1} x1="120" y1="67" x2="120" y2="173" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="67" x2="158" y2="67" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="173" x2="158" y2="173" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="90" x2="158" y2="150" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="150" x2="158" y2="90" />
              </g>
              <g className="seal-static" stroke="url(#tktGoldGradIntro)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" aria-hidden="true">
                <line x1="120" y1="67" x2="120" y2="173" />
                <line x1="82" y1="67" x2="158" y2="67" />
                <line x1="82" y1="173" x2="158" y2="173" />
                <line x1="82" y1="90" x2="158" y2="150" />
                <line x1="82" y1="150" x2="158" y2="90" />
              </g>
            </svg>

            <div className="intro-wordmark">TKT</div>
            <div className="intro-hairline" />
            <div className="intro-descriptor">EVENTS · EXPERIENCES</div>

            <div className="intro-progress-track" aria-hidden="true">
              <div className="intro-progress-fill" />
            </div>
            <div className="intro-counter">{copy.verifying}</div>
            <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#6E6A62]">{copy.hint}</p>
          </div>

          <button type="button" className="skip-btn" onClick={finish}>
            {copy.enter} →
          </button>
        </div>
      )}
    </>
  )
}
