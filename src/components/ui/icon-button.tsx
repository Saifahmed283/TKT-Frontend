import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'muted' | 'danger' | 'quiet-danger'

const tones: Record<Tone, string> = {
  neutral: 'text-ink-2 hover:bg-raised',
  muted: 'text-ink-3 hover:bg-raised hover:text-ink-2',
  danger: 'text-danger hover:bg-danger/10',
  'quiet-danger': 'text-ink-3 hover:bg-danger/10 hover:text-danger',
}

/** Icon-only action with a mandatory accessible name and a 44px touch target. */
export function IconButton({
  tone = 'neutral',
  type = 'button',
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  'aria-label': string
  tone?: Tone
}) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        'grid min-h-11 min-w-11 shrink-0 place-items-center rounded-none transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  )
}
