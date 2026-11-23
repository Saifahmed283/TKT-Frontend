import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Corners, CountUp } from './instruments'
import type { EventStatus } from '../lib/types'

export { Corners, CountUp, Blink } from './instruments'

export function StatusBadge({ status }: { status: EventStatus | string }) {
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

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`animate-fade-in relative max-h-[85vh] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-y-auto border border-line-soft bg-raised shadow-float`}
        onClick={(e) => e.stopPropagation()}
      >
        <Corners />
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-ink-0">{title}</h2>
          <button onClick={onClose} className="rounded-none p-1.5 text-ink-3 transition-colors hover:bg-elevated hover:text-ink-0" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
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
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink-0">{title}</h1>
        {subtitle && <p className="mt-1.5 font-mono text-[11px] tracking-[0.05em] text-ink-3">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="panel group relative p-5 transition-colors duration-300 hover:border-signal/40">
      <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">{label}</p>
      {typeof value === 'number' ? (
        <p className={`mt-2 font-display text-4xl font-semibold leading-none tracking-tight tabular-nums ${accent ? 'text-signal' : 'text-ink-0'}`}>
          <CountUp value={value} />
        </p>
      ) : (
        <p className={`mt-2 font-display text-4xl font-semibold leading-none tracking-tight tabular-nums ${accent ? 'text-signal' : 'text-ink-0'}`}>{value}</p>
      )}
      {sub && <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{sub}</p>}
    </div>
  )
}

export function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, opts)
}

export function fmtTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}