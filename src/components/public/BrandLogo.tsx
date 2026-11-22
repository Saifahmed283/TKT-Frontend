import { useTheme } from '../../lib/theme'
import { useLanguage } from '../../lib/i18n'
import { cn } from '../../lib/utils'

type Props = {
  className?: string
  imageClassName?: string
  showWordmark?: boolean
  tone?: 'auto' | 'light' | 'dark'
}

export default function BrandLogo({ className, imageClassName, showWordmark = false, tone = 'auto' }: Props) {
  const { theme } = useTheme()
  const { lang } = useLanguage()
  const resolved = tone === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : tone
  const src = resolved === 'dark' ? '/brand-logo-dark.png' : '/brand-logo-light.png'

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <img
        src={src}
        alt="TKT"
        className={cn('h-9 w-auto object-contain', imageClassName)}
        draggable={false}
      />
      {showWordmark && (
        <span className={cn('leading-none', lang === 'ar' ? 'font-sans' : 'font-display tracking-[0.08em]')}>
          <span className="block text-[1.1rem] font-bold uppercase text-ink-0">TKT</span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.24em] text-ink-3">
            {lang === 'ar' ? 'فعاليات · تجارب' : 'Events · Experiences'}
          </span>
        </span>
      )}
    </span>
  )
}
