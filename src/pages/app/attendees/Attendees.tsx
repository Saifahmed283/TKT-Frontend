import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Users, Download, Trash2 } from 'lucide-react'
import { api } from '../../../lib/api'
import { useDebouncedValue } from '../../../lib/useDebouncedValue'
import { useTaxonomy } from '../../../lib/taxonomy'
import { EmptyState, ErrorBanner, PageHeader, Spinner, fmtDateTime } from '../../../components/ui'
import { ConfirmDialog } from '../../../components/ui/dialog'
import { exportPdf, downloadAuthFile } from '../../../lib/export'

interface AttendeeRow {
  id: string
  name: string
  email: string
  phone: string | null
  category: string | null
  attendeeType?: string | null
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
  const qc = useQueryClient()
  const taxonomyQ = useTaxonomy()
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q)
  const [scope, setScope] = useState<'approved' | 'pending' | 'all'>('approved')
  const [status, setStatus] = useState('')
  const [attendeeType, setAttendeeType] = useState('')
  const [page, setPage] = useState(1)

  const typeLabel = (code?: string | null) => {
    if (!code) return '—'
    return taxonomyQ.data.attendeeTypes.find((item) => item.code === code)?.label ?? code
  }
  const filters = `&scope=${scope}${debouncedQ ? `&q=${encodeURIComponent(debouncedQ)}` : ''}${status ? `&status=${status}` : ''}${attendeeType ? `&attendeeType=${attendeeType}` : ''}`

  const query = useQuery({
    queryKey: ['attendees', eventId, scope, debouncedQ, status, attendeeType, page],
    queryFn: ({ signal }) =>
      api.get<{ rows: AttendeeRow[]; total: number; page: number; pageSize: number }>(
        `/events/${eventId}/attendees?page=${page}&pageSize=25${filters}`,
        { signal },
      ),
    placeholderData: (prev) => prev,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/attendees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendees'] }),
  })

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendees" subtitle="Approved attendees are shown by default. Pending reservations stay available in the pending view." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input ps-9"
            placeholder="Search name, email, phone…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <select className="input w-full sm:w-44" value={scope} onChange={(e) => { setScope(e.target.value as 'approved' | 'pending' | 'all'); setStatus(''); setPage(1) }}>
          <option value="approved">Approved</option>
          <option value="pending">Pending review</option>
          <option value="all">All attendees</option>
        </select>
        <select className="input w-full sm:w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {Object.keys(statusClass).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input w-full sm:w-44" value={attendeeType} onChange={(e) => { setAttendeeType(e.target.value); setPage(1) }}>
          <option value="">All attendee types</option>
          {taxonomyQ.data.attendeeTypes.map((item) => (
            <option key={item.code} value={item.code}>{item.label}</option>
          ))}
        </select>
        <span className="text-xs text-ink-400">{query.data ? `${query.data.total} attendees` : ''}</span>
        <button
          className="btn-ghost min-h-10 text-xs sm:min-h-11"
          onClick={() => void downloadAuthFile(`/events/${eventId}/attendees/export.csv${filters ? `?${filters.replace(/^&/, '')}` : ''}`, `attendees-${eventId.slice(0, 8)}.csv`).catch(() => {})}
        >
          <Download size={12} /> Export CSV
        </button>
        <button
          className="btn-ghost min-h-10 text-xs sm:min-h-11"
          onClick={() => void downloadAuthFile(`/events/${eventId}/attendees/export.xlsx${filters ? `?${filters.replace(/^&/, '')}` : ''}`, `attendees-${eventId.slice(0, 8)}.xlsx`).catch(() => {})}
        >
          <Download size={12} /> Excel
        </button>
        <button
          className="btn-ghost min-h-10 text-xs sm:min-h-11"
          onClick={() => {
            const rows = query.data?.rows ?? []
            exportPdf(`attendees-${eventId.slice(0, 8)}`, 'Attendees', ['Name', 'Email', 'Phone', 'Category', 'Attendee type', 'Status', 'Tickets', 'Scans', 'Registered'], rows.map((a) => [a.name, a.email, a.phone ?? '', a.category ?? '', typeLabel(a.attendeeType), a.status, a._count.tickets, a._count.accessLogs, fmtDateTime(a.createdAt)]))
          }}
        >
          <Download size={12} /> PDF
        </button>
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorBanner error={query.error} />
      ) : (query.data?.rows.length ?? 0) === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No attendees found" body="Add attendees via the API, bulk import, or registration desk." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-start text-sm">
            <thead className="border-b border-line bg-ink-850 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Attendee type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Scans</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {query.data?.rows.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-ink-850">
                  <td className="px-4 py-3 font-medium text-ink-50">{a.name}</td>
                  <td className="px-4 py-3 text-ink-300">
                    {a.email}
                    {a.phone ? <span className="ms-2 text-ink-400">{a.phone}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-300">{typeLabel(a.attendeeType)}</td>
                  <td className="px-4 py-3">
                    <span className={statusClass[a.status] ?? 'badge-neutral'}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{a._count.tickets}</td>
                  <td className="px-4 py-3 text-ink-300">{a._count.accessLogs}</td>
                  <td className="px-4 py-3 text-ink-400">{fmtDateTime(a.createdAt)}</td>
                  <td className="px-4 py-3 text-end">
                    {a._count.tickets === 0 && a._count.credentials === 0 && a._count.accessLogs === 0 && (
                      <ConfirmDialog title="Delete attendee?" body={`Delete ${a.name}? This cannot be undone.`} confirmLabel="Delete" onConfirm={() => remove.mutate(a.id)}>
                        <button aria-label="Delete attendee" className="btn-ghost grid min-h-11 min-w-11 place-items-center text-[11px] text-danger"><Trash2 size={12} /></button>
                      </ConfirmDialog>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && query.data.total > query.data.pageSize && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-400">
          <span>Page {query.data.page}</span>
          <div className="flex gap-2">
            <button className="btn-ghost min-h-11 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button
              className="btn-ghost min-h-11 text-xs"
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