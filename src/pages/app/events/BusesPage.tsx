import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { BusFront, Plus, Trash2, Armchair, Users, Download } from 'lucide-react'
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

type Seat = { id: string; label: string; row: number; col: number; state: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'UNAVAILABLE'; holderName?: string | null; passengerName?: string | null; groupId?: string | null; ticketId?: string | null }
type Bus = { id: string; name: string; isActive: boolean; seatPrice?: string | number; currency?: string; layout: { rows: number; cols: number; aisleAfterCol?: number }; seats?: Seat[]; _count?: { seats: number } }

function seatClass(state: Seat['state'], selected: boolean) {
  if (selected) return 'border-signal bg-signal text-black'
  if (state === 'AVAILABLE') return 'border-ok/40 bg-ok/15 text-ok hover:bg-ok/25'
  if (state === 'HELD') return 'border-amber/40 bg-amber/15 text-amber'
  if (state === 'RESERVED') return 'border-danger/40 bg-danger/15 text-danger'
  return 'border-line bg-ink-3/20 text-ink-3 cursor-not-allowed'
}

export function BusesPage() {
  const { eventId = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeBusId, setActiveBusId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [holderName, setHolderName] = useState('')
  const [form, setForm] = useState({ name: '', rows: 10, cols: 4, aisleAfterCol: 2, seatPrice: 0, currency: 'EGP' })

  const busesQ = useQuery({ queryKey: ['events', eventId, 'buses'], queryFn: () => api.get<Bus[]>(`/events/${eventId}/buses`), enabled: !!eventId })
  const seatsQ = useQuery({ queryKey: ['events', eventId, 'buses', activeBusId, 'seats'], queryFn: () => api.get<Bus & { seats: Seat[] }>(`/events/${eventId}/buses/${activeBusId}/seats`), enabled: !!eventId && !!activeBusId })

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['events', eventId, 'buses'] }) }
  const createBus = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/buses`, { name: form.name, seatPrice: form.seatPrice, currency: form.currency, layout: { rows: form.rows, cols: form.cols, aisleAfterCol: form.aisleAfterCol } }),
    onSuccess: (b: any) => { toast.success('Bus created'); setCreateOpen(false); setActiveBusId(b.id); refresh() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to create bus'),
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
  const buses = busesQ.data ?? []
  const bus = seatsQ.data
  const seats = bus?.seats ?? []
  const cols = bus?.layout?.cols ?? 4
  const aisleAfter = bus?.layout?.aisleAfterCol ?? 0

  const toggleSelect = (s: Seat) => {
    if (s.state === 'UNAVAILABLE') return
    if (s.state === 'RESERVED') { setSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]); return }
    setSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])
  }

  return (
    <div>
      <PageHeader title="Bus seats" subtitle="2D vertical seat maps — green available, red reserved, grey unavailable." icon={<BusFront className="size-5" />}
        actions={<Button onClick={() => setCreateOpen(true)}><Plus size={15} /> Add bus</Button>} />
      <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
        <Panel>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Buses</div>
          <div className="space-y-2">
            {buses.map(b => (
              <div key={b.id} className={`flex items-center justify-between rounded-none border px-3 py-2 ${activeBusId === b.id ? 'border-signal/40 bg-signal/5' : 'border-line'}`}>
                <button className="text-left" onClick={() => { setActiveBusId(b.id); setSelected([]) }}>
                  <div className="text-[13px] font-medium text-ink">{b.name}</div>
                  <div className="text-[11px] text-ink-3">{b._count?.seats ?? 0} seats</div>
                </button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => deleteBus.mutate(b.id)}><Trash2 size={14} /></Button>
              </div>
            ))}
            {buses.length === 0 && <div className="text-sm text-ink-3">No buses yet.</div>}
          </div>
        </Panel>

        <Panel>
          {!activeBusId ? <div className="py-16 text-center text-sm text-ink-3">Select or create a bus to manage seats.</div> : seatsQ.isLoading ? <FullPageSpinner /> : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Armchair size={16} className="text-signal" /><span className="font-display text-lg font-semibold">{bus?.name}</span></div>
                <div className="flex items-center gap-3 text-[11px] text-ink-3">
                  <span className="inline-flex items-center gap-1"><span className="size-3 rounded-none bg-ok/40" /> Available</span>
                  <span className="inline-flex items-center gap-1"><span className="size-3 rounded-none bg-amber/40" /> Held</span>
                  <span className="inline-flex items-center gap-1"><span className="size-3 rounded-none bg-danger/40" /> Reserved</span>
                  <span className="inline-flex items-center gap-1"><span className="size-3 rounded-none bg-ink-3/40" /> Unavailable</span>
                </div>
              </div>

              <div className="mx-auto w-fit rounded-none border-2 border-line bg-raised/60 p-4">
                <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Front</div>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols + (aisleAfter > 0 && aisleAfter < cols ? 1 : 0)}, minmax(0,1fr))` }}>
                  {Array.from({ length: bus?.layout?.rows ?? 0 }).flatMap((_, r) => {
                    const row = r + 1
                    const cells = []
                    for (let c = 1; c <= cols; c++) {
                      const seat = seats.find(s => s.row === row && s.col === c)
                      if (!seat) { cells.push(<div key={`${row}-${c}`} />); }
                      else {
                        const isSelected = selected.includes(seat.id)
                        cells.push(
                          <button key={seat.id} type="button" title={seat.holderName ? `${seat.label} · ${seat.holderName}` : seat.label}
                            onClick={() => toggleSelect(seat)}
                            onContextMenu={(e) => { e.preventDefault(); if (seat.state !== 'RESERVED') toggleUnavailable.mutate({ seatId: seat.id, state: seat.state === 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE' }) }}
                            className={`grid h-10 w-10 place-items-center rounded-none border text-[11px] font-semibold transition-colors ${seatClass(seat.state, isSelected)}`}>
                            {seat.label}
                          </button>
                        )
                      }
                      if (aisleAfter === c && c < cols) cells.push(<div key={`aisle-${row}-${c}`} className="w-4" />)
                    }
                    return cells
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <Field label="Holder / group name"><Input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Name shown on seat" /></Field>
                <Button disabled={selected.length === 0 || holderName.trim().length < 2} loading={reserve.isPending} onClick={() => reserve.mutate()}><Users size={15} /> Reserve {selected.length || ''} seat(s)</Button>
                <Button variant="ghost" disabled={selected.length === 0} loading={release.isPending} onClick={() => release.mutate(selected)}>Release selected</Button>
                <Button variant="ghost" onClick={() => void downloadAuthFile(`/events/${eventId}/buses/${activeBusId}/manifest.xlsx`, `bus-manifest.xlsx`).catch(() => toast.error('Export failed'))}><Download size={14} /> Seat manifest</Button>
                <Badge tone="default">{selected.length} selected</Badge>
              </div>
              <p className="text-[11px] text-ink-3">Tip: right-click a seat to mark unavailable/available. Reserved seats show holder name on hover.</p>

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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Add bus">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); createBus.mutate() }} className="space-y-4">
          <Field label="Bus name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rows"><Input type="number" min={1} max={60} value={form.rows} onChange={e => setForm({ ...form, rows: Number(e.target.value) })} /></Field>
            <Field label="Cols"><Input type="number" min={1} max={8} value={form.cols} onChange={e => setForm({ ...form, cols: Number(e.target.value) })} /></Field>
            <Field label="Aisle after col"><Input type="number" min={0} max={8} value={form.aisleAfterCol} onChange={e => setForm({ ...form, aisleAfterCol: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seat price"><Input type="number" min={0} step="0.01" value={form.seatPrice} onChange={e => setForm({ ...form, seatPrice: Number(e.target.value) })} /></Field>
            <Field label="Currency"><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button type="submit" loading={createBus.isPending}>Create bus</Button></div>
        </form>
      </Dialog>
    </div>
  )
}

