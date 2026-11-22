import { describe, expect, it } from 'vitest'
import { decodeOfflinePayload, offlinePayloadSchema } from '../src/lib/offline-payload'

function makeCode(payload: object) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `TKT1.${data}.ZmFrZVNpZ25hdHVyZQ`
}

const validPayload = {
  v: 1,
  credId: 'cred_123',
  attendeeId: 'att_456',
  eventId: 'evt_789',
  ticketType: 'VIP',
  attendeeName: 'Ahmed Hassan',
  validFrom: 1755000000000,
  validUntil: null,
  singleUse: false,
  allowReentry: true,
}

describe('decodeOfflinePayload', () => {
  it('decodes a well-formed TKT1 code', () => {
    const decoded = decodeOfflinePayload(makeCode(validPayload))
    expect(decoded).toEqual(validPayload)
  })

  it('rejects codes without the TKT1 prefix', () => {
    expect(decodeOfflinePayload('X1.' + makeCode(validPayload).split('.').slice(1).join('.'))).toBeNull()
  })

  it('rejects codes with the wrong number of segments', () => {
    expect(decodeOfflinePayload('TKT1.only-two-parts')).toBeNull()
    expect(decodeOfflinePayload('TKT1.a.b.c')).toBeNull()
  })

  it('rejects invalid base64url payloads', () => {
    expect(decodeOfflinePayload('TKT1.!!!.sig')).toBeNull()
  })

  it('rejects payloads missing required fields', () => {
    const { attendeeId: _omit, ...partial } = validPayload
    expect(decodeOfflinePayload(makeCode(partial))).toBeNull()
  })

  it('rejects wrong schema version', () => {
    expect(decodeOfflinePayload(makeCode({ ...validPayload, v: 2 }))).toBeNull()
  })

  it('schema round-trips', () => {
    expect(offlinePayloadSchema.safeParse(validPayload).success).toBe(true)
  })
})