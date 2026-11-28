import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { KeyRound, Plus, Trash2, Ban, Pencil } from 'lucide-react'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { egyptDateTimeLocalToIso, toEgyptDateTimeLocal } from '@/lib/time'

type AccessCode = {
  id: string
  code: string
  type: string
  status: string
  fullName?: string | null
  email?: string | null
  phone?: string | null
  attendeeCategory?: string | null
  ticketTypeId?: string | null
  notes?: string | null
  maxRedemptions: number
  redemptionCount: number
  expiresAt?: string | null
  ticketType?: { id: string; name: string } | null
}

type TicketType = { id: string; name: string }

const empty = { code: '', type: 'VIP_GUEST', fullName: '', email: '', phone: '', attendeeCategory: '', ticketTypeId: '', notes: '', maxRedemptions: '1', expiresAt: '' }

export function AccessCodesPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'activity')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AccessCode | null>(null)
  const [form, setForm] = useState(empty)

  const codes = useQuery({ queryKey: ['access-codes', eventId, sse], queryFn: () => api.get<AccessCode[]>(`/events/${eventId}/access-codes`) })
  const ticketTypes = useQuery({ queryKey: ['ticket-types', eventId], queryFn: () => api.get<TicketType[]>(`/events/${eventId}/tickets/types`) })

  const reset = () => { setForm(empty); setEditing(null) }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code: form.code,
        type: form.type,
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        attendeeCategory: form.attendeeCategory || undefined,
        ticketTypeId: form.ticketTypeId || undefined,
        notes: form.notes || undefined,
        maxRedemptions: Number(form.maxRedemptions || 1),
        expiresAt: egyptDateTimeLocalToIso(form.expiresAt) ?? null,
      }
      return editing ? api.patch(`/events/${eventId}/access-codes/${editing.id}`, payload) : api.post(`/events/${eventId}/access-codes`, payload)
    },
    onSuccess: () => { toast.success(editing ? 'Access code updated' : 'Access code created'); qc.invalidateQueries({ queryKey: ['access-codes'] }); setOpen(false); reset() },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save access code'),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.post(`/events/${eventId}/access-codes/${id}/revoke`, {}),
    onSuccess: () => { toast.success('Access code revoked'); qc.invalidateQueries({ queryKey: ['access-codes'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not revoke'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/access-codes/${id}`),
    onSuccess: () => { toast.success('Access code deleted'); qc.invalidateQueries({ queryKey: ['access-codes'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete'),
  })

  if (codes.isLoading) return <FullPageSpinner />
  if (codes.error) return <InlineError message="Could not load access codes." onRetry={() => codes.refetch()} />

  const onSubmit = (e: FormEvent) => { e.preventDefault(); save.mutate() }

  return (
    <div className="pb-16">
      <PageHeader title="Access Codes" subtitle="VIP, invite, and guest access codes with redemption controls." icon={<KeyRound className="size-5" />} actions={<Button icon={<Plus className="size-4" />} onClick={() => { reset(); setOpen(true) }}>Create code</Button>} />
      <div className="pt-6">
        <Table dense headers={['Code', 'Type', 'Assignee', 'Ticket type', 'Usage', 'Status', '']}>
          {(codes.data ?? []).length === 0 && <EmptyState colSpan={7} title="No access codes" />}
          {(codes.data ?? []).map((c) => (
            <tr key={c.id} className="group">
              <Td><div className="font-mono text-[12px] text-signal">{c.code}</div>{c.notes && <div className="text-[11px] text-ink-3 line-clamp-1">{c.notes}</div>}</Td>
              <Td><Badge tone="default">{c.type}</Badge></Td>
              <Td><div className="text-[12px]">{c.fullName || '—'}</div><div className="text-[11px] text-ink-3">{c.email || c.phone || ''}</div></Td>
              <Td className="text-[12px]">{c.ticketType?.name ?? 'Any active'}</Td>
              <Td className="text-[12px]">{c.redemptionCount}/{c.maxRedemptions}</Td>
              <Td><Badge tone={c.status === 'ACTIVE' ? 'ok' : c.status === 'REDEEMED' ? 'warn' : 'danger'}>{c.status}</Badge></Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <IconButton tone="muted" aria-label="Edit access code" onClick={() => { setEditing(c); setForm({ code: c.code, type: c.type, fullName: c.fullName ?? '', email: c.email ?? '', phone: c.phone ?? '', attendeeCategory: c.attendeeCategory ?? '', ticketTypeId: c.ticketTypeId ?? '', notes: c.notes ?? '', maxRedemptions: String(c.maxRedemptions), expiresAt: toEgyptDateTimeLocal(c.expiresAt) }); setOpen(true) }}><Pencil className="size-3.5" /></IconButton>
                  {c.status !== 'REVOKED' && <IconButton tone="muted" aria-label="Revoke access code" onClick={() => revoke.mutate(c.id)}><Ban className="size-3.5" /></IconButton>}
                  {c.redemptionCount === 0 && <ConfirmDialog title="Delete access code" body={`Delete access code "${c.code}"? This cannot be undone.`} confirmLabel="Delete code" onConfirm={() => remove.mutate(c.id)}><IconButton tone="danger" aria-label="Delete access code"><Trash2 className="size-3.5" /></IconButton></ConfirmDialog>}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      <Dialog open={open} onClose={() => { setOpen(false); reset() }} title={editing ? 'Edit access code' : 'Create access code'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code"><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required /></Field>
            <Field label="Type"><Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="VIP_GUEST">VIP_GUEST</option><option value="VIP_TICKET">VIP_TICKET</option><option value="INVITE">INVITE</option><option value="COMP">COMP</option></Select></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name"><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} /></Field>
            <Field label="Category">
              <Select value={form.attendeeCategory} onChange={e => setForm(f => ({ ...f, attendeeCategory: e.target.value }))}>
                <option value="">Select category…</option>
                <option value="VIP">VIP</option>
                <option value="Guest">Guest</option>
                <option value="Speaker">Speaker</option>
                <option value="Media">Media</option>
                <option value="Staff">Staff</option>
                <option value="Partner">Partner</option>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email"><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Ticket type"><Select value={form.ticketTypeId} onChange={e => setForm(f => ({ ...f, ticketTypeId: e.target.value }))}><option value="">Any active ticket type</option>{(ticketTypes.data ?? []).map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}</Select></Field>
            <Field label="Max redemptions"><Input type="number" min={1} value={form.maxRedemptions} onChange={e => setForm(f => ({ ...f, maxRedemptions: e.target.value }))} /></Field>
          </div>
          <Field label="Expires at"><Input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} /></Field>
          <Field label="Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => { setOpen(false); reset() }}>Cancel</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
