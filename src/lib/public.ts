import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface PublicTicketType {
  id: string
  name: string
  price: string
  quota: number | null
  sold: number
  remaining: number | null
  soldOut: boolean
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
}

export interface ReservationStatus {
  reservationCode: string
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

export function useReservationStatus(eventId: string, code: string | null) {
  return useQuery({
    queryKey: ['reservation-status', eventId, code],
    queryFn: () => api.get<ReservationStatus>(`/public/events/${eventId}/reservations/status?code=${encodeURIComponent(code!)}`),
    enabled: !!code,
    refetchInterval: 15_000,
  })
}