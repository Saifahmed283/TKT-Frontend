import { Check } from 'lucide-react'
import type { ReservationWizard } from './useReservationWizard'
import { TicketDesigner } from './TicketDesigner'

export function DesignStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, selected, event, name, ticketDesign, updateTicketDesign,
    designConfirmed, confirmDesign, selectedBus, selectedSeatIds, gender,
  } = w
  if (!selected) return null

  const recommendedPaletteId = gender === 'female' ? 'rose-noir' : gender === 'male' ? 'obsidian-gold' : 'champagne'
  const seatLabel = selectedSeatIds
    .map((id) => selectedBus?.seats.find((seat) => seat.id === id)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div data-testid="wizard-step-design" className="space-y-4">
      <TicketDesigner
        event={event}
        ticketType={selected}
        attendeeName={name}
        seatLabel={seatLabel || null}
        design={ticketDesign}
        onChange={updateTicketDesign}
        lang={lang}
        recommendedPaletteId={recommendedPaletteId}
      />

      <div className={`flex flex-wrap items-center justify-between gap-3 border p-4 ${designConfirmed ? 'border-ok/30 bg-ok/5' : 'border-signal/25 bg-signal/5'}`}>
        <div className="min-w-0">
          <p className={`text-[13px] font-semibold ${designConfirmed ? 'text-ok' : 'text-ink-0'}`}>
            {designConfirmed ? t('designChosen') : (lang === 'ar' ? 'اعتمد شكل تذكرتك للمتابعة' : 'Confirm your ticket look to continue')}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
            {designConfirmed
              ? (lang === 'ar' ? 'سيظهر هذا التصميم في تذكرتك بعد الاعتماد.' : 'This design will be used on your ticket after approval.')
              : t('designRequired')}
          </p>
        </div>
        <button type="button" onClick={confirmDesign} className={designConfirmed ? 'btn-ghost' : 'btn-primary'}>
          {designConfirmed && <Check size={14} />}
          {designConfirmed ? t('designChosen') : t('useThisDesign')}
        </button>
      </div>
    </div>
  )
}
