import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Users, Download, Trash2 } from 'lucide-react'
import { api } from '../../../lib/api'
import { useDebouncedValue } from '../../../lib/useDebouncedValue'
import { useTaxonomy } from '../../../lib/taxonomy'
import { EmptyState, ErrorBanner, PageHeader, Spinner, fmtDateTime } from '../../../components/ui'
import { ConfirmDialog } from '../../../components/ui/dialog'
import { Pagination } from '../../../components/ui/table'
import { ResponsiveTable } from '../../../components/ui/responsive-table'
import { IconButton } from '../../../components/ui/icon-button'
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
        <ResponsiveTable
          dense
          className="[&_table]:text-start [&_table]:text-sm"
          headers={['Name', 'Contact', 'Attendee type', 'Status', 'Tickets', 'Scans', 'Registered', '']}
        >
          {query.data?.rows.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-elevated/60">
              <td className="px-4 py-3 font-medium text-ink-0">{a.name}</td>
              <td className="px-4 py-3 text-ink-2">
                {a.email}
                {a.phone ? <span className="ms-2 text-ink-3">{a.phone}</span> : null}
              </td>
              <td className="px-4 py-3 text-ink-2">{typeLabel(a.attendeeType)}</td>
              <td className="px-4 py-3">
                <span className={statusClass[a.status] ?? 'badge-neutral'}>{a.status}</span>
              </td>
              <td className="px-4 py-3 text-ink-2">{a._count.tickets}</td>
              <td className="px-4 py-3 text-ink-2">{a._count.accessLogs}</td>
              <td className="px-4 py-3 text-ink-3">{fmtDateTime(a.createdAt)}</td>
              <td className="px-4 py-3 text-end">
                {a._count.tickets === 0 && a._count.credentials === 0 && a._count.accessLogs === 0 && (
                  <ConfirmDialog title="Delete attendee?" body={`Delete ${a.name}? This cannot be undone.`} confirmLabel="Delete" onConfirm={() => remove.mutate(a.id)}>
                    <IconButton aria-label="Delete attendee" tone="danger" className="btn-ghost text-[11px]"><Trash2 size={12} /></IconButton>
                  </ConfirmDialog>
                )}
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      )}

      {query.data && query.data.total > query.data.pageSize && (
        <Pagination
          page={query.data.page}
          pages={Math.ceil(query.data.total / query.data.pageSize)}
          onPage={setPage}
        />
      )}
    </div>
  )
}