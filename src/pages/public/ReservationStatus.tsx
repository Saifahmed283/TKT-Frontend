import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { ArrowLeft, CheckCircle2, Clock3, Copy, Lock, QrCode, RefreshCw, ShieldCheck, Ticket } from 'lucide-react'
import PublicNav from '../../components/public/PublicNav'
import PublicFooter from '../../components/public/PublicFooter'
import { Corners, Blink } from '../../components/instruments'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import { Button } from '../../components/ui/button'
import { useLanguage } from '../../lib/i18n'
import { getReservationAccessToken, useReservationStatus } from '../../lib/public'

function useQrDataUrl(code: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!code) { setUrl(null); return }
    let alive = true
    QRCode.toDataURL(code, { errorCorrectionLevel: 'M', margin: 1, width: 360, color: { dark: '#0B0B0C', light: '#FFFFFF' } })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null))
    return () => { alive = false }
  }, [code])
  return url
}

function money(price: string, currency = 'EGP', lang = 'en') {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return lang === 'ar' ? 'مجاني' : 'Free'
  return `${currency} ${n.toLocaleString()}`
}

export default function ReservationStatusPage() {
  const { code = '' } = useParams<{ code: string }>()
  const [sp] = useSearchParams()
  const eventId = sp.get('event') ?? ''
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'
  const [copied, setCopied] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [email, setEmail] = useState('')
  const hasCapability = Boolean(code && (getReservationAccessToken(code) || email))
  const status = useReservationStatus(eventId, code || null, { email })
  const data = status.data
  const qrUrl = useQrDataUrl(data?.approval === 'APPROVED' && data.qr ? data.qr : null)

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200) } catch {}
  }

  return (
    <div className="relative min-h-screen bg-paper text-ink" dir={isAr ? 'rtl' : 'ltr'} data-lang={lang}>
      <PublicNav />
      <main className="relative px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_68%_35%,rgba(232,208,139,0.08),transparent_35%),linear-gradient(to_bottom,var(--color-canvas),var(--color-paper))]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Link to="/upcoming" className="inline-flex items-center gap-2 text-[12px] text-ink-3 transition-colors hover:text-signal">
              <ArrowLeft size={14} /> {isAr ? 'الفعاليات' : 'Events'}
            </Link>
            <Button size="sm" variant="ghost" onClick={() => void status.refetch()} disabled={status.isFetching}>
              <RefreshCw size={14} className={status.isFetching ? 'animate-spin' : ''} /> {isAr ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/40 !p-0 !shadow-none" spotlightColor="rgba(232, 208, 139, 0.1)">
            <div className="relative p-5 sm:p-8">
              <Corners className="opacity-40" />
              <div className="mb-6 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center border border-signal/30 bg-signal/10 text-signal"><Ticket size={18} /></span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">{isAr ? 'حالة الحجز' : 'Reservation status'}</p>
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-0 sm:text-3xl">{code}</h1>
                </div>
              </div>

              {!hasCapability && (
                <form
                  className="border border-line-soft bg-elevated/30 p-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (emailInput.trim()) setEmail(emailInput.trim())
                  }}
                >
                  <p className="text-sm text-ink-2">
                    {isAr
                      ? 'أدخل البريد المستخدم في الحجز لعرض هذه التذكرة على جهاز جديد.'
                      : 'Enter the email used for this reservation to view it on a new device.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={isAr ? 'بريد الحجز' : 'Reservation email'}
                      data-testid="reservation-email-input"
                      className="input min-w-0 flex-1"
                    />
                    <Button type="submit" size="sm" data-testid="reservation-email-submit">
                      {isAr ? 'عرض' : 'View'}
                    </Button>
                  </div>
                </form>
              )}
              {hasCapability && status.isLoading && <div className="py-12 text-center text-sm text-ink-3">{t('loading') ?? 'Loading...'}</div>}
              {hasCapability && status.error && (
                <div className="border border-danger/25 bg-danger/8 p-4 text-sm text-danger">
                  {isAr
                    ? 'تعذر تحميل الحجز. تحقق من رمز الحجز والبريد.'
                    : 'Could not load reservation. Check the reservation code and email.'}
                </div>
              )}

              {data && (
                <div className="space-y-5">
                  <div className={`flex items-start gap-3 border px-4 py-4 ${data.approval === 'APPROVED' ? 'border-ok/25 bg-ok/8' : data.approval === 'REJECTED' ? 'border-danger/25 bg-danger/8' : 'border-signal/25 bg-signal/8'}`}>
                    <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${data.approval === 'APPROVED' ? 'text-ok' : data.approval === 'REJECTED' ? 'text-danger' : 'text-signal'}`} />
                    <div>
                      <p className="font-display text-xl font-semibold tracking-tight text-ink-0">
                        {data.approval === 'APPROVED' ? (t('ticketReady') ?? 'Ticket ready') : data.approval === 'REJECTED' ? (isAr ? 'تم رفض الحجز' : 'Reservation rejected') : (t('reservationPending') ?? 'Reservation pending')}
                      </p>
                      <p className="mt-1 text-sm text-ink-2">
                        {data.approval === 'APPROVED'
                          ? (t('ticketReadyBody') ?? 'Your QR ticket is ready. Present it at check-in.')
                          : data.approval === 'REJECTED'
                            ? (data.paymentReviewNote || (isAr ? 'تواصل مع فريق الفعالية للمساعدة.' : 'Contact the event team if you need help.'))
                            : (t('pendingBody') ?? 'Your reservation is pending review. This page updates automatically.')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                    <div className="flex flex-col items-center justify-center border border-line-soft bg-elevated/40 p-4">
                      {data.approval === 'APPROVED' ? (
                        qrUrl ? <img src={qrUrl} alt="Ticket QR" className="h-52 w-52 border border-line-soft bg-white p-2" /> : <div className="grid h-52 w-52 place-items-center border border-line-soft"><QrCode className="size-8 text-ink-3" /></div>
                      ) : (
                        <div className="grid h-52 w-52 place-items-center border border-dashed border-signal/30 bg-signal/5 text-center">
                          <div>
                            <Lock className="mx-auto size-7 text-signal" />
                            <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('pending') ?? 'Pending'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="border border-line-soft bg-elevated/30 p-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">{t('reservationCode') ?? 'Reservation code'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="font-mono text-lg font-bold tracking-[0.14em] text-signal">{data.reservationCode}</p>
                          <button type="button" onClick={() => void copyCode()} className="btn-ghost !px-3 !py-1.5 text-[11px]"><Copy size={13} /> {copied ? (t('copied') ?? 'Copied') : (t('copyCode') ?? 'Copy')}</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-line-soft bg-elevated/30 p-3"><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{isAr ? 'الاسم' : 'Name'}</p><p className="mt-1 text-sm text-ink-0">{data.attendeeName}</p></div>
                        <div className="border border-line-soft bg-elevated/30 p-3"><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('ticketType') ?? 'Ticket'}</p><p className="mt-1 text-sm text-ink-0">{data.ticketName}</p></div>
                        <div className="border border-line-soft bg-elevated/30 p-3"><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{isAr ? 'الدفع' : 'Payment'}</p><p className="mt-1 text-sm text-ink-0">{data.paymentStatus ?? '—'}</p></div>
                        <div className="border border-line-soft bg-elevated/30 p-3"><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('price') ?? 'Price'}</p><p className="mt-1 text-sm text-ink-0">{money(data.price, 'EGP', lang)}</p></div>
                      </div>
                      {data.seats && data.seats.length > 0 && (
                        <div className="border border-line-soft bg-elevated/30 p-3">
                          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{isAr ? 'المقاعد' : 'Seats'}</p>
                          <div className="mt-2 space-y-1">
                            {data.seats.map(s => (
                              <p key={s.id} className="text-sm text-ink-0">{s.bus?.name ? `${s.bus.name} · ` : ''}{s.label}{s.passengerName ? ` — ${s.passengerName}` : ''}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3"><ShieldCheck size={13} className="text-signal" /> {t('secureBooking') ?? 'Secure booking'}</div>
                      {data.deliveryStatus && <div className="text-[11px] text-ink-3">Delivery: <span className="text-ink-1">{data.deliveryStatus}</span></div>}
                    </div>
                  </div>

                  {data.approval === 'PENDING' && (
                    <div className="flex items-center gap-2 border border-line-soft bg-elevated/20 px-4 py-3 text-[12px] text-ink-2">
                      <Clock3 size={14} className="text-signal" />
                      <span>{isAr ? 'يتم تحديث الحالة تلقائياً كل 15 ثانية.' : 'Status refreshes automatically every 15 seconds.'}</span>
                      <span className="ml-auto inline-flex items-center gap-1 text-ok"><Blink className="bg-ok" /> Live</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
