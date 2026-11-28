import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Corners, CountUp } from '../instruments'

type StatCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

const variantAccent: Record<StatCardVariant, string> = {
  default: 'bg-ink-600/60',
  primary: 'bg-signal',
  success: 'bg-ok',
  warning: 'bg-warn',
  danger: 'bg-danger',
}

const variantBorder: Record<StatCardVariant, string> = {
  default: 'border-line-soft',
  primary: 'border-signal/30',
  success: 'border-ok/30',
  warning: 'border-warn/30',
  danger: 'border-danger/30',
}

const variantChip: Record<StatCardVariant, string> = {
  default: 'bg-elevated text-ink-3 ring-line-soft',
  primary: 'bg-signal-soft text-signal ring-signal/20',
  success: 'bg-ok/10 text-ok ring-ok/20',
  warning: 'bg-warn/10 text-warn ring-warn/20',
  danger: 'bg-danger/10 text-danger ring-danger/20',
}

type StatCardProps = {
  value: string | number
  sub?: string
  icon?: ReactNode
  accent?: boolean
  variant?: StatCardVariant
  trend?: { value: number; isPositive: boolean }
  onClick?: () => void
  className?: string
  style?: CSSProperties
} & ({ label: string; title?: string } | { title: string; label?: string })

/** Canonical stat card: animated counter, optional icon/trend/variant and click action. `title` selects the dashboard layout; `label` selects the compact animated layout. */
export function StatCard({
  label,
  title,
  value,
  sub,
  icon,
  accent,
  variant = 'default',
  trend,
  onClick,
  className,
  style,
}: StatCardProps) {
  const reduce = useReducedMotion()
  const heading = label ?? title
  const numeric = typeof value === 'number' ? value : null

  // Dashboard-style cards keep their original chip/accent-bar layout.
  if (title !== undefined) {
    const baseClass = cn(
      'relative block w-full min-h-11 overflow-hidden border bg-raised text-start transition-all duration-200 hover:-translate-y-px',
      variantBorder[variant],
      className,
    )
    const body = (
      <>
        <Corners className="opacity-40" />
        <div className={cn('absolute inset-y-0 left-0 w-[3px] rtl:left-auto rtl:right-0', variantAccent[variant])} />
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="break-words font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">{heading}</p>
              <p className="font-display text-2xl font-bold tracking-tight text-ink-0 sm:text-3xl tabular-nums">{value}</p>
              {trend && (
                <p
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold',
                    trend.isPositive ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger',
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </p>
              )}
            </div>
            <div className={cn('grid shrink-0 place-items-center rounded-none p-3 ring-1', variantChip[variant])}>
              {icon}
            </div>
          </div>
        </div>
      </>
    )
    if (onClick) {
      return <button type="button" onClick={onClick} style={style} className={cn(baseClass, 'cursor-pointer')}>{body}</button>
    }
    return <div style={style} className={baseClass}>{body}</div>
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group relative border bg-raised/70 p-4 transition-colors duration-300 hover:border-signal/40', variantBorder[variant], className)}
      style={style}
    >
      <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">{heading}</p>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <p
        className={cn(
          'mt-1.5 font-display text-[30px] font-bold leading-none tabular-nums tracking-tight',
          accent ? 'text-signal' : 'text-ink',
        )}
      >
        {numeric !== null ? <CountUp value={numeric} /> : value}
      </p>
      {sub && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{sub}</p>}
    </motion.div>
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