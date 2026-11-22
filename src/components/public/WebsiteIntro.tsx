import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLanguage } from '../../lib/i18n'

const SESSION_KEY = 'tkt_intro_seen'

const COLORS = {
  richBlack: '#0B0B0C',
  charcoal: '#1C1B1B',
  slateGrey: '#6E6A62',
  goldFoil: '#C8A25C',
  paleGold: '#E8D08B',
  warmIvory: '#FAF8F4',
}

function getGoldGradient(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2)
  grad.addColorStop(0, COLORS.goldFoil)
  grad.addColorStop(0.45, COLORS.paleGold)
  grad.addColorStop(0.55, COLORS.paleGold)
  grad.addColorStop(1, COLORS.goldFoil)
  return grad
}

function drawMonogram(ctx: CanvasRenderingContext2D, cx: number, cy: number, H: number, strokeStyle: string | CanvasGradient) {
  ctx.save()
  const halfH = H * 0.5
  const barW = H * 0.76
  const halfBarW = barW * 0.5
  const strokeW = Math.max(2, H * 0.088)
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = strokeW
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(cx, cy - halfH)
  ctx.lineTo(cx, cy + halfH)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - halfBarW, cy - halfH)
  ctx.lineTo(cx + halfBarW, cy - halfH)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - halfBarW, cy + halfH)
  ctx.lineTo(cx + halfBarW, cy + halfH)
  ctx.stroke()

  const diagX = halfBarW * 0.94
  const diagY = halfH * 0.54
  ctx.beginPath()
  ctx.moveTo(cx - diagX, cy - diagY)
  ctx.lineTo(cx + diagX, cy + diagY)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - diagX, cy + diagY)
  ctx.lineTo(cx + diagX, cy - diagY)
  ctx.stroke()
  ctx.restore()
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rotationOffset: number, reveal: number) {
  ctx.save()
  ctx.globalAlpha = reveal
  const innerRingR = radius * 0.78
  const outerRingR = radius * 0.86
  const dotRingR = radius * 0.96
  const monoH = radius * 0.86
  const ringColor = getGoldGradient(ctx, cx - radius, cy - radius, cx + radius, cy + radius)
  const monoColor = getGoldGradient(ctx, cx - monoH * 0.5, cy - monoH * 0.5, cx + monoH * 0.5, cy + monoH * 0.5)

  ctx.beginPath()
  ctx.arc(cx, cy, innerRingR, 0, Math.PI * 2)
  ctx.strokeStyle = ringColor
  ctx.lineWidth = Math.max(1, radius * 0.011)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, outerRingR, 0, Math.PI * 2)
  ctx.strokeStyle = ringColor
  ctx.lineWidth = Math.max(1.5, radius * 0.019)
  ctx.stroke()

  const dotRadius = Math.max(1.3, radius * 0.018)
  ctx.fillStyle = ringColor
  for (let i = 0; i < 36; i++) {
    const theta = (i * 10 * Math.PI) / 180 + rotationOffset
    const dx = cx + Math.cos(theta) * dotRingR
    const dy = cy + Math.sin(theta) * dotRingR
    ctx.beginPath()
    ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  drawMonogram(ctx, cx, cy, monoH, monoColor)
  ctx.restore()
}

export default function WebsiteIntro() {
  const reduce = useReducedMotion()
  const { lang } = useLanguage()
  const [show, setShow] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

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
    const timer = window.setTimeout(finish, 3600)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [show])

  useEffect(() => {
    if (!show || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    const start = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, w, h)

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0B0B0C')
      bg.addColorStop(1, '#151412')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const glow = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, Math.min(w, h) * 0.55)
      glow.addColorStop(0, 'rgba(232,208,139,0.13)')
      glow.addColorStop(0.5, 'rgba(200,162,92,0.05)')
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.globalAlpha = 0.08
      ctx.strokeStyle = COLORS.paleGold
      ctx.lineWidth = 1
      const grid = 64
      for (let x = (t * 12) % grid - grid; x < w + grid; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h + grid; y += grid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      ctx.restore()

      const radius = Math.min(w, h) * (w < 640 ? 0.18 : 0.145)
      const cx = w / 2
      const cy = h * 0.44
      const reveal = Math.min(1, t / 0.8)
      const rotation = t * 0.18
      drawSeal(ctx, cx, cy, radius * (0.92 + 0.08 * Math.min(1, t / 0.9)), rotation, reveal)

      // sweep ring
      ctx.save()
      ctx.globalAlpha = Math.max(0, 0.5 - t * 0.12)
      ctx.strokeStyle = 'rgba(232,208,139,0.35)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, radius * (1.15 + t * 18), 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [show])

  const copy = lang === 'ar'
    ? { sub: 'فعاليات · تجارب', title: 'TKT', hint: 'اضغط Enter أو اسحب للدخول', enter: 'ادخل التجربة' }
    : { sub: 'EVENTS · EXPERIENCES', title: 'TKT', hint: 'Press Enter or tap to enter', enter: 'Enter experience' }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[120] overflow-hidden bg-[#0B0B0C] text-[#FAF8F4]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="TKT intro"
          onClick={finish}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(11,11,12,0.25)_70%,rgba(11,11,12,0.72)_100%)]" />

          <div className="relative z-10 flex h-full flex-col items-center justify-end px-6 pb-[10vh] text-center sm:pb-[12vh]">
            <motion.p
              className="font-mono text-[11px] uppercase tracking-[0.42em] text-[#E8D08B]/80 sm:text-xs"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {copy.sub}
            </motion.p>

            <div className="mt-5 overflow-hidden">
              <motion.h1
                className="font-display text-[clamp(4rem,12vw,10rem)] font-normal uppercase leading-[0.88] tracking-[0.08em] text-[#FAF8F4]"
                initial={{ y: '110%', opacity: 0.4 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {copy.title}
              </motion.h1>
            </div>

            <motion.div
              className="mt-8 flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <span className="hidden h-px w-12 bg-[#C8A25C]/50 sm:block" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#FAF8F4]/55">{copy.hint}</p>
              <span className="hidden h-px w-12 bg-[#C8A25C]/50 sm:block" />
            </motion.div>

            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); finish() }}
              className="pointer-events-auto mt-7 border border-[#C8A25C]/45 bg-[#C8A25C]/8 px-7 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[#FAF8F4] transition duration-300 hover:bg-[#C8A25C]/16 hover:border-[#E8D08B]/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.35, duration: 0.5 }}
            >
              {copy.enter}
            </motion.button>
          </div>

          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#C8A25C] via-[#E8D08B] to-[#C8A25C]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3.5, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
