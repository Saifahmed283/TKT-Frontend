import type { ReactNode } from 'react'
import { Corners } from './instruments'
import type { EventStatus } from '../lib/types'
import { formatEgyptDate, formatEgyptDateTime, formatEgyptTime } from '../lib/time'

export { Corners, CountUp, Blink } from './instruments'

/** Event lifecycle statuses only (DRAFT/PLANNING/READY/PUBLISHED/LIVE/ENDED/ARCHIVED). */
export function EventStatusBadge({ status }: { status: EventStatus | string }) {
  const map: Record<string, string> = {
    DRAFT: 'badge-neutral',
    PLANNING: 'badge-neutral',
    READY: 'badge-warn',
    PUBLISHED: 'badge-signal',
    LIVE: 'badge-ok',
    ENDED: 'badge-neutral',
    ARCHIVED: 'badge-err',
  }
  return <span className={map[status] ?? 'badge-neutral'}>{status}</span>
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-ink-3">
      <div className="relative h-9 w-9">
        <span className="absolute inset-0 animate-spin rounded-full border border-signal/20 border-t-signal" />
        <span className="absolute inset-1.5 animate-blink rounded-full bg-signal/40" />
      </div>
      {label && <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-3">{label}</p>}
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="panel relative flex flex-col items-center gap-4 px-6 py-16 text-center">
      <Corners />
      <div className="grid h-12 w-12 place-items-center border border-signal/30 bg-signal/10 text-signal">{icon}</div>
      <div>
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink-0">{title}</h3>
        {body && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">{body}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorBanner({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  return (
    <div className="flex items-center gap-3 border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
      <span className="h-1.5 w-1.5 shrink-0 animate-blink rounded-full bg-danger" />
      {message}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-signal">
          <span className="inline-block h-1 w-1 rounded-full bg-signal" />
          TKT · Control center
        </p>
        <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-ink-0 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 break-words font-mono text-[11px] tracking-[0.05em] text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return formatEgyptDate(iso, opts)
}

export function fmtTime(iso: string | null | undefined) {
  return formatEgyptTime(iso)
}

export function fmtDateTime(iso: string | null | undefined) {
  return formatEgyptDateTime(iso)
}