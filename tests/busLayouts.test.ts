import { describe, expect, it } from 'vitest'
import {
  BUS_TEMPLATES,
  MECT49_SEAT_PLACEMENTS,
  buildTemplateSeats,
  cabinProjection,
  createBusLayout,
  normalizeBusLayout,
  resolveBusLayout,
} from '../src/lib/domain/busLayouts'

describe('canonical bus layouts', () => {
  it('defines exactly 49 MECT seats with unique sequential labels and coordinates', () => {
    expect(MECT49_SEAT_PLACEMENTS).toHaveLength(49)
    expect(MECT49_SEAT_PLACEMENTS.map((seat) => seat.label)).toEqual(
      Array.from({ length: 49 }, (_, index) => String(index + 1)),
    )

    const labels = new Set(MECT49_SEAT_PLACEMENTS.map((seat) => seat.label))
    const coordinates = new Set(MECT49_SEAT_PLACEMENTS.map((seat) => `${seat.x}:${seat.y}`))
    expect(labels.size).toBe(49)
    expect(coordinates.size).toBe(49)
    expect(MECT49_SEAT_PLACEMENTS.every((seat) => seat.kind === 'seat')).toBe(true)
  })

  it('keeps the physical MECT row structure and rear five-seat row', () => {
    const rowCounts = MECT49_SEAT_PLACEMENTS.reduce<Record<number, number>>((counts, seat) => {
      counts[seat.row] = (counts[seat.row] ?? 0) + 1
      return counts
    }, {})

    expect(rowCounts).toEqual({
      1: 4, 2: 4, 3: 4, 4: 4, 5: 4,
      6: 2, 7: 2, 8: 4,
      9: 4, 10: 4, 11: 4, 12: 4, 13: 5,
    })
    expect(MECT49_SEAT_PLACEMENTS.filter((seat) => seat.row === 13).map((seat) => seat.label))
      .toEqual(['45', '46', '47', '48', '49'])
  })

  it('builds the registered MECT template from the canonical geometry', () => {
    const template = BUS_TEMPLATES.find((item) => item.id === 'mect49')
    expect(template?.totalBookableSeats).toBe(49)
    expect(buildTemplateSeats('mect49')).toEqual(
      MECT49_SEAT_PLACEMENTS.map((seat) => ({ ...seat, state: 'AVAILABLE' })),
    )
  })

  it('preserves normalized seat geometry and viewBox from saved layouts', () => {
    const savedLayout = {
      template: 'mect49',
      rows: 13,
      cols: 5,
      aisleAfterCol: 2,
      viewBox: { w: 920, h: 1370 },
      seats: MECT49_SEAT_PLACEMENTS.map((seat) => ({
        label: seat.label,
        row: seat.row,
        col: seat.col,
        x: seat.x,
        y: seat.y,
        kind: seat.kind,
        state: 'AVAILABLE',
      })),
    }

    const normalized = normalizeBusLayout(savedLayout)
    expect(normalized.template).toBe('mect49')
    expect(normalized.viewBox).toEqual({ w: 920, h: 1370 })
    expect(normalized.seats).toHaveLength(49)
    expect(normalized.seats[48]).toMatchObject({ label: '49', row: 13, x: 570, y: 1260, kind: 'seat' })
  })

  it('keeps the coaster and custom-grid templates independently valid', () => {
    expect(buildTemplateSeats('coaster21')).toHaveLength(21)
    expect(buildTemplateSeats('coaster21').map((seat) => seat.label)).toEqual(
      Array.from({ length: 21 }, (_, index) => String(index + 1)),
    )

    const custom = normalizeBusLayout({
      template: 'grid',
      rows: 2,
      cols: 3,
      unavailable: [{ row: 2, col: 2 }],
    })
    expect(custom.seats).toHaveLength(6)
    expect(custom.seats.find((seat) => seat.row === 2 && seat.col === 2)?.state).toBe('UNAVAILABLE')
  })

  it('creates a complete dashboard payload with dual coordinates and cabin features', () => {
    const payload = createBusLayout('mect49')
    expect(payload.schemaVersion).toBe(2)
    expect(payload.modelCode).toBe('TKT VOYAGER 49')
    expect(payload.seats).toHaveLength(49)
    expect(payload.seats.every((seat) => typeof seat.x === 'number' && typeof seat.y === 'number')).toBe(true)
    expect(payload.seats.every((seat) => typeof seat.mx === 'number' && typeof seat.z === 'number')).toBe(true)
    expect(payload.viewBox).toEqual({ w: 920, h: 1370 })
    expect(payload.cabin).toEqual({ width: 2.5, length: 11.9, height: 2.45 })
    expect(payload.features.map((feature) => feature.id)).toEqual(expect.arrayContaining(['front-tv', 'mid-tv', 'wc', 'mid-exit', 'aux-1b', 'aux-2b']))
  })

  it('scales custom grid geometry without losing aisle placement', () => {
    const payload = createBusLayout('grid', { rows: 6, cols: 4, aisleAfterCol: 2 })
    expect(payload.seats).toHaveLength(24)
    expect(payload.viewBox.h).toBeGreaterThan(560)
    expect(payload.cabin.length).toBeGreaterThan(5)
    expect(payload.seats.filter((seat) => seat.row === 1).map((seat) => seat.col)).toEqual([1, 2, 3, 4])
  })

  it('preserves 3D coordinates and features when normalizing a saved layout', () => {
    const saved = createBusLayout('mect49')
    const normalized = normalizeBusLayout(saved)
    expect(normalized.seats[0]).toMatchObject({ mx: -0.78, z: -4.36, width: 0.385, side: 'left', kind: 'seat' })
    expect(normalized.features.find((feature) => feature.id === 'wc')).toMatchObject({ kind: 'wc', x: 566, y: 690 })
    expect(normalized.cabin).toEqual(saved.cabin)
  })

  it('projects saved plan features into the same cabin frame as seats', () => {
    const model = resolveBusLayout(createBusLayout('mect49'))
    const { toMx, toZ } = cabinProjection(model)
    const xs = model.seats.map((seat) => seat.x!)
    const ys = model.seats.map((seat) => seat.y!)
    const mxs = model.seats.map((seat) => seat.mx!)
    const zs = model.seats.map((seat) => seat.z!)

    expect(toMx(Math.min(...xs))).toBeCloseTo(Math.min(...mxs), 5)
    expect(toMx(Math.max(...xs))).toBeCloseTo(Math.max(...mxs), 5)
    expect(toZ(Math.min(...ys))).toBeCloseTo(Math.min(...zs), 5)
    expect(toZ(Math.max(...ys))).toBeCloseTo(Math.max(...zs), 5)
    expect(Math.abs(toMx(390))).toBeLessThanOrEqual(model.cabin.width / 2)
  })
})
