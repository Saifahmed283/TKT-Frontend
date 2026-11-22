import { z } from 'zod'

export const offlinePayloadSchema = z.object({
  v: z.literal(1),
  credId: z.string(),
  attendeeId: z.string(),
  eventId: z.string(),
  ticketType: z.string(),
  attendeeName: z.string(),
  validFrom: z.number(),
  validUntil: z.number().nullable(),
  singleUse: z.boolean(),
  allowReentry: z.boolean(),
})

export type OfflinePayload = z.infer<typeof offlinePayloadSchema>

export function decodeOfflinePayload(code: string): OfflinePayload | null {
  const parts = code.split('.')
  if (parts.length !== 3 || parts[0] !== 'TKT1') return null
  const data = parts[1]
  if (!data) return null
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    return offlinePayloadSchema.safeParse(parsed).success ? (parsed as OfflinePayload) : null
  } catch {
    return null
  }
}