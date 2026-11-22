import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Plus, Lock, Check, Pencil } from 'lucide-react'
import { api } from '../../lib/api'
import { ErrorBanner, PageHeader, Spinner, fmtDateTime } from '../../components/ui'
import { Table, Td, EmptyState } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { useSse } from '../../lib/sse'
import { Corners } from '../../components/instruments'

type TicketTypeRow = {
  id: string
  name: string
  description: string | null
  price: number | null
  quota: number | null
  active: boolean
  _count: { tickets: number }
}

type TicketRow = {
  id: string
  status: string
  price: number | null
  issuedAt: string
  attendee: { id: string; name: string; email: string } | null
  ticketType: { id: string; name: string } | null
  credential: { id: string; code: string; status: string } | null
}

const ticketTone: Record<string, 'ok' | 'live' | 'danger' | 'warn'> = {
  VALID: 'ok',
  ACTIVE: 'ok',
  USED: 'live',
  REFUNDED: 'warn',
  CANCELLED: 'danger',
  VOID: 'danger',
}

export default function TicketsPage() {
  const { eventId = '' } = useParams()
  const qc = useQueryClient()
  const sse = useSse(eventId, 'activity')
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newQuota, setNewQuota] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editQuota, setEditQuota] = useState('')

  const typesQ = useQuery({
    queryKey: ['ticket-types', eventId, sse],
    queryFn: () => api<TicketTypeRow[]>(`/events/${eventId}/tickets/types`).catch(() => []),
  })

  const query = useQuery({
    queryKey: ['tickets', eventId, q],
    queryFn: () =>
      api<{ rows: TicketRow[]; total: number }>(
        `/events/${eventId}/tickets?page=1&pageSize=50${q ? `&q=${encodeURIComponent(q)}` : ''}`,
      ),
  })

  const createType = useMutation({
    mutationFn: () =>
      api.post(`/events/${eventId}/tickets/types`, {
        name: newName,
        ...(newPrice !== '' ? { price: Number(newPrice) } : {}),
        ...(newQuota !== '' ? { quota: Number(newQuota) } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-types'] })
      setNewName('')
      setNewPrice('')
      setNewQuota('')
      setShowAdd(false)
    },
  })

  const patchType = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch(`/events/${eventId}/tickets/types/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-types'] })
      setEditId(null)
    },
  })

  const types = typesQ.data ?? []

  return (
    <div className="pb-16">
      <PageHeader
        title="Tickets"
        subtitle="Ticket types, quotas and issued tickets with credential bindings."
        actions={
          <button className="btn-primary !py-1.5 text-xs" onClick={() => setShowAdd((v) => !v)}>
            <Plus size={13} /> New ticket type
          </button>
        }
      />

      {showAdd && (
        <div className="panel relative mb-6 p-5">
          <Corners />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-signal">New ticket type</p>
            <button onClick={() => setShowAdd(false)} className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3 hover:text-ink">
              Close
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
            <div>
              <label className="label mb-1.5 block text-ink-3">Name</label>
              <input
                className="input"
                placeholder="VIP Pass"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="label mb-1.5 block text-ink-3">Price ($)</label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="0 = free"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="label mb-1.5 block text-ink-3">Quota</label>
              <input
                className="input"
                type="number"
                min={1}
                placeholder="unlimited"
                value={newQuota}
                onChange={(e) => setNewQuota(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              disabled={createType.isPending || newName.trim().length < 2}
              onClick={() => createType.mutate()}
            >
              {createType.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
            Quota caps how many public reservations this type may sell before it auto-locks.
          </p>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <p className="label">Ticket types</p>
        <span className="h-px flex-1 bg-line-soft" />
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">
          {types.length} configured
        </span>
      </div>
      <div className="grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
        {types.map((t) => (
          <div key={t.id} className="relative bg-raised p-4">
            <Corners className="opacity-40" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold tracking-wide text-ink-0">{t.name}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
                  {t.description ?? (Number(t.price) > 0 ? `$${Number(t.price).toLocaleString()}` : 'FREE')}
                </p>
              </div>
              {t.active ? <Badge tone="ok">LIVE</Badge> : <Badge tone="warn">OFF</Badge>}
            </div>
            <p className="mt-3 font-mono text-[11px] tracking-[0.1em] text-ink-2">
              {t._count.tickets} sold
              {t.quota != null && (
                <span className={t._count.tickets >= t.quota ? 'text-danger' : 'text-ink-3'}>
                  {' '}
                  / {t.quota} quota
                </span>
              )}
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
              {editId === t.id ? (
                <>
                  <input
                    className="input !h-8 w-24 !py-0 text-xs"
                    type="number"
                    min={1}
                    value={editQuota}
                    onChange={(e) => setEditQuota(e.target.value)}
                  />
                  <button
                    className="btn-ghost !px-2.5 !py-1 text-[10px]"
                    disabled={patchType.isPending}
                    onClick={() =>
                      patchType.mutate({ id: t.id, patch: { quota: Number(editQuota) || null } })
                    }
                  >
                    <Check size={11} /> Save
                  </button>
                  <button
                    className="btn-ghost !px-2 !py-1 text-[10px] text-ink-3"
                    onClick={() => setEditId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-ghost !px-2.5 !py-1 text-[10px]"
                    onClick={() => {
                      setEditId(t.id)
                      setEditQuota(t.quota != null ? String(t.quota) : '')
                    }}
                  >
                    <Pencil size={11} /> Quota
                  </button>
                  <button
                    className="btn-ghost !px-2.5 !py-1 text-[10px]"
                    disabled={patchType.isPending}
                    onClick={() => patchType.mutate({ id: t.id, patch: { active: !t.active } })}
                  >
                    {t.active ? (
                      <>
                        <Lock size={11} /> Deactivate
                      </>
                    ) : (
                      <>
                        <Check size={11} /> Activate
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 mt-8 flex items-center gap-2">
        <p className="label">Issued tickets</p>
        <span className="h-px flex-1 bg-line-soft" />
        <div className="relative w-full max-w-xs">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="input !py-1.5 ps-9 text-xs"
            placeholder="Search attendee or credential…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorBanner error={query.error} />
      ) : (query.data?.rows.length ?? 0) === 0 ? (
        <EmptyState
          colSpan={6}
          title="No tickets issued"
          body="Issue tickets to attendees to enable credential minting."
        />
      ) : (
        <Table headers={['Attendee', 'Type', 'Price', 'Status', 'Credential', 'Issued']}>
          {query.data?.rows.map((t) => (
            <tr key={t.id}>
              <Td>
                <p className="text-[13px] font-medium text-ink-0">{t.attendee?.name ?? '—'}</p>
                <p className="font-mono text-[10px] text-ink-3">{t.attendee?.email}</p>
              </Td>
              <Td>{t.ticketType?.name ?? '—'}</Td>
              <Td className="font-mono text-[12px]">{t.price != null ? `$${Number(t.price).toLocaleString()}` : '—'}</Td>
              <Td>
                <Badge tone={ticketTone[t.status] ?? 'default'}>{t.status}</Badge>
              </Td>
              <Td>
                {t.credential ? (
                  <span className={`font-mono text-[11px] ${t.credential.status === 'ACTIVE' ? 'text-ok' : 'text-ink-3'}`}>
                    {t.credential.code.slice(0, 18)}…
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-ink-3">Not issued</span>
                )}
              </Td>
              <Td className="text-[12px] text-ink-3">{fmtDateTime(t.issuedAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}