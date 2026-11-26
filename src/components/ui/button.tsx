import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Corners } from '../instruments'

type Variant = 'default' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  default:
    'bg-signal text-on-signal font-semibold hover:bg-signal/90 active:bg-signal active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] shadow-glow',
  outline:
    'border border-line-soft bg-raised text-ink-2 hover:border-signal/40 hover:text-ink active:bg-elevated active:border-signal/50',
  ghost: 'text-ink-3 hover:bg-raised hover:text-ink-2 active:bg-elevated',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15 active:bg-danger/20 active:border-danger/40',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[11px]',
  md: 'h-10 gap-2 px-4 text-[12px]',
  lg: 'h-12 gap-2 px-6 text-[13px]',
}

export function Button({
  variant = 'default',
  size = 'md',
  loading,
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center font-mono font-semibold uppercase tracking-[0.12em] transition-all duration-150 disabled:cursor-not-allowed',
        loading ? 'disabled:opacity-80 disabled:cursor-wait' : 'disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {variant === 'default' && <Corners className="opacity-60" />}
      {loading ? (
        <span className="inline-flex items-center gap-2" aria-hidden="true">
          <span className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        </span>
      ) : (
        icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null
      )}
      <span className={cn('inline-flex items-center', loading && 'opacity-90')}>{children}</span>
    </button>
  )
}
