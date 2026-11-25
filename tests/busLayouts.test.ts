import { describe, expect, it } from 'vitest'
import {
  BUS_TEMPLATES,
  MECT49_SEAT_PLACEMENTS,
  buildTemplateSeats,
  normalizeBusLayout,
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
})
