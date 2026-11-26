import { CheckCircle2, Clock3, Copy, Lock, QrCode, ShieldCheck, XCircle } from 'lucide-react'
import type { ReservationWizard } from './useReservationWizard'
import { money, QrDataImg } from './shared'
import { TicketCardPreview } from './TicketDesigner'

export function DoneScreen({ w, onClose }: { w: ReservationWizard; onClose: () => void }) {
  const { t, lang, done, selected, qrUrl, awaitingQr, pending, status, checkStatus, copyCode, copied } = w
  if (!done) return null
  const rejected = done.approval === 'REJECTED'
  return (
    <div className="space-y-5">
      <div className={`flex items-start gap-3 rounded-none border px-4 py-4 ${done.approval === 'APPROVED' ? 'border-ok/25 bg-ok/8' : rejected ? 'border-danger/25 bg-danger/8' : 'border-signal/25 bg-signal/8'}`}>
        {rejected
          ? <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />
          : done.approval === 'APPROVED'
            ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" />
            : <Clock3 className="mt-0.5 size-5 shrink-0 text-signal" />}
        <div>
          <p className="font-display text-xl font-semibold tracking-tight text-ink-0">
            {done.approval === 'APPROVED' ? t('ticketReady') : rejected ? (lang === 'ar' ? 'لم تتم الموافقة على الحجز' : 'Reservation not approved') : t('reservationPending')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            {done.approval === 'APPROVED' ? t('ticketReadyBody') : rejected ? (lang === 'ar' ? 'لم يتم إصدار تذكرة لهذا الحجز. تواصل مع فريق الفعالية إذا كنت تعتقد أن هذا القرار غير صحيح.' : 'No ticket was issued for this reservation. Contact the event team if you believe this is a mistake.') : t('pendingBody')}
          </p>
        </div>
      </div>

      {done.approval === 'PENDING' && (
        <div className="border border-signal/25 bg-signal/5 p-4">
          <p className="text-[13px] font-semibold text-ink-0">{t('notTicketYet')}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{t('notTicketYetBody')}</p>
        </div>
      )}

      {selected && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-signal">
            {lang === 'ar' ? 'معاينة تذكرتك' : 'YOUR TICKET DESIGN'}
          </p>
          <TicketCardPreview
            event={w.event}
            ticketType={selected}
            attendeeName={w.name}
            seatLabel={done.seats?.map((seat) => seat.label).join(', ')}
            design={w.ticketDesign}
            lang={lang}
            qrUrl={qrUrl}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center border border-line-soft bg-elevated/40 p-4">
          {done.approval === 'APPROVED' ? (
            qrUrl ? <img src={qrUrl} alt="Ticket QR" className="h-44 w-44 border border-line-soft bg-white p-2" /> : <div className="grid h-44 w-44 place-items-center border border-line-soft"><QrCode className="size-8 text-ink-3" /></div>
          ) : rejected ? (
            <div className="grid h-44 w-44 place-items-center border border-dashed border-danger/30 bg-danger/5 text-center">
              <div>
                <XCircle className="mx-auto size-7 text-danger" />
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-danger">{lang === 'ar' ? 'غير معتمد' : 'Not approved'}</p>
              </div>
            </div>
          ) : (
            <div className="grid h-44 w-44 place-items-center border border-dashed border-signal/30 bg-signal/5 text-center">
              <div>
                <Lock className="mx-auto size-7 text-signal" />
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('pending')}</p>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="border border-line-soft bg-elevated/30 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">{t('reservationCode')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="font-mono text-lg font-bold tracking-[0.18em] text-signal sm:text-xl">{done.reservationCode}</p>
              <button type="button" onClick={() => copyCode(done.reservationCode)} className="btn-ghost !px-3 !py-1.5 text-[11px]">
                <Copy size={13} /> {copied ? t('copied') : t('copyCode')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-line-soft bg-elevated/30 p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('ticketType')}</p>
              <p className="mt-1 text-sm text-ink-0">{selected?.name ?? t('ticket')}</p>
            </div>
            <div className="border border-line-soft bg-elevated/30 p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('price')}</p>
              <p className="mt-1 text-sm text-ink-0">{money(done.price, lang, selected?.currency)}</p>
            </div>
          </div>
          {done.seats && done.seats.length > 0 && (
            <div className="border border-line-soft bg-elevated/30 p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('seats')}</p>
              <p className="mt-1 text-sm text-ink-0">{done.seats.map(s => s.label).join(', ')}</p>
            </div>
          )}
          {done.approval === 'APPROVED' && done.qr && (
            <a href={`/my-ticket#code=${encodeURIComponent(done.reservationCode)}`} className="inline-flex w-full items-center justify-center gap-2 border border-signal/30 bg-signal/8 px-4 py-3 text-xs font-semibold text-signal transition-colors hover:bg-signal/15">
              <QrCode size={15} /> {lang === 'ar' ? 'افتح تذكرتي على الهاتف' : 'Open my ticket on phone'}
            </a>
          )}
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">
            <ShieldCheck size={13} className="text-signal" /> {t('secureBooking')}
          </div>
        </div>
      </div>

      {awaitingQr && (
        <div role="status" className="border border-signal/25 bg-signal/5 p-4">
          <p className="text-sm text-ink-2">{t('preparingQr')}</p>
          <p className="mt-1 text-[11px] text-ink-3">{t('pendingPollingBody')}</p>
        </div>
      )}

      {pending && (
        <div className="border border-line-soft bg-elevated/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2"><span className="text-ink-3">{t('status')}:</span> {status.data?.approval ? t(status.data.approval.toLowerCase()) : t('pending')}</p>
            <button type="button" onClick={checkStatus} className="btn-ghost !px-3 !py-2 text-[11px]" disabled={status.isFetching}>
              {status.isFetching ? t('checkingStatus') : t('checkStatus')}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-3">{t('pendingPollingBody')}</p>
          {status.data?.approval === 'APPROVED' && status.data.qr && (
            <div className="mt-4 flex items-center gap-4">
              <QrDataImg code={status.data.qr} />
              <div>
                <p className="text-sm text-ok">{t('ticketReady')}</p>
                <p className="text-[11px] text-ink-3">{status.data.deliveryStatus ? `${t('status')}: ${status.data.deliveryStatus}` : ''}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="btn-primary !px-5">{t('done')}</button>
      </div>
    </div>
  )
}
