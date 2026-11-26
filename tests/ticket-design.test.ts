import { describe, expect, it } from 'vitest'
import { DEFAULT_TICKET_DESIGN, normalizeTicketDesign, TICKET_DESIGN_PALETTES } from '../src/lib/public'

describe('ticket design payload contract', () => {
  it('keeps the default palette within the backend-supported schema', () => {
    expect(normalizeTicketDesign(DEFAULT_TICKET_DESIGN)).toEqual({
      templateId: 'signature-split',
      paletteId: 'obsidian-gold',
      panelColor: '#0B0B0C',
      accentColor: '#C8A25C',
      backgroundColor: '#F1EDE4',
      textColor: '#171717',
    })
  })

  it('strips palette presentation metadata before sending the reservation payload', () => {
    const palette = TICKET_DESIGN_PALETTES.find((item) => item.id === 'rose-noir')!
    const value = {
      templateId: 'editorial-wide' as const,
      ...palette,
      paletteId: palette.id,
    } as any

    expect(normalizeTicketDesign(value)).toEqual({
      templateId: 'editorial-wide',
      paletteId: 'rose-noir',
      panelColor: '#350D24',
      accentColor: '#F22586',
      backgroundColor: '#FFF2F7',
      textColor: '#2A1020',
    })
    expect(Object.keys(normalizeTicketDesign(value)).sort()).toEqual([
      'accentColor',
      'backgroundColor',
      'paletteId',
      'panelColor',
      'templateId',
      'textColor',
    ])
  })

  it('offers the three supplied TKT color directions', () => {
    expect(TICKET_DESIGN_PALETTES.map((palette) => palette.id)).toEqual([
      'obsidian-gold',
      'rose-noir',
      'champagne',
    ])
  })
})
