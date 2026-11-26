/**
 * Canonical bus layout model.
 *
 * Every seat has one authoritative definition: logical `row`/`col` for the API,
 * `x`/`y` for the 2D plan, and `mx`/`z` (metres) for the 3D cabin. The dashboard,
 * the SVG map and the WebGL cabin all consume this file — no template geometry is
 * duplicated inside a renderer.
 */

export type BusTemplateId = 'grid' | 'mect49' | 'coaster21' | 'custom'
export type SeatKind = 'seat' | 'aux' | 'driver'
export type SeatSide = 'left' | 'right' | 'center'

export interface BusSeatDef {
  label: string
  row: number
  col: number
  /** SVG plan coordinates. */
  x?: number
  y?: number
  /** Cabin coordinates in metres, with the vehicle centre at x = 0. */
  mx?: number
  z?: number
  width?: number
  side?: SeatSide
  state?: 'AVAILABLE' | 'UNAVAILABLE'
  kind?: SeatKind
}

export type BusFeatureKind = 'tv' | 'wc' | 'exit' | 'driver' | 'stairs' | 'luggage' | 'aux' | 'aisle'

export interface BusFeature {
  id: string
  kind: BusFeatureKind
  label: string
  labelAr: string
  x: number
  y: number
  w: number
  h: number
}

export interface BusCabin {
  width: number
  length: number
  height: number
}

export interface BusLayoutTemplate {
  id: BusTemplateId
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  modelCode: string
  look: 'signature' | 'coach' | 'coaster' | 'standard'
  rows: number
  cols: number
  aisleAfterCol?: number
  totalBookableSeats: number
  seats: BusSeatDef[]
  viewBox: { w: number; h: number }
  features: BusFeature[]
  cabin: BusCabin
}

export type ResolvedBusLayout = Omit<BusLayoutTemplate, 'aisleAfterCol'> & {
  aisleAfterCol: number
  schemaVersion: number
}

const VIEW = { w: 920, h: 1370 }

const MECH = {
  leftX: [292, 365],
  rightX: [492, 565],
  rearX: [270, 345, 420, 495, 570],
  leftMx: [-0.78, -0.36],
  rightMx: [0.36, 0.78],
  rearMx: [-0.88, -0.44, 0, 0.44, 0.88],
  rowY: [260, 336, 412, 488, 564, 650, 730, 810, 890, 966, 1042, 1118, 1260],
  rowZ: [-4.36, -3.69, -3.02, -2.35, -1.68, -1.01, -0.33, 0.47, 1.15, 1.83, 2.51, 3.19, 4.0],
} as const

/**
 * 49 bookable seats from the operator's MECT plan: 2+2 staggered blocks, a
 * left-only pair at the service zone, and the five-seat rear bench.
 */
export const MECT49_SEAT_PLACEMENTS: Array<BusSeatDef & { x: number; y: number; mx: number; z: number; width: number; side: SeatSide }> = (() => {
  const seats: Array<BusSeatDef & { x: number; y: number; mx: number; z: number; width: number; side: SeatSide }> = []
  let label = 1

  const add = (col: number, x: number, mx: number, row: number, side: SeatSide, width = 0.385) => {
    seats.push({
      label: String(label++), row, col, x, y: MECH.rowY[row - 1], mx, z: MECH.rowZ[row - 1],
      width, side, kind: 'seat',
    })
  }

  for (let row = 1; row <= 5; row += 1) {
    MECH.leftX.forEach((x, index) => add(index + 1, x, MECH.leftMx[index], row, 'left'))
    MECH.rightX.forEach((x, index) => add(index + 3, x, MECH.rightMx[index], row, 'right'))
  }
  for (let row = 6; row <= 7; row += 1) {
    MECH.leftX.forEach((x, index) => add(index + 1, x, MECH.leftMx[index], row, 'left'))
  }
  MECH.leftX.forEach((x, index) => add(index + 1, x, MECH.leftMx[index], 8, 'left'))
  MECH.rightX.forEach((x, index) => add(index + 3, x, MECH.rightMx[index], 8, 'right'))
  for (let row = 9; row <= 12; row += 1) {
    MECH.leftX.forEach((x, index) => add(index + 1, x, MECH.leftMx[index], row, 'left'))
    MECH.rightX.forEach((x, index) => add(index + 3, x, MECH.rightMx[index], row, 'right'))
  }
  MECH.rearX.forEach((x, index) => add(index + 1, x, MECH.rearMx[index], 13, 'center', 0.375))

  return seats
})()

const mectFeatures: BusFeature[] = [
  { id: 'front-tv', kind: 'tv', label: 'TV', labelAr: 'شاشة', x: 390, y: 90, w: 140, h: 42 },
  { id: 'driver', kind: 'driver', label: 'DRIVER', labelAr: 'السائق', x: 294, y: 128, w: 62, h: 62 },
  { id: 'aux-1b', kind: 'aux', label: '1B', labelAr: '1B', x: 274, y: 174, w: 58, h: 38 },
  { id: 'aux-2b', kind: 'aux', label: '2B', labelAr: '2B', x: 586, y: 174, w: 58, h: 38 },
  { id: 'front-exit', kind: 'exit', label: 'EXIT', labelAr: 'مخرج', x: 548, y: 132, w: 86, h: 44 },
  { id: 'aisle', kind: 'aisle', label: 'AISLE', labelAr: 'الممر', x: 445, y: 225, w: 30, h: 970 },
  { id: 'mid-tv', kind: 'tv', label: 'TV', labelAr: 'شاشة', x: 482, y: 690, w: 82, h: 60 },
  { id: 'wc', kind: 'wc', label: 'WC', labelAr: 'دورة مياه', x: 566, y: 690, w: 82, h: 60 },
  { id: 'mid-exit', kind: 'exit', label: 'EXIT', labelAr: 'مخرج', x: 482, y: 758, w: 166, h: 48 },
  { id: 'luggage', kind: 'luggage', label: 'LUGGAGE', labelAr: 'أمتعة', x: 268, y: 58, w: 82, h: 28 },
]

function mect49Seats(): BusSeatDef[] {
  return MECT49_SEAT_PLACEMENTS.map((seat) => ({ ...seat, state: 'AVAILABLE' }))
}

/** 21-seat coaster, using the same dual-coordinate model. */
function coaster21Seats(): BusSeatDef[] {
  const seats: BusSeatDef[] = []
  const xs = [300, 380, 500, 580]
  const mxs = [-0.72, -0.32, 0.32, 0.72]
  const zs = [-3.2, -2.0, -0.8, 0.4, 1.6, 2.8]
  let label = 1
  const rows = [
    { row: 1, cols: [0, 2, 3] },
    { row: 2, cols: [0, 1, 2, 3] },
    { row: 3, cols: [0, 1, 2, 3] },
    { row: 4, cols: [0, 1, 2, 3] },
    { row: 5, cols: [0, 1, 2, 3] },
    { row: 6, cols: [0, 3] },
  ]
  rows.forEach(({ row, cols }) => {
    cols.forEach((c) => seats.push({
      label: String(label++), row, col: c + 1, x: xs[c], y: 240 + (row - 1) * 88,
      mx: mxs[c], z: zs[row - 1], width: 0.43,
      side: c < 2 ? 'left' : 'right', kind: 'seat', state: 'AVAILABLE',
    }))
  })
  return seats
}

function gridSeats(rows: number, cols: number, aisleAfter = 0, unavailable: { row: number; col: number }[] = []): BusSeatDef[] {
  const un = new Set(unavailable.map((s) => `${s.row}:${s.col}`))
  const seats: BusSeatDef[] = []
  const span = 620
  const zPitch = 0.68
  const zStart = -((rows - 1) * zPitch) / 2
  let label = 1
  for (let r = 1; r <= rows; r += 1) {
    for (let c = 1; c <= cols; c += 1) {
      const t = cols === 1 ? 0.5 : (c - 1) / (cols - 1)
      const pastAisle = aisleAfter > 0 && c > aisleAfter
      const x = 110 + t * span + (pastAisle ? 40 : 0)
      const mx = cols === 1 ? 0 : (t - 0.5) * 1.6 + (pastAisle ? 0.08 : -0.05)
      seats.push({
        label: String(label++), row: r, col: c, x, y: 240 + (r - 1) * 86,
        mx, z: zStart + (r - 1) * zPitch, width: Math.min(0.55, 1.75 / Math.max(cols, 2)),
        side: t < 0.5 ? 'left' : t > 0.5 ? 'right' : 'center', kind: 'seat',
        state: un.has(`${r}:${c}`) ? 'UNAVAILABLE' : 'AVAILABLE',
      })
    }
  }
  return seats
}

const genericFeatures: BusFeature[] = [
  { id: 'front-tv', kind: 'tv', label: 'TV', labelAr: 'شاشة', x: 390, y: 78, w: 140, h: 40 },
  { id: 'driver', kind: 'driver', label: 'DRIVER', labelAr: 'السائق', x: 296, y: 118, w: 58, h: 58 },
  { id: 'front-exit', kind: 'exit', label: 'EXIT', labelAr: 'مخرج', x: 550, y: 120, w: 84, h: 40 },
  { id: 'aisle', kind: 'aisle', label: 'AISLE', labelAr: 'الممر', x: 452, y: 205, w: 22, h: 900 },
]

export const BUS_TEMPLATES: BusLayoutTemplate[] = [
  {
    id: 'grid', name: 'Custom grid', nameAr: 'شبكة مخصصة',
    description: 'Configure rows, columns and the aisle for any vehicle.',
    descriptionAr: 'اختر عدد الصفوف والأعمدة ومكان الممر لأي باص.',
    modelCode: 'TKT FLEX', look: 'standard', rows: 10, cols: 4, aisleAfterCol: 2,
    totalBookableSeats: 40, seats: [], viewBox: { w: VIEW.w, h: 1160 },
    features: genericFeatures, cabin: { width: 2.4, length: 8.6, height: 2.3 },
  },
  {
    id: 'mect49', name: 'MECT 49 · Signature coach', nameAr: 'MECT 49 · كوتش التوقيع',
    description: '49-seat coach with service centre, rear five-seat bench and auxiliary 1B/2B positions.',
    descriptionAr: '49 مقعدًا مع منطقة خدمات ومنصة خلفية بخمسة مقاعد ومقاعد مساعدة 1B/2B.',
    modelCode: 'TKT VOYAGER 49', look: 'signature', rows: 13, cols: 5, aisleAfterCol: 2,
    totalBookableSeats: 49, seats: mect49Seats(), viewBox: { ...VIEW },
    features: mectFeatures, cabin: { width: 2.5, length: 11.9, height: 2.45 },
  },
  {
    id: 'coaster21', name: 'Coaster 21', nameAr: 'كوستر 21',
    description: 'Compact 21-seat midibus. Confirm physical numbering with the operator before paid bookings.',
    descriptionAr: 'ميكروباص 21 مقعدًا. تأكد من ترقيم المقاعد الفعلي مع الناقل قبل الحجوزات المدفوعة.',
    modelCode: 'TKT COASTER 21', look: 'coaster', rows: 6, cols: 4, aisleAfterCol: 2,
    totalBookableSeats: 21, seats: coaster21Seats(), viewBox: { w: VIEW.w, h: 840 },
    features: genericFeatures, cabin: { width: 2.2, length: 7.4, height: 2.15 },
  },
]

export function getBusTemplate(id: BusTemplateId | string | undefined | null): BusLayoutTemplate {
  return BUS_TEMPLATES.find((item) => item.id === id) ?? BUS_TEMPLATES[0]
}

export function buildTemplateSeats(
  templateId: BusTemplateId | string,
  opts?: { rows?: number; cols?: number; aisleAfterCol?: number; unavailable?: { row: number; col: number }[] },
): BusSeatDef[] {
  if (templateId === 'mect49') return mect49Seats()
  if (templateId === 'coaster21') return coaster21Seats()
  return gridSeats(opts?.rows ?? 10, opts?.cols ?? 4, opts?.aisleAfterCol ?? 2, opts?.unavailable ?? [])
}

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeFeatures(layout: any, template: BusLayoutTemplate): BusFeature[] {
  if (Array.isArray(layout?.features) && layout.features.length) {
    return layout.features
      .filter((item: any) => item && typeof item.id === 'string' && typeof item.kind === 'string')
      .map((item: any) => ({
        id: String(item.id), kind: String(item.kind) as BusFeatureKind,
        label: String(item.label ?? item.id), labelAr: String(item.labelAr ?? item.label ?? item.id),
        x: asNumber(item.x, 0), y: asNumber(item.y, 0),
        w: asNumber(item.w, 60), h: asNumber(item.h, 44),
      }))
  }
  return template.features
}

/**
 * Resolve a stored bus layout into one renderable model. Saved geometry wins;
 * templates fill the gaps so older buses (grid-only JSON) still render correctly.
 */
export function resolveBusLayout(layout: any): ResolvedBusLayout {
  const templateId = (layout?.template as BusTemplateId) || 'grid'
  const template = getBusTemplate(templateId)
  const rows = Math.max(1, Math.min(80, asNumber(layout?.rows, template.rows)))
  const cols = Math.max(1, Math.min(20, asNumber(layout?.cols, template.cols)))
  const aisleAfterCol = Math.max(0, Math.min(cols, asNumber(layout?.aisleAfterCol, template.aisleAfterCol ?? 0)))
  const rawSeats = Array.isArray(layout?.seats) && layout.seats.length ? layout.seats : null

  const generatedSeats = buildTemplateSeats(templateId, {
    rows,
    cols,
    aisleAfterCol,
    unavailable: Array.isArray(layout?.unavailable) ? layout.unavailable : [],
  })
  const generatedByPosition = new Map(generatedSeats.map((seat) => [String(seat.row) + ':' + String(seat.col), seat]))
  const generatedByLabel = new Map(generatedSeats.map((seat) => [seat.label.trim().toUpperCase(), seat]))

  // Public APIs often send only logical row/column coordinates. Always hydrate
  // missing SVG and 3D coordinates from the canonical template so seats never
  // collapse into the origin in either renderer.
  const seats: BusSeatDef[] = rawSeats
    ? rawSeats.map((seat: any, index: number) => {
        const row = asNumber(seat.row, generatedSeats[index]?.row ?? 1)
        const col = asNumber(seat.col, generatedSeats[index]?.col ?? 1)
        const label = String(seat.label ?? generatedSeats[index]?.label ?? index + 1)
        const fallback = generatedByPosition.get(String(row) + ':' + String(col))
          ?? generatedByLabel.get(label.trim().toUpperCase())
          ?? generatedSeats[index]

        return {
          ...fallback,
          label,
          row,
          col,
          x: seat.x == null ? fallback?.x : asNumber(seat.x, fallback?.x ?? 0),
          y: seat.y == null ? fallback?.y : asNumber(seat.y, fallback?.y ?? 0),
          mx: seat.mx == null ? fallback?.mx : asNumber(seat.mx, fallback?.mx ?? 0),
          z: seat.z == null ? fallback?.z : asNumber(seat.z, fallback?.z ?? 0),
          width: seat.width == null ? fallback?.width : asNumber(seat.width, fallback?.width ?? 0.4),
          side: (seat.side as SeatSide) ?? fallback?.side,
          kind: (seat.kind as SeatKind) ?? fallback?.kind ?? 'seat',
          state: seat.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE',
        }
      })
    : generatedSeats

  const cabinRaw = layout?.cabin
  const cabin: BusCabin = {
    width: asNumber(cabinRaw?.width, template.cabin.width),
    length: asNumber(cabinRaw?.length, template.cabin.length),
    height: asNumber(cabinRaw?.height, template.cabin.height),
  }
  const viewBox = {
    w: asNumber(layout?.viewBox?.w, template.viewBox.w),
    h: asNumber(layout?.viewBox?.h, template.viewBox.h),
  }

  return {
    ...template,
    schemaVersion: asNumber(layout?.schemaVersion, 2),
    name: String(layout?.name ?? (templateId === 'grid' || templateId === 'custom'
      ? String(rows) + ' × ' + String(cols) + ' seating plan'
      : template.name)),
    nameAr: String(layout?.nameAr ?? (templateId === 'grid' || templateId === 'custom'
      ? 'مخطط ' + String(rows) + ' صفوف × ' + String(cols) + ' مقاعد'
      : template.nameAr)),
    description: String(layout?.description ?? (templateId === 'grid' || templateId === 'custom'
      ? String(rows) + ' rows · up to ' + String(cols) + ' seats per row'
      : template.description)),
    descriptionAr: String(layout?.descriptionAr ?? (templateId === 'grid' || templateId === 'custom'
      ? String(rows) + ' صفوف · حتى ' + String(cols) + ' مقاعد في الصف'
      : template.descriptionAr)),
    rows, cols, aisleAfterCol, seats, viewBox, cabin,
    modelCode: String(layout?.modelCode ?? (templateId === 'grid' || templateId === 'custom'
      ? 'STANDARD COACH'
      : template.modelCode)),
    totalBookableSeats: seats.filter((seat) => (seat.kind ?? 'seat') === 'seat').length,
    features: normalizeFeatures(layout, template),
  } as ResolvedBusLayout
}

/** Backwards-compatible normalizer used by existing dashboard code and tests. */
export function normalizeBusLayout(layout: any): {
  template: BusTemplateId
  rows: number
  cols: number
  aisleAfterCol: number
  look: string
  seats: BusSeatDef[]
  viewBox: { w: number; h: number }
  features: BusFeature[]
  cabin: BusCabin
  modelCode: string
} {
  const resolved = resolveBusLayout(layout)
  return {
    template: resolved.id, rows: resolved.rows, cols: resolved.cols,
    aisleAfterCol: resolved.aisleAfterCol, look: resolved.look, seats: resolved.seats,
    viewBox: resolved.viewBox, features: resolved.features, cabin: resolved.cabin,
    modelCode: resolved.modelCode,
  }
}

/**
 * Map a feature's plan coordinates into cabin metres using the seat geometry as
 * the reference frame. Renderers never need template-specific offsets.
 */
export function cabinProjection(model: ResolvedBusLayout) {
  const xs = model.seats.map((seat) => seat.x ?? 0)
  const ys = model.seats.map((seat) => seat.y ?? 0)
  const mxs = model.seats.map((seat) => seat.mx ?? 0)
  const zs = model.seats.map((seat) => seat.z ?? 0)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const minMx = Math.min(...mxs), maxMx = Math.max(...mxs)
  const minZ = Math.min(...zs), maxZ = Math.max(...zs)
  const limitX = model.cabin.width / 2 - 0.06
  const toMx = (x: number) => {
    const value = maxX === minX ? 0 : minMx + ((x - minX) / (maxX - minX)) * (maxMx - minMx)
    return Math.max(-limitX, Math.min(limitX, value))
  }
  const toZ = (y: number) => (maxY === minY ? 0 : minZ + ((y - minY) / (maxY - minY)) * (maxZ - minZ))
  return { toMx, toZ }
}

/** Full layout payload sent by the dashboard when a bus is created or redesigned. */
export function createBusLayout(templateId: BusTemplateId, opts: { rows?: number; cols?: number; aisleAfterCol?: number; name?: string } = {}) {
  const template = getBusTemplate(templateId)
  const rows = Math.max(1, Math.min(80, opts.rows ?? template.rows))
  const cols = Math.max(1, Math.min(20, opts.cols ?? template.cols))
  const aisleAfterCol = Math.max(0, Math.min(cols, opts.aisleAfterCol ?? template.aisleAfterCol ?? 0))
  const seats = templateId === 'grid' ? gridSeats(rows, cols, aisleAfterCol) : template.seats.map((seat) => ({ ...seat, state: 'AVAILABLE' as const }))
  const viewBox = templateId === 'grid'
    ? { w: VIEW.w, h: Math.max(560, 240 + rows * 86 + 120) }
    : template.viewBox

  return {
    schemaVersion: 2,
    template: templateId,
    name: opts.name ?? template.modelCode,
    modelCode: template.modelCode,
    look: template.look,
    rows,
    cols,
    aisleAfterCol,
    seats,
    viewBox,
    features: template.features,
    cabin: templateId === 'grid'
      ? { ...template.cabin, length: Math.max(5, rows * 0.68 + 2.2) }
      : template.cabin,
  }
}
