import type { ReservationWizard } from './useReservationWizard'
import { TicketDesigner } from './TicketDesigner'

export function DesignStep({ w }: { w: ReservationWizard }) {
  const { selected, event, name, ticketDesign, setTicketDesign, lang, selectedBus, selectedSeatIds } = w
  if (!selected) return null
  const seatLabel = selectedSeatIds
    .map((id) => selectedBus?.seats.find((seat) => seat.id === id)?.label)
    .filter(Boolean)
    .join(', ')
  return (
    <div data-testid="wizard-step-design" className="space-y-4">
      <div className="rounded-lg border border-line-soft bg-elevated/20 p-3">
        <p className="text-sm font-semibold text-ink-0">{lang === 'ar' ? 'الآن اختر شكل تذكرتك' : 'Now make your ticket yours'}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-3">{lang === 'ar' ? 'هذه الخطوة اختيارية من ناحية الشكل فقط؛ بيانات الدخول الأساسية لا يمكن حذفها أو تغييرها من التصميم.' : 'Only the visual style is customizable. Required admission details remain fixed and cannot be removed by the design.'}</p>
      </div>
      <TicketDesigner
        event={event}
        ticketType={selected}
        attendeeName={name}
        seatLabel={seatLabel || null}
        design={ticketDesign}
        onChange={setTicketDesign}
        lang={lang}
      />
    </div>
  )
}
