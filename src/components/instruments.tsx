import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'

/** Corner tick marks — the instrument-panel signature. */
export function Corners({ className = '' }: { className?: string }) {
  const c = `pointer-events-none absolute h-2.5 w-2.5 border-signal/60 ${className}`
  return (
    <>
      <span aria-hidden="true" className={`${c} left-0 top-0 border-l border-t`} />
      <span aria-hidden="true" className={`${c} right-0 top-0 border-r border-t`} />
      <span aria-hidden="true" className={`${c} bottom-0 left-0 border-b border-l`} />
      <span aria-hidden="true" className={`${c} bottom-0 right-0 border-b border-r`} />
    </>
  )
}

/** Blinking status dot. */
export function Blink({ className = 'bg-ok' }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block h-1.5 w-1.5 animate-blink rounded-full ${className}`} />
}

/** Number that counts up when scrolled into view. */
export function CountUp({
  value,
  suffix = '',
  scale = 1,
  decimals = 0,
  className = '',
}: {
  value: number
  suffix?: string
  scale?: number
  decimals?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setN(value)
      return
    }
    const controls = animate(0, value, {
      duration: 2.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setN(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, reduceMotion, value])
  const display = scale === 1 ? n.toLocaleString() : (n / scale).toFixed(decimals)
  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}