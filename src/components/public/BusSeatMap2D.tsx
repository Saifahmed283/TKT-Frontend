import { memo, useId, useMemo } from 'react'
import type { PublicSeat } from '../../lib/public'
import { resolveBusLayout, type BusFeature } from '../../lib/domain/busLayouts'

export type CoachSeat = PublicSeat & { ticketId?: string | null }

type Props = {
  layout: unknown
  seats: CoachSeat[]
  selectedSeatIds: string[]
  onSeatClick: (seat: CoachSeat) => void
  language?: 'ar' | 'en'
  maxSelectable?: number
  disabled?: boolean
  allowStatusSelection?: boolean
  onSeatContextMenu?: (seat: CoachSeat) => void
  canInteract?: (seat: CoachSeat) => boolean
  className?: string
  compact?: boolean
}

const copy = {
  en: {
    eyebrow: 'TKT · INTERACTIVE SEAT PLAN', title: 'Choose your seat',
    available: 'Available', selected: 'Selected', held: 'On hold', reserved: 'Reserved',
    unavailable: 'Unavailable', front: 'FRONT', rear: 'REAR', aisle: 'AISLE',
    chosen: 'Selected', left: 'Seats free', blocked: 'Not available', max: 'Maximum',
    warning: 'Some seat records do not match this coach plan.',
  },
  ar: {
    eyebrow: 'TKT · مخطط المقاعد التفاعلي', title: 'اختر مقعدك',
    available: 'متاح', selected: 'محدد', held: 'محجوز مؤقتًا', reserved: 'محجوز',
    unavailable: 'غير متاح', front: 'المقدمة', rear: 'المؤخرة', aisle: 'الممر',
    chosen: 'المختارة', left: 'مقاعد متاحة', blocked: 'غير متاحة', max: 'الحد الأقصى',
    warning: 'بعض بيانات المقاعد لا تطابق مخطط هذا الباص.',
  },
} as const

type Copy = { readonly [K in keyof typeof copy.en]: string }

type Palette = { fill: string; back: string; stroke: string; text: string; glow: string }
const PALETTE: Record<string, Palette> = {
  AVAILABLE: { fill: '#faf8f4', back: '#e9e3d6', stroke: '#c8a25c', text: '#17181c', glow: 'none' },
  SELECTED: { fill: '#ffd873', back: '#e9b94a', stroke: '#17181c', text: '#17181c', glow: '#ffb020' },
  HELD: { fill: '#b98a3e', back: '#8c6629', stroke: '#4d3813', text: '#fffaf0', glow: '#d9a441' },
  RESERVED: { fill: '#262326', back: '#151416', stroke: '#dc6a6a', text: '#fff5f5', glow: '#dc4c4c' },
  UNAVAILABLE: { fill: '#d9d5cd', back: '#c5c0b6', stroke: '#8f8a80', text: '#6c6860', glow: 'none' },
}

function statusLabel(state: keyof typeof PALETTE, text: Copy) {
  if (state === 'SELECTED') return text.selected
  if (state === 'AVAILABLE') return text.available
  if (state === 'HELD') return text.held
  if (state === 'RESERVED') return text.reserved
  return text.unavailable
}

function FeatureShape({ feature, text, uid }: { feature: BusFeature; text: Copy; uid: string }) {
  const { x, y, w, h, kind } = feature
  const label = text === copy.ar ? feature.labelAr : feature.label

  if (kind === 'aisle') {
    return (
      <g className="tc-aisle">
        <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={`url(#${uid}-aisle)`} stroke="#d7cfc1" strokeDasharray="6 9" />
        <path d={`M${x + w / 2} ${y + 16} V${y + h - 16}`} stroke="#c3b8a6" strokeDasharray="3 11" strokeWidth="1.5" />
        <text x={x + w / 2} y={y + h / 2} transform={`rotate(-90 ${x + w / 2} ${y + h / 2})`} textAnchor="middle" className="tc-feature-label tc-aisle-label">{text.aisle}</text>
      </g>
    )
  }
  if (kind === 'driver') {
    return (
      <g>
        <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 2} fill="#e8e0d1" stroke="#a79d8d" strokeWidth="2" />
        <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) / 5} fill="none" stroke="#7d7467" strokeWidth="2" />
        <path d={`M${x + 8} ${y + h / 2} H${x + w - 8} M${x + w / 2} ${y + 8} V${y + h - 8}`} stroke="#7d7467" strokeWidth="2" />
        <text x={x + w / 2} y={y + h + 24} textAnchor="middle" className="tc-feature-caption">{label}</text>
      </g>
    )
  }
  if (kind === 'tv') {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={11} fill="#1c1b20" stroke="#c8a25c" strokeWidth="1.6" />
        <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx={6} fill={`url(#${uid}-screen)`} />
        <path d={`M${x + 12} ${y + h - 12} l${w * 0.25} -${h * 0.35} l${w * 0.18} ${h * 0.2} l${w * 0.2} -${h * 0.3} l${w * 0.25} ${h * 0.45}`} fill="none" stroke="#ffe6a8" strokeOpacity=".55" strokeWidth="1.6" />
        <text x={x + w / 2} y={y - 8} textAnchor="middle" className="tc-feature-caption">{label}</text>
      </g>
    )
  }
  if (kind === 'exit') {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={10} fill="#fff4d8" stroke="#d9901f" strokeWidth="2" />
        <path d={`M${x + 12} ${y + h / 2} h${Math.max(10, w - 24)} m-12 -9 l10 9 l-10 9`} stroke="#a46a10" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <text x={x + w / 2} y={y - 8} textAnchor="middle" className="tc-feature-caption tc-exit-caption">{label}</text>
      </g>
    )
  }
  if (kind === 'wc') {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={10} fill="#efe9f6" stroke="#9d86ad" strokeWidth="1.8" />
        <circle cx={x + w - 16} cy={y + h / 2} r="3.5" fill="#7c638c" />
        <path d={`M${x + 12} ${y + 18} h${w - 32} v${h - 30} h-${w - 32} z`} fill="none" stroke="#9d86ad" strokeWidth="1.4" />
        <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" className="tc-feature-text">{label}</text>
      </g>
    )
  }
  if (kind === 'aux') {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={8} fill="#f0ece4" stroke="#a9a094" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" className="tc-feature-text">{label}</text>
      </g>
    )
  }
  if (kind === 'luggage') {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={6} fill="#efece5" stroke="#b9b0a2" strokeWidth="1.2" />
        {[1, 2].map((i) => <path key={i} d={`M${x + (w / 3) * i} ${y + 4} V${y + h - 4}`} stroke="#b9b0a2" strokeWidth="1" />)}
        <text x={x + w / 2} y={y - 6} textAnchor="middle" className="tc-feature-caption">{label}</text>
      </g>
    )
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#efece5" stroke="#b9b0a2" strokeWidth="1.4" />
      <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" className="tc-feature-caption">{label}</text>
    </g>
  )
}

function BusSeatMap2D({
  layout, seats, selectedSeatIds, onSeatClick, language = 'en', maxSelectable = 1,
  disabled = false, allowStatusSelection = false, onSeatContextMenu, canInteract,
  className = '', compact = false,
}: Props) {
  const text = copy[language]
  const uid = useId().replace(/:/g, '')
  const model = useMemo(() => resolveBusLayout(layout), [layout])
  const byLabel = useMemo(() => new Map(seats.map((seat) => [seat.label.trim().toUpperCase(), seat])), [seats])
  const selected = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds])

  const shell = useMemo(() => {
    const xs = model.seats.map((seat) => seat.x ?? 0)
    const minX = Math.max(24, Math.min(...xs, 250) - 34)
    const maxX = Math.min(model.viewBox.w - 24, Math.max(...xs, 650) + 104)
    return { x: minX, w: Math.max(320, maxX - minX), y: 22, h: model.viewBox.h - 44 }
  }, [model])

  const counts = useMemo(() => ({
    available: seats.filter((seat) => seat.state === 'AVAILABLE' && !selected.has(seat.id)).length,
    blocked: seats.filter((seat) => seat.state === 'HELD' || seat.state === 'RESERVED' || seat.state === 'UNAVAILABLE').length,
  }), [seats, selected])
  const missing = model.seats.length > 0 && seats.length > 0 && model.seats.some((placement) => !byLabel.has(placement.label.trim().toUpperCase()))
  const mappedLabels = useMemo(() => new Set(model.seats.map((placement) => placement.label.trim().toUpperCase())), [model])
  const unmappedSeats = useMemo(() => seats.filter((seat) => !mappedLabels.has(seat.label.trim().toUpperCase())), [seats, mappedLabels])

  const activate = (seat: CoachSeat) => {
    if (disabled || canInteract?.(seat) === false) return
    if (!allowStatusSelection && seat.state !== 'AVAILABLE' && !selected.has(seat.id)) return
    if (!selected.has(seat.id) && selectedSeatIds.length >= maxSelectable) return
    onSeatClick(seat)
  }

  return (
    <section className={`tc-map ${className}`} dir={language === 'ar' ? 'rtl' : 'ltr'} aria-label={text.title}>
      {!compact && (
        <>
          <header className="tc-header">
            <div>
              <span className="tc-eyebrow">{text.eyebrow}</span>
              <h3>{model.name}</h3>
              <p>{language === 'ar' ? model.descriptionAr : model.description}</p>
            </div>
            <div className="tc-counter"><strong>{selectedSeatIds.length}</strong><span>{text.chosen}</span></div>
          </header>
          <div className="tc-legend">
            <span><i className="tc-dot available" />{text.available}</span>
            <span><i className="tc-dot selected" />{text.selected}</span>
            <span><i className="tc-dot held" />{text.held}</span>
            <span><i className="tc-dot reserved" />{text.reserved}</span>
            <span><i className="tc-dot unavailable" />{text.unavailable}</span>
            <small>{text.max}: {maxSelectable}</small>
          </div>
        </>
      )}
      <div className="tc-canvas">
        <svg
          viewBox={`0 0 ${model.viewBox.w} ${model.viewBox.h}`}
          className="tc-svg"
          role="group"
          aria-label={`${model.name} — ${model.seats.length} seats`}
          data-testid="coach-seat-map"
        >
          <defs>
            <linearGradient id={`${uid}-shell`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#f6f3ec" /><stop offset="1" stopColor="#e9e3d8" />
            </linearGradient>
            <linearGradient id={`${uid}-aisle`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#efeae0" /><stop offset=".5" stopColor="#f8f5ef" /><stop offset="1" stopColor="#efeae0" />
            </linearGradient>
            <linearGradient id={`${uid}-screen`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d3550" /><stop offset="1" stopColor="#0e1620" />
            </linearGradient>
            <pattern id={`${uid}-floor`} width="28" height="28" patternUnits="userSpaceOnUse">
              <rect width="28" height="28" fill="none" />
              <path d="M28 0H0V28" fill="none" stroke="#8d8578" strokeOpacity=".07" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x={shell.x} y={shell.y} width={shell.w} height={shell.h} rx="46" fill={`url(#${uid}-shell)`} stroke="#8d8578" strokeWidth="3" />
          <rect x={shell.x + 12} y={shell.y + 12} width={shell.w - 24} height={shell.h - 24} rx="36" fill={`url(#${uid}-floor)`} stroke="#d9d2c6" strokeWidth="1.5" />
          <path d={`M${shell.x + 54} ${shell.y + 26} Q${shell.x + shell.w / 2} ${shell.y + 2} ${shell.x + shell.w - 54} ${shell.y + 26}`} fill="none" stroke="#c8a25c" strokeWidth="3" />
          <path d={`M${shell.x + 54} ${shell.y + shell.h - 26} Q${shell.x + shell.w / 2} ${shell.y + shell.h - 2} ${shell.x + shell.w - 54} ${shell.y + shell.h - 26}`} fill="none" stroke="#c8a25c" strokeWidth="2" strokeOpacity=".65" />
          <text x={shell.x + shell.w / 2} y={shell.y + 62} textAnchor="middle" className="tc-direction">{text.front} ↑</text>
          <text x={shell.x + shell.w / 2} y={shell.y + shell.h - 18} textAnchor="middle" className="tc-direction">{text.rear}</text>

          {[shell.x + 22, shell.x + shell.w - 36].map((x) => (
            <g key={x} className="tc-windows">
              {Array.from({ length: Math.max(4, Math.floor((shell.h - 300) / 92)) }, (_, index) => (
                <rect key={index} x={x} y={shell.y + 180 + index * 92} width="14" height="58" rx="7" fill={`url(#${uid}-screen)`} stroke="#b6ad9f" strokeOpacity=".7" />
              ))}
            </g>
          ))}

          {model.features.map((feature) => <FeatureShape key={feature.id} feature={feature} text={text} uid={uid} />)}

          {model.seats.map((placement) => {
            const seat = byLabel.get(placement.label.trim().toUpperCase())
            if (!seat) return null
            const isSelected = selected.has(seat.id)
            const state = isSelected ? 'SELECTED' : seat.state
            const palette = PALETTE[state] ?? PALETTE.UNAVAILABLE
            const interactive = !disabled && canInteract?.(seat) !== false && (allowStatusSelection || seat.state === 'AVAILABLE' || isSelected)
            const x = placement.x ?? 0
            const y = placement.y ?? 0
            const accessible = `${model.name}: ${seat.label} — ${statusLabel(state, text)}`
            return (
              <g
                key={seat.id}
                className="tc-seat"
                data-seat-label={seat.label}
                data-testid="seat-option"
                role="button"
                tabIndex={interactive ? 0 : -1}
                aria-label={accessible}
                aria-disabled={!interactive}
                aria-pressed={isSelected}
                onClick={() => activate(seat)}
                onContextMenu={(event) => { if (onSeatContextMenu) { event.preventDefault(); onSeatContextMenu(seat) } }}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && interactive) {
                    event.preventDefault()
                    activate(seat)
                  }
                }}
              >
                <title>{accessible}</title>
                <rect x={x + 4} y={y + 7} width="56" height="66" rx="13" fill="#17181c" opacity=".14" />
                <path
                  d={`M${x + 8} ${y + 5} Q${x + 8} ${y} ${x + 15} ${y} H${x + 43} Q${x + 50} ${y} ${x + 50} ${y + 7} V${y + 30} Q${x + 50} ${y + 36} ${x + 43} ${y + 36} H${x + 15} Q${x + 8} ${y + 36} ${x + 8} ${y + 30} Z`}
                  fill={palette.back} stroke={palette.stroke} strokeWidth="1.6"
                />
                <path
                  d={`M${x + 5} ${y + 29} Q${x + 5} ${y + 24} ${x + 12} ${y + 24} H${x + 46} Q${x + 53} ${y + 24} ${x + 53} ${y + 31} V${y + 57} Q${x + 53} ${y + 65} ${x + 45} ${y + 65} H${x + 13} Q${x + 5} ${y + 65} ${x + 5} ${y + 57} Z`}
                  className="tc-cushion" fill={palette.fill} stroke={palette.stroke} strokeWidth="1.8"
                />
                <path d={`M${x + 2} ${y + 37} V${y + 53} M${x + 56} ${y + 37} V${y + 53}`} stroke={palette.stroke} strokeWidth="3.2" strokeLinecap="round" />
                <rect x={x + 14} y={y + 37} width="30" height="22" rx="8" fill={state === 'AVAILABLE' || state === 'SELECTED' ? palette.back : palette.stroke} opacity=".92" />
                <text x={x + 29} y={y + 53} textAnchor="middle" className="tc-seat-number" fill={palette.text}>{seat.label}</text>
                {state === 'RESERVED' && <path d={`M${x + 14} ${y + 8} l28 44 M${x + 42} ${y + 8} l-28 44`} stroke="#ffb020" strokeWidth="2.2" strokeLinecap="round" />}
                {state === 'HELD' && <circle cx={x + 47} cy={y + 10} r="5" fill="#ffd873" stroke="#4d3813" strokeWidth="1.4" />}
                {isSelected && <circle cx={x + 47} cy={y + 10} r="6" fill="#17181c" stroke="#ffb020" strokeWidth="2" />}
              </g>
            )
          })}
        </svg>
      </div>
      {unmappedSeats.length > 0 && (
        <div className="space-y-2 border-t border-[#ded8cc] bg-[#f7f3eb] p-3" data-testid="unmapped-seat-fallback">
          <p className="text-[11px] font-semibold text-[#514b42]">
            {language === 'ar' ? 'مقاعد إضافية من سجل الباص' : 'Additional seats from the bus inventory'}
          </p>
          <div className="grid grid-cols-4 gap-2 min-[420px]:grid-cols-5">
            {unmappedSeats.map((seat) => {
              const isSelected = selected.has(seat.id)
              const state = isSelected ? 'SELECTED' : seat.state
              const palette = PALETTE[state] ?? PALETTE.UNAVAILABLE
              const interactive = !disabled && canInteract?.(seat) !== false && (allowStatusSelection || seat.state === 'AVAILABLE' || isSelected)
              return (
                <button
                  key={seat.id}
                  type="button"
                  data-testid="unmapped-seat-option"
                  aria-label={model.name + ': ' + seat.label + ' — ' + statusLabel(state, text)}
                  aria-pressed={isSelected}
                  aria-disabled={!interactive}
                  disabled={!interactive}
                  onClick={() => activate(seat)}
                  className="min-h-11 rounded-lg border px-2 py-2 text-xs font-bold tabular-nums disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ color: palette.text, backgroundColor: palette.fill, borderColor: palette.stroke }}
                >
                  {seat.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {!compact && (
        <footer className="tc-footer">
          <div><strong>{selectedSeatIds.length}</strong><span>{text.chosen}</span></div>
          <div><strong>{counts.available}</strong><span>{text.left}</span></div>
          <div><strong>{counts.blocked}</strong><span>{text.blocked}</span></div>
          {missing && <small>{text.warning}</small>}
        </footer>
      )}
      <style>{`
        .tc-map{width:100%; overflow:hidden; border:1px solid #ded8cc; border-radius:18px; background:#faf8f4; color:#17181c; font-family:inherit}
        .tc-header{display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 22px; background:linear-gradient(120deg,#111317,#24272c); color:#faf8f4; border-bottom:2px solid #c8a25c}
        .tc-eyebrow{font-size:9px; letter-spacing:.22em; font-weight:700; color:#ffd873}
        .tc-header h3{margin:6px 0 0; font-size:22px; font-weight:650; letter-spacing:.01em}
        .tc-header p{margin:5px 0 0; color:#c8c2b7; font-size:11px; line-height:1.5}
        .tc-counter{display:flex; min-width:66px; min-height:66px; flex-direction:column; align-items:center; justify-content:center; border:1px solid #ffd87388; border-radius:50%; color:#ffd873}
        .tc-counter strong{font-size:22px; font-variant-numeric:tabular-nums}
        .tc-counter span{font-size:9px; letter-spacing:.1em}
        .tc-legend{display:flex; align-items:center; gap:13px; flex-wrap:wrap; padding:11px 18px; background:#f2eee6; border-bottom:1px solid #ded8cc; font-size:10px; color:#5d5a53}
        .tc-legend span{display:inline-flex; align-items:center; gap:6px}
        .tc-legend small{margin-inline-start:auto; color:#7c756a}
        .tc-dot{width:11px; height:11px; border:1px solid; border-radius:4px}
        .tc-dot.available{background:#faf8f4; border-color:#c8a25c}.tc-dot.selected{background:#ffd873; border-color:#17181c}.tc-dot.held{background:#b98a3e; border-color:#4d3813}.tc-dot.reserved{background:#262326; border-color:#dc6a6a}.tc-dot.unavailable{background:#d9d5cd; border-color:#8f8a80}
        .tc-canvas{overflow:auto; padding:14px 8px; background:radial-gradient(circle at 50% 0%,#fffdf8 0%,#f3efe7 100%)}
        .tc-svg{display:block; width:min(100%,620px); min-width:430px; height:auto; margin:auto}
        .tc-direction{fill:#6c665c; font-size:13px; font-weight:800; letter-spacing:.28em}
        .tc-feature-caption{fill:#6c665c; font-size:11px; font-weight:800; letter-spacing:.12em}
        .tc-feature-text{fill:#4a443c; font-size:14px; font-weight:800}
        .tc-exit-caption{fill:#a46a10}
        .tc-aisle-label{fill:#9a9285; font-size:11px; letter-spacing:.3em}
        .tc-seat{cursor:pointer; outline:none; transition:filter .16s ease, transform .16s ease}
        .tc-seat[aria-disabled=true]{cursor:not-allowed; filter:saturate(.72)}
        .tc-seat[aria-disabled=false]:hover{filter:drop-shadow(0 4px 6px #17181c33)}
        .tc-seat:focus-visible .tc-cushion{stroke:#17181c; stroke-width:3.4}
        .tc-seat-number{font-size:12px; font-weight:800; font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
        .tc-footer{display:flex; align-items:center; gap:22px; flex-wrap:wrap; padding:12px 20px; background:#fff; border-top:1px solid #ded8cc}
        .tc-footer div{display:flex; flex-direction:column; gap:1px}
        .tc-footer strong{font-size:18px; font-variant-numeric:tabular-nums}
        .tc-footer span,.tc-footer small{font-size:10px; color:#777066}
        @media(max-width:600px){.tc-header{padding:14px}.tc-header h3{font-size:19px}.tc-counter{min-width:56px; min-height:56px}.tc-legend{gap:9px}.tc-svg{min-width:400px}}
        @media(prefers-reduced-motion:reduce){.tc-seat{transition:none}}
      `}</style>
    </section>
  )
}

export default memo(BusSeatMap2D)
