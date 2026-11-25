import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import type { EventSummary } from '../../lib/types'
import { PageHeader, StatusBadge, Spinner, ErrorBanner, EmptyState, fmtDateTime, Corners } from '../../components/ui'
import { EventFormModal } from '../../components/events/EventFormModal'
import { useState } from 'react'

export default function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const q = useQuery({
    queryKey: ['events'],
    queryFn: () => api<EventSummary[]>('/events'),
  })

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Events"
        subtitle="Events you are a member of."
        actions={
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> New event
          </button>
        }
      />

      {q.isLoading ? (
        <Spinner label="Loading events…" />
      ) : q.isError ? (
        <ErrorBanner error={q.error} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={22} />}
          title="No events"
          body="Create your first event to start building teams, areas, tickets, and gate access."
          action={
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> New event
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((e) => (
            <Link key={e.id} to={`/app/events/${e.id}`} className="card card-hover group relative p-5">
              <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-ink-0 group-hover:text-signal">{e.name}</h3>
                <StatusBadge status={e.status} />
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{e.category || e.type}</p>
              <p className="mt-2 line-clamp-2 text-sm text-ink-3">
                {e.description ?? `${e.type} · ${e.venueName ?? 'Venue TBA'}`}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
                <span>{fmtDateTime(e.startAt)}</span>
                <span className="text-signal">{e.timezone}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <EventFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}