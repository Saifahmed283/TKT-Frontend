import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Users, Download } from 'lucide-react'
import { api } from '../../lib/api'
import { EmptyState, ErrorBanner, PageHeader, Spinner, fmtDateTime } from '../../components/ui'
import { exportCsv } from '../../lib/export'

interface AttendeeRow {
  id: string
  name: string
  email: string
  phone: string | null
  category: string | null
  status: string
  notes: string | null
  createdAt: string
  _count: { tickets: number; credentials: number; accessLogs: number }
}

const statusClass: Record<string, string> = {
  INVITED: 'badge-neutral',
  REGISTERED: 'badge-signal',
  CONFIRMED: 'badge-warn',
  WAITLISTED: 'badge-neutral',
  CANCELLED: 'badge-err',
  CHECKED_IN: 'badge-ok',
  CHECKED_OUT: 'badge-neutral',
  BLOCKED: 'badge-err',
}

export default function AttendeesPage() {
  const { eventId = '' } = useParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['attendees', eventId, q, status, page],
    queryFn: () =>
      api<{ rows: AttendeeRow[]; total: number; page: number; pageSize: number }>(
        `/events/${eventId}/attendees?page=${page}&pageSize=25${q ? `&q=${encodeURIComponent(q)}` : ''}${status ? `&status=${status}` : ''}`,
      ),
  })

  const exporting = useQuery({
    queryKey: ['attendees-export', eventId],
    queryFn: () =>
      api<{ rows: AttendeeRow[] }>(`/events/${eventId}/attendees?page=1&pageSize=100000`).then((r) => {
        exportCsv(
          `attendees-${eventId.slice(0, 8)}`,
          ['Name', 'Email', 'Phone', 'Category', 'Status', 'Tickets', 'Credentials', 'Scans', 'Registered'],
          r.rows.map((a) => [
            a.name,
            a.email,
            a.phone ?? '',
            a.category ?? '',
            a.status,
            a._count.tickets,
            a._count.credentials,
            a._count.accessLogs,
            fmtDateTime(a.createdAt),
          ]),
        )
      }),
    enabled: false,
  })

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendees" subtitle="Everyone registered for this event." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search name, email, phone…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select className="input w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {Object.keys(statusClass).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="text-xs text-ink-400">{query.data ? `${query.data.total} attendees` : ''}</span>
        <button
          className="btn-ghost py-1.5 text-xs"
          onClick={() => exporting.refetch()}
          disabled={exporting.isFetching}
        >
          <Download size={12} /> {exporting.isFetching ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorBanner error={query.error} />
      ) : (query.data?.rows.length ?? 0) === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No attendees found" body="Add attendees via the API, bulk import, or registration desk." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-ink-850 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Scans</th>
                <th className="px-4 py-3 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {query.data?.rows.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-ink-850">
                  <td className="px-4 py-3 font-medium text-ink-50">{a.name}</td>
                  <td className="px-4 py-3 text-ink-300">
                    {a.email}
                    {a.phone ? <span className="ml-2 text-ink-400">{a.phone}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusClass[a.status] ?? 'badge-neutral'}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{a._count.tickets}</td>
                  <td className="px-4 py-3 text-ink-300">{a._count.accessLogs}</td>
                  <td className="px-4 py-3 text-ink-400">{fmtDateTime(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && query.data.total > query.data.pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink-400">
          <span>Page {query.data.page}</span>
          <div className="flex gap-2">
            <button className="btn-ghost py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button
              className="btn-ghost py-1.5 text-xs"
              disabled={page * query.data.pageSize >= query.data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}