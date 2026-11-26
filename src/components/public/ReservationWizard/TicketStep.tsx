import type { ReservationWizard } from './useReservationWizard'
import { money } from './shared'
import { SeatsStep } from './SeatsStep'

export function TicketStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, availableTypes, ticketTypeId, setTicketTypeId,
    setSelectedSeatIds, setHoldExpiresAt, selected, hasPaymentProvider,
  } = w
  const visibleTypes = availableTypes
  const paymentSetupMissing = availableTypes.some((ticket) => Number(ticket.price) > 0) && !hasPaymentProvider

  return (
    <div data-testid="wizard-step-ticket" className="space-y-4">
      <div className="space-y-1">
        <p className="label">{t('ticketType')}</p>
        <p className="text-[11px] text-ink-3">
          {lang === 'ar' ? 'ابدأ باختيار الباقة المناسبة لتجربتك.' : 'Choose the experience package that fits your visit.'}
        </p>
      </div>

      {paymentSetupMissing && (
        <div data-testid="payment-provider-missing" role="status" className="border border-signal/30 bg-signal/5 px-3 py-3 text-[11px] leading-relaxed text-ink-1">
          <p className="font-semibold text-ink-0">
            {lang === 'ar' ? 'الحجز المدفوع غير متاح حاليًا' : 'Paid booking is not available yet'}
          </p>
          <p className="mt-1 text-ink-2">
            {lang === 'ar'
              ? 'منظّم الفعالية لم يفعّل وسيلة دفع لهذا الحدث بعد. الباقات المدفوعة متوقفة مؤقتًا، والباقات المجانية متاحة للحجز.'
              : 'The event organizer has not enabled a payment method for this event. Paid ticket options are paused until payment is configured; free tickets can still be booked.'}
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {visibleTypes.map((tt) => {
          const now = Date.now()
          const notStarted = tt.salesStartAt ? now < new Date(tt.salesStartAt).getTime() : false
          const ended = tt.salesEndAt ? now > new Date(tt.salesEndAt).getTime() : false
          const paymentUnavailable = Number(tt.price) > 0 && !hasPaymentProvider
          const disabled = tt.soldOut || notStarted || ended || paymentUnavailable
          const active = tt.id === ticketTypeId
          const suffix = paymentUnavailable
            ? (lang === 'ar' ? ' (الدفع غير مُعد)' : ' (payment not set up)')
            : tt.soldOut ? ' (' + t('soldOut') + ')' : notStarted ? ' (' + t('openingSoon') + ')' : ended ? ' (' + t('reservationsClosed') + ')' : tt.remaining != null ? ' (' + tt.remaining + ' ' + t('left') + ')' : ''
          return (
            <button
              key={tt.id}
              type="button"
              data-testid="ticket-option"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => { setTicketTypeId(tt.id); setSelectedSeatIds([]); setHoldExpiresAt(null) }}
              className={`relative overflow-hidden border p-3 text-start transition-all ${active ? 'border-signal/60 bg-signal/10 shadow-[inset_3px_0_0_var(--color-signal)]' : 'border-line-soft bg-elevated/20 hover:border-signal/30'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-0">
                <span className="truncate">{tt.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-signal">{money(tt.price, lang, tt.currency ?? 'EGP')}</span>
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-ink-3">
                {tt.category ? <span>{tt.category}</span> : null}
                {tt.transportIncluded ? <span className="border border-signal/25 bg-signal/5 px-2 py-1 text-signal">{lang === 'ar' ? 'الحافلة مشمولة' : 'Bus included'}</span> : <span className="border border-line-soft px-2 py-1">{lang === 'ar' ? 'دخول البرنامج' : 'Program access'}</span>}
                {suffix ? <span>{suffix}</span> : null}
              </span>
            </button>
          )
        })}
      </div>

      {visibleTypes.length === 0 && (
        <div className="border border-line-soft bg-elevated/20 px-4 py-6 text-center text-sm text-ink-3">
          {lang === 'ar' ? 'لا توجد باقات متاحة ضمن هذا التصنيف.' : 'There are no available packages in this category.'}
        </div>
      )}

      {selected?.transportIncluded && (
        <p className="border border-signal/20 bg-signal/5 px-3 py-2 text-[12px] leading-relaxed text-signal">
          {t('transportTicketHint')}
        </p>
      )}

      {selected?.transportIncluded && <SeatsStep w={w} />}
    </div>
  )
}
