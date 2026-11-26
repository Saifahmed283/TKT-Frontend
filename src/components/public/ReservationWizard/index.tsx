import { ArrowLeft, ArrowRight, Check, Clock3 } from 'lucide-react'
import { Modal, ErrorBanner } from '../../ui'
import type { PublicEvent } from '../../../lib/public'
import { useReservationWizard } from './useReservationWizard'
import { money } from './shared'
import { TicketStep } from './TicketStep'
import { SeatsStep } from './SeatsStep'
import { DetailsStep } from './DetailsStep'
import { PaymentStep } from './PaymentStep'
import { DesignStep } from './DesignStep'
import { ReviewStep } from './ReviewStep'
import { DoneScreen } from './DoneScreen'

export default function ReservationModal({ event, onClose }: { event: PublicEvent; onClose: () => void }) {
  const w = useReservationWizard(event, onClose)
  const {
    t, lang, done, stepId, step, activeStep, steps, selected, totalPrice, selectedSeatIds,
    selectedBus, holdExpiresAt, holdExpiring, holdCountdown, confirmDiscard, setConfirmDiscard,
    reserve, existingReservation, duplicateLoading, resending, resendMessage, openExisting,
    resendTicket, canGoBack, goBack, goNext, goToStep, canContinue, onSubmit, requestClose,
  } = w

  const progress = Math.round(((activeStep + 1) / (steps.length + 1)) * 100)
  const blockedHint = stepId === 'ticket'
    ? t('ticketRequired')
    : stepId === 'seats'
      ? t('seatRequired')
      : stepId === 'details'
        ? t('detailsRequired')
        : stepId === 'payment'
          ? t('paymentDetailsRequired')
          : stepId === 'design'
            ? t('designRequired')
            : ''

  return (
    <Modal
      open
      onClose={requestClose}
      title={done ? (done.approval === 'APPROVED' ? t('reservationConfirmed') : t('reservationPending')) : `${t('reserveFor')} ${event.name}`}
      wide
      extraWide
    >
      {done ? (
        <DoneScreen w={w} onClose={onClose} />
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
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

          <section className="space-y-4 border-b border-line-soft pb-5" aria-label={lang === 'ar' ? 'تقدم الحجز' : 'Reservation progress'}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">
                  {lang === 'ar' ? 'الخطوة' : 'Step'} {activeStep + 1} / {steps.length}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-ink-0" data-testid="wizard-current-step">
                  {step.label}
                </h2>
              </div>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-3">{progress}%</span>
            </div>

            <div
              role="progressbar"
              aria-label={lang === 'ar' ? 'تقدم الحجز' : 'Booking progress'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-1.5 overflow-hidden rounded-full bg-line-soft"
            >
              <div className="h-full rounded-full bg-signal transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>

            <ol className="flex gap-2 overflow-x-auto pb-1" aria-label={lang === 'ar' ? 'خطوات الحجز' : 'Booking steps'}>
              {steps.map((item, index) => {
                const Icon = item.icon
                const complete = index < activeStep
                const active = index === activeStep
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      disabled={index > activeStep}
                      aria-current={active ? 'step' : undefined}
                      aria-label={`${index + 1}. ${item.label}`}
                      title={item.label}
                      onClick={() => goToStep(item.id)}
                      className={`flex min-h-10 items-center gap-2 border px-2.5 py-2 text-xs transition-colors disabled:cursor-default ${
                        active
                          ? 'border-signal/50 bg-signal/10 text-signal'
                          : complete
                            ? 'border-ok/30 text-ok hover:border-ok/50'
                            : 'border-line-soft text-ink-3'
                      }`}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[10px] ${
                        complete ? 'border-ok/40 bg-ok/10' : active ? 'border-signal/50' : 'border-line-soft'
                      }`}>
                        {complete ? <Check size={12} /> : index + 1}
                      </span>
                      <Icon size={12} className="hidden sm:block" />
                      <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <p className="text-[13px] leading-relaxed text-ink-2">{step.help}</p>
          </section>

          {activeStep > 0 && (
            <div data-testid="wizard-summary" className="border border-line-soft bg-elevated/20 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
                <span className="font-medium text-ink-0">{selected?.name ?? t('ticket')}</span>
                <span className="font-mono font-semibold text-signal">{money(String(totalPrice), lang, selected?.currency ?? 'EGP')}</span>
                {selectedSeatIds.length > 0 && (
                  <span className="text-ink-2">{selectedBus?.seats.find((s) => selectedSeatIds.includes(s.id))?.label}</span>
                )}
              </div>
              {holdExpiresAt && (
                <div className={`mt-2 flex items-center gap-1 border-t border-line-soft pt-2 font-mono text-[11px] uppercase tracking-[0.12em] ${holdExpiring ? 'text-danger' : 'text-ok'}`}>
                  <Clock3 size={12} /> {holdExpiring ? t('holdEndingSoon') : t('heldUntil')} {holdCountdown}
                </div>
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
                    className="btn-ghost disabled:opacity-40"
                    disabled={duplicateLoading}
                    onClick={() => void openExisting()}
                  >
                    {duplicateLoading ? t('loadingReservation') : t('viewReservation')}
                  </button>
                )}
                <button
                  type="button"
                  data-testid="resend-ticket"
                  className="btn-ghost disabled:opacity-40"
                  disabled={resending}
                  onClick={() => void resendTicket()}
                >
                  {resending ? t('resending') : t('resendTicket')}
                </button>
                <button
                  type="button"
                  data-testid="forgot-code"
                  className="btn-ghost disabled:opacity-40"
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
          {stepId === 'seats' && <SeatsStep w={w} />}
          {stepId === 'details' && <DetailsStep w={w} />}
          {stepId === 'payment' && <PaymentStep w={w} />}
          {stepId === 'design' && <DesignStep w={w} />}
          {stepId === 'review' && <ReviewStep w={w} />}

          {stepId !== 'review' ? (
            <div className="space-y-2">
              {!canContinue && blockedHint && <p className="text-end text-[12px] text-ink-3">{blockedHint}</p>}
              <div className="flex items-center justify-between gap-3">
                <button type="button" data-testid="wizard-back" onClick={goBack} disabled={!canGoBack} className="btn-ghost disabled:opacity-40">
                  <ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('back')}
                </button>
                <button type="button" data-testid="wizard-next" onClick={goNext} disabled={!canContinue} className="btn-primary disabled:opacity-40">
                  {t('next')} <ArrowRight size={14} className="rtl:-scale-x-100" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button type="button" data-testid="wizard-back" onClick={goBack} className="btn-ghost">
                <ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('back')}
              </button>
              <button type="submit" data-testid="wizard-submit" disabled={reserve.isPending || !canContinue} className="btn-primary disabled:opacity-40">
                {reserve.isPending ? t('submitting') : t('confirmReservation')}
              </button>
            </div>
          )}

          <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">{t('secureBookingBody')}</p>
        </form>
      )}
    </Modal>
  )
}
