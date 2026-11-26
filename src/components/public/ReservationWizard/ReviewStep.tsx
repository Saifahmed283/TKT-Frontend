import { Ticket } from 'lucide-react'
import { resolveUploadPreviewUrl } from '../../ui/file-upload'
import type { ReservationWizard, WizardStepId } from './useReservationWizard'
import { TicketCardPreview } from './TicketDesigner'
import { money } from './shared'

function EditLink({ step, label, onClick }: { step: WizardStepId; label: string; onClick: (id: WizardStepId) => void }) {
  return (
    <button type="button" onClick={() => onClick(step)} className="text-[11px] font-semibold text-signal hover:underline">
      {label}
    </button>
  )
}

export function ReviewStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, event, name, email, phone, notes, gender, nationality, identityNumber,
    selected, selectedBus, selectedProvider, paymentReference, paymentProofUrl,
    isPaid, totalPrice, selectedSeatIds, ticketDesign, goToStep,
  } = w
  const proofPreviewUrl = paymentProofUrl ? resolveUploadPreviewUrl(paymentProofUrl) : ''
  const proofPath = (paymentProofUrl ?? '').split(/[?#]/, 1)[0].toLowerCase()
  const proofIsImage = ['.jpg', '.jpeg', '.png', '.webp'].some((extension) => proofPath.endsWith(extension))
  const isAr = lang === 'ar'
  const identityLabel = nationality === 'EG' ? (isAr ? 'الرقم القومي' : 'National ID') : (isAr ? 'جواز السفر' : 'Passport number')
  const identityValue = identityNumber.trim()
  const maskedIdentityValue = identityValue
    ? '•'.repeat(Math.max(0, identityValue.length - 4)) + identityValue.slice(-4)
    : ''
  const seatLabel = selectedSeatIds
    .map((id) => selectedBus?.seats.find((seat) => seat.id === id)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div data-testid="wizard-review" className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-3">
        <div>
          <h3 className="font-semibold text-ink-0">{isAr ? 'راجع بياناتك قبل الإرسال' : 'Review every detail before submitting'}</h3>
          <p className="mt-1 text-[12px] text-ink-3">{isAr ? 'استخدم روابط التعديل للعودة إلى أي خطوة.' : 'Use the edit links to jump back to any step.'}</p>
        </div>
        <span className="shrink-0 border border-ok/30 bg-ok/5 px-2.5 py-1 text-[10px] font-semibold text-ok">{isAr ? 'مكتمل' : 'READY'}</span>
      </div>

      {selected && (
        <section className="space-y-3 border border-line-soft bg-elevated/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'تصميم تذكرتك' : 'Your ticket design'}</p>
            <EditLink step="design" label={t('editDesign')} onClick={goToStep} />
          </div>
          <div className="max-w-md border border-line-soft bg-paper/60 p-2">
            <TicketCardPreview
              event={event}
              ticketType={selected}
              attendeeName={name}
              seatLabel={seatLabel || null}
              design={ticketDesign}
              lang={lang}
              compact
            />
          </div>
        </section>
      )}

      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'البيانات الشخصية' : 'Personal information'}</p>
          <EditLink step="details" label={t('editDetails')} onClick={goToStep} />
        </div>
        {[
          [t('fullName'), name.trim()],
          [t('email'), email.trim()],
          [t('phone'), phone.trim()],
          [isAr ? 'النوع' : 'Gender', ({ male: isAr ? 'ذكر' : 'Male', female: isAr ? 'أنثى' : 'Female', other: isAr ? 'آخر' : 'Other', prefer_not_to_say: isAr ? 'أفضل عدم الإفصاح' : 'Prefer not to say' } as Record<string, string>)[gender]],
          [isAr ? 'الجنسية' : 'Nationality', nationality === 'EG' ? (isAr ? 'مصري' : 'Egyptian') : (isAr ? 'غير مصري' : 'Non-Egyptian')],
          [identityLabel, maskedIdentityValue],
        ].map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-3 text-[12px]">
            <span className="text-ink-3">{label}</span>
            <bdi className="break-all text-end font-medium text-ink-0">{value}</bdi>
          </div>
        ))}
        {notes.trim() && <div className="border-t border-line-soft pt-2 text-[12px]"><span className="text-ink-3">{t('customization')}: </span><span className="text-ink-0">{notes.trim()}</span></div>}
      </section>

      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'التذكرة والنقل' : 'Ticket and transport'}</p>
          <EditLink step="ticket" label={t('editTicket')} onClick={goToStep} />
        </div>
        <div className="flex items-center justify-between gap-3 text-[12px]">
          <span className="flex items-center gap-2 text-ink-3"><Ticket size={14} className="text-signal" /> {t('ticketType')}</span>
          <b className="text-end text-ink-0">{selected?.name ?? '—'}</b>
        </div>
        {selected?.transportIncluded && (
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="text-ink-3">{t('seats')}</span>
            <span className="flex items-center gap-2">
              <b className="text-ink-0">{seatLabel || '—'}</b>
              <EditLink step="seats" label={t('editSeat')} onClick={goToStep} />
            </span>
          </div>
        )}
      </section>

      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'الدفع' : 'Payment'}</p>
          {isPaid && <EditLink step="payment" label={t('editPayment')} onClick={goToStep} />}
        </div>
        {isPaid ? (
          <>
            <div className="flex items-center justify-between gap-3 text-[12px]"><span className="text-ink-3">{isAr ? 'مزود الدفع' : 'Provider'}</span><b className="text-ink-0">{selectedProvider?.name ?? '—'}</b></div>
            <div className="flex items-center justify-between gap-3 text-[12px]"><span className="text-ink-3">{isAr ? 'رقم العملية' : 'Reference ID'}</span><bdi className="font-mono text-ink-0">{paymentReference.trim()}</bdi></div>
            {paymentProofUrl && (
              <div className="space-y-2 border-t border-line-soft pt-2" data-testid="review-payment-proof">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-ink-2">{isAr ? 'إثبات الدفع' : 'Payment proof'}</span>
                  <a href={proofPreviewUrl} target="_blank" rel="noreferrer" className="text-[11px] text-signal hover:underline">{isAr ? 'فتح الملف' : 'Open proof'}</a>
                </div>
                {proofIsImage
                  ? <img src={proofPreviewUrl} alt={isAr ? 'إثبات الدفع' : 'Payment proof'} className="max-h-64 w-full border border-line-soft bg-canvas object-contain" />
                  : <p className="text-[11px] text-ink-3">{isAr ? 'ملف الإيصال مرفق.' : 'Receipt file attached.'}</p>}
              </div>
            )}
          </>
        ) : (
          <p className="text-[12px] text-ok">{isAr ? 'لا يلزم دفع لهذه التذكرة.' : 'No payment is required for this ticket.'}</p>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-sm font-semibold">
          <span>{t('total')}</span>
          <span className="font-mono text-signal">{money(String(totalPrice), lang, selected?.currency ?? selectedBus?.currency ?? 'EGP')}</span>
        </div>
      </section>

      <p className="text-[12px] leading-relaxed text-ink-3">
        {isAr
          ? 'بالضغط على تأكيد الحجز، ترسل البيانات للمراجعة. لن يصدر QR للتذاكر المدفوعة حتى يؤكد فريق الحدث الدفع.'
          : 'When you confirm, the details are submitted for review. Paid tickets receive a signed QR only after the event team verifies the payment.'}
      </p>
    </div>
  )
}
