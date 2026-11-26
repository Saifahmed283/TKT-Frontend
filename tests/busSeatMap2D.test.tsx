/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BusSeatMap2D from '../src/components/public/BusSeatMap2D'
import { BUS_TEMPLATES, createBusLayout } from '../src/lib/domain/busLayouts'

function seatsFor(layout: ReturnType<typeof createBusLayout>, state: 'AVAILABLE' | 'UNAVAILABLE' = 'AVAILABLE') {
  return layout.seats.map((seat) => ({
    id: `seat-${seat.label}`,
    label: seat.label,
    row: seat.row,
    col: seat.col,
    state,
  }))
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('BusSeatMap2D', () => {
  it('renders every canonical seat from the saved layout with a stable test id', () => {
    const layout = createBusLayout('mect49')
    render(
      <BusSeatMap2D
        layout={layout}
        seats={seatsFor(layout)}
        selectedSeatIds={[]}
        onSeatClick={vi.fn()}
      />,
    )

    expect(screen.getAllByTestId('seat-option')).toHaveLength(49)
    expect(screen.getByText('TKT VOYAGER 49')).toBeTruthy()
    expect(screen.getByText('WC')).toBeTruthy()
    expect(screen.getByText('1B')).toBeTruthy()
  })

  it('renders coaster and custom grid layouts from the same component', () => {
    const coaster = createBusLayout('coaster21')
    const grid = createBusLayout('grid', { rows: 2, cols: 3, aisleAfterCol: 2 })

    const { unmount } = render(
      <BusSeatMap2D layout={coaster} seats={seatsFor(coaster)} selectedSeatIds={[]} onSeatClick={vi.fn()} />,
    )
    expect(screen.getAllByTestId('seat-option')).toHaveLength(21)
    unmount()

    render(
      <BusSeatMap2D layout={grid} seats={seatsFor(grid)} selectedSeatIds={[]} onSeatClick={vi.fn()} />,
    )
    expect(screen.getAllByTestId('seat-option')).toHaveLength(6)
  })

  it('activates an available seat with mouse and keyboard', () => {
    const layout = createBusLayout('mect49')
    const onSeatClick = vi.fn()
    render(
      <BusSeatMap2D layout={layout} seats={seatsFor(layout)} selectedSeatIds={[]} onSeatClick={onSeatClick} />,
    )

    const seat = screen.getByLabelText('TKT VOYAGER 49: 1 — Available')
    fireEvent.click(seat)
    fireEvent.keyDown(seat, { key: 'Enter' })
    expect(onSeatClick).toHaveBeenCalledTimes(2)
  })

  it('refuses blocked seats unless status selection is enabled', () => {
    const layout = createBusLayout('grid', { rows: 1, cols: 1 })
    const onSeatClick = vi.fn()
    const { rerender } = render(
      <BusSeatMap2D layout={layout} seats={seatsFor(layout, 'UNAVAILABLE')} selectedSeatIds={[]} onSeatClick={onSeatClick} />,
    )

    const seat = screen.getByLabelText('TKT FLEX: 1 — Unavailable')
    expect(seat.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(seat)
    expect(onSeatClick).not.toHaveBeenCalled()

    rerender(
      <BusSeatMap2D
        layout={layout}
        seats={seatsFor(layout, 'UNAVAILABLE')}
        selectedSeatIds={[]}
        onSeatClick={onSeatClick}
        allowStatusSelection
        maxSelectable={4}
      />,
    )
    fireEvent.click(screen.getByLabelText('TKT FLEX: 1 — Unavailable'))
    expect(onSeatClick).toHaveBeenCalledTimes(1)
  })

  it('uses the canonical template registry as the single geometry source', () => {
    const mect = BUS_TEMPLATES.find((template) => template.id === 'mect49')
    expect(mect?.modelCode).toBe('TKT VOYAGER 49')
    expect(mect?.seats).toHaveLength(49)
    expect(mect?.features.some((feature) => feature.id === 'wc')).toBe(true)
  })
})
