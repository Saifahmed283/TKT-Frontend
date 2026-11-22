import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { usePermissions } from '@/lib/auth'

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { eventId } = useParams()
  const { has } = usePermissions()
  if (has(permission, eventId)) return <>{children}</>
  return <Navigate to={eventId ? `/app/events/${eventId}` : '/app'} replace />
}
