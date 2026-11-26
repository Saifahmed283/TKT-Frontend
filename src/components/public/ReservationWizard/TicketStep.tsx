import { useState } from 'react'
import type { ReservationWizard } from './useReservationWizard'
import { money } from './shared'
import { SeatsStep } from './SeatsStep'

type TicketFilter = 'all' | 'program' | 'bus'

export function TicketStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, availableTypes, ticketTypeId, setTicketTypeId,
    setSelectedSeatIds, setHoldExpiresAt, selected,
  } = w
  const [filter, setFilter] = useState<TicketFilter>('all')
  const hasProgramOnly = availableTypes.some((ticket) => !ticket.transportIncluded)
  const hasBusIncluded = availableTypes.some((ticket) => ticket.transportIncluded)
  const visibleTypes = availableTypes.filter((ticket) => {
    if (filter === 'program') return !ticket.transportIncluded
    if (filter === 'bus') return Boolean(ticket.transportIncluded)
    return true
  })


  const changeFilter = (next: TicketFilter) => {
    setFilter(next)
    const nextTypes = availableTypes.filter((ticket) =>
      next === 'all' || (next === 'bus' ? Boolean(ticket.transportIncluded) : !ticket.transportIncluded),
    )
    const stillVisible = nextTypes.some((ticket) => ticket.id === ticketTypeId && !ticket.soldOut)
    if (!stillVisible) {
      const firstAvailable = nextTypes.find((ticket) => !ticket.soldOut)
      if (firstAvailable) setTicketTypeId(firstAvailable.id)
      setSelectedSeatIds([])
      setHoldExpiresAt(null)
    }
  }

  return (
    <div data-testid="wizard-step-ticket" className="space-y-4">
      <div className="space-y-1">
        <p className="label">{t('ticketType')}</p>
        <p className="text-[11px] text-ink-3">
          {lang === 'ar' ? 'ابدأ باختيار الباقة المناسبة لتجربتك.' : 'Choose the experience package that fits your visit.'}
        </p>
      </div>

      {(hasProgramOnly && hasBusIncluded) && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line-soft bg-elevated/30 p-1" role="group" aria-label="Ticket package filter">
          {([
            ['program', lang === 'ar' ? 'البرنامج فقط' : 'Program only'],
            ['bus', lang === 'ar' ? 'البرنامج + الحافلة' : 'Program + Bus included'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-testid={`ticket-filter-${id}`}
              aria-pressed={filter === id}
              onClick={() => changeFilter(id)}
              className={`min-h-10 px-2 py-2 text-[10px] font-semibold transition-colors sm:text-[11px] ${filter === id ? 'bg-signal text-[#0b0b0c] shadow-sm' : 'text-ink-2 hover:bg-paper'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {filter !== 'all' && (
        <button type="button" onClick={() => changeFilter('all')} className="text-[10px] font-medium text-signal underline underline-offset-4">
          {lang === 'ar' ? 'عرض كل الباقات' : 'View all ticket packages'}
        </button>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {visibleTypes.map((tt) => {
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
              className={`relative overflow-hidden border p-3 text-start transition-all ${active ? 'border-signal/60 bg-signal/10 shadow-[inset_3px_0_0_var(--color-signal)]' : 'border-line-soft bg-elevated/20 hover:border-signal/30'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
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
