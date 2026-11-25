import { useState } from 'react'
import { CheckCircle2, Copy, Lock, QrCode, ShieldCheck, Wallet } from 'lucide-react'
import type { ReservationWizard } from './useReservationWizard'
import { money, QrDataImg } from './shared'
import { TicketCardPreview } from './TicketDesigner'
import { downloadAppleWalletPass, getReservationAccessToken } from '../../../lib/public'

export function DoneScreen({ w, onClose }: { w: ReservationWizard; onClose: () => void }) {
  const { t, lang, done, selected, qrUrl, awaitingQr, pending, status, setCheckingCode, copyCode, copied } = w
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletMessage, setWalletMessage] = useState<string | null>(null)
  if (!done) return null

  const addToWallet = async () => {
    if (walletLoading || !done.qr) return
    setWalletLoading(true)
    setWalletMessage(null)
    try {
      await downloadAppleWalletPass(w.event.id, done.reservationCode, {
        token: done.accessToken ?? getReservationAccessToken(done.reservationCode),
        email: w.email.trim(),
      })
      setWalletMessage(lang === 'ar' ? 'تم تجهيز بطاقة Apple Wallet.' : 'Your Apple Wallet pass is ready.')
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : (lang === 'ar' ? 'تعذر تجهيز البطاقة.' : 'Could not create the Wallet pass.'))
    } finally {
      setWalletLoading(false)
    }
  }
  return (
    <div className="space-y-5">
      <div className={`flex items-start gap-3 rounded-none border px-4 py-4 ${done.approval === 'APPROVED' ? 'border-ok/25 bg-ok/8' : 'border-signal/25 bg-signal/8'}`}>
        <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${done.approval === 'APPROVED' ? 'text-ok' : 'text-signal'}`} />
        <div>
          <p className="font-display text-xl font-semibold tracking-tight text-ink-0">
            {done.approval === 'APPROVED' ? t('ticketReady') : t('reservationPending')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            {done.approval === 'APPROVED' ? t('ticketReadyBody') : t('pendingBody')}
          </p>
        </div>
      </div>

      {selected && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-signal">{lang === 'ar' ? 'معاينة تذكرتك النهائية' : 'YOUR TICKET PREVIEW'}</p>
            <span className="text-[9px] uppercase tracking-[.12em] text-ink-3">{w.ticketDesign.paletteId}</span>
          </div>
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
              <p className="mt-1 text-sm text-ink-0">{money(done.price, lang)}</p>
            </div>
          </div>
          {done.seats && done.seats.length > 0 && (
            <div className="border border-line-soft bg-elevated/30 p-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('seats')}</p>
              <p className="mt-1 text-sm text-ink-0">{done.seats.map(s => s.label).join(', ')}</p>
            </div>
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
            <button type="button" onClick={() => setCheckingCode(done.reservationCode)} className="btn-ghost !px-3 !py-2 text-[11px]" disabled={status.isFetching}>
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

      {done.approval === 'APPROVED' && done.qr && done.walletPassAvailable && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void addToWallet()}
            disabled={walletLoading}
            data-testid="add-to-apple-wallet"
            className="flex w-full items-center justify-center gap-2 border border-signal/40 bg-[#0B0B0C] px-4 py-3 text-[12px] font-semibold text-[#F1EDE4] transition-colors hover:border-signal hover:bg-[#171717] disabled:cursor-wait disabled:opacity-60"
          >
            <Wallet size={16} className="text-[#C8A25C]" />
            {walletLoading
              ? (lang === 'ar' ? 'جارٍ تجهيز البطاقة…' : 'Preparing Wallet pass…')
              : (lang === 'ar' ? 'إضافة إلى Apple Wallet' : 'Add to Apple Wallet')}
          </button>
          {walletMessage && <p role="status" className="text-center text-[11px] text-ink-3">{walletMessage}</p>}
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="btn-primary !px-5">{t('done')}</button>
      </div>
    </div>
  )
}
