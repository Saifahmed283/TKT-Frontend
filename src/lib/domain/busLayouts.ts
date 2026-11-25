export type BusTemplateId = 'grid' | 'mect49' | 'coaster21' | 'custom'

export interface BusSeatDef {
  label: string
  row: number
  col: number
  x?: number
  y?: number
  state?: 'AVAILABLE' | 'UNAVAILABLE'
  kind?: 'seat' | 'driver' | 'door' | 'aux'
}

export interface BusLayoutTemplate {
  id: BusTemplateId
  name: string
  nameAr: string
  description: string
  rows: number
  cols: number
  aisleAfterCol?: number
  totalBookableSeats: number
  seats: BusSeatDef[]
  viewBox?: { w: number; h: number }
  look?: 'standard' | 'luxury' | 'coaster' | 'coach'
}

function gridSeats(rows: number, cols: number, _aisleAfterCol = 0, unavailable: { row: number; col: number }[] = []): BusSeatDef[] {
  const un = new Set(unavailable.map(s => `${s.row}:${s.col}`))
  const seats: BusSeatDef[] = []
  let n = 1
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      seats.push({ label: String(n++), row: r, col: c, state: un.has(`${r}:${c}`) ? 'UNAVAILABLE' : 'AVAILABLE', kind: 'seat' })
    }
  }
  return seats
}

/** MECT 49-seat: 49 bookable passenger seats labeled 1-49. 1B/2B auxiliary positions are non-bookable and not exposed. */
function mect49Seats(): BusSeatDef[] {
  const seats: BusSeatDef[] = []
  let n = 1
  // Front: 2 seats (1-2)
  seats.push({ label: String(n++), row: 1, col: 3, kind: 'seat' })
  seats.push({ label: String(n++), row: 1, col: 4, kind: 'seat' })
  // Row 2: 2 seats (3-4)
  seats.push({ label: String(n++), row: 2, col: 3, kind: 'seat' })
  seats.push({ label: String(n++), row: 2, col: 4, kind: 'seat' })
  // Rows 3-12: 4 seats each (5-44)
  for (let r = 3; r <= 12; r++) {
    for (const c of [1, 2, 3, 4]) seats.push({ label: String(n++), row: r, col: c, kind: 'seat' })
  }
  // Back row: 5 seats (45-49)
  for (let c = 1; c <= 5; c++) seats.push({ label: String(n++), row: 13, col: c, kind: 'seat' })
  return seats
}

/** 21-seat Coaster: IDs 1-21 in visual reading order. Confirm physical numbering with operator before paid bookings. */
function coaster21Seats(): BusSeatDef[] {
  const seats: BusSeatDef[] = []
  let n = 1
  // Row 1: 3 seats
  seats.push({ label: String(n++), row: 1, col: 1, kind: 'seat' })
  seats.push({ label: String(n++), row: 1, col: 3, kind: 'seat' })
  seats.push({ label: String(n++), row: 1, col: 4, kind: 'seat' })
  // Rows 2-5: 4 seats each = 16
  for (let r = 2; r <= 5; r++) {
    for (const c of [1, 2, 3, 4]) seats.push({ label: String(n++), row: r, col: c, kind: 'seat' })
  }
  // Back row: 2 seats = total 21
  seats.push({ label: String(n++), row: 6, col: 1, kind: 'seat' })
  seats.push({ label: String(n++), row: 6, col: 4, kind: 'seat' })
  return seats
}

export const BUS_TEMPLATES: BusLayoutTemplate[] = [
  {
    id: 'grid', name: 'Custom grid', nameAr: 'شبكة مخصصة',
    description: 'Configure rows, columns and aisle for any bus.',
    rows: 10, cols: 4, aisleAfterCol: 2, totalBookableSeats: 40, seats: [], look: 'standard',
  },
  {
    id: 'mect49', name: 'MECT 49-seat', nameAr: 'MECT 49 مقعد',
    description: '49-seat coach layout. Seats 1-49; 1B/2B auxiliary positions are non-bookable.',
    rows: 13, cols: 5, aisleAfterCol: 2, totalBookableSeats: 49, seats: mect49Seats(), look: 'coach',
    viewBox: { w: 360, h: 760 },
  },
  {
    id: 'coaster21', name: 'Coaster 21-seat', nameAr: 'كوستر 21 مقعد',
    description: '21-seat coaster layout. IDs 1-21 in visual reading order; confirm physical numbering before paid bookings.',
    rows: 6, cols: 4, aisleAfterCol: 2, totalBookableSeats: 21, seats: coaster21Seats(), look: 'coaster',
    viewBox: { w: 320, h: 520 },
  },
]

export function getBusTemplate(id: BusTemplateId | string | undefined | null): BusLayoutTemplate {
  return BUS_TEMPLATES.find(t => t.id === id) ?? BUS_TEMPLATES[0]
}

export function buildTemplateSeats(templateId: BusTemplateId | string, opts?: { rows?: number; cols?: number; aisleAfterCol?: number; unavailable?: { row: number; col: number }[] }): BusSeatDef[] {
  if (templateId === 'mect49') return mect49Seats()
  if (templateId === 'coaster21') return coaster21Seats()
  return gridSeats(opts?.rows ?? 10, opts?.cols ?? 4, opts?.aisleAfterCol ?? 2, opts?.unavailable ?? [])
}

export function normalizeBusLayout(layout: any): { template: BusTemplateId; rows: number; cols: number; aisleAfterCol: number; look: string; seats: BusSeatDef[] } {
  const template = ((layout?.template as BusTemplateId) || 'grid')
  const tpl = getBusTemplate(template)
  const rows = Number(layout?.rows ?? tpl.rows ?? 10)
  const cols = Number(layout?.cols ?? tpl.cols ?? 4)
  const aisleAfterCol = Number(layout?.aisleAfterCol ?? tpl.aisleAfterCol ?? 0)
  const look = String(layout?.look ?? tpl.look ?? 'standard')
  const rawSeats = Array.isArray(layout?.seats) && layout.seats.length ? layout.seats : null
  const seats: BusSeatDef[] = rawSeats
    ? rawSeats.map((s: any) => ({ label: String(s.label), row: Number(s.row), col: Number(s.col), state: s.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE', kind: s.kind ?? 'seat', x: s.x, y: s.y }))
    : buildTemplateSeats(template, { rows, cols, aisleAfterCol, unavailable: layout?.unavailable ?? [] })
  return { template, rows, cols, aisleAfterCol, look, seats }
}
