import type { ReservationWizard } from './useReservationWizard'
import { money } from './shared'

export function TicketStep({ w }: { w: ReservationWizard }) {
  const { t, lang, availableTypes, ticketTypeId, setTicketTypeId, setSelectedSeatIds, setHoldExpiresAt, selected } = w
  return (
    <div data-testid="wizard-step-ticket" className="space-y-3">
      <p className="label">{t('ticketType')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {availableTypes.map((tt) => {
          const now = Date.now()
          const notStarted = tt.salesStartAt ? now < new Date(tt.salesStartAt).getTime() : false
          const ended = tt.salesEndAt ? now > new Date(tt.salesEndAt).getTime() : false
          const disabled = tt.soldOut || notStarted || ended
          const active = tt.id === ticketTypeId
          const suffix = tt.soldOut ? ` (${t('soldOut')})` : notStarted ? ` (${t('openingSoon')})` : ended ? ` (${t('reservationsClosed')})` : tt.remaining != null ? ` (${tt.remaining} ${t('left')})` : ''
          return (
            <button
              key={tt.id}
              type="button"
              data-testid="ticket-option"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => { setTicketTypeId(tt.id); setSelectedSeatIds([]); setHoldExpiresAt(null) }}
              className={`border p-3 text-start transition-colors ${active ? 'border-signal/50 bg-signal/10' : 'border-line-soft bg-elevated/20 hover:border-signal/30'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-0">
                <span className="truncate">{tt.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-signal">{money(tt.price, lang, tt.currency ?? 'EGP')}</span>
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-ink-3">
                {tt.category ? <span>{tt.category}</span> : null}
                {tt.transportIncluded ? <span className="text-signal">{t('transportIncluded')}</span> : null}
                {suffix ? <span>{suffix}</span> : null}
              </span>
            </button>
          )
        })}
      </div>
      {selected?.transportIncluded && <p className="border border-signal/20 bg-signal/5 px-3 py-2 text-[12px] text-signal">{t('transportTicketHint')}</p>}
    </div>
  )
}
