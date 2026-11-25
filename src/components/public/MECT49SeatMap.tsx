import { memo, useMemo } from 'react'
import type { PublicSeat } from '../../lib/public'
import { MECT49_SEAT_PLACEMENTS } from '../../lib/domain/busLayouts'

type Placement = { label: string; x: number; y: number }

const placements: Placement[] = MECT49_SEAT_PLACEMENTS.map(({ label, x, y }) => ({ label, x, y }))

type Props = {
  seats: PublicSeat[]
  selectedSeatIds: string[]
  onSeatClick: (seat: PublicSeat) => void
  language?: 'ar' | 'en'
  maxSelectable?: number
  disabled?: boolean
  allowStatusSelection?: boolean
  onSeatContextMenu?: (seat: PublicSeat) => void
  className?: string
}

const labels = {
  ar: { title: 'اختيار مقعدك', subtitle: 'MECT · مخطط 49 مقعدًا', available: 'متاح', selected: 'مختار', held: 'محجوز مؤقتًا', reserved: 'محجوز', unavailable: 'غير متاح', driver: 'السائق', front: 'مقدمة الباص', aisle: 'الممر', tv: 'شاشة', wc: 'دورة مياه', exit: 'مخرج', rear: 'الصف الخلفي · 5 مقاعد', chosen: 'المقاعد المختارة', remaining: 'المقاعد المتاحة' },
  en: { title: 'Choose your seat', subtitle: 'MECT · 49-seat coach layout', available: 'Available', selected: 'Selected', held: 'On hold', reserved: 'Reserved', unavailable: 'Unavailable', driver: 'Driver', front: 'Front', aisle: 'Aisle', tv: 'TV', wc: 'WC', exit: 'Exit', rear: 'Rear row · 5 seats', chosen: 'Selected seats', remaining: 'Seats available' },
} as const

function MECT49SeatMap({ seats, selectedSeatIds, onSeatClick, language = 'ar', maxSelectable = 1, disabled = false, allowStatusSelection = false, onSeatContextMenu, className = '' }: Props) {
  const copy = labels[language]
  const byLabel = useMemo(() => new Map(seats.map((seat) => [seat.label, seat])), [seats])
  const selected = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds])
  const available = seats.filter((seat) => seat.state === 'AVAILABLE' && !selected.has(seat.id)).length
  const held = seats.filter((seat) => seat.state === 'HELD').length
  const reserved = seats.filter((seat) => seat.state === 'RESERVED').length
  const unavailable = seats.filter((seat) => seat.state === 'UNAVAILABLE').length
  const hasFullLayout = placements.length === 49 && seats.length === 49 && placements.every((p) => byLabel.has(p.label))

  const activate = (seat: PublicSeat) => {
    if (disabled || (!allowStatusSelection && seat.state !== 'AVAILABLE' && !selected.has(seat.id))) return
    if (!selected.has(seat.id) && selectedSeatIds.length >= maxSelectable) return
    onSeatClick(seat)
  }

  return (
    <section className={`mect49-map ${className}`} dir={language === 'ar' ? 'rtl' : 'ltr'} aria-label={copy.title}>
      <header className="mect49-header">
        <div><span className="mect49-eyebrow">TKT · EVENTS & EXPERIENCES</span><h3>{copy.title}</h3><p>{copy.subtitle}</p></div>
        <div className="mect49-selected-count"><strong>{selectedSeatIds.length}</strong><span>{copy.selected}</span></div>
      </header>
      <div className="mect49-legend">
        <span><i className="mect49-dot available" />{copy.available}</span>
        <span><i className="mect49-dot selected" />{copy.selected}</span>
        <span><i className="mect49-dot held" />{copy.held}</span>
        <span><i className="mect49-dot reserved" />{copy.reserved}</span>
        <span><i className="mect49-dot unavailable" />{copy.unavailable}</span>
        <small>{language === 'ar' ? 'الحد الأقصى' : 'Maximum'}: {maxSelectable}</small>
      </div>
      <div className="mect49-canvas">
        <svg viewBox="0 0 920 1370" className="mect49-svg" role="group" aria-label={copy.subtitle}>
          <defs>
            <linearGradient id="mect49-shell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#f1eee7" /></linearGradient>
            <linearGradient id="mect49-gold" x1="0" x2="1"><stop offset="0" stopColor="#8c6932" /><stop offset=".5" stopColor="#e8d08b" /><stop offset="1" stopColor="#a77f3d" /></linearGradient>
            <pattern id="mect49-floor" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#6e6a62" strokeOpacity=".06" /></pattern>
          </defs>
          <rect x="255" y="22" width="410" height="1320" rx="44" fill="url(#mect49-shell)" stroke="#6e6a62" strokeWidth="3" />
          <rect x="267" y="34" width="386" height="1296" rx="34" fill="url(#mect49-floor)" stroke="#ddd8ce" />
          <path d="M294 50 Q460 22 626 50" stroke="url(#mect49-gold)" strokeWidth="3" fill="none" />
          <text x="460" y="72" textAnchor="middle" className="mect49-caption">{copy.front}</text>
          <rect x="390" y="90" width="140" height="42" rx="10" className="mect49-fixture" /><text x="460" y="116" textAnchor="middle" className="mect49-fixture-text">{copy.tv}</text>
          <circle cx="325" cy="158" r="19" fill="#e6e1d7" stroke="#9d978a" strokeWidth="2" /><circle cx="325" cy="158" r="7" fill="none" stroke="#9d978a" strokeWidth="2" />
          <text x="325" y="193" textAnchor="middle" className="mect49-caption">{copy.driver}</text>
          <rect x="548" y="137" width="86" height="42" rx="9" className="mect49-fixture" /><text x="591" y="163" textAnchor="middle" className="mect49-fixture-text">{copy.exit}</text>
          <rect x="445" y="225" width="30" height="970" rx="14" className="mect49-aisle" /><text x="460" y="250" textAnchor="middle" className="mect49-aisle-text">{copy.aisle}</text>
          <rect x="482" y="690" width="82" height="60" rx="10" className="mect49-fixture" /><text x="523" y="726" textAnchor="middle" className="mect49-fixture-text">{copy.tv}</text>
          <rect x="566" y="690" width="82" height="60" rx="10" className="mect49-fixture" /><text x="607" y="726" textAnchor="middle" className="mect49-fixture-text">{copy.wc}</text>
          <rect x="482" y="758" width="166" height="48" rx="10" className="mect49-fixture" /><text x="565" y="788" textAnchor="middle" className="mect49-fixture-text">{copy.exit}</text>
          {placements.map((placement) => {
            const seat = byLabel.get(placement.label)
            if (!seat) return null
            const isSelected = selected.has(seat.id)
            const state = isSelected ? 'SELECTED' : seat.state
            const interactive = allowStatusSelection || seat.state === 'AVAILABLE' || isSelected
            const fill = state === 'SELECTED' ? '#e8d08b' : state === 'AVAILABLE' ? '#faf8f4' : state === 'HELD' ? '#6e6a62' : state === 'RESERVED' ? '#1c1b1b' : '#d8d4cc'
            const stroke = state === 'SELECTED' ? '#0b0b0c' : state === 'AVAILABLE' ? '#c8a25c' : state === 'HELD' ? '#1c1b1b' : state === 'RESERVED' ? '#6e6a62' : '#8f8a80'
            const textColor = state === 'HELD' || state === 'RESERVED' ? '#faf8f4' : '#0b0b0c'
            const accessible = `${copy.title}: ${seat.label} — ${state === 'SELECTED' ? copy.selected : state === 'AVAILABLE' ? copy.available : state === 'HELD' ? copy.held : state === 'RESERVED' ? copy.reserved : copy.unavailable}`
            return (
              <g key={seat.id} role="button" tabIndex={interactive && !disabled ? 0 : -1} aria-label={accessible} aria-disabled={!interactive || disabled} aria-pressed={isSelected} data-seat-label={seat.label}
                onClick={() => activate(seat)}
                onContextMenu={(event) => { if (onSeatContextMenu) { event.preventDefault(); onSeatContextMenu(seat) } }}
                onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && interactive && !disabled) { event.preventDefault(); activate(seat) } }}>
                <title>{accessible}</title>
                <rect x={placement.x + 3} y={placement.y + 5} width="58" height="68" rx="13" fill="#0b0b0c" opacity=".12" />
                <path d={`M${placement.x+8} ${placement.y+4} Q${placement.x+8} ${placement.y} ${placement.x+15} ${placement.y} H${placement.x+43} Q${placement.x+50} ${placement.y} ${placement.x+50} ${placement.y+7} V${placement.y+28} Q${placement.x+50} ${placement.y+34} ${placement.x+43} ${placement.y+34} H${placement.x+15} Q${placement.x+8} ${placement.y+34} ${placement.x+8} ${placement.y+28} Z`} fill={stroke} fillOpacity=".25" stroke={stroke} />
                <path className="mect49-seat-cushion" d={`M${placement.x+6} ${placement.y+28} Q${placement.x+6} ${placement.y+24} ${placement.x+12} ${placement.y+24} H${placement.x+46} Q${placement.x+52} ${placement.y+24} ${placement.x+52} ${placement.y+31} V${placement.y+57} Q${placement.x+52} ${placement.y+64} ${placement.x+45} ${placement.y+64} H${placement.x+13} Q${placement.x+6} ${placement.y+64} ${placement.x+6} ${placement.y+57} Z`} fill={fill} stroke={stroke} strokeWidth="1.7" />
                <path d={`M${placement.x+3} ${placement.y+36} V${placement.y+51} M${placement.x+55} ${placement.y+36} V${placement.y+51}`} stroke={stroke} strokeWidth="3" strokeLinecap="round" />
                <text x={placement.x+29} y={placement.y+54} textAnchor="middle" fontSize="12" fontWeight="700" fill={textColor}>{seat.label}</text>
                {state === 'RESERVED' && <path d={`M${placement.x+15} ${placement.y+9} l28 44 M${placement.x+43} ${placement.y+9} l-28 44`} stroke="#c8a25c" strokeWidth="2" />}
                {state === 'HELD' && <circle cx={placement.x+29} cy={placement.y+13} r="3.5" fill="#e8d08b" />}
                {isSelected && <circle cx={placement.x+49} cy={placement.y+8} r="6" fill="#0b0b0c" stroke="#e8d08b" strokeWidth="1.5" />}
              </g>
            )
          })}
          <text x="460" y="1330" textAnchor="middle" className="mect49-caption">{copy.rear}</text>
        </svg>
      </div>
      <footer className="mect49-footer"><div><strong>{selectedSeatIds.length}</strong><span>{copy.chosen}</span></div><div><strong>{available}</strong><span>{copy.remaining}</span></div><div><strong>{held + reserved + unavailable}</strong><span>{copy.unavailable}</span></div>{!hasFullLayout && <small>{language === 'ar' ? 'تأكد من مطابقة بيانات المقاعد لمخطط 49 مقعدًا.' : 'Seat data does not match a complete 49-seat layout.'}</small>}</footer>
      <style>{`
        .mect49-map{width:100%;overflow:hidden;border:1px solid #ded9ce;border-radius:18px;background:#faf8f4;color:#0b0b0c}
        .mect49-header{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px;background:#0b0b0c;color:#faf8f4;border-bottom:2px solid #c8a25c}
        .mect49-eyebrow{font-size:9px;letter-spacing:.2em;font-weight:700;color:#e8d08b}
        .mect49-header h3{margin:5px 0 0;font:400 22px Georgia,serif}
        .mect49-header p{margin:6px 0 0;color:#c8c2b7;font-size:11px}
        .mect49-selected-count{display:flex;min-width:62px;min-height:62px;flex-direction:column;align-items:center;justify-content:center;border:1px solid #c8a25c88;border-radius:50%;color:#e8d08b}
        .mect49-selected-count strong{font-size:21px;font-variant-numeric:tabular-nums}
        .mect49-selected-count span{font-size:9px}
        .mect49-legend{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;background:#f3f0e9;border-bottom:1px solid #ded9ce;font-size:10px;color:#5d5a53}
        .mect49-legend span{display:inline-flex;align-items:center;gap:5px}
        .mect49-legend small{margin-inline-start:auto;color:#6e6a62}
        .mect49-dot{width:11px;height:11px;border:1px solid;border-radius:4px}
        .mect49-dot.available{background:#faf8f4;border-color:#c8a25c}.mect49-dot.selected{background:#e8d08b;border-color:#0b0b0c}.mect49-dot.held{background:#6e6a62;border-color:#1c1b1b}.mect49-dot.reserved{background:#1c1b1b;border-color:#6e6a62}.mect49-dot.unavailable{background:#d8d4cc;border-color:#8f8a80}
        .mect49-canvas{overflow:auto;padding:12px 6px;background:linear-gradient(180deg,#f3f0e9,#faf8f4)}
        .mect49-svg{display:block;width:min(100%,720px);min-width:420px;height:auto;margin:auto}
        .mect49-fixture{fill:#f1eee7;stroke:#c8a25c;stroke-width:1.2}.mect49-fixture-text{fill:#6a5734;font-size:12px;font-weight:700}
        .mect49-caption{fill:#6e6a62;font-size:10px;font-weight:700;letter-spacing:.14em}.mect49-aisle{fill:#e9e4da;stroke:#d4cfc5;stroke-dasharray:5 7}.mect49-aisle-text{fill:#8d877c;font-size:8px;letter-spacing:.12em;font-weight:700}
        .mect49-seat-cushion{transition:stroke-width .12s ease}.mect49-svg g[role=button]{cursor:pointer;outline:none}.mect49-svg g[aria-disabled=true]{cursor:not-allowed;filter:saturate(.82)}.mect49-svg g[aria-disabled=false]:hover{filter:drop-shadow(0 2px 4px #0b0b0c25)}.mect49-svg g:focus-visible .mect49-seat-cushion{stroke:#0b0b0c;stroke-width:3}
        .mect49-footer{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:12px 18px;background:#fff;border-top:1px solid #ded9ce}.mect49-footer div{display:flex;flex-direction:column;gap:1px}.mect49-footer strong{font-size:17px;font-variant-numeric:tabular-nums}.mect49-footer span,.mect49-footer small{font-size:10px;color:#6e6a62}
        @media(max-width:580px){.mect49-header{padding:14px}.mect49-header h3{font-size:19px}.mect49-selected-count{min-width:54px;min-height:54px}.mect49-legend{gap:8px}.mect49-svg{min-width:400px}}
        @media(prefers-reduced-motion:reduce){.mect49-seat-cushion{transition:none}}
      `}</style>
    </section>
  )
}

export default memo(MECT49SeatMap)
