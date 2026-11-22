import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { StatCard, Panel } from '@/components/motion/primitives'
import { CreditCard, Plus, Trash2, Check, X, ExternalLink } from 'lucide-react'
import { useState, type FormEvent } from 'react'

type Provider = {
  id: string
  name: string
  accountName?: string | null
  accountNumber?: string | null
  paymentPhone?: string | null
  paymentLink?: string | null
  instructions?: string | null
  imageUrl?: string | null
  isActive: boolean
}

type PendingPayment = {
  id: string
  reservationCode?: string | null
  approvalStatus: string
  paymentStatus: string
  price: string
  paymentAmount?: string | null
  paymentReference?: string | null
  paymentProofUrl?: string | null
  paymentSubmittedAt?: string | null
  paymentProvider?: { id: string; name: string } | null
  attendee: { id: string; name: string; email: string | null }
  ticketType: { id: string; name: string }
}

type Summary = { pending: number; confirmed: number; failed: number; totalRevenue: number }

const emptyForm = {
  name: '',
  accountName: '',
  accountNumber: '',
  paymentPhone: '',
  paymentLink: '',
  instructions: '',
  imageUrl: '',
  isActive: 'true',
}

export function PaymentsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'reservation')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [proof, setProof] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const providers = useQuery({
    queryKey: ['payment-providers', eventId],
    queryFn: () => api.get<Provider[]>(`/events/${eventId}/payments/providers`).catch(() => []),
  })
  const pending = useQuery({
    queryKey: ['payment-pending', eventId, sse],
    queryFn: () => api.get<PendingPayment[]>(`/events/${eventId}/payments/pending`).catch(() => []),
  })
  const summary = useQuery({
    queryKey: ['payment-summary', eventId, sse],
    queryFn: () => api.get<Summary>(`/events/${eventId}/payments/summary`).catch(() => null),
  })

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
  }

  const saveProvider = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        accountName: form.accountName || null,
        accountNumber: form.accountNumber || null,
        paymentPhone: form.paymentPhone || null,
        paymentLink: form.paymentLink || null,
        instructions: form.instructions || null,
        imageUrl: form.imageUrl || null,
        isActive: form.isActive === 'true',
      }
      return editing
        ? api.patch(`/events/${eventId}/payments/providers/${editing.id}`, payload)
        : api.post(`/events/${eventId}/payments/providers`, payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Provider updated' : 'Provider created')
      qc.invalidateQueries({ queryKey: ['payment-providers'] })
      setOpen(false)
      resetForm()
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save provider'),
  })

  const deleteProvider = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/payments/providers/${id}`),
    onSuccess: () => {
      toast.success('Provider deleted')
      qc.invalidateQueries({ queryKey: ['payment-providers'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete provider'),
  })

  const review = useMutation({
    mutationFn: ({ ticketId, action }: { ticketId: string; action: 'CONFIRM' | 'REJECT' }) =>
      api.post(`/events/${eventId}/payments/reservations/${ticketId}/review`, { action }),
    onSuccess: (_, v) => {
      toast.success(v.action === 'CONFIRM' ? 'Payment confirmed' : 'Payment rejected')
      qc.invalidateQueries({ queryKey: ['payment-pending'] })
      qc.invalidateQueries({ queryKey: ['payment-summary'] })
      qc.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Review failed'),
  })

  if (providers.isLoading || pending.isLoading) return <FullPageSpinner />
  if (providers.error || pending.error) {
    return (
      <InlineError
        message="Could not load payments."
        onRetry={() => {
          providers.refetch()
          pending.refetch()
          summary.refetch()
        }}
      />
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    saveProvider.mutate()
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Payments"
        subtitle="Payment providers, proof review, and reservation payment status."
        icon={<CreditCard className="size-5" />}
        actions={
          <Button
            onClick={() => {
              resetForm()
              setOpen(true)
            }}
            icon={<Plus className="size-4" />}
          >
            Add provider
          </Button>
        }
      />

      <div className="px-6 pt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending review" value={summary.data?.pending ?? 0} icon={<CreditCard className="size-4" />} />
          <StatCard label="Confirmed" value={summary.data?.confirmed ?? 0} icon={<Check className="size-4" />} />
          <StatCard label="Failed/Rejected" value={summary.data?.failed ?? 0} icon={<X className="size-4" />} />
          <StatCard label="Revenue" value={(summary.data?.totalRevenue ?? 0).toLocaleString()} icon={<CreditCard className="size-4" />} />
        </div>

        <Panel title="Payment providers">
          <Table headers={['Provider', 'Account', 'Phone/Link', 'Active', '']}>
            {(providers.data ?? []).length === 0 && <EmptyState colSpan={5} title="No payment providers" />}
            {(providers.data ?? []).map((p) => (
              <tr key={p.id} className="group">
                <Td>
                  <div className="font-medium">{p.name}</div>
                  {p.instructions && <div className="text-[11px] text-ink-3 line-clamp-1">{p.instructions}</div>}
                </Td>
                <Td className="text-[12px] text-ink-2">{[p.accountName, p.accountNumber].filter(Boolean).join(' · ') || '—'}</Td>
                <Td className="text-[12px] text-ink-2">{p.paymentPhone || p.paymentLink || '—'}</Td>
                <Td>
                  <Badge tone={p.isActive ? 'ok' : 'default'}>{p.isActive ? 'ACTIVE' : 'OFF'}</Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(p)
                        setForm({
                          name: p.name,
                          accountName: p.accountName ?? '',
                          accountNumber: p.accountNumber ?? '',
                          paymentPhone: p.paymentPhone ?? '',
                          paymentLink: p.paymentLink ?? '',
                          instructions: p.instructions ?? '',
                          imageUrl: p.imageUrl ?? '',
                          isActive: p.isActive ? 'true' : 'false',
                        })
                        setOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => {
                        if (confirm('Delete provider?')) deleteProvider.mutate(p.id)
                      }}
                      icon={<Trash2 className="size-3.5" />}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>

        <Panel title="Pending payment reviews">
          <Table headers={['Reservation', 'Attendee', 'Ticket', 'Provider', 'Reference', 'Proof', 'Submitted', '']}>
            {(pending.data ?? []).length === 0 && <EmptyState colSpan={8} title="No pending payments" />}
            {(pending.data ?? []).map((r) => (
              <tr key={r.id}>
                <Td>
                  <span className="font-mono text-[11px] text-signal">{r.reservationCode ?? r.id.slice(0, 8)}</span>
                  <div className="text-[10px] text-ink-3">{r.approvalStatus}</div>
                </Td>
                <Td>
                  <div className="text-[13px]">{r.attendee.name}</div>
                  <div className="text-[11px] text-ink-3">{r.attendee.email ?? '—'}</div>
                </Td>
                <Td className="text-[12px]">
                  {r.ticketType.name}
                  <div className="text-ink-3">{r.paymentAmount ?? r.price}</div>
                </Td>
                <Td className="text-[12px]">{r.paymentProvider?.name ?? '—'}</Td>
                <Td className="font-mono text-[11px] text-ink-3">{r.paymentReference ?? '—'}</Td>
                <Td>
                  {r.paymentProofUrl ? (
                    <button className="text-signal text-[11px] underline" onClick={() => setProof(r.paymentProofUrl!)}>
                      View
                    </button>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td className="text-[11px] text-ink-3">{r.paymentSubmittedAt ? new Date(r.paymentSubmittedAt).toLocaleString() : '—'}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => review.mutate({ ticketId: r.id, action: 'CONFIRM' })} icon={<Check className="size-3.5" />}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => review.mutate({ ticketId: r.id, action: 'REJECT' })} icon={<X className="size-3.5" />}>
                      Reject
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false)
          resetForm()
        }}
        title={editing ? 'Edit payment provider' : 'Add payment provider'}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Account name">
              <Input value={form.accountName} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} />
            </Field>
            <Field label="Account number">
              <Input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Payment phone">
              <Input value={form.paymentPhone} onChange={(e) => setForm((f) => ({ ...f, paymentPhone: e.target.value }))} />
            </Field>
            <Field label="Payment link">
              <Input value={form.paymentLink} onChange={(e) => setForm((f) => ({ ...f, paymentLink: e.target.value }))} />
            </Field>
          </div>
          <Field label="Instructions">
            <Input value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          </Field>
          <Field label="Image URL">
            <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          </Field>
          <Field label="Active">
            <Select value={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveProvider.isPending}>
              {saveProvider.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!proof} onClose={() => setProof(null)} title="Payment proof">
        {proof &&
          (proof.startsWith('data:image') || proof.startsWith('http') ? (
            <img src={proof} alt="Payment proof" className="max-h-[70vh] w-full object-contain rounded-lg" />
          ) : (
            <a href={proof} target="_blank" rel="noreferrer" className="text-signal underline inline-flex items-center gap-1">
              Open proof <ExternalLink className="size-3.5" />
            </a>
          ))}
      </Dialog>
    </div>
  )
}
