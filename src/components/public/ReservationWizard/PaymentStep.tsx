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
  const missing = [
    !selectedProvider && (isAr ? 'اختر وسيلة الدفع.' : 'Select a payment provider.'),
    !paymentReference.trim() && (isAr ? 'أدخل رقم العملية.' : 'Enter the transaction reference.'),
    !paymentProofUrl && (isAr ? 'ارفع إيصال الدفع.' : 'Upload the payment receipt.'),
  ].filter((item): item is string => Boolean(item))

  return (
    <div data-testid="wizard-step-payment" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-signal/20 bg-signal/5 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <CreditCard className="size-5 shrink-0 text-signal" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-ink-0">{isAr ? 'المبلغ المطلوب' : 'Amount to send'}</p>
            <p className="truncate text-[11px] text-ink-3">{isAr ? 'حوّل المبلغ ثم أرسل بيانات العملية.' : 'Transfer the amount, then submit the transaction details.'}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-2 sm:justify-end">
          <span className="hidden text-[12px] text-ink-2 sm:inline">{selected?.name}</span>
          <span className="font-mono text-[15px] font-semibold text-signal">{money(String(totalPrice), lang, selected?.currency ?? 'EGP')}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="label shrink-0 sm:w-36" htmlFor="payment-provider">{isAr ? '1. اختر وسيلة الدفع' : '1. Choose a payment provider'}</label>
        <select id="payment-provider" data-testid="payment-provider" className="input min-w-0 flex-1" value={paymentProviderId} onChange={(e) => setPaymentProviderId(e.target.value)} required>
          <option value="">{isAr ? 'اختر مزود الدفع' : 'Select a payment provider'}</option>
          {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
        </select>
      </div>

      {providers.length === 0 && (
        <p className="border border-danger/30 bg-danger/5 p-3 text-[12px] text-danger">{isAr ? 'لا توجد وسيلة دفع مفعلة لهذا الحدث. لا يمكن إرسال حجز مدفوع الآن.' : 'No payment provider is enabled for this event. A paid reservation cannot be submitted yet.'}</p>
      )}

      {selectedProvider && (
        <div data-testid="payment-instructions" className="border border-signal/25 bg-signal/5 px-3 py-3 text-[12px] text-ink-2 sm:px-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">{isAr ? '2. تعليمات الدفع' : '2. Payment instructions'}</p>
            <p className="font-semibold text-ink-0">{selectedProvider.name}</p>
          </div>
          <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {selectedProvider.accountName && (
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.08em] text-ink-3">{t('account')}</dt>
                <dd className="break-words font-medium text-ink-0">{selectedProvider.accountName}</dd>
              </div>
            )}
            {selectedProvider.accountNumber && (
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.08em] text-ink-3">{t('number')}</dt>
                <dd className="break-all font-mono font-medium text-ink-0"><bdi dir="ltr">{selectedProvider.accountNumber}</bdi></dd>
              </div>
            )}
            {selectedProvider.paymentPhone && (
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-[0.08em] text-ink-3">{t('phone')}</dt>
                <dd className="break-all font-mono font-medium text-ink-0"><bdi dir="ltr">{selectedProvider.paymentPhone}</bdi></dd>
              </div>
            )}
          </dl>
          {selectedProvider.instructions && (
            <p className="mt-2 whitespace-pre-line text-[11px] leading-relaxed text-ink-2">{selectedProvider.instructions}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {selectedProvider.paymentLink && (
              <a href={selectedProvider.paymentLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 border border-signal/30 bg-paper px-3 py-1.5 text-[11px] font-semibold text-signal hover:bg-signal/5">
                <ExternalLink size={13} /> {isAr ? 'فتح رابط الدفع الآمن' : 'Open secure payment link'}
              </a>
            )}
            {selectedProvider.imageUrl && <img src={selectedProvider.imageUrl} alt={selectedProvider.name} className="max-h-14 max-w-32 border border-line-soft object-contain" />}
          </div>
        </div>
      )}

      <div className="border border-line-soft bg-elevated/20 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal">{isAr ? '3. أرسل إثبات العملية' : '3. Submit payment evidence'}</p>
          <p className="text-[10px] text-ink-3">{isAr ? 'لا ترسل كلمة مرور أو OTP أو بيانات بطاقة.' : 'Never send a password, OTP, or card details.'}</p>
        </div>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <div className="min-w-0">
            <label className="label mb-1.5 block" htmlFor="payment-reference">{isAr ? 'رقم العملية / Reference ID' : 'Transaction reference ID'}</label>
            <input id="payment-reference" data-testid="payment-reference" className="input font-mono" autoComplete="off" dir="ltr" maxLength={200} required value={paymentReference} onChange={(e) => setPaymentReference(e.target.value.replace(/[\u0000-\u001f]/g, '').slice(0, 200))} placeholder={isAr ? 'رقم العملية من تطبيق الدفع' : 'Transaction ID from your payment app'} />
          </div>
          <FileUploadField
            uploadEndpoint="/uploads/proof"
            label={isAr ? 'صورة إثبات الدفع' : 'Payment proof image'}
            value={paymentProofUrl ?? ''}
            onChange={(value) => setPaymentProofUrl(value || null)}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            hint={isAr ? 'مطلوب' : 'Required'}
            preview={false}
          />
        </div>
      </div>

      {!canContinue && missing.length > 0 && (
        <p className="text-end text-[11px] text-danger">{missing.join(' · ')}</p>
      )}
    </div>
  )
}
