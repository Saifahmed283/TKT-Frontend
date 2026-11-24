import { describe, expect, it } from 'vitest'
import {
  ATTENDEE_TYPE_CODES,
  EVENT_CATEGORY_CODES,
  EVENT_DOMAIN_CODES,
  EVENT_FORMAT_CODES,
  FALLBACK_TAXONOMY,
  TICKET_TIER_CODES,
} from '../src/lib/taxonomy'

describe('frontend taxonomy fallback', () => {
  it('has one option for every canonical code', () => {
    expect(FALLBACK_TAXONOMY.eventFormats.map((item) => item.code)).toEqual([...EVENT_FORMAT_CODES])
    expect(FALLBACK_TAXONOMY.eventCategories.map((item) => item.code)).toEqual([...EVENT_CATEGORY_CODES])
    expect(FALLBACK_TAXONOMY.eventDomains.map((item) => item.code)).toEqual([...EVENT_DOMAIN_CODES])
    expect(FALLBACK_TAXONOMY.ticketTiers.map((item) => item.code)).toEqual([...TICKET_TIER_CODES])
    expect(FALLBACK_TAXONOMY.attendeeTypes.map((item) => item.code)).toEqual([...ATTENDEE_TYPE_CODES])
  })

  it('keeps event format and legacy event category distinct', () => {
    expect(EVENT_CATEGORY_CODES).toContain('FESTIVAL')
    expect(EVENT_FORMAT_CODES).not.toContain('FESTIVAL')
    expect(EVENT_DOMAIN_CODES).toContain('TECHNOLOGY')
    expect(EVENT_CATEGORY_CODES).not.toContain('TECHNOLOGY')
  })
})
