import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { CheckCircle2, Copy, Lock, QrCode, ShieldCheck, Ticket } from 'lucide-react'
import { Modal, ErrorBanner } from '../ui'
import { api } from '../../lib/api'
import { useLanguage } from '../../lib/i18n'
import { useReservationStatus, type PublicEvent, type ReservationResult } from '../../lib/public'

function money(price: string, lang: string) {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return lang === 'ar' ? 'مجاني' : 'Free'
  return `$${n.toLocaleString()}`
}

function useQrDataUrl(code: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!code) { setUrl(null); return }
    let alive = true
    QRCode.toDataURL(code, { errorCorrectionLevel: 'M', margin: 1, width: 320, color: { dark: '#0B0B0C', light: '#FFFFFF' } })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null))
    return () => { alive = false }
  }, [code])
  return url
}

function QrDataImg({ code }: { code: string }) {
  const url = useQrDataUrl(code)
  if (!url) return null
  return <img src={url} alt="Ticket QR" className="h-32 w-32 border border-line-soft bg-white p-2" />
}

export default function ReservationModal({ event, onClose }: { event: PublicEvent; onClose: () => void }) {
  const qc = useQueryClient()
  const { t, lang } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ticketTypeId, setTicketTypeId] = useState(event.ticketTypes.find((x) => !x.soldOut)?.id ?? event.ticketTypes[0]?.id ?? '')
  const [done, setDone] = useState<ReservationResult | null>(null)
  const [checkingCode, setCheckingCode] = useState('')
  const [copied, setCopied] = useState(false)
  const qrUrl = useQrDataUrl(done?.approval === 'APPROVED' && done.qr ? done.qr : null)

  const reserve = useMutation({
    mutationFn: () =>
      api.post<ReservationResult>(`/public/events/${event.id}/reservations`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        ticketTypeId,
      }),
    onSuccess: (data) => {
      setDone(data)
      void qc.invalidateQueries({ queryKey: ['public-events'] })
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !ticketTypeId) return
    reserve.mutate()
  }

  const selected = event.ticketTypes.find((x) => x.id === ticketTypeId)
  const pending = done?.approval === 'PENDING'
  const status = useReservationStatus(event.id, pending && checkingCode ? checkingCode : null)

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return (
    <Modal open onClose={onClose} title={done ? (done.approval === 'APPROVED' ? t('reservationConfirmed') : t('reservationPending')) : `${t('reserveFor')} ${event.name}`} wide={!!done}>
      {done ? (
        <div className="space-y-5">
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${done.approval === 'APPROVED' ? 'border-ok/25 bg-ok/8' : 'border-signal/25 bg-signal/8'}`}>
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
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">
                <ShieldCheck size={13} className="text-signal" /> {t('secureBooking')}
              </div>
            </div>
          </div>

          {pending && (
            <div className="border border-line-soft bg-elevated/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-2"><span className="text-ink-3">{t('status')}:</span> {status.data?.approval ? t(status.data.approval.toLowerCase()) : t('pending')}</p>
                <button type="button" onClick={() => setCheckingCode(done.reservationCode)} className="btn-ghost !px-3 !py-2 text-[11px]" disabled={status.isFetching}>
                  {status.isFetching ? t('checkingStatus') : t('checkStatus')}
                </button>
              </div>
              {status.data?.approval === 'APPROVED' && status.data.qr && (
                <div className="mt-4 flex items-center gap-4">
                  <QrDataImg code={status.data.qr} />
                  <p className="text-sm text-ok">{t('ticketReady')}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="btn-primary !px-5">{t('done')}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {reserve.error && <ErrorBanner error={reserve.error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label mb-1.5 block" htmlFor="res-name">{t('fullName')}</label>
              <input id="res-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div>
              <label className="label mb-1.5 block" htmlFor="res-email">{t('email')}</label>
              <input id="res-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="label mb-1.5 block" htmlFor="res-phone">{t('phone')} <span className="text-ink-3 normal-case tracking-normal">({t('optional')})</span></label>
              <input id="res-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className="label mb-1.5 block" htmlFor="res-type">{t('ticketType')}</label>
            <select id="res-type" className="input" value={ticketTypeId} onChange={(e) => setTicketTypeId(e.target.value)}>
              {event.ticketTypes.map((tt) => (
                <option key={tt.id} value={tt.id} disabled={tt.soldOut}>
                  {tt.name} — {money(tt.price, lang)}{tt.soldOut ? ` (${t('soldOut')})` : tt.remaining != null ? ` (${tt.remaining} ${t('left')})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3 border border-line-soft bg-elevated/20 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-ink-3"><Ticket size={14} className="text-signal" /> {selected?.name ?? t('ticket')}</span>
            <span className="font-mono text-signal">{selected ? money(selected.price, lang) : '—'}</span>
          </div>
          <button type="submit" disabled={reserve.isPending || !ticketTypeId || !!selected?.soldOut} className="btn-primary w-full !py-3">
            {reserve.isPending ? t('submitting') : t('confirmReservation')}
          </button>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">{t('secureBookingBody')}</p>
        </form>
      )}
    </Modal>
  )
}
