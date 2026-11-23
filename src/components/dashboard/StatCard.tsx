import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Corners } from '@/components/instruments'

type Variant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

const accent: Record<Variant, string> = {
  default: 'bg-ink-600/60',
  primary: 'bg-signal',
  success: 'bg-ok',
  warning: 'bg-warn',
  danger: 'bg-danger',
}

const border: Record<Variant, string> = {
  default: 'border-line-soft',
  primary: 'border-signal/30',
  success: 'border-ok/30',
  warning: 'border-warn/30',
  danger: 'border-danger/30',
}

const chip: Record<Variant, string> = {
  default: 'bg-elevated text-ink-3 ring-line-soft',
  primary: 'bg-signal-soft text-signal ring-signal/20',
  success: 'bg-ok/10 text-ok ring-ok/20',
  warning: 'bg-warn/10 text-warn ring-warn/20',
  danger: 'bg-danger/10 text-danger ring-danger/20',
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  onClick,
  className,
  style,
}: {
  title: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; isPositive: boolean }
  variant?: Variant
  onClick?: () => void
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={style}
      className={cn(
        'relative overflow-hidden border bg-raised transition-all duration-200 hover:-translate-y-px',
        border[variant],
        onClick ? 'cursor-pointer' : '',
        className,
      )}
    >
      <Corners className="opacity-40" />
      <div className={cn('absolute inset-y-0 left-0 w-[3px] rtl:left-auto rtl:right-0', accent[variant])} />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-3">{title}</p>
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
          <div className={cn('grid shrink-0 place-items-center rounded-none p-3 ring-1', chip[variant])}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}