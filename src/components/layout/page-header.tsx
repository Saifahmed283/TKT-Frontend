import type { ReactNode } from 'react'
import { Corners } from '../instruments'

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line-soft px-0 pb-4 pt-6 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="relative mt-0.5 grid size-9 shrink-0 place-items-center border border-signal/30 bg-signal-soft text-signal">
            {icon}
            <Corners />
          </span>
        )}
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-signal">
            <span className="inline-block h-1 w-1 rounded-full bg-signal" />
            TKT · Control center
          </p>
          <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-ink-0 sm:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-1.5 break-words font-mono text-[11px] tracking-[0.05em] text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}