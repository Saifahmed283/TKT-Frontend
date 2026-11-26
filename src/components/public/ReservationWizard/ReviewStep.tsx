import { Ticket } from 'lucide-react'
import { resolveUploadPreviewUrl } from '../../ui/file-upload'
import type { ReservationWizard } from './useReservationWizard'

export function ReviewStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, name, email, phone, notes, gender, nationality, identityNumber,
    selected, selectedBus, selectedProvider, paymentReference, paymentProofUrl,
    isPaid, totalPrice, selectedSeatIds, ticketDesign,
  } = w
  const proofPreviewUrl = paymentProofUrl ? resolveUploadPreviewUrl(paymentProofUrl) : ''
  const proofPath = (paymentProofUrl ?? '').split(/[?#]/, 1)[0].toLowerCase()
  const proofIsImage = ['.jpg', '.jpeg', '.png', '.webp'].some((extension) => proofPath.endsWith(extension))
  const isAr = lang === 'ar'
  const identityLabel = nationality === 'EG' ? (isAr ? 'الرقم القومي' : 'National ID') : (isAr ? 'جواز السفر' : 'Passport number')
  const identityValue = identityNumber.trim()
  return (
    <div data-testid="wizard-review" className="space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-line-soft pb-3">
        <div><h3 className="font-semibold text-ink-0">{isAr ? 'راجع بياناتك قبل الإرسال' : 'Review every detail before submitting'}</h3><p className="mt-1 text-[11px] text-ink-3">{isAr ? 'استخدم زر الرجوع لتصحيح أي معلومة.' : 'Use Back to correct anything that is not exact.'}</p></div>
        <span className="shrink-0 rounded-full border border-ok/30 bg-ok/5 px-2.5 py-1 text-[10px] font-semibold text-ok">{isAr ? 'مكتمل' : 'READY'}</span>
      </div>
      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'البيانات الشخصية' : 'Personal information'}</p>
        {[
          [t('fullName'), name.trim()],
          [t('email'), email.trim()],
          [t('phone'), phone.trim()],
          [isAr ? 'النوع' : 'Gender', ({male:isAr?'ذكر':'Male',female:isAr?'أنثى':'Female',other:isAr?'آخر':'Other',prefer_not_to_say:isAr?'أفضل عدم الإفصاح':'Prefer not to say'} as Record<string,string>)[gender]],
          [isAr ? 'الجنسية' : 'Nationality', nationality === 'EG' ? (isAr ? 'مصري' : 'Egyptian') : (isAr ? 'غير مصري' : 'Non-Egyptian')],
          [identityLabel, identityValue],
        ].map(([label,value]) => <div key={label} className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-3 text-[12px]"><span className="text-ink-3">{label}</span><bdi className="break-all text-end font-medium text-ink-0">{value}</bdi></div>)}
        {notes.trim() && <div className="border-t border-line-soft pt-2 text-[12px]"><span className="text-ink-3">{t('customization')}: </span><span className="text-ink-0">{notes.trim()}</span></div>}
      </section>
      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'التذكرة والنقل' : 'Ticket and transport'}</p>
        <div className="flex items-center justify-between gap-3 text-[12px]"><span className="flex items-center gap-2 text-ink-3"><Ticket size={14} className="text-signal" /> {t('ticketType')}</span><b className="text-end text-ink-0">{selected?.name ?? '—'}</b></div>
        {selected?.transportIncluded && <div className="flex items-center justify-between gap-3 text-[12px]"><span className="text-ink-3">{t('seats')}</span><b className="text-ink-0">{selectedBus?.seats.find(s => selectedSeatIds.includes(s.id))?.label ?? '—'}</b></div>}
      </section>
      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'الدفع' : 'Payment'}</p>
        {isPaid ? <>
          <div className="flex items-center justify-between gap-3 text-[12px]"><span className="text-ink-3">{isAr ? 'مزود الدفع' : 'Provider'}</span><b className="text-ink-0">{selectedProvider?.name ?? '—'}</b></div>
          <div className="flex items-center justify-between gap-3 text-[12px]"><span className="text-ink-3">{isAr ? 'رقم العملية' : 'Reference ID'}</span><bdi className="font-mono text-ink-0">{paymentReference.trim()}</bdi></div>
          {paymentProofUrl && <div className="space-y-2 border-t border-line-soft pt-2" data-testid="review-payment-proof"><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-ink-2">{isAr ? 'إثبات الدفع' : 'Payment proof'}</span><a href={proofPreviewUrl} target="_blank" rel="noreferrer" className="text-[11px] text-signal hover:underline">{isAr ? 'فتح الملف' : 'Open proof'}</a></div>{proofIsImage ? <img src={proofPreviewUrl} alt={isAr ? 'إثبات الدفع' : 'Payment proof'} className="max-h-64 w-full rounded border border-line-soft bg-canvas object-contain" /> : <p className="text-[11px] text-ink-3">{isAr ? 'ملف الإيصال مرفق.' : 'Receipt file attached.'}</p>}</div>}
        </> : <p className="text-[12px] text-ok">{isAr ? 'لا يلزم دفع لهذه التذكرة.' : 'No payment is required for this ticket.'}</p>}
        <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-sm font-semibold"><span>{t('total')}</span><span className="font-mono text-signal">{selected?.currency ?? selectedBus?.currency ?? 'EGP'} {totalPrice.toLocaleString()}</span></div>
      </section>
      <section className="space-y-2 border border-line-soft bg-elevated/20 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-signal">{isAr ? 'تصميم التذكرة' : 'Ticket design'}</p>
        <p className="text-[12px] text-ink-2">{ticketDesign.templateId === 'signature-split' ? 'Signature Split' : 'Editorial Wide'} · {ticketDesign.paletteId}</p>
        <div className="flex flex-wrap gap-2">{[ticketDesign.panelColor,ticketDesign.accentColor,ticketDesign.backgroundColor,ticketDesign.textColor].map((color) => <span key={color} className="size-5 rounded-full border border-black/10" style={{backgroundColor:color}} title={color} />)}</div>
      </section>
      <p className="text-[11px] leading-relaxed text-ink-3">{isAr ? 'بالضغط على تأكيد الحجز، ترسل البيانات للمراجعة. لن يصدر QR للتذاكر المدفوعة حتى يؤكد فريق الحدث الدفع.' : 'When you confirm, the details are submitted for review. Paid tickets receive a signed QR only after the event team verifies the payment.'}</p>
    </div>
  )
}
