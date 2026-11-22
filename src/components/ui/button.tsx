import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Corners } from '../instruments'

type Variant = 'default' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  default:
    'bg-signal text-black font-semibold hover:bg-signal/90 active:scale-[0.98] shadow-glow',
  outline:
    'border border-line-soft bg-raised text-ink-2 hover:border-signal/40 hover:text-ink',
  ghost: 'text-ink-3 hover:bg-raised hover:text-ink-2',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-[11px]',
  md: 'h-10 gap-2 rounded-md px-4 text-[12px]',
  lg: 'h-12 gap-2 rounded-lg px-6 text-[13px]',
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
      className={cn(
        'relative inline-flex select-none items-center justify-center font-mono font-semibold uppercase tracking-[0.12em] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {variant === 'default' && <Corners className="opacity-60" />}
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}