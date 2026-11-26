import type { CSSProperties, ReactNode } from 'react'
import { Corners } from '../instruments'

type Spark = { x: string; y: string; size: number; delay: string; star?: boolean; tone?: 'signal' | 'gold' | 'ink' }

const SPARKS: Spark[] = [
  { x: '6%', y: '16%', size: 3, delay: '0s', star: true },
  { x: '84%', y: '12%', size: 4, delay: '0.7s' },
  { x: '18%', y: '72%', size: 3, delay: '1.4s', tone: 'gold' },
  { x: '74%', y: '78%', size: 5, delay: '0.3s', star: true },
  { x: '46%', y: '8%', size: 2, delay: '1.9s', tone: 'ink' },
  { x: '92%', y: '54%', size: 3, delay: '2.4s' },
  { x: '10%', y: '44%', size: 2, delay: '1.1s', tone: 'gold' },
  { x: '58%', y: '92%', size: 3, delay: '2.8s', star: true },
]

/** Tiny twinkling dots — pure CSS, no canvas. */
export function Sparkles({ className = '', count = SPARKS.length }: { className?: string; count?: number }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {SPARKS.slice(0, Math.max(0, Math.min(count, SPARKS.length))).map((spark, i) => (
        <span
          key={i}
          className={`tkt-spark${spark.star ? ' tkt-spark--star' : ''}${spark.tone ? ` tkt-spark--${spark.tone}` : ''}`}
          style={
            {
              '--spark-x': spark.x,
              '--spark-y': spark.y,
              '--spark-size': `${spark.size}px`,
              '--spark-delay': spark.delay,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

/** Dashed orbit with one or two drifting satellites. */
export function OrbitRing({ className = '', inset = '6%', second = false }: { className?: string; inset?: string; second?: boolean }) {
  return (
    <span aria-hidden="true" className={`tkt-orbit pointer-events-none absolute ${className}`} style={{ inset }}>
      <span className="tkt-orbit-ring" />
      <span className="tkt-orbit-track"><span className="tkt-orbit-dot" /></span>
      {second && (
        <span className="tkt-orbit-track tkt-orbit-track--second"><span className="tkt-orbit-dot tkt-orbit-dot--small" /></span>
      )}
    </span>
  )
}

/** Soft colour wash used behind sections and visuals. */
export function Bloom({ className = '', tone = 'signal' }: { className?: string; tone?: 'signal' | 'warm' }) {
  return <span aria-hidden="true" data-tone={tone} className={`tkt-bloom pointer-events-none absolute ${className}`} />
}

/** Small floating label. Decorative by default so it never pollutes the a11y tree. */
export function FloatingChip({
  children,
  className = '',
  delay = '0s',
  decorative = true,
}: {
  children: ReactNode
  className?: string
  delay?: string
  decorative?: boolean
}) {
  return (
    <span
      aria-hidden={decorative || undefined}
      className={`tkt-chip pointer-events-none absolute z-[2] inline-flex items-center gap-1.5 whitespace-nowrap border border-signal/30 bg-raised/85 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-signal backdrop-blur-sm ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  )
}

/** Ticket-stub frame with notch marks — wraps a hero visual or a small illustration. */
export function TicketFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 border border-line-soft/80 bg-raised/25" />
      <Corners />
      <span aria-hidden="true" className="pointer-events-none absolute -left-[5px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-line-soft bg-paper" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-[5px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-line-soft bg-paper" />
      <div className="relative h-full w-full">{children}</div>
    </div>
  )
}

/** Shared backdrop for the public page headers. */
export function PageAccents({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <Bloom className="-end-[14%] -top-[18%] h-[420px] w-[420px] opacity-50" />
      <Bloom tone="warm" className="start-[4%] top-[28%] h-[260px] w-[260px] opacity-40" />
      <Sparkles count={6} className="opacity-60" />
    </div>
  )
}
