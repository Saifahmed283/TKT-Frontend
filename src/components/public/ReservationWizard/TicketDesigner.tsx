import { useState } from 'react'
import { Crown, Flower2, Heart, Sparkles, Star, Zap, type LucideIcon } from 'lucide-react'
import type { PublicEvent, PublicTicketType, TicketDesignSelection } from '../../../lib/public'
import { TICKET_DESIGN_PALETTES } from '../../../lib/public'

const STICKER_ICONS: Record<Exclude<TicketDesignSelection['stickerId'], 'none'>, LucideIcon> = {
  sparkle: Sparkles,
  star: Star,
  flower: Flower2,
  heart: Heart,
  bolt: Zap,
  crown: Crown,
}
const STICKER_OPTIONS: Array<{ id: TicketDesignSelection['stickerId']; label: string; labelAr: string }> = [
  { id: 'none', label: 'No sticker', labelAr: 'بدون ملصق' },
  { id: 'sparkle', label: 'Sparkle', labelAr: 'بريق' },
  { id: 'star', label: 'Star', labelAr: 'نجمة' },
  { id: 'flower', label: 'Bloom', labelAr: 'زهرة' },
  { id: 'heart', label: 'Heart', labelAr: 'قلب' },
  { id: 'bolt', label: 'Energy', labelAr: 'طاقة' },
  { id: 'crown', label: 'Crown', labelAr: 'تاج' },
]

type TicketCardPreviewProps = {
  event: PublicEvent
  ticketType: PublicTicketType
  attendeeName?: string
  seatLabel?: string | null
  design: TicketDesignSelection
  lang: string
  compact?: boolean
  qrUrl?: string | null
}

function dateTimeLabel(event: PublicEvent, lang: string) {
  const date = new Date(event.startAt)
  if (Number.isNaN(date.getTime())) return 'Date to be announced'
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: event.timezone || undefined,
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

function QrPreviewStub() {
  const cells = [
    '111111100101111111',
    '100000101101000001',
    '101110101001011101',
    '101110100101011101',
    '101110101111011101',
    '100000100001000001',
    '111111101010111111',
    '000000001101000000',
    '101101111001101011',
    '011010001110010110',
    '110111101011101101',
    '001001010100010010',
    '111111101100111010',
    '100000100011100101',
    '101110101110011111',
    '101110100010101000',
    '101110101101001110',
    '100000100110110001',
    '111111101011101101',
  ]
  return (
    <div className="shrink-0 rounded-md bg-white p-1.5 shadow-sm" aria-label="QR preview placeholder">
      <div className="grid grid-cols-[repeat(19,2px)] gap-px">
        {cells.join('').split('').map((cell, index) => (
          <span key={index} className={cell === '1' ? 'h-[2px] w-[2px] bg-[#111111]' : 'h-[2px] w-[2px] bg-white'} />
        ))}
      </div>
      <p className="mt-1 text-center text-[5px] font-bold uppercase tracking-[0.12em] text-[#777777]">Preview</p>
    </div>
  )
}

export function TicketCardPreview({
  event,
  ticketType,
  attendeeName,
  seatLabel,
  design,
  lang,
  compact = false,
  qrUrl,
}: TicketCardPreviewProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [flipped, setFlipped] = useState(false)
  const dateLabel = dateTimeLabel(event, lang)
  const isAr = lang === 'ar'
  const StickerIcon = design.stickerId === 'none' ? null : STICKER_ICONS[design.stickerId]
  const panel = design.panelColor
  const accent = design.accentColor
  const surface = design.backgroundColor
  const ink = design.textColor
  const holder = attendeeName?.trim() || (isAr ? 'اسم حامل التذكرة' : 'Ticket holder name')
  const seat = ticketType.transportIncluded
    ? (seatLabel || (isAr ? 'يظهر بعد اختيار المقعد' : 'Added after seat selection'))
    : null
  const dateValue = dateLabel

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: x * 7, y: y * -7 })
  }

  const cardStyle = {
    transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
    backgroundColor: surface,
    color: ink,
    boxShadow: '0 24px 60px -34px rgba(0,0,0,.65), 0 9px 22px -15px rgba(0,0,0,.45)',
  }

  return (
    <div className="relative" style={{ perspective: '1100px' }}>
      <div
        data-testid="ticket-card-preview"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative grid aspect-[1.82/1] w-full overflow-hidden rounded-xl border border-black/10 transition-transform duration-200 ease-out"
        style={cardStyle}
        dir="ltr"
      >
        {design.templateId === 'signature-split' ? (
          <>
            <div className="absolute inset-y-0 left-0 z-10 flex w-[29%] flex-col justify-between p-3 sm:p-5" style={{ backgroundColor: panel }}>
              <div>
                <p className="font-display text-lg font-bold tracking-[.08em] text-white sm:text-2xl">TKT</p>
                <p className="mt-2 text-[6px] font-semibold uppercase tracking-[.18em] sm:text-[9px]" style={{ color: accent }}>EVENT PASS</p>
              </div>
              <div className="h-px w-full" style={{ backgroundColor: accent, opacity: .8 }} />
              <p className="max-w-[100px] text-[5px] font-medium uppercase leading-relaxed tracking-[.14em] text-white/75 sm:text-[8px]">YOUR EXPERIENCE STARTS HERE</p>
            </div>
            <div className="absolute inset-y-0 right-0 flex w-[71%] flex-col justify-between p-3 sm:p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[6px] font-semibold uppercase tracking-[.15em] sm:text-[9px]" style={{ color: accent }}>OFFICIAL EVENT ADMISSION</p>
                  <span className="rounded-full px-2 py-1 text-[5px] font-semibold uppercase tracking-[.12em] sm:text-[8px]" style={{ backgroundColor: panel, color: '#fff' }}>{ticketType.transportIncluded ? 'PROGRAM + BUS' : 'PROGRAM ONLY'}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-[clamp(13px,2.8vw,25px)] font-bold leading-tight sm:mt-3" style={{ color: ink }}>{event.name}</h3>
                <p className="mt-1 text-[7px] font-medium sm:text-[11px]" style={{ color: accent }}>{ticketType.name}</p>
              </div>
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[5px] uppercase tracking-[.13em] opacity-60 sm:text-[8px]">ATTENDEE</p>
                  <p className="mt-1 truncate text-[8px] font-bold sm:text-[12px]">{holder}</p>
                  <p className="mt-2 text-[5px] uppercase tracking-[.13em] opacity-60 sm:text-[8px]">DATE & TIME</p>
                  <p className="mt-1 line-clamp-2 text-[7px] font-semibold sm:text-[10px]">{dateValue}</p>
                </div>
                <div className="min-w-0">
                  {seat && <>
                    <p className="text-[5px] uppercase tracking-[.13em] opacity-60 sm:text-[8px]">SEAT</p>
                    <p className="mt-1 line-clamp-2 text-[7px] font-semibold sm:text-[10px]">{seat}</p>
                  </>}
                  <p className="mt-2 text-[5px] uppercase tracking-[.13em] opacity-60 sm:text-[8px]">LOCATION</p>
                  <p className="mt-1 line-clamp-2 text-[7px] font-semibold sm:text-[10px]">{event.venueName || 'Location pending'}</p>
                </div>
                {qrUrl ? <img src={qrUrl} alt="Issued ticket QR code" className="h-[42px] w-[42px] shrink-0 rounded-sm border border-black/10 bg-white p-1 sm:h-[62px] sm:w-[62px]" /> : <QrPreviewStub />}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-x-0 top-0 flex h-[28%] items-center justify-between px-4 sm:px-6" style={{ backgroundColor: panel }}>
              <span className="font-display text-lg font-bold tracking-[.08em] text-white sm:text-2xl">TKT</span>
              <span className="text-[6px] font-semibold uppercase tracking-[.2em] sm:text-[10px]" style={{ color: accent }}>EVENT PASS · OFFICIAL ADMISSION</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 top-[28%] flex flex-col justify-between p-3 sm:p-5">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <h3 className="line-clamp-2 font-display text-[clamp(13px,2.7vw,24px)] font-bold leading-tight" style={{ color: ink }}>{event.name}</h3>
                  <p className="mt-1 text-[7px] font-semibold sm:text-[11px]" style={{ color: accent }}>{ticketType.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[5px] uppercase tracking-[.12em] opacity-60 sm:text-[8px]">ATTENDEE</p>
                  <p className="mt-1 max-w-[110px] truncate text-[8px] font-bold sm:text-[11px]">{holder}</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-2">
                  <div>
                    <p className="text-[5px] uppercase tracking-[.12em] opacity-60 sm:text-[8px]">DATE & TIME</p>
                    <p className="mt-1 line-clamp-2 text-[7px] font-semibold sm:text-[10px]">{dateValue}</p>
                  </div>
                  <div>
                    <p className="text-[5px] uppercase tracking-[.12em] opacity-60 sm:text-[8px]">LOCATION</p>
                    <p className="mt-1 line-clamp-2 text-[7px] font-semibold sm:text-[10px]">{event.venueName || 'Location pending'}</p>
                  </div>
                  {seat && <div>
                    <p className="text-[5px] uppercase tracking-[.12em] opacity-60 sm:text-[8px]">SEAT</p>
                    <p className="mt-1 line-clamp-2 text-[7px] font-semibold sm:text-[10px]">{seat}</p>
                  </div>}
                </div>
                <QrPreviewStub />
              </div>
            </div>
          </>
        )}
        {StickerIcon && <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border p-1.5" style={{ color: accent, borderColor: accent, backgroundColor: surface }}><StickerIcon size={14} strokeWidth={1.8} /></div>}
        <div className="pointer-events-none absolute inset-0 opacity-[.06]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${ink} 1px, transparent 0)`, backgroundSize: '14px 14px' }} />
        {flipped && (
          <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6" style={{ backgroundColor: panel, color: '#fff' }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold tracking-widest">TKT</span>
              <span className="text-[8px] uppercase tracking-[.18em]" style={{ color: accent }}>TICKET DETAILS</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[8px] sm:text-[11px]">
              <div><p className="opacity-60">EVENT</p><p className="mt-1 font-semibold">{event.name}</p></div>
              <div><p className="opacity-60">TICKET TYPE</p><p className="mt-1 font-semibold">{ticketType.name}</p></div>
              <div><p className="opacity-60">ATTENDEE</p><p className="mt-1 font-semibold">{holder}</p></div>
              <div><p className="opacity-60">LOCATION</p><p className="mt-1 font-semibold">{event.venueName || 'TBA'}</p></div>
            </div>
            <p className="text-[7px] uppercase tracking-[.16em]" style={{ color: accent }}>QR CODE IS GENERATED AFTER A CONFIRMED BOOKING</p>
          </div>
        )}
      </div>
      {!compact && (
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="mt-2 text-[10px] font-semibold uppercase tracking-[.14em] text-ink-3 transition-colors hover:text-signal"
        >
          {flipped ? 'Show front' : 'Turn ticket over'}
        </button>
      )}
    </div>
  )
}

export function TicketDesigner({
  event,
  ticketType,
  attendeeName,
  seatLabel,
  design,
  onChange,
  lang,
  recommendedPaletteId,
}: TicketCardPreviewProps & {
  onChange: (value: TicketDesignSelection) => void
  recommendedPaletteId?: TicketDesignSelection['paletteId']
}) {
  const isAr = lang === 'ar'
  const [showAdvancedColors, setShowAdvancedColors] = useState(false)
  return (
    <section className="space-y-4 border border-line-soft bg-elevated/20 p-3 sm:p-4" data-testid="ticket-designer">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-signal">{isAr ? 'صمّم تذكرتك' : 'MAKE IT YOURS'}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink-0">{isAr ? 'اختر شكل التذكرة' : 'Choose your ticket design'}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">{isAr ? 'المعاينة تتحدث مباشرة، ونفس التصميم سيظهر في تذكرتك بعد الاعتماد.' : 'Live preview. This design is saved with your booking and used on your approved ticket.'}</p>
        </div>
        <span className="border border-signal/25 bg-signal/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-signal">LIVE PREVIEW</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {([
          { id: 'signature-split', label: isAr ? 'التوقيع المقسوم' : 'Signature Split' },
          { id: 'editorial-wide', label: isAr ? 'التصميم التحريري' : 'Editorial Wide' },
        ] as const).map((template) => (
          <button
            key={template.id}
            type="button"
            data-testid={`ticket-template-${template.id}`}
            aria-pressed={design.templateId === template.id}
            onClick={() => onChange({ ...design, templateId: template.id })}
            className={`border px-3 py-2 text-[11px] font-medium transition-colors ${design.templateId === template.id ? 'border-signal/60 bg-signal/10 text-signal' : 'border-line-soft bg-paper text-ink-2 hover:border-signal/30'}`}
          >
            {template.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TICKET_DESIGN_PALETTES.map((palette) => (
          <button
            key={palette.id}
            type="button"
            data-testid={`ticket-palette-${palette.id}`}
            aria-pressed={design.paletteId === palette.id}
            onClick={() => onChange({
              ...design,
              paletteId: palette.id,
              panelColor: palette.panelColor,
              accentColor: palette.accentColor,
              backgroundColor: palette.backgroundColor,
              textColor: palette.textColor,
            })}
            className={`group border p-2 text-start transition-colors ${design.paletteId === palette.id ? 'border-signal/60 bg-signal/5' : 'border-line-soft bg-paper hover:border-signal/30'}`}
          >
            <span className="mb-2 flex h-8 overflow-hidden rounded-sm">
              <span className="w-1/3" style={{ backgroundColor: palette.panelColor }} />
              <span className="flex-1" style={{ backgroundColor: palette.backgroundColor }}>
                <span className="mt-2 block h-1 w-1/2" style={{ backgroundColor: palette.accentColor }} />
              </span>
            </span>
            <span className="block truncate text-[10px] font-semibold text-ink-2">{palette.label}</span>
            {recommendedPaletteId === palette.id && <span className="mt-1 block text-[9px] font-semibold uppercase tracking-wider text-signal">{isAr ? 'مقترح لك' : 'Suggested'}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-ink-2">{isAr ? 'ملصق اختياري' : 'Optional sticker'}</p>
          <span className="text-[9px] text-ink-3">{isAr ? 'يمكنك إزالته' : 'Can be removed'}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {STICKER_OPTIONS.map((sticker) => {
            const Sticker = sticker.id === 'none' ? null : STICKER_ICONS[sticker.id]
            return (
              <button
                key={sticker.id}
                type="button"
                data-testid={`ticket-sticker-${sticker.id}`}
                aria-pressed={design.stickerId === sticker.id}
                onClick={() => onChange({ ...design, stickerId: sticker.id })}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 border px-2 py-2 transition-colors ${design.stickerId === sticker.id ? 'border-signal/60 bg-signal/10 text-signal' : 'border-line-soft bg-paper text-ink-2 hover:border-signal/30'}`}
              >
                {Sticker ? <Sticker size={16} /> : <span className="text-[14px]">—</span>}
                <span className="text-[10px] font-medium">{isAr ? sticker.labelAr : sticker.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <details
        className="border border-line-soft bg-paper/40"
        open={showAdvancedColors}
        onToggle={(event) => setShowAdvancedColors(event.currentTarget.open)}
      >
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold text-ink-2">
          <span>{isAr ? 'ألوان متقدمة' : 'Advanced colours'}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">{isAr ? 'اختياري' : 'Optional'}</span>
        </summary>
        <div className="grid grid-cols-2 gap-2 border-t border-line-soft p-2 sm:grid-cols-4">
          {([
            ['panelColor', isAr ? 'اللوحة' : 'Panel'],
            ['accentColor', isAr ? 'اللون المميز' : 'Accent'],
            ['backgroundColor', isAr ? 'الخلفية' : 'Surface'],
            ['textColor', isAr ? 'النص' : 'Text'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex min-w-0 items-center gap-2 border border-line-soft bg-paper px-2 py-2">
              <input
                type="color"
                data-testid={`ticket-color-${key}`}
                aria-label={label}
                value={design[key]}
                onChange={(e) => onChange({ ...design, paletteId: 'custom', [key]: e.target.value.toUpperCase() })}
                className="h-7 w-8 shrink-0 cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="min-w-0">
                <span className="block text-[10px] text-ink-3">{label}</span>
                <span className="block truncate font-mono text-[9px] text-ink-2">{design[key]}</span>
              </span>
            </label>
          ))}
        </div>
      </details>

      <div className="border border-line-soft bg-paper/70 p-2 sm:p-3">
        <TicketCardPreview
          event={event}
          ticketType={ticketType}
          attendeeName={attendeeName}
          seatLabel={seatLabel}
          design={design}
          lang={lang}
          compact
        />
      </div>
      <p className="text-[10px] leading-relaxed text-ink-3">
        {isAr
          ? 'ملاحظة: رمز QR النهائي يُصدر بعد اعتماد الحجز، وتظل بيانات الحدث والمقعد مرتبطة بالسجل الرسمي.'
          : 'The scannable QR is issued after the booking is approved. Event and seat details remain linked to the official booking record.'}
      </p>
    </section>
  )
}
