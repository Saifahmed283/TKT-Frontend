import { Ticket } from 'lucide-react'
import type { ReservationWizard } from './useReservationWizard'

export function ReviewStep({ w }: { w: ReservationWizard }) {
  const {
    t, name, email, phone, notes, selected, selectedBus, selectedProvider,
    paymentReference, isPaid, totalPrice, selectedSeatIds,
  } = w
  return (
    <div data-testid="wizard-review" className="space-y-3 border border-line-soft bg-elevated/20 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('fullName')}</span><span className="text-ink-0">{name.trim()}</span></div>
      <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('email')}</span><span className="text-ink-0" dir="ltr">{email.trim()}</span></div>
      <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('phone')}</span><span className="text-ink-0" dir="ltr">{phone.trim()}</span></div>
      {notes.trim() && <div className="flex items-start justify-between gap-3"><span className="shrink-0 text-ink-3">{t('customization')}</span><span className="text-end text-ink-0">{notes.trim()}</span></div>}
      <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3"><span className="flex items-center gap-2 text-ink-3"><Ticket size={14} className="text-signal" /> {t('ticketType')}</span><span className="text-ink-0">{selected?.name ?? '—'}</span></div>
      {selected?.transportIncluded && <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('seats')}</span><span className="text-ink-0">{selectedBus?.seats.find(s => selectedSeatIds.includes(s.id))?.label ?? '—'}</span></div>}
      {isPaid && <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('paymentDetails')}</span><span className="text-ink-0">{selectedProvider?.name || paymentReference.trim() || t('paymentProof')}</span></div>}
      <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3 font-medium text-ink-0"><span>{t('total')}</span><span className="font-mono text-signal">{selectedBus?.currency ?? selected?.currency ?? 'EGP'} {totalPrice.toLocaleString()}</span></div>
      <p className="text-[11px] text-ink-3">{t('reviewBody')}</p>
    </div>
  )
}
