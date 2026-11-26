import type { ReservationWizard } from './useReservationWizard'
import { money } from './shared'

export function TicketStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, availableTypes, ticketTypeId, setTicketTypeId,
    setSelectedSeatIds, setHoldExpiresAt, hasPaymentProvider,
  } = w
  const paymentSetupMissing = availableTypes.some((ticket) => Number(ticket.price) > 0) && !hasPaymentProvider

  return (
    <div data-testid="wizard-step-ticket" className="space-y-4">
      {paymentSetupMissing && (
        <div data-testid="payment-provider-missing" role="status" className="border border-signal/30 bg-signal/5 px-4 py-3 text-[12px] leading-relaxed text-ink-1">
          <p className="font-semibold text-ink-0">
            {lang === 'ar' ? 'الحجز المدفوع غير متاح حاليًا' : 'Paid booking is not available yet'}
          </p>
          <p className="mt-1 text-ink-2">
            {lang === 'ar'
              ? 'منظّم الفعالية لم يفعّل وسيلة دفع لهذا الحدث بعد. الباقات المدفوعة متوقفة مؤقتًا، والباقات المجانية متاحة للحجز.'
              : 'The event organizer has not enabled a payment method for this event. Paid options are paused until payment is configured; free tickets can still be booked.'}
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {availableTypes.map((ticketType) => {
          const now = Date.now()
          const notStarted = ticketType.salesStartAt ? now < new Date(ticketType.salesStartAt).getTime() : false
          const ended = ticketType.salesEndAt ? now > new Date(ticketType.salesEndAt).getTime() : false
          const paymentUnavailable = Number(ticketType.price) > 0 && !hasPaymentProvider
          const disabled = ticketType.soldOut || notStarted || ended || paymentUnavailable
          const active = ticketType.id === ticketTypeId
          const suffix = paymentUnavailable
            ? (lang === 'ar' ? 'الدفع غير مُعد' : 'payment not set up')
            : ticketType.soldOut
              ? t('soldOut')
              : notStarted
                ? t('openingSoon')
                : ended
                  ? t('reservationsClosed')
                  : ticketType.remaining != null
                    ? `${ticketType.remaining} ${t('left')}`
                    : ''
          return (
            <button
              key={ticketType.id}
              type="button"
              data-testid="ticket-option"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                setTicketTypeId(ticketType.id)
                setSelectedSeatIds([])
                setHoldExpiresAt(null)
              }}
              className={`border p-4 text-start transition-colors ${active ? 'border-signal/60 bg-signal/10 shadow-[inset_3px_0_0_var(--color-signal)]' : 'border-line-soft bg-elevated/20 hover:border-signal/30'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[14px] font-semibold text-ink-0">{ticketType.name}</span>
                <span className="shrink-0 font-mono text-[12px] text-signal">{money(ticketType.price, lang, ticketType.currency ?? 'EGP')}</span>
              </span>
              <span className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                {ticketType.category && <span>{ticketType.category}</span>}
                <span className={ticketType.transportIncluded ? 'border border-signal/25 bg-signal/5 px-2 py-1 text-signal' : 'border border-line-soft px-2 py-1'}>
                  {ticketType.transportIncluded
                    ? (lang === 'ar' ? 'الحافلة مشمولة' : 'Bus included')
                    : (lang === 'ar' ? 'دخول البرنامج' : 'Program access')}
                </span>
                {suffix && <span>{suffix}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {availableTypes.length === 0 && (
        <div className="border border-line-soft bg-elevated/20 px-4 py-8 text-center text-[13px] text-ink-3">
          {lang === 'ar' ? 'لا توجد باقات متاحة ضمن هذا التصنيف.' : 'There are no available packages in this category.'}
        </div>
      )}

      {w.selected?.transportIncluded && (
        <p className="border border-signal/20 bg-signal/5 px-4 py-3 text-[12px] leading-relaxed text-signal">
          {t('transportTicketHint')}
        </p>
      )}
    </div>
  )
}
