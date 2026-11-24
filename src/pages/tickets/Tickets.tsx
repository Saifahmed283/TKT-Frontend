import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Lock, Check, Pencil, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { useTaxonomy } from '../../lib/taxonomy'
import { ErrorBanner, PageHeader, Spinner, fmtDateTime } from '../../components/ui'
import { Table, Td, EmptyState } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { ConfirmDialog } from '../../components/ui/dialog'
import { useSse } from '../../lib/sse'
import { Corners } from '../../components/instruments'

type TicketTypeRow = {
  id: string
  name: string
  description: string | null
  category?: string | null
  tier?: string | null
  price: number | string | null
  currency?: string | null
  quota: number | null
  salesStartAt?: string | null
  salesEndAt?: string | null
  isPublic?: boolean
  transportIncluded?: boolean
  sortOrder?: number
  active: boolean
  _count: { tickets: number }
}

type TicketRow = {
  id: string
  status: string
  price: number | null
  issuedAt: string
  attendee: { id: string; name: string; email: string } | null
  ticketType: { id: string; name: string; tier?: string | null } | null
  credential: { id: string; code: string; status: string } | null
  busSeats?: { id: string; label: string; passengerName?: string | null; bus?: { name?: string | null } | null }[]
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
  const taxonomyQ = useTaxonomy()
  const tierOptions = taxonomyQ.data.ticketTiers
  const sse = useSse(eventId, 'activity')
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: '', tier: 'STANDARD', price: '', currency: 'EGP', quota: '', salesStartAt: '', salesEndAt: '', isPublic: true, transportIncluded: false, sortOrder: '0' })
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '', tier: 'STANDARD', price: '', currency: 'EGP', quota: '', salesStartAt: '', salesEndAt: '', isPublic: true, transportIncluded: false, sortOrder: '0', active: true })

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

  const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : '')
  const payloadFrom = (f: typeof form, includeActive = false, active = true) => ({
    name: f.name,
    description: f.description || null,
    category: f.category || null,
    tier: f.tier || null,
    price: f.price === '' ? null : Number(f.price),
    currency: f.currency || 'EGP',
    quota: f.quota === '' ? null : Number(f.quota),
    salesStartAt: f.salesStartAt ? new Date(f.salesStartAt).toISOString() : null,
    salesEndAt: f.salesEndAt ? new Date(f.salesEndAt).toISOString() : null,
    isPublic: f.isPublic,
    transportIncluded: f.transportIncluded,
    sortOrder: f.sortOrder === '' ? 0 : Number(f.sortOrder),
    ...(includeActive ? { active } : {}),
  })

  const createType = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/tickets/types`, payloadFrom(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-types'] })
      setForm({ name: '', description: '', category: '', tier: 'STANDARD', price: '', currency: 'EGP', quota: '', salesStartAt: '', salesEndAt: '', isPublic: true, transportIncluded: false, sortOrder: '0' })
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

  const deleteType = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/tickets/types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket-types'] }),
  })

  const deleteTicket = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/tickets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      qc.invalidateQueries({ queryKey: ['ticket-types'] })
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
            <button onClick={() => setShowAdd(false)} className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3 hover:text-ink">Close</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block"><span className="label mb-1.5 block text-ink-3">Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Category</span><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="VIP / General" /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Tier</span><select className="input" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>{tierOptions.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</select></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Price</span><input className="input" type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Currency</span><input className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Quota</span><input className="input" type="number" min={1} value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Sales start</span><input className="input" type="datetime-local" value={form.salesStartAt} onChange={(e) => setForm({ ...form, salesStartAt: e.target.value })} /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Sales end</span><input className="input" type="datetime-local" value={form.salesEndAt} onChange={(e) => setForm({ ...form, salesEndAt: e.target.value })} /></label>
            <label className="block"><span className="label mb-1.5 block text-ink-3">Sort</span><input className="input" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
            <label className="block sm:col-span-2 lg:col-span-3"><span className="label mb-1.5 block text-ink-3">Description</span><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label className="flex items-center gap-2 pt-6 text-xs text-ink-2"><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} /> Public</label>
            <label className="flex items-center gap-2 pt-6 text-xs text-ink-2"><input type="checkbox" checked={form.transportIncluded} onChange={(e) => setForm({ ...form, transportIncluded: e.target.checked })} /> Includes transport</label>
          </div>
          <div className="mt-4 flex justify-end"><button className="btn-primary" disabled={!form.name.trim() || createType.isPending} onClick={() => createType.mutate()}>{createType.isPending ? 'Creating…' : 'Create ticket type'}</button></div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <p className="label">Ticket types</p>
        <span className="h-px flex-1 bg-line-soft" />
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{types.length} configured</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {types.map((t) => {
          const editing = editId === t.id
          return (
            <div key={t.id} className="panel relative p-4">
              <Corners className="opacity-30" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-semibold tracking-wide text-ink-0">{t.name}</p>
                    {t.category && <span className="border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">{t.category}</span>}
                    {t.tier && <span className="border border-signal/30 bg-signal/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-signal">{t.tier}</span>}
                    {t.transportIncluded && <span className="border border-ok/30 bg-ok/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ok">Transport</span>}
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{Number(t.price) > 0 ? `${t.currency ?? 'EGP'} ${Number(t.price).toLocaleString()}` : 'FREE'} · {t.isPublic === false ? 'Private' : 'Public'}</p>
                </div>
                <div>{t.active ? <Badge tone="ok">LIVE</Badge> : <Badge tone="warn">OFF</Badge>}</div>
              </div>
              <p className="mt-3 font-mono text-[11px] tracking-[0.1em] text-ink-2">{t._count.tickets} sold{t.quota != null ? <span className={t._count.tickets >= t.quota ? 'text-danger' : 'text-ink-3'}> / {t.quota} quota</span> : <span className="text-ink-3"> / unlimited</span>}</p>
              {(t.salesStartAt || t.salesEndAt) && <p className="mt-1 text-[11px] text-ink-3">Sales: {t.salesStartAt ? fmtDateTime(t.salesStartAt) : 'Any'} → {t.salesEndAt ? fmtDateTime(t.salesEndAt) : 'Any'}</p>}
              {editing ? (
                <div className="mt-4 grid gap-2 border-t border-line-soft pt-4 sm:grid-cols-2">
                  <input className="input !h-9 text-xs" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                  <input className="input !h-9 text-xs" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="Category" />
                  <select className="input !h-9 text-xs" value={editForm.tier} onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}>{tierOptions.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</select>
                  <input className="input !h-9 text-xs" type="number" min={0} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="Price" />
                  <input className="input !h-9 text-xs" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value.toUpperCase() })} placeholder="Currency" />
                  <input className="input !h-9 text-xs" type="number" min={1} value={editForm.quota} onChange={(e) => setEditForm({ ...editForm, quota: e.target.value })} placeholder="Quota" />
                  <input className="input !h-9 text-xs" type="number" min={0} value={editForm.sortOrder} onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })} placeholder="Sort" />
                  <input className="input !h-9 text-xs" type="datetime-local" value={editForm.salesStartAt} onChange={(e) => setEditForm({ ...editForm, salesStartAt: e.target.value })} />
                  <input className="input !h-9 text-xs" type="datetime-local" value={editForm.salesEndAt} onChange={(e) => setEditForm({ ...editForm, salesEndAt: e.target.value })} />
                  <input className="input !h-9 text-xs sm:col-span-2" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                  <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={editForm.isPublic} onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })} /> Public</label>
                  <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={editForm.transportIncluded} onChange={(e) => setEditForm({ ...editForm, transportIncluded: e.target.checked })} /> Includes transport</label>
                  <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} /> Active</label>
                  <div className="flex gap-2 sm:col-span-2">
                    <button className="btn-primary !py-1.5 text-xs" disabled={patchType.isPending} onClick={() => patchType.mutate({ id: t.id, patch: payloadFrom(editForm, true, editForm.active) })}><Check size={12} /> Save</button>
                    <button className="btn-ghost !py-1.5 text-xs" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
                  <button className="btn-ghost !px-2.5 !py-1 text-[10px]" onClick={() => { setEditId(t.id); setEditForm({ name: t.name, description: t.description ?? '', category: t.category ?? '', tier: t.tier ?? 'STANDARD', price: t.price == null ? '' : String(t.price), currency: t.currency ?? 'EGP', quota: t.quota == null ? '' : String(t.quota), salesStartAt: toDateInput(t.salesStartAt), salesEndAt: toDateInput(t.salesEndAt), isPublic: t.isPublic !== false, transportIncluded: t.transportIncluded === true, sortOrder: String(t.sortOrder ?? 0), active: t.active }) }}><Pencil size={11} /> Edit</button>
                  <button className="btn-ghost !px-2.5 !py-1 text-[10px]" disabled={patchType.isPending} onClick={() => patchType.mutate({ id: t.id, patch: { active: !t.active } })}>{t.active ? <><Lock size={11} /> Deactivate</> : <><Check size={11} /> Activate</>}</button>
                  {t._count.tickets === 0 && (
                    <ConfirmDialog title="Delete ticket type?" body={`Delete "${t.name}"? This cannot be undone.`} confirmLabel="Delete" onConfirm={() => deleteType.mutate(t.id)}>
                      <button className="btn-ghost !px-2.5 !py-1 text-[10px] text-danger"><Trash2 size={11} /> Delete</button>
                    </ConfirmDialog>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
          colSpan={8}
          title="No tickets issued"
          body="Issue tickets to attendees to enable credential minting."
        />
      ) : (
        <Table headers={['Attendee', 'Type', 'Seats', 'Price', 'Status', 'Credential', 'Issued', '']}>
          {query.data?.rows.map((t) => (
            <tr key={t.id}>
              <Td>
                <p className="text-[13px] font-medium text-ink-0">{t.attendee?.name ?? '—'}</p>
                <p className="font-mono text-[10px] text-ink-3">{t.attendee?.email}</p>
              </Td>
              <Td><div>{t.ticketType?.name ?? '—'}</div>{t.ticketType?.tier && <div className="font-mono text-[10px] text-ink-3">{t.ticketType.tier}</div>}</Td>
              <Td className="text-[11px] text-ink-2">{(t.busSeats ?? []).length ? (t.busSeats ?? []).map((s) => (s.bus?.name ? s.bus.name + ' ' : '') + s.label).join(', ') : '—'}</Td>
              <Td className="font-mono text-[12px]">{t.price != null ? String(t.price) : '—'}</Td>
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
              <Td className="text-end">
                {!t.credential && (
                  <ConfirmDialog title="Delete ticket?" body="Delete this issued ticket? This cannot be undone." confirmLabel="Delete" onConfirm={() => deleteTicket.mutate(t.id)}>
                    <button className="btn-ghost !px-2.5 !py-1 text-[10px] text-danger"><Trash2 size={11} /> Delete</button>
                  </ConfirmDialog>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}


