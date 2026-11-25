import { ExternalLink } from 'lucide-react'
import { FileUploadField } from '../../ui/file-upload'
import type { ReservationWizard } from './useReservationWizard'
import { money } from './shared'

export function PaymentStep({ w }: { w: ReservationWizard }) {
  const {
    t, lang, event, paymentProviderId, setPaymentProviderId, paymentReference,
    setPaymentReference, paymentProofUrl, setPaymentProofUrl, selected,
    selectedProvider, selectedBus, seatTotal, ticketPrice, totalPrice, canContinue,
    selectedSeatIds,
  } = w
  return (
    <div data-testid="wizard-step-payment" className="space-y-3 border border-line-soft bg-elevated/20 p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-signal">{t('paymentDetails')}</p>
      <div data-testid="payment-instructions" className="space-y-2 border border-signal/25 bg-signal/5 p-3 text-[12px] text-ink-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-signal">{t('paymentInstructions')}</p>
        {(event.paymentProviders ?? []).some((p) => p.instructions) ? (
          (event.paymentProviders ?? []).filter((p) => p.instructions).map((p) => (
            <div key={p.id}>
              <p className="font-medium text-ink">{p.name}</p>
              <p className="whitespace-pre-line">{p.instructions}</p>
            </div>
          ))
        ) : (
          <p className="text-ink-3">{t('noPaymentMethods')}</p>
        )}
      </div>
      <div data-testid="payment-subtotal" className="border border-line-soft bg-panel/40 p-3 text-[12px] text-ink-2">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-signal">{t('paymentSubtotal')}</p>
        <div className="flex justify-between gap-3">
          <span>{t('ticketType')}: {selected?.name}</span>
          <span className="font-mono">{money(String(ticketPrice), lang, selected?.currency ?? 'EGP')}</span>
        </div>
        {seatTotal > 0 && (
          <div className="flex justify-between gap-3">
            <span>{t('seatSubtotal')} ({selectedSeatIds.length})</span>
            <span className="font-mono">{money(String(seatTotal), lang, selectedBus?.currency ?? 'EGP')}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between gap-3 border-t border-line-soft pt-2 font-medium text-ink-0">
          <span>{t('total')}</span>
          <span className="font-mono text-signal">{money(String(totalPrice), lang, selected?.currency ?? 'EGP')}</span>
        </div>
      </div>
      {(event.paymentProviders?.length ?? 0) > 0 ? (
        <select data-testid="payment-provider" className="input" value={paymentProviderId} onChange={(e) => setPaymentProviderId(e.target.value)}>
          <option value="">{t('selectPaymentMethod')}</option>
          {event.paymentProviders!.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      ) : (
        <p className="text-[12px] text-ink-3">{t('noPaymentMethods')}</p>
      )}
      {selectedProvider ? (
        <div className="space-y-1 border border-line-soft bg-panel/40 p-3 text-[12px] text-ink-2">
          {selectedProvider.accountName && <div><span className="text-ink-3">{t('account')}:</span> {selectedProvider.accountName}</div>}
          {selectedProvider.accountNumber && <div><span className="text-ink-3">{t('number')}:</span> {selectedProvider.accountNumber}</div>}
          {selectedProvider.paymentPhone && <div><span className="text-ink-3">{t('phone')}:</span> {selectedProvider.paymentPhone}</div>}
          {selectedProvider.paymentLink && <a href={selectedProvider.paymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-signal hover:underline"><ExternalLink size={12} /> {t('openPaymentLink')}</a>}
          {selectedProvider.imageUrl && <img src={selectedProvider.imageUrl} alt={selectedProvider.name} className="mt-2 max-h-36 border border-line-soft object-contain" />}
        </div>
      ) : null}
      <input data-testid="payment-reference" className="input" placeholder={t('paymentReference')} value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
      <FileUploadField uploadEndpoint="/uploads/proof" label={t('paymentProof')} value={paymentProofUrl ?? ''} onChange={(v) => setPaymentProofUrl(v || null)} accept="image/*,application/pdf" hint={t('optional')} />
      {!canContinue && <p className="text-[11px] text-danger">{t('paymentDetailsRequired')}</p>}
    </div>
  )
}
