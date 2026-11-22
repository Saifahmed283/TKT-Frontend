import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Corners } from '../instruments'

/** Stat card with an animated counter. Numbers transition from previous to current. */
export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  className,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  accent?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  const numeric = typeof value === 'number' ? value : null
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group relative border border-line-soft bg-raised/70 p-4 transition-colors duration-300 hover:border-signal/40', className)}
    >
      <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">{label}</p>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <p
        className={cn(
          'mt-1.5 font-display text-[30px] font-bold leading-none tabular-nums tracking-tight',
          accent ? 'text-signal' : 'text-ink',
        )}
      >
        {numeric !== null ? <AnimatedNumber value={numeric} /> : value}
      </p>
      {sub && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{sub}</p>}
    </motion.div>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.span
      key={value}
      initial={reduce ? false : { opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {value.toLocaleString()}
    </motion.span>
  )
}

/** Panel container with a subtle reveal on first render. */
export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn('relative border border-line-soft bg-raised/70 p-4', className)}
    >
      <Corners className="opacity-40" />
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-line-soft pb-2.5">
          {title && <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-signal">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </motion.section>
  )
}

/** Staggered reveal container for lists of cards. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={
        reduce
          ? undefined
          : {
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
            }
      }
    >
      {children}
    </motion.div>
  )
}