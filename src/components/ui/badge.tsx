import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Blink } from '../instruments'

type Tone = 'default' | 'live' | 'ok' | 'warn' | 'danger' | 'info'

const tones: Record<Tone, string> = {
  default: 'border-line bg-elevated text-ink-2',
  live: 'border-signal/30 bg-signal-soft text-signal',
  ok: 'border-ok/25 bg-ok/10 text-ok',
  warn: 'border-warn/25 bg-warn/10 text-warn',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  info: 'border-info/25 bg-info/10 text-info',
}

export function Badge({
  tone = 'default',
  pulse,
  className,
  children,
}: {
  tone?: Tone
  pulse?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]',
        tones[tone],
        className,
      )}
    >
      {pulse && <Blink className={tone === 'live' || tone === 'ok' ? 'bg-ok' : tone === 'danger' ? 'bg-danger' : 'bg-signal'} />}
      {children}
    </span>
  )
}

/** Generic entity statuses (LIVE/ACTIVE/DONE/GRANTED/DENIED/…), not event lifecycle statuses. */
export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === 'LIVE' || status === 'ACTIVE' || status === 'DONE' || status === 'RESOLVED' || status === 'GRANTED'
      ? 'ok'
      : status === 'DENIED' || status === 'BLOCKED' || status === 'REVOKED' || status === 'CANCELLED' || status === 'CRITICAL'
        ? 'danger'
        : status === 'DRAFT' || status === 'ARCHIVED' || status === 'REFUNDED'
          ? 'default'
          : 'warn'
  return <Badge tone={tone} pulse={status === 'LIVE'}>{status}</Badge>
}
