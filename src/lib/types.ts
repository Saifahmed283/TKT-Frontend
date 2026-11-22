// Shared API types — mirror the backend responses.

export type EventStatus = 'DRAFT' | 'PLANNING' | 'READY' | 'PUBLISHED' | 'LIVE' | 'COMPLETED' | 'ARCHIVED'
export type EventType = 'CONFERENCE' | 'CONCERT' | 'WEDDING' | 'SPORTS' | 'EXHIBITION' | 'CHARITY' | 'CORPORATE' | 'UNIVERSITY' | 'OTHER'

export type EventSummary = {
  id: string
  name: string
  description: string | null
  type: EventType
  status: EventStatus
  startAt: string
  endAt: string | null
  timezone: string
  venueName: string | null
  coverImageUrl: string | null
  org: { id: string; name: string }
  _count: { attendees: number; tickets: number; tasks: number; incidents: number }
  settings?: {
    registration?: {
      enabled?: boolean
      open?: boolean
      startAt?: string | null
      endAt?: string | null
    }
  }
}

export type EventDetail = EventSummary & {
  org: { id: string; name: string; slug: string }
  _count: {
    members: number
    teams: number
    areas: number
    attendees: number
    tickets: number
    credentials: number
    tasks: number
    incidents: number
    accessLogs: number
  }
}

export type EventMember = {
  id: string
  status: string
  createdAt: string
  role: { id: string; code: string; name: string; scope: string }
  team: { id: string; name: string } | null
  areas: { area: { id: string; name: string } }[]
  user: { id: string; name: string; email: string }
}

export type RoleInfo = {
  id?: string
  code: string
  name: string
  description?: string | null
  scope: 'PLATFORM' | 'ORGANIZATION' | 'EVENT' | 'TEAM' | 'AREA'
  permissions: string[]
  kind?: 'SYSTEM' | 'ORGANIZATION'
}

export type Team = {
  id: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
  _count: { members: number; tasks: number }
  areas: { area: { id: string; name: string; type: string } }[]
  members: { user: { id: string; name: string }; role: { name: string } }[]
}

export type Area = {
  id: string
  name: string
  description: string | null
  type: string
  accessPolicy: string
  capacity: number | null
  location: unknown
  active: boolean
  createdAt: string
  _count: { assignments: number; teamAssignments: number; accessLogs: number }
  teamAssignments: { team: { id: string; name: string } }[]
}

export type Attendee = {
  id: string
  name: string
  email: string | null
  phone: string | null
  category: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  _count: { tickets: number; credentials: number; accessLogs: number }
}

export type Ticket = {
  id: string
  status: string
  price: string | null
  issuedAt: string
  attendee: { id: string; name: string; email: string | null }
  ticketType: { id: string; name: string }
  credential: { id: string; code: string; status: string } | null
}

export type TicketType = {
  id: string
  name: string
  description: string | null
  price: string | null
  quota: number | null
  active: boolean
  _count: { tickets: number }
}

export type Credential = {
  id: string
  code: string
  type: string
  status: string
  validFrom: string
  validUntil: string | null
  singleUse: boolean
  allowReentry: boolean
  areaIds: string[]
  issuedAt: string
  attendee: { id: string; name: string; email: string | null }
  ticket: { id: string; ticketType: { name: string } } | null
  _count: { accessLogs: number }
}

export type AccessLog = {
  id: string
  result: 'GRANTED' | 'DENIED'
  reason: string
  timestamp: string
  offline: boolean
  area: { id: string; name: string } | null
  operator: { id: string; name: string } | null
  attendee: { id: string; name: string } | null
  credential: { id: string; code: string } | null
}

export type AccessDecision = {
  result: 'GRANTED' | 'DENIED'
  reason: string
  credentialId: string | null
  attendee: { id: string; name: string; category: string | null } | null
  ticketType: string | null
  area: { id: string; name: string } | null
  at: string | null
}

export type Task = {
  id: string
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'
  dueAt: string | null
  checklist: { done: boolean; text: string }[] | null
  evidence: unknown[] | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  team: { id: string; name: string } | null
  assignee: { id: string; name: string } | null
  area: { id: string; name: string } | null
  creator: { id: string; name: string }
}

export type Incident = {
  id: string
  code: string
  type: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: string
  title: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  area: { id: string; name: string } | null
  assignee: { id: string; name: string } | null
  team: { id: string; name: string } | null
  creator: { id: string; name: string }
  _count: { comments: number }
}

export type IncidentDetail = Incident & {
  description: string | null
  resolution: string | null
  evidence: unknown[] | null
  comments: { id: string; body: string; createdAt: string; author: { id: string; name: string } }[]
}

export type Announcement = {
  id: string
  title: string
  body: string
  priority: string
  createdAt: string
  author: { id: string; name: string }
}

export type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
  event: { id: string; name: string } | null
}

export type AuditEntry = {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  previousValue: unknown
  newValue: unknown
  timestamp: string
  result: string
  sourceIp: string | null
  actor: { id: string; name: string; email: string } | null
}

export type Overview = {
  event: EventDetail
  kpis: {
    attendees: number
    checkedIn: number
    checkInRate: number
    granted: number
    denied: number
    accessSuccessRate: number
    activeIncidents: number
    openTasks: number
    activeStaff: number
    todayScans: number
  }
  incidentsByPriority: { priority: string; _count: number }[]
  tasksByStatus: { status: string; _count: number }[]
  areaScans: { areaId: string | null; count: number }[]
  recentAccess: (AccessLog & { area: { name: string } | null; credential: { code: string } | null })[]
  recentIncidents: (Incident & {})[]
  recentTasks: Task[]
  myScope: { teamId: string | null; areaIds: string[]; eventScope: string; isSuperAdmin: boolean }
}

export type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  myRole?: string
  _count: { events: number; members: number }
}

export type OrgMember = {
  id: string
  role: string
  status: string
  createdAt: string
  user: { id: string; name: string; email: string; phone: string | null }
}

export type RoleCatalog = {
  code: string
  name: string
  description: string | null
  scope: string
  permissions: string[]
  kind: 'SYSTEM' | 'ORGANIZATION'
  id?: string
}

// ——— Session / me types (mirror GET /auth/me) ———

export type User = {
  id: string
  name: string
  email: string
  phone: string | null
  platformRole: string | null
  orgMemberships: {
    role: string
    status: string
    org: { id: string; name: string; slug: string }
  }[]
  eventMemberships: {
    id: string
    status: string
    role: { code: string; name: string; scope: string }
    team: { id: string; name: string } | null
    areas: { area: { id: string; name: string; type: string } }[]
    event: {
      id: string
      name: string
      status: string
      type: string
      startAt: string | null
      org: { id: string; name: string }
    }
  }[]
}

export type EventMemberRow = {
  id: string
  status: string
  createdAt: string
  role: { id: string; code: string; name: string; scope: string }
  team: { id: string; name: string } | null
  areas: { area: { id: string; name: string } }[]
  user: { id: string; name: string; email: string }
}

export type OrgMemberRow = {
  id: string
  role: string
  status: string
  createdAt: string
  user: { id: string; name: string; email: string; phone: string | null }
}

export type Paginated<T> = { rows: T[]; total: number; page: number; pageSize: number }