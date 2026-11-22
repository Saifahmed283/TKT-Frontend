import { cn } from '@/lib/utils'

/** Pulsing live dot used for LIVE / ACTIVE / connection states. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex size-2" aria-hidden="true">
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60',
          className,
        )}
        style={{ animationDuration: '1.8s' }}
      />
      <span className={cn('relative inline-flex size-2 rounded-full bg-signal', className)} />
    </span>
  )
}

/** Pulsing status dot with a semantic color. */
export function StatusDot({ tone = 'ok', className }: { tone?: 'ok' | 'warn' | 'danger' | 'signal'; className?: string }) {
  const colors = {
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    signal: 'bg-signal',
  }
  return (
    <span className={cn('inline-block size-2 animate-pulse-dot rounded-full', colors[tone], className)} aria-hidden="true" />
  )
}