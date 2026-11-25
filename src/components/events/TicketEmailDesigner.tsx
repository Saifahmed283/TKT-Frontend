import { useMemo, useState, type DragEvent } from 'react'
import { GripVertical, ArrowUp, ArrowDown, Palette, Type, Image as ImageIcon, QrCode, Ticket } from 'lucide-react'

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
const SECTIONS: { id: SectionId; title: string; detail: string }[] = [
  { id: 'intro', title: 'Introduction', detail: 'Bilingual title and message' },
  { id: 'details', title: 'Booking details', detail: 'Event, ticket, date, venue and reservation' },
  { id: 'qr', title: 'QR ticket', detail: 'Unique QR generated for each issued credential' },
  { id: 'action', title: 'Ticket action', detail: 'Secure ticket link' },
  { id: 'footer', title: 'Brand footer', detail: 'Brand line and custom footer text' },
  { id: 'legal', title: 'Email note', detail: 'Delivery confirmation note' },
]

const DEFAULTS: Required<Omit<TicketEmailDesign, 'layoutOrder' | 'logoUrl'>> & Pick<TicketEmailDesign, 'logoUrl'> = {
  primaryColor: '#0b1f44',
  accentColor: '#c8a25c',
  backgroundColor: '#fdfbf7',
  headerColor: '#0b0b0c',
  panelColor: '#f1ede4',
  fontFamily: 'Cairo',
  logoUrl: '',
}

function safeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value! : fallback
}

export function TicketEmailDesigner({
  value,
  onChange,
}: {
  value: TicketEmailDesign
  onChange: (value: TicketEmailDesign) => void
}) {
  const [dragging, setDragging] = useState<SectionId | null>(null)
  const design = { ...DEFAULTS, ...value }
  const layoutOrder = useMemo(() => {
    const given = Array.isArray(value.layoutOrder) ? value.layoutOrder : DEFAULT_ORDER
    const valid = given.filter((id): id is SectionId => DEFAULT_ORDER.includes(id as SectionId))
    return [...new Set(valid), ...DEFAULT_ORDER.filter((id) => !valid.includes(id))]
  }, [value.layoutOrder])
  const patch = (next: Partial<TicketEmailDesign>) => onChange({ ...value, ...next, layoutOrder })

  const move = (target: SectionId) => {
    if (!dragging || dragging === target) return
    const reordered = [...layoutOrder]
    const from = reordered.indexOf(dragging)
    const to = reordered.indexOf(target)
    if (from < 0 || to < 0) return
    reordered.splice(from, 1)
    reordered.splice(to, 0, dragging)
    onChange({ ...value, layoutOrder: reordered })
    setDragging(null)
  }

  const drop = (event: DragEvent<HTMLDivElement>, target: SectionId) => {
    event.preventDefault()
    move(target)
  }

  const sectionContent = (id: SectionId) => {
    switch (id) {
      case 'intro':
        return <div className="space-y-1 text-center"><p dir="rtl" className="text-lg font-bold">تم تأكيد حجزك بنجاح</p><p className="text-sm font-semibold">Your ticket is ready</p><p dir="rtl" className="text-xs leading-6 opacity-70">شكراً لحجزك معنا. ستجد أدناه تفاصيل الحجز ورمز التذكرة.</p></div>
      case 'details':
        return <div className="rounded-xl p-3 text-sm" style={{ background: design.panelColor }}><div className="mb-2 text-xs font-bold">تفاصيل الحجز · BOOKING DETAILS</div><div className="flex justify-between border-b border-black/10 py-2"><span>الفعالية</span><b>TKT Signature Event</b></div><div className="flex justify-between py-2"><span>نوع التذكرة</span><b>General Admission</b></div></div>
      case 'qr':
        return <div className="flex items-center justify-center gap-3 rounded-xl p-4" style={{ background: design.panelColor }}><div className="grid size-16 place-items-center border-4 border-white bg-white text-black"><QrCode size={42}/></div><div className="text-start"><b className="block text-sm">رمز QR الخاص بك</b><span className="text-xs opacity-70">Unique code per ticket</span></div></div>
      case 'action':
        return <div className="rounded-full px-4 py-3 text-center text-sm font-bold text-white" style={{ background: design.accentColor }}>عرض التذكرة / VIEW TICKET</div>
      case 'footer':
        return <div className="border-t border-black/10 pt-3 text-center text-xs"><b className="block">TKT · YOUR EXPERIENCE STARTS HERE</b><span className="opacity-60">Your Partner in Travel & Events</span></div>
      case 'legal':
        return <p className="text-center text-[10px] opacity-50">تم إرسال هذا البريد لتأكيد تفاصيل حجزك مع TKT.</p>
    }
    return null
  }

  return (
    <section className="space-y-4 rounded-xl border border-line-soft bg-elevated/20 p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-signal/10 text-signal"><Ticket size={18}/></div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink">Visual Ticket & Email Designer</h4>
          <p className="mt-1 text-xs leading-5 text-ink-3">Adjust the visual identity and drag sections to change the order used by the outgoing ticket email.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-3"><Palette size={14}/> Brand colors</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              ['primaryColor', 'Primary'],
              ['accentColor', 'Accent'],
              ['backgroundColor', 'Background'],
              ['headerColor', 'Header'],
              ['panelColor', 'Details panel'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex min-w-0 items-center gap-2 rounded-lg border border-line-soft bg-panel/60 p-2">
                <input
                  aria-label={label + ' color'}
                  type="color"
                  value={safeColor(design[key], DEFAULTS[key])}
                  onChange={(event) => patch({ [key]: event.target.value } as Partial<TicketEmailDesign>)}
                  className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="min-w-0"><span className="block text-xs text-ink">{label}</span><span className="block font-mono text-[10px] text-ink-3">{design[key]}</span></span>
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-ink-2"><ImageIcon size={13}/> Logo image URL</span>
              <input className="input w-full" type="url" placeholder="https://..." value={design.logoUrl ?? ''} onChange={(event) => patch({ logoUrl: event.target.value })}/>
            </label>
            <label className="block space-y-1">
              <span className="flex items-center gap-2 text-xs font-medium text-ink-2"><Type size={13}/> Email font</span>
              <select className="input w-full" value={design.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value as TicketEmailDesign['fontFamily'] })}>
                <option value="Cairo">Cairo</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Arial">Arial</option>
                <option value="Poppins">Poppins</option>
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">Email sections · drag to reorder</div>
            <div className="space-y-2">
              {layoutOrder.map((id, index) => {
                const section = SECTIONS.find((item) => item.id === id)!
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={(event) => { setDragging(id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id) }}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => drop(event, id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${dragging === id ? 'border-signal bg-signal/10 opacity-60' : 'border-line-soft bg-panel/60'}`}
                  >
                    <GripVertical size={16} className="shrink-0 text-ink-3"/>
                    <div className="min-w-0 flex-1"><div className="text-xs font-semibold text-ink">{section.title}</div><div className="mt-0.5 text-[10px] text-ink-3">{section.detail}</div></div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" aria-label={`Move ${section.title} up`} disabled={index===0} onClick={() => {const reordered=[...layoutOrder];reordered.splice(index,1);reordered.splice(index-1,0,id);onChange({...value,layoutOrder:reordered})}} className="rounded p-1 text-ink-3 hover:bg-elevated disabled:opacity-30"><ArrowUp size={14}/></button>
                      <button type="button" aria-label={`Move ${section.title} down`} disabled={index===layoutOrder.length-1} onClick={() => {const reordered=[...layoutOrder];reordered.splice(index,1);reordered.splice(index+1,0,id);onChange({...value,layoutOrder:reordered})}} className="rounded p-1 text-ink-3 hover:bg-elevated disabled:opacity-30"><ArrowDown size={14}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">Live layout preview</div>
          <div className="overflow-hidden rounded-2xl border border-line-soft shadow-lg" style={{ background: design.backgroundColor, color: design.primaryColor, fontFamily: design.fontFamily }}>
            <div className="flex min-h-20 items-center justify-between gap-3 p-5" style={{ background: design.headerColor }}>
              {design.logoUrl ? <img src={design.logoUrl} alt="TKT logo preview" className="max-h-11 max-w-32 object-contain"/> : <span className="text-3xl font-semibold tracking-wider" style={{ color: design.accentColor }}>TKT</span>}
              <div className="text-right text-white"><div dir="rtl" className="text-xs">رحلتك تبدأ معنا</div><div className="mt-1 text-[9px] tracking-widest">YOUR EXPERIENCE STARTS HERE</div></div>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              {layoutOrder.map((id) => <div key={id}>{sectionContent(id)}</div>)}
            </div>
          </div>
          <p className="text-[10px] leading-5 text-ink-3">The sample QR is illustrative. A unique signed QR PNG and real booking details are inserted when the reservation credential is issued.</p>
        </div>
      </div>
    </section>
  )
}
