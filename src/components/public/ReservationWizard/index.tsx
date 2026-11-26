import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react'
import { Modal, ErrorBanner } from '../../ui'
import type { PublicEvent } from '../../../lib/public'
import { useReservationWizard } from './useReservationWizard'
import { money } from './shared'
import { TicketStep } from './TicketStep'
import { DetailsStep } from './DetailsStep'
import { DesignStep } from './DesignStep'
import { PaymentStep } from './PaymentStep'
import { ReviewStep } from './ReviewStep'
import { DoneScreen } from './DoneScreen'

export default function ReservationModal({ event, onClose }: { event: PublicEvent; onClose: () => void }) {
  const w = useReservationWizard(event, onClose)
  const { t, lang, done, stepId, activeStep, steps, selected, totalPrice, selectedSeatIds, selectedBus, holdExpiresAt, holdExpiring, holdCountdown, confirmDiscard, setConfirmDiscard, reserve, existingReservation, duplicateLoading, resending, resendMessage, openExisting, resendTicket, canGoBack, goBack, goNext, canContinue, onSubmit, requestClose } = w

  return (
    <Modal open onClose={requestClose} title={done ? (done.approval === 'APPROVED' ? t('reservationConfirmed') : t('reservationPending')) : `${t('reserveFor')} ${event.name}`} wide={!!done || stepId === 'design' || stepId === 'review'}>
      {done ? (
        <DoneScreen w={w} onClose={onClose} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {confirmDiscard && (
            <div data-testid="wizard-discard-confirm" className="border border-signal/30 bg-signal/8 p-4">
              <p className="text-sm font-medium text-ink-0">{t('discardTitle')}</p>
              <p className="mt-1 text-[12px] text-ink-2">{t('discardBody')}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" data-testid="wizard-discard-cancel" className="btn-ghost !px-3 !py-1.5 text-[11px]" onClick={() => setConfirmDiscard(false)}>{t('discardCancel')}</button>
                <button type="button" data-testid="wizard-discard-accept" className="btn-primary !px-3 !py-1.5 text-[11px]" onClick={onClose}>{t('discardConfirm')}</button>
              </div>
            </div>
          )}
          <section className="space-y-3 border-b border-line-soft pb-4" aria-label={lang === 'ar' ? 'تقدم الحجز' : 'Reservation progress'}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-signal">
                  {lang === 'ar' ? 'الخطوة' : 'Step'} {activeStep + 1} / {steps.length}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-ink-0" data-testid="wizard-current-step">{steps[activeStep]?.label}</p>
              </div>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-3">
                {Math.round(((activeStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={lang === 'ar' ? 'تقدم الحجز' : 'Booking progress'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(((activeStep + 1) / steps.length) * 100)}
              className="h-1.5 overflow-hidden rounded-full bg-line-soft"
            >
              <div
                className="h-full rounded-full bg-signal transition-[width] duration-300"
                style={{ width: ((activeStep + 1) / steps.length) * 100 + '%' }}
              />
            </div>
            <div className="hidden flex-wrap items-center gap-2 sm:flex">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={index > activeStep}
                    aria-current={index === activeStep ? 'step' : undefined}
                    onClick={() => w.setStepIndex(index)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors disabled:cursor-default ${index === activeStep ? 'border-signal/40 bg-signal/10 text-signal' : index < activeStep ? 'border-ok/30 text-ok hover:border-ok/50' : 'border-line-soft text-ink-3'}`}
                  >
                    <Icon size={12} /> {step.label}
                  </button>
                )
              })}
            </div>
          </section>

          {activeStep >= 1 && (
            <div data-testid="wizard-summary" className="flex flex-wrap items-center justify-between gap-2 border border-line-soft bg-elevated/20 px-3 py-2 text-[11px] text-ink-2">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink-0">{selected?.name ?? t('ticket')}</span>
                <span className="font-mono text-signal">{money(String(totalPrice), lang, selected?.currency ?? 'EGP')}</span>
                {selectedSeatIds.length > 0 && <span className="text-ink-3">{selectedBus?.seats.find((s) => selectedSeatIds.includes(s.id))?.label ?? ''}</span>}
              </span>
              {holdExpiresAt && (
                <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-[0.12em] ${holdExpiring ? 'text-danger' : 'text-ok'}`}>
                  <Clock3 size={12} /> {holdExpiring ? t('holdEndingSoon') : t('heldUntil')} {holdCountdown}
                </span>
              )}
            </div>
          )}

          {reserve.error && <ErrorBanner error={reserve.error} />}
          {existingReservation && (
            <div data-testid="wizard-existing-reservation" className="rounded-none border border-signal/25 bg-signal/8 px-4 py-3 text-sm text-ink-1">
              <p className="font-medium text-ink-0">{t('reservationExists')}</p>
              {existingReservation.reservationCode && (
                <p className="mt-1 font-mono text-[12px] text-signal">{existingReservation.reservationCode}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {existingReservation.reservationCode && (
                  <button
                    type="button"
                    data-testid="view-existing-reservation"
                    className="btn-ghost !px-3 !py-1.5 text-[11px]"
                    disabled={duplicateLoading}
                    onClick={() => void openExisting()}
                  >
                    {duplicateLoading ? t('loadingReservation') : t('viewReservation')}
                  </button>
                )}
                <button
                  type="button"
                  data-testid="resend-ticket"
                  className="btn-ghost !px-3 !py-1.5 text-[11px]"
                  disabled={resending}
                  onClick={() => void resendTicket()}
                >
                  {resending ? t('resending') : t('resendTicket')}
                </button>
                <button
                  type="button"
                  data-testid="forgot-code"
                  className="btn-ghost !px-3 !py-1.5 text-[11px]"
                  disabled={resending}
                  onClick={() => void resendTicket()}
                >
                  {t('forgotCode')}
                </button>
              </div>
              {resendMessage && <p className="mt-2 text-[11px] text-ink-2" role="status">{resendMessage}</p>}
            </div>
          )}

          {stepId === 'ticket' && <TicketStep w={w} />}
          {stepId === 'details' && <DetailsStep w={w} />}
          {stepId === 'payment' && <PaymentStep w={w} />}
          {stepId === 'design' && <DesignStep w={w} />}
          {stepId === 'review' && <ReviewStep w={w} />}

          {stepId !== 'review' ? (
            <div className="flex items-center justify-between gap-3">
              <button type="button" data-testid="wizard-back" onClick={goBack} disabled={!canGoBack} className="btn-ghost !px-4 disabled:opacity-40">
                <ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('back')}
              </button>
              <button type="button" data-testid="wizard-next" onClick={goNext} disabled={!canContinue} className="btn-primary !px-5">
                {t('next')} <ArrowRight size={14} className="rtl:-scale-x-100" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button type="button" data-testid="wizard-back" onClick={goBack} className="btn-ghost !px-4">
                <ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('back')}
              </button>
              <button type="submit" data-testid="wizard-submit" disabled={w.reserve.isPending || !canContinue} className="btn-primary !px-5 !py-3">
                {w.reserve.isPending ? t('submitting') : t('confirmReservation')}
              </button>
            </div>
          )}
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">{t('secureBookingBody')}</p>
        </form>
      )}
    </Modal>
  )
}
