import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export type TaxonomyOption = {
  code: string
  label: string
  description: string
}

export type TaxonomyRole = {
  code: string
  name: string
  description: string
  scope: string
}

export type TaxonomySnapshot = {
  eventFormats: TaxonomyOption[]
  eventCategories: TaxonomyOption[]
  eventDomains: TaxonomyOption[]
  ticketTiers: TaxonomyOption[]
  attendeeTypes: TaxonomyOption[]
  roles?: TaxonomyRole[]
}

export const EVENT_FORMAT_CODES = [
  'CONFERENCE', 'CONCERT', 'WEDDING', 'SPORTS', 'EXHIBITION',
  'CHARITY', 'CORPORATE', 'UNIVERSITY', 'OTHER',
] as const
export type EventFormatCode = (typeof EVENT_FORMAT_CODES)[number]

export const EVENT_CATEGORY_CODES = [
  'CONFERENCE', 'EXHIBITION', 'CONCERT', 'FESTIVAL', 'SPORTS',
  'CORPORATE', 'UNIVERSITY', 'COMMUNITY', 'PRIVATE', 'OTHER',
] as const
export type EventCategoryCode = (typeof EVENT_CATEGORY_CODES)[number]

export const EVENT_DOMAIN_CODES = [
  'TECHNOLOGY', 'EDUCATION', 'BUSINESS', 'HEALTHCARE', 'GOVERNMENT',
  'NON_PROFIT', 'ARTS_CULTURE', 'SPORTS', 'ENTERTAINMENT',
  'COMMUNITY', 'PRIVATE', 'OTHER',
] as const
export type EventDomainCode = (typeof EVENT_DOMAIN_CODES)[number]

export const TICKET_TIER_CODES = [
  'STANDARD', 'VIP', 'PREMIUM', 'EARLY_BIRD', 'STUDENT',
  'COMPLIMENTARY', 'STAFF', 'SPEAKER', 'SPONSOR', 'OTHER',
] as const
export type TicketTierCode = (typeof TICKET_TIER_CODES)[number]

export const ATTENDEE_TYPE_CODES = [
  'ATTENDEE', 'VIP', 'SPEAKER', 'SPONSOR', 'EXHIBITOR', 'MEDIA',
  'STAFF', 'ORGANIZER', 'STUDENT', 'GUEST', 'OTHER',
] as const
export type AttendeeTypeCode = (typeof ATTENDEE_TYPE_CODES)[number]

const option = (code: string, label: string, description: string): TaxonomyOption => ({ code, label, description })

/** Local fallback only — the API metadata endpoint is authoritative when reachable. */
export const FALLBACK_TAXONOMY: TaxonomySnapshot = {
  eventFormats: [
    option('CONFERENCE', 'Conference', 'A structured program of talks, panels or workshops.'),
    option('CONCERT', 'Concert / performance', 'Live music, comedy or cinema programming.'),
    option('WEDDING', 'Wedding', 'Private celebration with a ceremonial program.'),
    option('SPORTS', 'Sports', 'Competition, tournament or athletic gathering.'),
    option('EXHIBITION', 'Exhibition / Expo', 'Showcase of exhibits, products, art or fashion.'),
    option('CHARITY', 'Charity', 'Fundraising or community-support event.'),
    option('CORPORATE', 'Corporate', 'Business summit, networking or company event.'),
    option('UNIVERSITY', 'University / academic', 'Academic gathering, thesis defense or research conference.'),
    option('OTHER', 'Other', 'Format not yet classified.'),
  ],
  eventCategories: [
    option('CONFERENCE', 'Conference class', 'Legacy class for conference-style programs.'),
    option('EXHIBITION', 'Exhibition class', 'Legacy class for showcases and exhibitions.'),
    option('CONCERT', 'Concert class', 'Legacy class for music and stage performances.'),
    option('FESTIVAL', 'Festival class', 'Legacy class for multi-program festivals.'),
    option('SPORTS', 'Sports class', 'Legacy class for sport and competition.'),
    option('CORPORATE', 'Corporate class', 'Legacy class for business and corporate events.'),
    option('UNIVERSITY', 'University class', 'Legacy class for academic and university events.'),
    option('COMMUNITY', 'Community class', 'Legacy class for local and social gatherings.'),
    option('PRIVATE', 'Private class', 'Legacy class for closed or invite-only events.'),
    option('OTHER', 'Other class', 'Legacy fallback for unclassified values.'),
  ],
  eventDomains: [
    option('TECHNOLOGY', 'Technology', 'Tech conferences, hackathons and product launches.'),
    option('EDUCATION', 'Education', 'Learning, schools, universities and research.'),
    option('BUSINESS', 'Business', 'Corporate, finance, startup and professional activity.'),
    option('HEALTHCARE', 'Healthcare', 'Medical, clinical and public-health events.'),
    option('GOVERNMENT', 'Government / official', 'Protocol, diplomatic, military and public-sector events.'),
    option('NON_PROFIT', 'Non-profit', 'Charity, fundraising and community-support events.'),
    option('ARTS_CULTURE', 'Arts & culture', 'Museums, exhibitions, fashion and cultural programs.'),
    option('SPORTS', 'Sports', 'Sporting competitions and athletics.'),
    option('ENTERTAINMENT', 'Entertainment', 'Music, concerts, festivals, comedy and cinema.'),
    option('COMMUNITY', 'Community', 'Local gatherings, social events and outdoor activities.'),
    option('PRIVATE', 'Private', 'Closed or invite-only celebrations.'),
    option('OTHER', 'Other', 'Domain not classified yet.'),
  ],
  ticketTiers: [
    option('STANDARD', 'Standard', 'Regular admission.'),
    option('VIP', 'VIP', 'Premium access with dedicated privileges.'),
    option('PREMIUM', 'Premium', 'Upgraded tier below top VIP access.'),
    option('EARLY_BIRD', 'Early bird', 'Discounted advance-purchase tier.'),
    option('STUDENT', 'Student', 'Student-priced admission.'),
    option('COMPLIMENTARY', 'Complimentary', 'Free or invited admission.'),
    option('STAFF', 'Staff', 'Operational staff allocation.'),
    option('SPEAKER', 'Speaker', 'Program participant allocation.'),
    option('SPONSOR', 'Sponsor', 'Sponsor allocation.'),
    option('OTHER', 'Other', 'Tier not classified yet.'),
  ],
  attendeeTypes: [
    option('ATTENDEE', 'Attendee', 'General participant.'),
    option('VIP', 'VIP', 'High-priority guest.'),
    option('SPEAKER', 'Speaker / program participant', 'On-stage or program contributor.'),
    option('SPONSOR', 'Sponsor / partner', 'Commercial partner representative.'),
    option('EXHIBITOR', 'Exhibitor', 'Booth or showcase representative.'),
    option('MEDIA', 'Media', 'Press and credentialed content creators.'),
    option('STAFF', 'Staff', 'Operational or support role.'),
    option('ORGANIZER', 'Organizer', 'Event owner or committee member.'),
    option('STUDENT', 'Student', 'Registered student attendee.'),
    option('GUEST', 'Guest', 'Invited guest or official delegate.'),
    option('OTHER', 'Other', 'Attendee class not yet mapped.'),
  ],
}

export function useTaxonomy() {
  const query = useQuery<TaxonomySnapshot>({
    queryKey: ['taxonomy'],
    queryFn: () => api<TaxonomySnapshot>('/meta/taxonomy').catch(() => FALLBACK_TAXONOMY),
    staleTime: Infinity,
    retry: false,
  })

  // The fallback makes `data` non-optional for consumers, even on first render.
  return { ...query, data: query.data ?? FALLBACK_TAXONOMY }
}
