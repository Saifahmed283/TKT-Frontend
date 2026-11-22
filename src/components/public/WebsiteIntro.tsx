import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLanguage } from '../../lib/i18n'

const SESSION_KEY = 'tkt_intro_seen'

function buildHaloDots() {
  return Array.from({ length: 36 }, (_, i) => {
    const angle = ((i * 10 - 90) * Math.PI) / 180
    return {
      id: i,
      cx: 120 + Math.cos(angle) * 104,
      cy: 120 + Math.sin(angle) * 104,
      delay: 0.5 + i * 0.022,
    }
  })
}

export default function WebsiteIntro() {
  const reduce = useReducedMotion()
  const { lang } = useLanguage()
  const [show, setShow] = useState(false)
  const [progress, setProgress] = useState(0)
  const dots = useMemo(buildHaloDots, [])

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

    let pct = 0
    const interval = window.setInterval(() => {
      pct = Math.min(100, pct + 2)
      setProgress(pct)
      if (pct >= 100) {
        window.clearInterval(interval)
        window.setTimeout(finish, 380)
      }
    }, 42)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        window.clearInterval(interval)
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [show])

  const copy = lang === 'ar'
    ? { verifying: 'جاري التحقق', enter: 'ادخل التجربة', hint: 'اضغط Enter للدخول' }
    : { verifying: 'VERIFYING SEAL', enter: 'Enter Experience', hint: 'Press Enter to enter' }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="tkt-intro fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden bg-[#0B0B0C] text-[#FAF8F4]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, visibility: 'hidden' as any }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="TKT Brand Introduction"
        >
          <style>{`
            .tkt-intro { --ease-arch: cubic-bezier(0.22, 1, 0.36, 1); }
            .tkt-intro .intro-seal-svg { width: min(228px, 52vw); height: min(228px, 52vw); margin-bottom: 26px; overflow: visible; }
            .tkt-intro .seal-ring-outer { stroke-dasharray: 592; stroke-dashoffset: 592; transform-origin: 120px 120px; animation: tktDrawRing 1.35s var(--ease-arch) forwards; }
            .tkt-intro .seal-ring-inner { stroke-dasharray: 528; stroke-dashoffset: -528; transform-origin: 120px 120px; animation: tktDrawRing 1.35s 0.14s var(--ease-arch) forwards; }
            .tkt-intro .mono-stroke { stroke-dasharray: 1; stroke-dashoffset: 1; animation: tktDrawMono 1.05s 0.32s var(--ease-arch) forwards; }
            .tkt-intro .seal-static { opacity: 0; animation: tktFadeUp 0.01s 1.5s linear forwards; }
            .tkt-intro .halo-dot { opacity: 0; transform-box: fill-box; transform-origin: center; animation: tktPopDot 0.4s var(--ease-arch) forwards; }
            .tkt-intro .intro-wordmark { font-family: 'Italiana', serif; font-size: clamp(36px, 5vw, 54px); letter-spacing: 0.36em; padding-left: 0.36em; color: #E8D08B; opacity: 0; transform: translateY(14px); animation: tktFadeUp 0.9s 0.75s var(--ease-arch) forwards; }
            .tkt-intro .intro-hairline { width: 0; height: 1px; background: #C8A25C; margin: 14px 0 16px; opacity: 0; animation: tktLineGrow 0.8s 0.95s var(--ease-arch) forwards; }
            .tkt-intro .intro-descriptor { font-family: 'Jura', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.42em; padding-left: 0.42em; color: #FAF8F4; opacity: 0; transform: translateY(10px); animation: tktFadeUp 0.8s 1.05s var(--ease-arch) forwards; }
            .tkt-intro .intro-progress-track { width: min(280px, 70vw); height: 2px; background: #1C1B1B; margin-top: 40px; position: relative; overflow: hidden; }
            .tkt-intro .intro-progress-fill { height: 100%; background: linear-gradient(90deg, #C8A25C, #E8D08B); box-shadow: 0 0 12px rgba(232,208,139,0.35); transition: width 0.1s linear; }
            .tkt-intro .intro-counter { margin-top: 14px; font-family: 'Jura', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.28em; color: #6E6A62; text-transform: uppercase; }
            .tkt-intro .skip-btn { position: absolute; bottom: max(28px, env(safe-area-inset-bottom)); right: max(28px, env(safe-area-inset-right)); background: transparent; border: none; color: #6E6A62; font-family: 'Jura', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; padding: 10px 0; transition: color 0.25s; }
            .tkt-intro .skip-btn:hover, .tkt-intro .skip-btn:focus-visible { color: #E8D08B; outline: none; }
            @keyframes tktDrawRing { to { stroke-dashoffset: 0; } }
            @keyframes tktDrawMono { to { stroke-dashoffset: 0; } }
            @keyframes tktPopDot { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
            @keyframes tktFadeUp { to { opacity: 1; transform: translateY(0); } }
            @keyframes tktLineGrow { to { width: 72px; opacity: 1; } }
            @media (prefers-reduced-motion: reduce) {
              .tkt-intro .seal-ring-outer, .tkt-intro .seal-ring-inner, .tkt-intro .mono-stroke, .tkt-intro .halo-dot, .tkt-intro .intro-wordmark, .tkt-intro .intro-hairline, .tkt-intro .intro-descriptor, .tkt-intro .seal-static { animation: none !important; opacity: 1 !important; transform: none !important; stroke-dashoffset: 0 !important; }
              .tkt-intro .intro-hairline { width: 72px !important; }
            }
          `}</style>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(232,208,139,0.06),transparent_45%,rgba(11,11,12,0.2)_100%)]" />

          <div className="intro-stage relative flex flex-col items-center px-6 text-center">
            <svg className="intro-seal-svg" viewBox="0 0 240 240" aria-hidden="true">
              <defs>
                <linearGradient id="tktGoldGradIntro" x1="15%" y1="15%" x2="85%" y2="85%">
                  <stop offset="0%" stopColor="#C8A25C" />
                  <stop offset="50%" stopColor="#E8D08B" />
                  <stop offset="100%" stopColor="#C8A25C" />
                </linearGradient>
              </defs>
              <circle className="seal-ring-outer" cx="120" cy="120" r="94" fill="none" stroke="url(#tktGoldGradIntro)" strokeWidth="2.6" />
              <circle className="seal-ring-inner" cx="120" cy="120" r="84" fill="none" stroke="url(#tktGoldGradIntro)" strokeWidth="1.2" />
              <g>
                {dots.map((d) => (
                  <circle key={d.id} className="halo-dot" cx={d.cx} cy={d.cy} r="2" fill="#E8D08B" style={{ animationDelay: `${d.delay}s` }} />
                ))}
              </g>
              <g stroke="url(#tktGoldGradIntro)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <line className="mono-stroke" pathLength={1} x1="120" y1="67" x2="120" y2="173" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="67" x2="158" y2="67" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="173" x2="158" y2="173" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="90" x2="158" y2="150" />
                <line className="mono-stroke" pathLength={1} x1="82" y1="150" x2="158" y2="90" />
              </g>
              <g className="seal-static" stroke="url(#tktGoldGradIntro)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
              <div className="intro-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="intro-counter" aria-live="polite">
              {copy.verifying} · {String(progress).padStart(2, '0')}%
            </div>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6E6A62]">{copy.hint}</p>
          </div>

          <button type="button" className="skip-btn" onClick={finish}>
            {copy.enter} →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
