import { CreditCard, ExternalLink } from 'lucide-react'
import { FileUploadField } from '../../ui/file-upload'
import type { ReservationWizard } from './useReservationWizard'
import { money } from './shared'

export function PaymentStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, event, paymentProviderId, setPaymentProviderId, paymentReference,
    setPaymentReference, paymentProofUrl, setPaymentProofUrl, selected,
    selectedProvider, totalPrice, isPaid, canContinue,
  } = w
  const isAr = lang === 'ar'
  if (!isPaid) return null

  const providers = event.paymentProviders ?? []

  return (
    <div data-testid="wizard-step-payment" className="space-y-4">
      <div className="border border-signal/20 bg-signal/5 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <CreditCard className="size-6 shrink-0 text-signal" />
          <div>
            <p className="text-[12px] font-semibold text-ink-0">{isAr ? 'المبلغ المطلوب' : 'Amount to send'}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">{isAr ? 'حوّل المبلغ ثم أرسل بيانات العملية وإيصال الدفع.' : 'Transfer the amount, then submit the transaction details and receipt.'}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-[13px]">
          <span className="text-ink-2">{selected?.name}</span>
          <span className="font-mono font-semibold text-ink-0">{money(String(totalPrice), lang, selected?.currency ?? 'EGP')}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="label block" htmlFor="payment-provider">{isAr ? '1. اختر وسيلة الدفع' : '1. Choose a payment provider'}</label>
        {providers.length > 0 ? (
          <select id="payment-provider" data-testid="payment-provider" className="input" value={paymentProviderId} onChange={(e) => setPaymentProviderId(e.target.value)} required>
            <option value="">{isAr ? 'اختر مزود الدفع' : 'Select a payment provider'}</option>
            {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
          </select>
        ) : (
          <p className="border border-danger/30 bg-danger/5 p-3 text-[13px] text-danger">{isAr ? 'لا توجد وسيلة دفع مفعلة لهذا الحدث. لا يمكن إرسال حجز مدفوع الآن.' : 'No payment provider is enabled for this event. A paid reservation cannot be submitted yet.'}</p>
        )}
      </div>

      {selectedProvider && (
        <div data-testid="payment-instructions" className="space-y-2 border border-signal/25 bg-signal/5 p-4 text-[12px] leading-relaxed text-ink-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">{isAr ? '2. تعليمات الدفع' : '2. Payment instructions'}</p>
          <p className="font-semibold text-ink-0">{selectedProvider.name}</p>
          {selectedProvider.accountName && <div><span className="text-ink-3">{t('account')}:</span> {selectedProvider.accountName}</div>}
          {selectedProvider.accountNumber && <div><span className="text-ink-3">{t('number')}:</span> <bdi dir="ltr">{selectedProvider.accountNumber}</bdi></div>}
          {selectedProvider.paymentPhone && <div><span className="text-ink-3">{t('phone')}:</span> <bdi dir="ltr">{selectedProvider.paymentPhone}</bdi></div>}
          {selectedProvider.instructions && <p className="whitespace-pre-line">{selectedProvider.instructions}</p>}
          {selectedProvider.paymentLink && (
            <a href={selectedProvider.paymentLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 border border-signal/30 bg-paper px-3 py-2 font-semibold text-signal hover:bg-signal/5">
              <ExternalLink size={14} /> {isAr ? 'فتح رابط الدفع الآمن' : 'Open secure payment link'}
            </a>
          )}
          {selectedProvider.imageUrl && <img src={selectedProvider.imageUrl} alt={selectedProvider.name} className="mt-2 max-h-36 max-w-full border border-line-soft object-contain" />}
        </div>
      )}

      <div className="space-y-3 border border-line-soft bg-elevated/20 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">{isAr ? '3. أرسل إثبات العملية' : '3. Submit payment evidence'}</p>
        <div>
          <label className="label mb-1.5 block" htmlFor="payment-reference">{isAr ? 'رقم العملية / Reference ID' : 'Transaction reference ID'}</label>
          <input id="payment-reference" data-testid="payment-reference" className="input font-mono" autoComplete="off" dir="ltr" maxLength={200} required value={paymentReference} onChange={(e) => setPaymentReference(e.target.value.replace(/[\u0000-\u001f]/g, '').slice(0, 200))} placeholder={isAr ? 'أدخل رقم العملية كما يظهر في تطبيق الدفع' : 'Enter the transaction ID from your payment app'} />
        </div>
        <FileUploadField
          uploadEndpoint="/uploads/proof"
          label={isAr ? 'صورة إثبات الدفع' : 'Payment proof image'}
          value={paymentProofUrl ?? ''}
          onChange={(value) => setPaymentProofUrl(value || null)}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          hint={isAr ? 'مطلوب' : 'Required'}
        />
        <p className="text-[11px] leading-relaxed text-ink-3">{isAr ? 'لا ترسل كلمة مرور أو رمز تحقق OTP أو بيانات البطاقة. نحتاج فقط رقم العملية وإيصال الدفع.' : 'Never submit a password, OTP, or card details. Only the transaction reference and payment receipt are required.'}</p>
      </div>

      {!canContinue && (
        <div className="border border-danger/25 bg-danger/5 p-3 text-[11px] text-danger">
          <p className="font-semibold">{isAr ? 'قبل المتابعة:' : 'Before you continue:'}</p>
          <ul className="mt-1 space-y-0.5">
            {!selectedProvider && <li>• {isAr ? 'اختر وسيلة الدفع.' : 'Select a payment provider.'}</li>}
            {!paymentReference.trim() && <li>• {isAr ? 'أدخل رقم العملية.' : 'Enter the transaction reference.'}</li>}
            {!paymentProofUrl && <li>• {isAr ? 'ارفع إيصال الدفع.' : 'Upload the payment receipt.'}</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
