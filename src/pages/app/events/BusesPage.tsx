import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BusFront, Pencil, Plus, Trash2, Users, Download } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { downloadAuthFile } from '@/lib/export'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { Panel } from '@/components/motion/primitives'
import { BUS_TEMPLATES, createBusLayout, getBusTemplate, normalizeBusLayout, type BusTemplateId } from '@/lib/busLayouts'
import BusSeatMap2D from '@/components/public/BusSeatMap2D'

type Seat = {
  id: string
  label: string
  row: number
  col: number
  state: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'UNAVAILABLE'
  holderName?: string | null
  passengerName?: string | null
  groupId?: string | null
  ticketId?: string | null
}
type BusLayout = { template?: BusTemplateId; look?: string; rows: number; cols: number; aisleAfterCol?: number; seats?: { label: string; row: number; col: number; state?: string }[] }
type Bus = { id: string; name: string; isActive: boolean; seatPrice?: string | number; currency?: string; layout: BusLayout; seats?: Seat[]; _count?: { seats: number } }

const MAX_LAYOUT_SEATS = 200

export function BusesPage() {
  const { eventId = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingBusId, setEditingBusId] = useState<string | null>(null)
  const [activeBusId, setActiveBusId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [holderName, setHolderName] = useState('')
  const [form, setForm] = useState({ name: '', template: 'grid' as BusTemplateId, rows: 10, cols: 4, aisleAfterCol: 2, seatPrice: 0, currency: 'EGP' })

  const busesQ = useQuery({ queryKey: ['events', eventId, 'buses'], queryFn: () => api.get<Bus[]>(`/events/${eventId}/buses`), enabled: !!eventId })
  const seatsQ = useQuery({ queryKey: ['events', eventId, 'buses', activeBusId, 'seats'], queryFn: () => api.get<Bus & { seats: Seat[] }>(`/events/${eventId}/buses/${activeBusId}/seats`), enabled: !!eventId && !!activeBusId })

  const buses = busesQ.data ?? []
  useEffect(() => {
    if (!activeBusId && buses.length) setActiveBusId(buses[0].id)
  }, [activeBusId, buses])

  const previewLayout = useMemo(() => createBusLayout(form.template, {
    rows: form.rows, cols: form.cols, aisleAfterCol: form.aisleAfterCol, name: form.name || undefined,
  }), [form])
  const previewSeats = useMemo(() => previewLayout.seats.map((seat) => ({
    id: `preview-${seat.label}`, label: seat.label, row: seat.row, col: seat.col,
    state: 'AVAILABLE' as const,
  })), [previewLayout])

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['events', eventId, 'buses'] }) }

  const openCreate = () => {
    setEditingBusId(null)
    setForm({ name: '', template: 'grid', rows: 10, cols: 4, aisleAfterCol: 2, seatPrice: 0, currency: 'EGP' })
    setEditorOpen(true)
  }

  const openEditor = (bus: Bus) => {
    const layout = normalizeBusLayout(bus.layout)
    setEditingBusId(bus.id)
    setForm({
      name: bus.name,
      template: layout.template,
      rows: layout.rows,
      cols: layout.cols,
      aisleAfterCol: layout.aisleAfterCol,
      seatPrice: Number(bus.seatPrice ?? 0),
      currency: bus.currency ?? 'EGP',
    })
    setEditorOpen(true)
  }

  const saveBus = useMutation({
    mutationFn: () => {
      if (form.template === 'grid' && form.rows * form.cols > MAX_LAYOUT_SEATS) {
        throw new Error(`Custom grids are limited to ${MAX_LAYOUT_SEATS} seats.`)
      }
      const layout = createBusLayout(form.template, {
        rows: form.rows, cols: form.cols, aisleAfterCol: form.aisleAfterCol, name: form.name || undefined,
      })
      const payload = {
        name: form.name,
        seatPrice: Number(form.seatPrice) || 0,
        currency: form.currency.trim() || 'EGP',
        layout,
      }
      return editingBusId
        ? api.patch<Bus>(`/events/${eventId}/buses/${editingBusId}`, payload)
        : api.post<Bus>(`/events/${eventId}/buses`, payload)
    },
    onSuccess: (bus) => {
      toast.success(editingBusId ? 'Bus layout updated' : 'Bus created')
      setEditorOpen(false)
      setEditingBusId(null)
      if (bus?.id) setActiveBusId(bus.id)
      refresh()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save bus'),
  })

  const deleteBus = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/buses/${id}`),
    onSuccess: () => { toast.success('Bus deleted'); if (activeBusId) setActiveBusId(null); refresh() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to delete bus'),
  })
  const reserve = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/buses/${activeBusId}/reserve`, { seatIds: selected, holderName }),
    onSuccess: () => { toast.success('Seats reserved'); setSelected([]); setHolderName(''); refresh() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Reservation failed'),
  })
  const release = useMutation({
    mutationFn: (seatIds: string[]) => api.post(`/events/${eventId}/buses/${activeBusId}/release`, { seatIds }),
    onSuccess: () => { toast.success('Seats released'); setSelected([]); refresh() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Release failed'),
  })
  const toggleUnavailable = useMutation({
    mutationFn: ({ seatId, state }: { seatId: string; state: 'AVAILABLE' | 'UNAVAILABLE' }) => api.patch(`/events/${eventId}/buses/${activeBusId}/seats/${seatId}`, { state }),
    onSuccess: () => refresh(),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to update seat'),
  })

  if (busesQ.isLoading) return <FullPageSpinner />
  if (busesQ.error) return <InlineError message={busesQ.error instanceof Error ? busesQ.error.message : 'Failed to load buses'} />

  const bus = seatsQ.data
  const seats = bus?.seats ?? []
  const normLayout = normalizeBusLayout(bus?.layout ?? {})
  const toggleSelect = (seat: Seat) => {
    if (seat.state === 'UNAVAILABLE' || seat.ticketId) return
    setSelected(prev => prev.includes(seat.id) ? prev.filter(id => id !== seat.id) : [...prev, seat.id])
  }
  const selectedSeatRecords = seats.filter((seat) => selected.includes(seat.id))
  const canReserveSelected = selectedSeatRecords.length > 0 && selectedSeatRecords.every((seat) => seat.state === 'AVAILABLE')
  const canReleaseSelected = selectedSeatRecords.length > 0 && selectedSeatRecords.every((seat) => (
    (seat.state === 'RESERVED' || seat.state === 'HELD') && !seat.ticketId
  ))

  return (
    <div>
      <PageHeader
        title="Bus seats"
        subtitle="One canonical coach plan powers this dashboard, the public 2D map and the 3D cabin."
        icon={<BusFront className="size-5" />}
        actions={<Button onClick={openCreate}><Plus size={15} /> Add bus</Button>}
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
        <Panel>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Buses</div>
          <div className="space-y-2">
            {buses.map((item) => (
              <div key={item.id} className={`flex items-center justify-between gap-1 rounded-none border px-3 py-2 ${activeBusId === item.id ? 'border-signal/40 bg-signal/5' : 'border-line'}`}>
                <button className="min-w-0 flex-1 text-left" onClick={() => { setActiveBusId(item.id); setSelected([]) }}>
                  <div className="truncate text-[13px] font-medium text-ink">{item.name}</div>
                  <div className="text-[11px] text-ink-3">{item._count?.seats ?? 0} seats · {item.currency ?? 'EGP'} {Number(item.seatPrice ?? 0).toFixed(2)}</div>
                </button>
                <Button size="sm" variant="ghost" title="Redesign bus" aria-label={`Redesign ${item.name}`} onClick={() => openEditor(item)}><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" className="text-danger" aria-label={`Delete ${item.name}`} onClick={() => deleteBus.mutate(item.id)}><Trash2 size={14} /></Button>
              </div>
            ))}
            {buses.length === 0 && <div className="text-sm text-ink-3">No buses yet.</div>}
          </div>
        </Panel>

        <Panel>
          {!activeBusId ? <div className="py-16 text-center text-sm text-ink-3">Select or create a bus to manage seats.</div> : seatsQ.isLoading ? <FullPageSpinner /> : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArmchairIcon />
                  <div>
                    <div className="font-display text-lg font-semibold">{bus?.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{normLayout.modelCode} · {normLayout.template}</div>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => bus && openEditor(bus)}><Pencil size={14} /> Redesign</Button>
              </div>

              <BusSeatMap2D
                layout={bus?.layout ?? {}}
                seats={seats}
                selectedSeatIds={selected}
                onSeatClick={toggleSelect}
                language="en"
                maxSelectable={Math.max(1, seats.length)}
                allowStatusSelection
                canInteract={(seat) => !seat.ticketId}
                onSeatContextMenu={(seat) => {
                  if (seat.state !== 'AVAILABLE' && seat.state !== 'UNAVAILABLE') return
                  toggleUnavailable.mutate({
                    seatId: seat.id,
                    state: seat.state === 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
                  })
                }}
              />

              <div className="flex flex-wrap items-end gap-3">
                <Field label="Holder / group name"><Input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Name shown on seat" /></Field>
                <Button disabled={!canReserveSelected || holderName.trim().length < 2} loading={reserve.isPending} onClick={() => reserve.mutate()}><Users size={15} /> Reserve {selected.length || ''} seat(s)</Button>
                <Button variant="ghost" disabled={!canReleaseSelected} loading={release.isPending} onClick={() => release.mutate(selected)}>Release selected</Button>
                <Button variant="ghost" onClick={() => void downloadAuthFile(`/events/${eventId}/buses/${activeBusId}/manifest.xlsx`, `bus-manifest.xlsx`).catch(() => toast.error('Export failed'))}><Download size={14} /> Seat manifest</Button>
                <Badge tone="default">{selected.length} selected</Badge>
              </div>
              <p className="text-[11px] text-ink-3">Tip: right-click an available seat to mark it unavailable, or an unavailable seat to restore it. Ticket-linked seats must be released through ticket cancellation/refund.</p>

              {seats.some(s => s.state === 'RESERVED' || s.state === 'HELD') && (
                <div className="rounded-none border border-line p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Reserved / held seats</div>
                  <div className="flex flex-wrap gap-2">
                    {seats.filter(s => s.state === 'RESERVED' || s.state === 'HELD').map(s => <Badge key={s.id} tone={s.state === 'HELD' ? 'warn' : 'danger'}>{s.label} · {s.passengerName || s.holderName || s.state}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} title={editingBusId ? 'Redesign bus' : 'Add bus'}>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); saveBus.mutate() }} className="space-y-4">
          <Field label="Bus name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Bus model / layout">
            <select
              className="input"
              value={form.template}
              onChange={e => {
                const template = e.target.value as BusTemplateId
                const tpl = getBusTemplate(template)
                setForm(f => ({ ...f, template, rows: tpl.rows, cols: tpl.cols, aisleAfterCol: tpl.aisleAfterCol ?? 0 }))
              }}
            >
              {BUS_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name} — {t.totalBookableSeats || 'custom'} seats</option>)}
            </select>
          </Field>
          <div className="rounded-none border border-line-soft bg-elevated/20 p-3 text-[11px] text-ink-2">
            {getBusTemplate(form.template).description}
            {form.template === 'coaster21' && <div className="mt-1 text-amber-300">Confirm physical seat numbering with the operator before paid bookings.</div>}
            {form.template === 'mect49' && <div className="mt-1 text-ink-3">1B/2B auxiliary positions, TV, WC and exits are non-bookable cabin features.</div>}
          </div>
          {form.template === 'grid' && (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Rows"><Input type="number" min={1} max={Math.floor(MAX_LAYOUT_SEATS / Math.max(1, form.cols))} value={form.rows} onChange={e => setForm({ ...form, rows: Number(e.target.value) })} /></Field>
              <Field label="Cols"><Input type="number" min={1} max={8} value={form.cols} onChange={e => setForm({ ...form, cols: Number(e.target.value) })} /></Field>
              <Field label="Aisle after col"><Input type="number" min={0} max={form.cols} value={form.aisleAfterCol} onChange={e => setForm({ ...form, aisleAfterCol: Number(e.target.value) })} /></Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seat price"><Input type="number" min={0} step="0.01" value={form.seatPrice} onChange={e => setForm({ ...form, seatPrice: Number(e.target.value) })} /></Field>
            <Field label="Currency"><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></Field>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-ink-3">
              <span>Live blueprint · {previewSeats.length} bookable seats</span>
              <span className="font-mono uppercase tracking-widest">{previewLayout.modelCode}</span>
            </div>
            <BusSeatMap2D layout={previewLayout} seats={previewSeats} selectedSeatIds={[]} onSeatClick={() => {}} language="en" compact disabled />
          </div>
          {editingBusId && <p className="text-[11px] text-amber-300">Redesign rebuilds the seat inventory. Reserved and actively held seats must be released first.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveBus.isPending}>{editingBusId ? 'Save layout' : 'Create bus'}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

function ArmchairIcon() {
  return <span className="grid size-8 place-items-center rounded-lg border border-signal/30 bg-signal/10 text-signal"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 11V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" /><path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5H4z" /><path d="M6 16v3m12-3v3" /></svg></span>
}
