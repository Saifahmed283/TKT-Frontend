import { Link } from 'react-router-dom'
import { useLanguage } from '../../lib/i18n'
import BrandLogo from './BrandLogo'

export default function PublicFooter() {
  const { t, lang } = useLanguage()
  return (
    <footer className="border-t border-line-soft bg-ink-900/40 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl py-12 sm:py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_.8fr_.8fr]">
          <div>
            <BrandLogo imageClassName="h-11" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-3">
              {lang === 'ar'
                ? 'منصة بسيطة وآمنة لحجز تذاكر الفعاليات والدخول السريع.'
                : 'Simple, secure event booking with fast, trusted entry.'}
            </p>
          </div>
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-3">{t('events')}</p>
            <ul className="space-y-3 text-sm text-ink-2">
              <li><Link to="/upcoming" className="transition-colors hover:text-signal">{t('upcomingEvents')}</Link></li>
              <li><Link to="/past" className="transition-colors hover:text-signal">{t('pastWorks')}</Link></li>
              <li><Link to="/about" className="transition-colors hover:text-signal">{t('aboutUs')}</Link></li>
              <li><Link to="/contact" className="transition-colors hover:text-signal">{t('contactUs')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-3">{t('dashboard')}</p>
            <ul className="space-y-3 text-sm text-ink-2">
              <li><Link to="/login" className="transition-colors hover:text-signal">{t('signIn')}</Link></li>
              <li><Link to="/app" className="transition-colors hover:text-signal">{t('dashboard')}</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 TKT</span>
          <span>{lang === 'ar' ? 'تذاكر آمنة · دخول سلس' : 'Secure tickets · Smooth entry'}</span>
        </div>
      </div>
    </footer>
  )
}