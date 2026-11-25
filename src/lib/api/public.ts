import { useQuery } from '@tanstack/react-query'
import { api, API_BASE } from './api'

export interface TicketDesignSelection {
  templateId: 'signature-split' | 'editorial-wide'
  paletteId: 'obsidian-gold' | 'rose-noir' | 'champagne' | 'custom'
  panelColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
}

export const DEFAULT_TICKET_DESIGN: TicketDesignSelection = {
  templateId: 'signature-split',
  paletteId: 'obsidian-gold',
  panelColor: '#0B0B0C',
  accentColor: '#C8A25C',
  backgroundColor: '#F1EDE4',
  textColor: '#171717',
}

export const TICKET_DESIGN_PALETTES: Array<{
  id: TicketDesignSelection['paletteId']
  label: string
  panelColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
}> = [
  { id: 'obsidian-gold', label: 'Obsidian Gold', panelColor: '#0B0B0C', accentColor: '#C8A25C', backgroundColor: '#F1EDE4', textColor: '#171717' },
  { id: 'rose-noir', label: 'Rose Noir', panelColor: '#350D24', accentColor: '#F22586', backgroundColor: '#FFF2F7', textColor: '#2A1020' },
  { id: 'champagne', label: 'Champagne', panelColor: '#9B7A42', accentColor: '#E7C984', backgroundColor: '#FCF8F0', textColor: '#332918' },
]

export interface PublicTicketType {
  id: string
  name: string
  description?: string | null
  category?: string | null
  tier?: string | null
  price: string
  currency?: string
  quota: number | null
  sold: number
  remaining: number | null
  soldOut: boolean
  salesStartAt?: string | null
  salesEndAt?: string | null
  isPublic?: boolean
  transportIncluded?: boolean
}

export type ReservationAvailability = 'upcoming' | 'open' | 'sold_out' | 'locked' | 'closed'

export interface PublicPaymentProvider {
  id: string
  name: string
  accountName?: string | null
  accountNumber?: string | null
  paymentPhone?: string | null
  paymentLink?: string | null
  instructions?: string | null
  imageUrl?: string | null
}

export interface PublicSeat { id: string; label: string; row: number; col: number; state: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'UNAVAILABLE'; holdExpiresAt?: string | null }
export interface PublicBusLayout { template?: 'grid' | 'mect49' | 'coaster21' | 'custom'; look?: string; rows: number; cols: number; aisleAfterCol?: number; seats?: Array<{ label: string; row: number; col: number; state?: string; kind?: 'seat' | 'driver' | 'door' | 'aux'; x?: number; y?: number }>; viewBox?: { w: number; h: number } }
export interface PublicBus { id: string; name: string; seatPrice?: string; currency?: string; layout: PublicBusLayout; totalSeats: number; availableSeats: number; seats: PublicSeat[] }

export interface PublicEvent {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  startAt: string
  endAt: string | null
  timezone: string
  venueName: string | null
  venueAddress: string | null
  coverImageUrl: string | null
  organization: { id: string; name: string; logoUrl: string | null }
  registration: {
    open: boolean
    window: { start: string | null; end: string | null }
    availability: ReservationAvailability
  }
  ticketTypes: PublicTicketType[]
  paymentProviders?: PublicPaymentProvider[]
  buses?: PublicBus[]
  attendeeCount: number
  ticketCount: number
  scanCount: number
}

export type ReservationApproval = 'APPROVED' | 'PENDING' | 'REJECTED'

export interface ReservationResult {
  attendeeId: string
  ticketId: string
  reservationCode: string
  price: string
  approval: ReservationApproval
  paymentStatus?: 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'
  qr: string | null
  // Secure access token for subsequent status lookups (replaces reservation code for sensitive operations)
  accessToken?: string | null
  seats?: { id: string; label: string; busId: string; passengerName?: string | null; bus?: { name: string } | null }[]
}

export interface ReservationStatus {
  reservationCode: string
  ticketId: string
  attendeeId: string
  approval: ReservationApproval
  paymentStatus?: 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'
  paymentProvider?: { id: string; name: string } | null
  paymentReference?: string | null
  paymentReviewNote?: string | null
  deliveryStatus?: string | null
  ticketStatus: string
  price: string
  ticketName: string
  attendeeName: string
  qr: string | null
  // Secure access token (returned on creation, used for subsequent lookups)
  accessToken?: string | null
  seats?: { id: string; label: string; busId: string; passengerName?: string | null; bus?: { name: string } | null }[]
}

export interface PublicStats {
  eventsTotal: number
  eventsUpcoming: number
  eventsCompleted: number
  attendees: number
  tickets: number
  scans: number
  orgs: number
  reviews: { count: number; average: number }
  topEvents: {
    id: string
    name: string
    type: string
    venueName: string | null
    startAt: string
    attendeeCount: number
    scanCount: number
  }[]
}

export interface PublicReview {
  id: string
  author: string
  role: string | null
  content: string
  rating: number
  eventName: string | null
  createdAt: string
}

export interface LocalizedText {
  en: string
  ar: string
}

export interface AboutContent {
  copy: {
    team: { eyebrow: LocalizedText; titleA: LocalizedText; titleB: LocalizedText; badge: LocalizedText }
    partners: { eyebrow: LocalizedText; titleA: LocalizedText; titleB: LocalizedText }
    reports: { eyebrow: LocalizedText; titleA: LocalizedText; titleB: LocalizedText }
  }
  members: { id: string; name: LocalizedText; role: LocalizedText; bio: LocalizedText }[]
  partners: { id: string; name: LocalizedText }[]
  reports: { id: string; author: LocalizedText; role: LocalizedText; content: LocalizedText; eventName: LocalizedText }[]
  updatedAt: string | null
}

export const ABOUT_CONTENT_QUERY_KEY = ['about-content'] as const

export function useAboutContent() {
  return useQuery({
    queryKey: ABOUT_CONTENT_QUERY_KEY,
    queryFn: () => api.get<AboutContent>('/public/site-content/about'),
    staleTime: 60_000,
  })
}

export interface WheelStatus {
  canSpin: boolean
  spinsUsed: number
  remainingSpins: number
  lastReward: string | null
  lastLabel: string | null
  lastCode: string | null
}

export interface WheelResult {
  index: number
  reward: string
  label: string
  code: string | null
  spinsUsed: number
  remainingSpins: number
}

export function usePublicEvents(scope: 'upcoming' | 'past') {
  return useQuery({
    queryKey: ['public-events', scope],
    queryFn: () => api.get<PublicEvent[]>(`/public/events?scope=${scope}`),
  })
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.get<PublicStats>('/public/stats'),
  })
}

export function usePublicReviews() {
  return useQuery({
    queryKey: ['public-reviews'],
    queryFn: () => api.get<PublicReview[]>('/public/reviews'),
  })
}

export function useWheelStatus() {
  return useQuery({
    queryKey: ['wheel-status'],
    queryFn: () => api.get<WheelStatus>('/public/wheel/status'),
  })
}

export interface ReservationStatusParams {
  code: string
  token?: string
  email?: string
}

const RESERVATION_TOKEN_PREFIX = 'tkt_reservation_token_'

/** Keep the status capability in this browser tab only; never in localStorage. */
export function rememberReservationAccessToken(code: string, token?: string | null) {
  if (!token) return
  try {
    sessionStorage.setItem(`${RESERVATION_TOKEN_PREFIX}${code}`, token)
  } catch {}
}

export function getReservationAccessToken(code: string): string | null {
  try {
    return sessionStorage.getItem(`${RESERVATION_TOKEN_PREFIX}${code}`)
  } catch {
    return null
  }
}

export function fetchReservationStatus(eventId: string, params: ReservationStatusParams) {
  const { code } = params
  const queryParams = new URLSearchParams({ code })
  const token = params.token ?? getReservationAccessToken(code)
  if (token) queryParams.set('token', token)
  if (params.email) queryParams.set('email', params.email)
  return api.get<ReservationStatus>(`/public/events/${eventId}/reservations/status?${queryParams.toString()}`)
}

export async function downloadAppleWalletPass(
  eventId: string,
  code: string,
  credentials: { token?: string | null; email?: string | null },
): Promise<void> {
  const response = await fetch(`${API_BASE}/public/events/${encodeURIComponent(eventId)}/reservations/wallet`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      ...(credentials.token ? { token: credentials.token } : {}),
      ...(credentials.email ? { email: credentials.email } : {}),
    }),
  })

  if (!response.ok) {
    let message = 'Apple Wallet pass is not available right now.'
    let codeValue = 'WALLET_PASS_FAILED'
    try {
      const body = await response.json() as { error?: { code?: string; message?: string } }
      message = body.error?.message ?? message
      codeValue = body.error?.code ?? codeValue
    } catch {}
    throw Object.assign(new Error(message), { code: codeValue })
  }

  const pass = await response.blob()
  const objectUrl = URL.createObjectURL(pass)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `TKT-${code.replace(/[^a-zA-Z0-9-]/g, '')}.pkpass`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
}

export function resendReservationTicket(eventId: string, payload: { email: string; reservationCode?: string }) {
  return api.post<{ ok: boolean; deliveryStatus: string | null }>(`/public/events/${eventId}/reservations/resend`, payload)
}

export function useReservationStatus(
  eventId: string,
  code: string | null,
  options?: { enabled?: boolean; pollMs?: number | false; until?: number; email?: string },
) {
  const pollMs = options?.pollMs === undefined ? 5_000 : options.pollMs
  const token = getReservationAccessToken(code ?? '')
  const email = options?.email
  return useQuery({
    queryKey: ['reservation-status', eventId, code, email ?? null],
    queryFn: () => fetchReservationStatus(eventId, { code: code!, token: token ?? undefined, email }),
    // Code-only lookups are rejected by the API; require a real capability.
    enabled: !!code && Boolean(token || email) && options?.enabled !== false,
    refetchInterval: (query) => {
      const data = query.state.data as ReservationStatus | undefined
      // Stop at a decision or at the hard cap — the status endpoint is
      // rate-limited and there is no value in polling indefinitely.
      if (pollMs === false || (options?.until != null && Date.now() >= options.until)) return false
      if (data?.approval === 'REJECTED') return false
      // Approval can land before the credential is minted; keep polling while
      // the approved reservation still has no QR.
      if (data?.approval === 'APPROVED' && data.qr) return false
      return pollMs
    },
  })
}