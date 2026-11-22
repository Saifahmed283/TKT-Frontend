import { TriangleAlert, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Corners, Blink } from '../instruments'

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4" role="status" aria-live="polite">
      <div className="relative h-10 w-10 border border-line-soft bg-raised">
        <Corners />
        <span className="absolute inset-1.5 animate-spin rounded-full border border-signal/20 border-t-signal" />
        <span className="absolute inset-[15px] animate-blink rounded-full bg-signal/40" />
      </div>
      {label && (
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-3">
          <Blink className="bg-signal" />
          {label}
        </p>
      )}
    </div>
  )
}

export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 border border-danger/25 bg-danger/10 px-4 py-3',
        className,
      )}
    >
      <TriangleAlert className="size-4 shrink-0 text-danger" />
      <p className="flex-1 font-mono text-[12px] leading-snug text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-danger transition-colors hover:bg-danger/10"
        >
          <RotateCcw className="size-3" />
          Retry
        </button>
      )}
    </div>
  )
}