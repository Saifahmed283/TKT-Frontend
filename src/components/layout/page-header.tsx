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
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line-soft px-6 pb-4 pt-6">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="relative mt-0.5 grid size-9 shrink-0 place-items-center border border-signal/30 bg-signal-soft text-signal">
            {icon}
            <Corners />
          </span>
        )}
        <div>
          <p className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
            <span className="inline-block h-1 w-1 rounded-full bg-signal" />
            TKT · Control center
          </p>
          <h1 className="font-display text-[28px] font-bold uppercase leading-none tracking-tight text-ink-0">{title}</h1>
          {subtitle && <p className="mt-1.5 font-mono text-[11px] tracking-[0.05em] text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}