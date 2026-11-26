import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import QRCode from 'qrcode'

export type TicketEmailDesign = {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  headerColor?: string
  panelColor?: string
  logoUrl?: string
  fontFamily?: 'Cairo' | 'Tahoma' | 'Arial' | 'Poppins'
  layoutOrder?: string[]
}

type SectionId = 'intro' | 'details' | 'qr' | 'action' | 'footer' | 'legal'
const DEFAULT_ORDER: SectionId[] = ['intro', 'details', 'qr', 'action', 'footer', 'legal']
const PREVIEW_QR_PAYLOAD = 'TKT-PREVIEW-ONLY:NOT-A-VALID-TICKET'

const safeColor = (value: string | undefined, fallback: string) =>
  /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback

function safeLogoUrl(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function TicketEmailPreview({
  eventName = 'TKT Signature Event',
  title = 'Booking Confirmation & Ticket Issuance',
  titleAr = 'تم تأكيد حجزك بنجاح',
  body = 'Your ticket details are below. Keep this email and present your QR code at the entrance.',
  bodyAr = 'شكراً لحجزك معنا. ستجد أدناه تفاصيل الحجز ورمز التذكرة.',
  footer = 'Your Partner in Travel, Events & Special Occasions',
  design = {},
}: {
  eventName?: string
  title?: string
  titleAr?: string
  body?: string
  bodyAr?: string
  footer?: string
  design?: TicketEmailDesign
}) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    QRCode.toDataURL(PREVIEW_QR_PAYLOAD, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 360,
      color: { dark: '#0B0B0C', light: '#FFFFFF' },
    })
      .then((url) => { if (active) setQrUrl(url) })
      .catch(() => { if (active) setQrUrl(null) })
    return () => { active = false }
  }, [])

  const palette = {
    primary: safeColor(design.primaryColor, '#0b1f44'),
    accent: safeColor(design.accentColor, '#c8a25c'),
    background: safeColor(design.backgroundColor, '#fdfbf7'),
    header: safeColor(design.headerColor, '#0b0b0c'),
    panel: safeColor(design.panelColor, '#f1ede4'),
  }
  const fontFamily = ['Cairo', 'Tahoma', 'Arial', 'Poppins'].includes(design.fontFamily ?? '')
    ? design.fontFamily!
    : 'Cairo'
  const logoUrl = safeLogoUrl(design.logoUrl)
  const order = useMemo(() => {
    const requested = Array.isArray(design.layoutOrder) ? design.layoutOrder : DEFAULT_ORDER
    const valid = requested.filter((id): id is SectionId => DEFAULT_ORDER.includes(id as SectionId))
    return [...new Set(valid), ...DEFAULT_ORDER.filter((id) => !valid.includes(id))]
  }, [design.layoutOrder])
  const fill = (value: string) => value.replaceAll('{event}', eventName)

  const sections: Record<SectionId, ReactNode> = {
    intro: (
      <section className="px-5 py-7 sm:px-9">
        <h2 dir="rtl" className="text-right text-2xl font-bold leading-relaxed" style={{ color: palette.primary }}>{fill(titleAr)}</h2>
        <p dir="ltr" className="mt-1 text-left text-base font-bold" style={{ color: palette.accent }}>{fill(title)}</p>
        <p dir="rtl" className="mt-5 whitespace-pre-wrap text-right text-sm leading-8 text-[#172033]">{fill(bodyAr)}</p>
        <p dir="ltr" className="mt-2 whitespace-pre-wrap text-left text-sm leading-7 text-[#172033]">{fill(body)}</p>
      </section>
    ),
    details: (
      <section className="mx-5 mb-5 rounded-2xl p-4 sm:mx-9 sm:p-5" style={{ backgroundColor: palette.panel }}>
        <h3 dir="rtl" className="text-right text-base font-bold" style={{ color: palette.primary }}>تفاصيل الحجز</h3>
        <p dir="ltr" className="mt-1 text-left text-[10px] font-semibold tracking-widest" style={{ color: palette.primary }}>BOOKING DETAILS</p>
        <div className="mt-3 divide-y divide-black/10">
          {[
            ['الفعالية', 'EVENT', eventName],
            ['نوع التذكرة', 'TICKET', 'General Admission'],
            ['التاريخ والوقت', 'DATE & TIME', 'As scheduled'],
            ['الرقم المرجعي', 'REFERENCE', 'TKT-PREVIEW'],
          ].map(([ar, en, value]) => (
            <div key={en} className="grid grid-cols-[1fr_.8fr_1.2fr] gap-2 py-3 text-[11px] sm:text-xs">
              <span dir="rtl" className="text-right text-[#6d6a64]">{ar}</span>
              <span dir="ltr" className="text-left font-semibold tracking-wide text-[#172033]">{en}</span>
              <span className="break-words text-right font-semibold text-[#172033]">{value}</span>
            </div>
          ))}
        </div>
      </section>
    ),
    qr: (
      <section className="mx-5 mb-5 flex flex-col items-center gap-4 rounded-2xl p-4 sm:mx-9 sm:flex-row sm:gap-5" style={{ backgroundColor: '#faf8f4' }}>
        <div className="flex size-32 shrink-0 items-center justify-center border-4 border-white bg-white p-2 shadow-sm">
          {qrUrl
            ? <img src={qrUrl} alt="Preview-only QR code" className="size-full" data-testid="ticket-email-preview-qr" />
            : <div className="size-full animate-pulse bg-black/5" aria-label="Generating sample QR code" />}
        </div>
        <div className="text-center sm:text-right">
          <p dir="rtl" className="text-sm font-bold leading-7" style={{ color: palette.primary }}>امسح الرمز للتحقق من صلاحية التذكرة</p>
          <p dir="ltr" className="mt-1 text-xs leading-6 text-[#565e6b]">Scan this code to verify your ticket</p>
          <p dir="rtl" className="mt-2 text-[10px] leading-5" style={{ color: palette.accent }}>هذا رمز معاينة فقط وليس صالحاً للدخول</p>
          <p dir="ltr" className="mt-1 text-[10px] leading-5 text-[#8a6a35]">Preview QR only — a unique signed code is added to each issued ticket.</p>
        </div>
      </section>
    ),
    action: (
      <div className="mx-5 mb-6 rounded-full px-5 py-4 text-center text-sm font-bold text-white sm:mx-9" style={{ backgroundColor: palette.accent }}>
        عرض التذكرة&nbsp; / &nbsp;VIEW TICKET
      </div>
    ),
    footer: (
      <section className="mx-5 mb-4 px-1 text-center sm:mx-9">
        <p dir="rtl" className="text-sm font-bold" style={{ color: palette.primary }}>TKT لتنظيم الرحلات والفعاليات والمناسبات</p>
        <p dir="ltr" className="mt-1 text-xs text-[#687080]">{fill(footer)}</p>
      </section>
    ),
    legal: (
      <section className="mx-5 border-t border-[#e8e3d9] px-1 pb-6 pt-4 text-center sm:mx-9">
        <p dir="rtl" className="text-[10px] leading-5 text-[#8b8e96]">تم إرسال هذا البريد لتأكيد تفاصيل حجزك مع TKT.</p>
      </section>
    ),
  }

  const shellStyle: CSSProperties = {
    backgroundColor: palette.background,
    color: palette.primary,
    fontFamily: fontFamily + ', Tahoma, Arial, sans-serif',
  }
  const headerStyle: CSSProperties = { backgroundColor: palette.header }

  return (
    <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-2xl border border-[#e8e3d9] shadow-xl" style={shellStyle} data-testid="ticket-email-preview">
      <div className="flex min-h-20 flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-9" style={headerStyle}>
        {logoUrl
          ? <img src={logoUrl} alt="TKT logo" className="max-h-11 max-w-32 object-contain" />
          : <span dir="ltr" className="font-serif text-4xl tracking-wide" style={{ color: palette.accent }}>TKT</span>}
        <div className="text-right text-white">
          <p dir="rtl" className="text-sm">رحلتك تبدأ معنا</p>
          <p dir="ltr" className="mt-1 text-[10px] tracking-widest">YOUR EXPERIENCE STARTS HERE</p>
        </div>
      </div>
      <div>{order.map((id) => <div key={id}>{sections[id]}</div>)}</div>
    </div>
  )
}
