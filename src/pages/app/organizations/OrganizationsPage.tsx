import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { Building2, CalendarDays, ChevronRight } from 'lucide-react'

type Org = {
  id: string
  name: string
  createdAt: string
  myRole: { name: string } | string | null
  _count: { members: number; events: number }
  events: { id: string; name: string; status: string }[]
}

export function OrganizationsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Org[]>('/organizations'),
  })

  if (isLoading) return <FullPageSpinner />
  if (error) return <InlineError message="Could not load organizations." onRetry={refetch} />

  return (
    <div className="pb-16">
      <PageHeader
        title="Organizations"
        subtitle="Organizations own events. Members, roles and scopes live here."
        icon={<Building2 className="size-5" />}
      />
      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2">
        {data?.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-line py-16 text-center">
            <Building2 className="mx-auto size-7 text-ink-3" />
            <p className="mt-3 text-sm text-ink-2">You're not a member of any organization yet</p>
          </div>
        )}
        {data?.map((o) => (
          <div key={o.id} className="rounded-xl border border-line bg-raised/70 p-5">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/app/organizations/${o.id}`} className="text-[15px] font-semibold hover:text-signal transition-colors">{o.name}</Link>
                {o.myRole && <Badge tone="live" className="mt-1.5">{typeof o.myRole === 'string' ? o.myRole : o.myRole.name}</Badge>}
              </div>
              <span className="text-[11px] text-ink-3">{o._count.members} members</span>
            </div>
            <div className="mt-4 space-y-2 border-t border-line-soft pt-4">
              {o.events.map((e) => (
                <Link
                  key={e.id}
                  to={`/app/events/${e.id}`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-raised"
                >
                  <CalendarDays className="size-4 text-ink-3" />
                  <span className="min-w-0 flex-1 truncate">{e.name}</span>
                  <Badge tone={e.status === 'LIVE' ? 'live' : 'default'}>{e.status}</Badge>
                  <ChevronRight className="size-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
              {o.events.length === 0 && <p className="text-[12px] text-ink-3">No events in this organization yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
