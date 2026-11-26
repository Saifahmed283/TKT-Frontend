import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownToLine, CheckCircle2, Copy, Download, LockKeyhole, QrCode, RefreshCw, ShieldCheck, Trash2, Wifi, WifiOff } from 'lucide-react'
import QRCode from 'qrcode'
import { fetchPwaReservationTicket, type PwaReservationTicket } from '../../lib/api/public'
import { useLanguage } from '../../lib/i18n'

const STORAGE_KEY = 'tkt-pwa-saved-ticket-v1'
type TicketData = PwaReservationTicket
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> }

function loadSaved(): TicketData | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<TicketData> | null
    if (!value || typeof value.reservationCode !== 'string' || typeof value.eventName !== 'string') return null
    return value as TicketData
  } catch { return null }
}

function valid(ticket: TicketData) {
  return ticket.approval === 'APPROVED'
    && ticket.ticketStatus !== 'CANCELLED'
    && ticket.credentialStatus === 'ACTIVE'
    && Boolean(ticket.qr)
    && (!ticket.credentialValidUntil || new Date(ticket.credentialValidUntil).getTime() > Date.now())
}

function formatDate(value: string, lang: string, timezone: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    dateStyle: 'long', timeStyle: 'short', timeZone: timezone || undefined,
  }).format(date)
}

export default function MyTicketPwaPage() {
  const { lang, toggle } = useLanguage()
  const isAr = lang === 'ar'
  const [code, setCode] = useState(() => new URLSearchParams(window.location.hash.replace(/^#/, '')).get('code') ?? loadSaved()?.reservationCode ?? '')
  const initialSaved = loadSaved()
  const matchingSaved = initialSaved && (!code || initialSaved.reservationCode === code) ? initialSaved : null
  const [ticket, setTicket] = useState<TicketData | null>(matchingSaved)
  const [saved, setSaved] = useState(Boolean(matchingSaved))
  const [email, setEmail] = useState('')
  const [online, setOnline] = useState(() => navigator.onLine)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null)
  const [installHelp, setInstallHelp] = useState(false)
  const isValid = Boolean(ticket && valid(ticket))

  useEffect(() => {
    const onlineHandler = () => setOnline(true)
    const offlineHandler = () => setOnline(false)
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    return () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    let alive = true
    if (!ticket?.qr || !isValid) {
      setQrImage(null)
      return
    }
    QRCode.toDataURL(ticket.qr, {
      errorCorrectionLevel: 'H', margin: 2, width: 360,
      color: { dark: '#0B0B0C', light: '#FFFFFF' },
    }).then((image) => { if (alive) setQrImage(image) }).catch(() => { if (alive) setQrImage(null) })
    return () => { alive = false }
  }, [ticket?.qr, isValid])

  const lookup = async (event: FormEvent) => {
    event.preventDefault()
    if (!online || loading || !code.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await fetchPwaReservationTicket(code.trim(), email.trim())
      setTicket(result)
      if (saved && loadSaved()?.reservationCode === result.reservationCode) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)) } catch {}
      }
    } catch {
      setError(isAr
        ? 'لم نتمكن من العثور على الحجز. راجع رقم الحجز والبريد الإلكتروني.'
        : 'We could not find this reservation. Check the reservation code and email.')
    } finally { setLoading(false) }
  }

  const saveOffline = () => {
    if (!ticket || !valid(ticket)) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket))
      setSaved(true)
      setError('')
    } catch {
      setError(isAr ? 'تعذر حفظ التذكرة على هذا الجهاز.' : 'This device could not save the ticket.')
    }
  }

  const removeOffline = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setSaved(false)
  }

  const copyCode = async () => {
    if (!ticket) return
    try {
      await navigator.clipboard.writeText(ticket.reservationCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  const install = async () => {
    if (!installPrompt) {
      setInstallHelp((value) => !value)
      return
    }
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const words = {
    intro: isAr ? 'احتفظ بتذكرتك على هاتفك، حتى عندما لا يتوفر اتصال بالإنترنت.' : 'Keep your ticket on your phone, even when you are offline.',
    lookup: isAr ? 'أدخل رقم الحجز والبريد المستخدم عند التسجيل.' : 'Enter your reservation code and booking email.',
    code: isAr ? 'رقم الحجز' : 'Reservation code',
    email: isAr ? 'البريد الإلكتروني للحجز' : 'Reservation email',
    find: isAr ? 'عرض التذكرة' : 'Find my ticket',
    refresh: isAr ? 'تحديث الحالة' : 'Refresh status',
    install: isAr ? 'تثبيت تطبيق TKT' : 'Install TKT app',
    save: isAr ? 'حفظ على هذا الجهاز' : 'Save on this device',
    saved: isAr ? 'محفوظ على هذا الجهاز' : 'Saved on this device',
    remove: isAr ? 'حذف النسخة المحفوظة' : 'Remove offline copy',
    guest: isAr ? 'اسم صاحب الحجز' : 'Guest',
    type: isAr ? 'نوع التذكرة' : 'Ticket type',
    venue: isAr ? 'المكان' : 'Venue',
    date: isAr ? 'الموعد' : 'Date',
    seats: isAr ? 'المقاعد' : 'Seats',
    payment: isAr ? 'حالة الدفع' : 'Payment status',
    ready: isAr ? 'التذكرة جاهزة للدخول' : 'Ticket ready for entry',
    pending: isAr ? 'الحجز قيد المراجعة' : 'Reservation under review',
    rejected: isAr ? 'الحجز مرفوض' : 'Reservation rejected',
    invalid: isAr ? 'هذه التذكرة غير صالحة حالياً. حدّث الحالة أو تواصل مع المنظم.' : 'This ticket is not currently valid. Refresh its status or contact the organizer.',
    noQr: isAr ? 'سيظهر رمز الدخول بعد اعتماد الحجز وإصدار التذكرة.' : 'The entry QR appears after the reservation is approved and the credential is issued.',
    online: isAr ? 'متصل' : 'Online',
    offline: isAr ? 'دون اتصال' : 'Offline',
    offlineWarning: isAr ? 'النسخة دون اتصال لا تستقبل تحديثات الإلغاء أو تسجيل الدخول. اتصل بالإنترنت وحدّث التذكرة قبل التوجه للفعالية.' : 'Offline copies cannot receive cancellation or check-in updates. Reconnect and refresh before travelling to the event.',
    ios: isAr ? 'على iPhone: افتح الصفحة في Safari، اضغط مشاركة، ثم «إضافة إلى الشاشة الرئيسية».' : 'On iPhone: open this page in Safari, tap Share, then choose “Add to Home Screen”.',
    privacy: isAr ? 'تُجلب بيانات الحجز مباشرة من خوادم TKT. لا يتم إرسال رقم الحجز أو QR إلى خدمات خارجية.' : 'Reservation data is retrieved directly from TKT. No booking details or QR codes are sent to third-party services.',
  }

  return (
    <main className="min-h-screen bg-[#090B0E] px-4 py-6 text-white sm:px-6 sm:py-10" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-7 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-white">
            <img src="/tkt-mark.svg" alt="" className="h-9 w-9 rounded-xl" /><span>TKT</span>
          </a>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-[11px] ${online ? 'text-emerald-300' : 'text-amber-300'}`}>
              {online ? <Wifi size={14} /> : <WifiOff size={14} />}{online ? words.online : words.offline}
            </span>
            <button type="button" onClick={toggle} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80">{isAr ? 'EN' : 'عربي'}</button>
          </div>
        </header>
        <section className="mb-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#171A20] to-[#101216] p-5 sm:p-7">
          <p className="text-[10px] font-semibold tracking-[0.24em] text-[#FFB020]">TKT DIGITAL TICKETS</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{isAr ? 'تذكرتي' : 'My ticket'}</h1>
          <p className="mt-2 text-sm leading-7 text-white/65">{words.intro}</p>
          <button type="button" onClick={() => void install()} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#FFB020]/40 bg-[#FFB020]/10 px-4 py-2.5 text-sm font-semibold text-[#FFC45D]"><Download size={16} />{words.install}</button>
          {installHelp && <p className="mt-3 text-xs leading-6 text-white/65">{words.ios}</p>}
        </section>
        <form onSubmit={lookup} className="mb-5 space-y-3 rounded-3xl border border-white/10 bg-[#11151A] p-5">
          <p className="text-sm text-white/65">{words.lookup}</p>
          <label className="block space-y-1.5"><span className="text-xs text-white/65">{words.code}</span><input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-sm outline-none focus:border-[#FFB020]/70" placeholder="TKT-XXXXXXXX" /></label>
          <label className="block space-y-1.5"><span className="text-xs text-white/65">{words.email}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-[#FFB020]/70" placeholder="name@example.com" /></label>
          <button type="submit" disabled={loading || !online} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFB020] px-4 py-3 text-sm font-bold text-[#17120A] disabled:cursor-not-allowed disabled:opacity-45">{loading ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={16} />}{ticket ? words.refresh : words.find}</button>
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        </form>
        {ticket && (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#F8F7F3] text-[#101216] shadow-2xl">
            <div className="bg-[#171A20] p-5 text-white sm:p-6">
              <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold tracking-[0.2em] text-[#FFB020]">TKT · EVENT PASS</span>{isValid ? <CheckCircle2 className="text-emerald-300" size={20} /> : <LockKeyhole className="text-amber-300" size={20} />}</div>
              <h2 className="mt-4 text-xl font-semibold">{ticket.eventName}</h2>
              <p className="mt-1 text-sm text-white/60">{ticket.ticketName}</p>
            </div>
            <div className="p-5 sm:p-6">
              {ticket.approval === 'PENDING' ? <p className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900">{words.pending} — {words.noQr}</p>
                : ticket.approval === 'REJECTED' ? <p className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">{words.rejected}</p>
                : !isValid ? <p className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">{words.invalid}</p> : null}
              {isValid && qrImage && <div className="mb-5 flex flex-col items-center rounded-2xl border border-dashed border-[#C9C7C0] bg-white p-5"><img src={qrImage} alt="TKT entry QR code" className="h-56 w-56 max-w-full object-contain" /><p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800"><ShieldCheck size={15} />{words.ready}</p></div>}
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-[#D8D6CF] pt-5 text-sm">
                <div><p className="text-[11px] text-[#77766F]">{words.guest}</p><p className="mt-1 font-semibold">{ticket.attendeeName}</p></div>
                <div><p className="text-[11px] text-[#77766F]">{words.type}</p><p className="mt-1 font-semibold">{ticket.ticketName}</p></div>
                <div><p className="text-[11px] text-[#77766F]">{words.date}</p><p className="mt-1 font-semibold">{formatDate(ticket.eventStartAt, lang, ticket.timezone)}</p></div>
                <div><p className="text-[11px] text-[#77766F]">{words.venue}</p><p className="mt-1 font-semibold">{ticket.venueName || ticket.venueAddress || '—'}</p></div>
                {ticket.seats.length > 0 && <div className="col-span-2"><p className="text-[11px] text-[#77766F]">{words.seats}</p><p className="mt-1 font-semibold">{ticket.seats.map((seat) => [seat.busName, seat.label].filter(Boolean).join(' · ')).join(' / ')}</p></div>}
                <div className="col-span-2"><p className="text-[11px] text-[#77766F]">{words.payment}</p><p className="mt-1 font-semibold">{ticket.paymentStatus}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[#D8D6CF] pt-4">
                <div><p className="text-[10px] uppercase tracking-[0.18em] text-[#77766F]">{words.code}</p><p className="mt-1 font-mono text-sm font-bold tracking-[0.12em]">{ticket.reservationCode}</p></div>
                <button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-2 rounded-full border border-[#C9C7C0] px-3 py-2 text-xs font-semibold"><Copy size={14} />{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرقم' : 'Copy code')}</button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {isValid && <button type="button" onClick={saveOffline} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#171A20] px-4 py-3 text-xs font-bold text-white"><ArrowDownToLine size={15} />{saved ? words.saved : words.save}</button>}
                {saved && <button type="button" onClick={removeOffline} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8D6CF] px-4 py-3 text-xs font-semibold text-[#5A5B5D]"><Trash2 size={14} />{words.remove}</button>}
              </div>
            </div>
          </section>
        )}
        {ticket && saved && <p className="mt-3 text-center text-[11px] leading-6 text-white/45">{words.offlineWarning}</p>}
        {!online && ticket && <p role="status" className="mt-3 text-center text-xs text-amber-200">{isAr ? 'أنت غير متصل. يتم عرض النسخة المحفوظة محلياً.' : 'You are offline. Showing the saved copy on this device.'}</p>}
        <p className="mt-6 flex items-start gap-2 text-[11px] leading-6 text-white/45"><ShieldCheck size={14} className="mt-1 shrink-0" />{words.privacy}</p>
        <footer className="pt-8 text-center text-[10px] tracking-[0.2em] text-white/35">TKT · EVENTS & EXPERIENCES</footer>
      </div>
    </main>
  )
}
