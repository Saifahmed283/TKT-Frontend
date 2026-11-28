import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { API_BASE, api, resolveUploadUrl } from '@/lib/api'
import { downloadAuthFile } from '@/lib/export'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { FileUploadField } from '@/components/ui/file-upload'
import { Td, EmptyState } from '@/components/ui/table'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { StatCard, Panel } from '@/components/motion/primitives'
import { CreditCard, Plus, Trash2, Check, X, ExternalLink, Download, Search, Wallet } from 'lucide-react'
import { useState, type FormEvent } from 'react'

type Provider = {
  id: string; name: string; accountName?: string | null; accountNumber?: string | null; paymentPhone?: string | null;
  paymentLink?: string | null; instructions?: string | null; imageUrl?: string | null; isActive: boolean
  metadata?: { fetchUrlTemplate?: string; fetchAuthHeader?: string; fetchAuthValue?: string } | null
}
type PendingPayment = {
  id: string; reservationCode?: string | null; paymentReference?: string | null; paymentProofUrl?: string | null; paymentProvider?: string | null;
  status: string; paymentStatus?: string | null; price: string; issuedAt: string; attendee?: { name: string; email?: string | null; phone?: string | null } | null;
  ticketType?: { name: string; category: string } | null; metadata?: Record<string, unknown> | null
}
type Summary = {
  currency: string; estimatedCost: number; financeNotes: string; confirmedRevenue: number; pendingRevenue: number; failedRevenue: number; refundedRevenue: number; netRevenue: number; estimatedProfit: number;
  totalTickets: number; soldTickets: number; totalCapacity: number | null; remainingTickets: number | null;
  byPaymentStatus: { status: string; count: number }[]; byCategory: { category: string; count: number; revenue: number }[];
  byProvider: { provider: string; count: number; revenue: number }[]; byTicketType: { id: string; name: string; category: string; price: number; capacity: number | null; sold: number; remaining: number | null }[];
}

const fmtMoney = (n: number, currency = 'EGP') => `${currency} ${n.toLocaleString()}`

// Uploaded proofs are short-lived signed links served by our own API. Only
// those are safe to embed; arbitrary external URLs stay as plain links so an
// admin never silently loads an attacker-controlled image while reviewing.
type ProofSource = { url: string; trusted: boolean }

function isOwnProofUrl(stored: string): boolean {
  if (stored.startsWith('/api/uploads/blob/') || stored.startsWith('/uploads/')) return true
  try {
    const parsed = new URL(stored, window.location.href)
    const ownOrigin = parsed.origin === window.location.origin
      || parsed.origin === new URL(API_BASE, window.location.href).origin
    return ownOrigin && (parsed.pathname.startsWith('/api/uploads/blob/') || parsed.pathname.startsWith('/uploads/'))
  } catch {
    return false
  }
}

function proofSource(raw: unknown): ProofSource | null {
  const stored = typeof raw === 'string' ? raw.trim() : ''
  if (!stored) return null
  // Only proof links served by our own API/frontend may be embedded; arbitrary
  // external URLs remain plain links so an admin is not silently loading
  // attacker-controlled content while reviewing a payment.
  const trusted = isOwnProofUrl(stored)
  const url = resolveUploadUrl(stored)
  if (trusted) return { url, trusted: true }
  if (/^https?:\/\//i.test(url) || url.startsWith('data:image/')) return { url, trusted: false }
  return null
}

function isImageProof(url: string) {
  return /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i.test(url)
}

export function PaymentsPage() {
  const { eventId = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [providerOpen, setProviderOpen] = useState(false)
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null)
  const [refLookup, setRefLookup] = useState('')
  const [reviewTarget, setReviewTarget] = useState<PendingPayment | null>(null)
  const debouncedRef = useDebouncedValue(refLookup)
  const [form, setForm] = useState({ name: '', accountName: '', accountNumber: '', paymentPhone: '', paymentLink: '', instructions: '', imageUrl: '', fetchUrlTemplate: '', fetchAuthHeader: '', fetchAuthValue: '' })
  const [fetchResult, setFetchResult] = useState<{ message: string; localMatchCount: number; external: any; providerName?: string } | null>(null)

  const providersQ = useQuery({ queryKey: ['events', eventId, 'payments', 'providers'], queryFn: () => api.get<Provider[]>(`/events/${eventId}/payments/providers`), enabled: !!eventId })
  const pendingQ = useQuery({ queryKey: ['events', eventId, 'payments', 'pending'], queryFn: () => api.get<PendingPayment[]>(`/events/${eventId}/payments/pending`), enabled: !!eventId })
  const summaryQ = useQuery({ queryKey: ['events', eventId, 'payments', 'summary'], queryFn: () => api.get<Summary>(`/events/${eventId}/payments/summary`), enabled: !!eventId })
  const refQ = useQuery({ queryKey: ['events', eventId, 'payments', 'ref', debouncedRef], queryFn: ({ signal }) => api.get<PendingPayment[]>(`/events/${eventId}/payments/reference/${encodeURIComponent(debouncedRef)}`, { signal }), enabled: !!eventId && debouncedRef.trim().length >= 3 })

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['events', eventId, 'payments'] }); void qc.invalidateQueries({ queryKey: ['events', eventId] }) }

  const createProvider = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/payments/providers`, form),
    onSuccess: () => { toast.success('Payment provider added'); setProviderOpen(false); setForm({ name: '', accountName: '', accountNumber: '', paymentPhone: '', paymentLink: '', instructions: '', imageUrl: '', fetchUrlTemplate: '', fetchAuthHeader: '', fetchAuthValue: '' }); refresh() },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to add provider'),
  })
  const deleteProvider = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/payments/providers/${id}`),
    onSuccess: () => { toast.success('Provider deleted'); setDeleteProviderId(null); refresh() },
    onError: (e: any) => { toast.error(e?.message ?? 'Failed to delete provider'); setDeleteProviderId(null) },
  })
  const review = useMutation({
    mutationFn: ({ ticketId, action }: { ticketId: string; action: 'CONFIRM' | 'REJECT' }) =>
      api(`/events/${eventId}/payments/reservations/${ticketId}/review`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ action }),
      }, { timeoutMs: 30_000 }),
    onSuccess: (_, v) => { toast.success(v.action === 'CONFIRM' ? 'Payment confirmed' : 'Payment rejected'); setReviewTarget(null); refresh() },
    onError: (e: any) => toast.error(e?.message ?? 'Review failed'),
  })

  const fetchRef = useMutation({
    mutationFn: (reference: string) => api.post<{ message: string; localMatchCount: number; external: any; providerName?: string }>(`/events/${eventId}/payments/reference/${encodeURIComponent(reference)}/fetch`, {}),
    onSuccess: (d) => {
      setFetchResult(d)
      toast.success(d.message || 'Reference checked')
      refresh()
      void refQ.refetch()
    },
    onError: (e: any) => {
      setFetchResult(null)
      toast.error(e?.message ?? 'Reference fetch failed')
    },
  })

  const exportPayments = async () => {
    try { await downloadAuthFile(`/events/${eventId}/payments/export.xlsx`, `payments-${eventId}.xlsx`); toast.success('Export ready') }
    catch (e: any) { toast.error(e?.message ?? 'Export failed') }
  }

  if (providersQ.isLoading || pendingQ.isLoading || summaryQ.isLoading) return <FullPageSpinner />
  if (providersQ.error || pendingQ.error || summaryQ.error) { const err = providersQ.error ?? pendingQ.error ?? summaryQ.error; return <InlineError message={err instanceof Error ? err.message : 'Failed to load payments'} /> }

  const providers = providersQ.data ?? []
  const pending = pendingQ.data ?? []
  const summary = summaryQ.data
  const reviewMeta = (reviewTarget?.metadata ?? {}) as Record<string, unknown>
  const reviewProof = proofSource(reviewMeta.paymentProofUrl || reviewTarget?.paymentProofUrl)

  return (
    <div>
      <PageHeader title="Payments" subtitle="Providers, payment review, revenue, remaining tickets, and finance exports."
        actions={<div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => void exportPayments()}><Download size={15} /> Excel</Button><Button onClick={() => setProviderOpen(true)}><Plus size={15} /> Add provider</Button></div>} />

      <div className="space-y-6">
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Confirmed revenue" value={fmtMoney(summary.confirmedRevenue, summary.currency)} sub={`Net ${fmtMoney(summary.netRevenue, summary.currency)}`} icon={<Wallet size={18} />} />
            <StatCard label="Pending revenue" value={fmtMoney(summary.pendingRevenue, summary.currency)} sub={`${summary.byPaymentStatus.find(s => s.status === 'PENDING')?.count ?? 0} pending`} icon={<CreditCard size={18} />} />
            <StatCard label="Remaining tickets" value={summary.remainingTickets == null ? '—' : String(summary.remainingTickets)} sub={summary.totalCapacity ? `${summary.soldTickets}/${summary.totalCapacity} sold` : `${summary.soldTickets} sold`} icon={<Check size={18} />} />
            <StatCard label="Estimated profit" value={fmtMoney(summary.estimatedProfit, summary.currency)} sub={`Cost ${fmtMoney(summary.estimatedCost, summary.currency)}`} icon={<Download size={18} />} />
          </div>
        )}

        {summary && (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">By category</div>
              <ResponsiveTable headers={['Category', 'Count', 'Revenue']}>
                {summary.byCategory.map(c => <tr key={c.category}><Td>{c.category}</Td><Td>{c.count}</Td><Td>{fmtMoney(c.revenue, summary.currency)}</Td></tr>)}
                {summary.byCategory.length === 0 && <EmptyState colSpan={3} title="No payment categories" />}
              </ResponsiveTable>
            </Panel>
            <Panel>
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">By ticket type / remaining</div>
              <ResponsiveTable headers={['Ticket type', 'Sold', 'Remaining', 'Revenue']}>
                {summary.byTicketType.map(t => <tr key={t.id}><Td>{t.name}<div className="text-[11px] text-ink-3">{t.category}</div></Td><Td>{t.sold}</Td><Td>{t.remaining == null ? '—' : t.remaining}</Td><Td>{fmtMoney(t.sold * t.price, summary.currency)}</Td></tr>)}
                {summary.byTicketType.length === 0 && <EmptyState colSpan={4} title="No ticket types" />}
              </ResponsiveTable>
            </Panel>
          </div>
        )}

        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Payment reference lookup</div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"><div className="flex w-full items-center gap-2"><Search size={14} className="shrink-0 text-ink-3" /><Input value={refLookup} onChange={e => setRefLookup(e.target.value)} placeholder="Search payment reference..." className="w-full sm:w-72" /></div>
              <Button size="sm" variant="ghost" disabled={refLookup.trim().length < 3 || fetchRef.isPending} loading={fetchRef.isPending} onClick={() => fetchRef.mutate(refLookup.trim())}>Fetch by reference</Button></div>
          </div>
          {fetchResult && (
            <div className="mb-4 rounded-none border border-signal/20 bg-signal/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-ink">Fetch result</p>
                  <p className="mt-1 text-sm text-ink-2">{fetchResult.message}</p>
                  {fetchResult.external && fetchResult.external.attempted && (
                    <div className="mt-3 p-3 rounded-none border border-amber/30 bg-amber/5">
                      <p className="font-mono text-[11px] text-amber">External provider fetch attempted</p>
                      <p className="mt-1 text-[12px] text-ink-2">
                        Status: {fetchResult.external.ok ? 'Success' : 'Failed'} {fetchResult.external.status ? `(HTTP ${fetchResult.external.status})` : ''}
                        {fetchResult.external.error && <span className="text-danger"> · {fetchResult.external.error}</span>}
                      </p>
                      {fetchResult.external.url && <p className="mt-1 text-[10px] font-mono text-ink-3">URL: {fetchResult.external.url}</p>}
                    </div>
                  )}
                  {fetchResult.providerName && (
                    <p className="mt-2 text-[11px] font-mono text-signal">Provider: {fetchResult.providerName}</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setFetchResult(null)}>Dismiss</Button>
              </div>
            </div>
          )}
          {refLookup.trim().length >= 3 && (
            <ResponsiveTable headers={['Reference', 'Reservation', 'Attendee', 'Proof', 'Status']}>
              {(refQ.data ?? []).map(r => {
                const meta = (r.metadata ?? {}) as Record<string, unknown>
                const proof = proofSource(r.paymentProofUrl || meta.paymentProofUrl)
                return <tr key={r.id}><Td className="font-mono text-xs">{String(meta.paymentReference ?? '—')}</Td><Td>{r.reservationCode ?? r.id.slice(0, 8)}</Td><Td>{r.attendee?.name ?? '—'}</Td><Td>{proof ? <a className="text-signal hover:underline" href={proof.url} target="_blank" rel="noreferrer">Open proof</a> : '—'}</Td><Td><Badge tone={String(r.paymentStatus ?? meta.paymentStatus) === 'CONFIRMED' ? 'ok' : 'warn'}>{String(r.paymentStatus ?? meta.paymentStatus ?? '—')}</Badge></Td></tr>
              })}
              {(refQ.data ?? []).length === 0 && <EmptyState colSpan={5} title="No reference match" body="Check reference number and event scope." />}
            </ResponsiveTable>
          )}
        </Panel>

        <Panel>
          <div data-testid="pending-payments" className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Pending payment reviews {pending.length > 0 && <span className="ml-1 text-signal">({pending.length})</span>}</div>
          <ResponsiveTable headers={['Reservation', 'Attendee', 'Amount', 'Reference', 'Proof', 'Status', 'Actions']}>
            {pending.map(p => {
              const meta = (p.metadata ?? {}) as Record<string, unknown>
              const paymentStatus = String(p.paymentStatus ?? meta.paymentStatus ?? 'PENDING')
              const hasProof = Boolean(proofSource(meta.paymentProofUrl || p.paymentProofUrl))
              return (
                <tr key={p.id} data-testid="pending-payment-row">
                  <Td><div className="font-medium text-ink">{p.reservationCode ?? p.id.slice(0, 8)}</div><div className="text-[11px] text-ink-3">{p.ticketType?.name}</div></Td>
                  <Td><div>{p.attendee?.name}</div><div className="text-[11px] text-ink-3">{p.attendee?.email ?? p.attendee?.phone}</div></Td>
                  <Td>{p.price}</Td>
                  <Td className="font-mono text-xs">{String(meta.paymentReference ?? p.paymentReference ?? '—')}</Td>
                  <Td>{hasProof ? <button type="button" data-testid="payment-proof-open" onClick={() => setReviewTarget(p)} className="inline-flex items-center gap-1 text-signal hover:underline"><ExternalLink size={12} /> Preview proof</button> : <span className="text-ink-3">No file</span>}</Td>
                  <Td><Badge tone={paymentStatus === 'CONFIRMED' ? 'ok' : 'warn'}>{paymentStatus}</Badge></Td>
                  <Td><div className="flex gap-2">
                    <Button data-testid="payment-confirm" size="sm" variant="ghost" disabled={review.isPending} onClick={() => setReviewTarget(p)}><Check size={14} /> Review & confirm</Button>
                    <Button data-testid="payment-reject" size="sm" variant="ghost" className="text-danger" disabled={review.isPending} loading={review.isPending} onClick={() => review.mutate({ ticketId: p.id, action: 'REJECT' })}><X size={14} /> Reject</Button>
                  </div></Td>
                </tr>
              )
            })}
            {pending.length === 0 && <EmptyState colSpan={7} title="No pending payments" body="Submitted payment proofs will appear here." />}
          </ResponsiveTable>
        </Panel>

        <Panel>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Payment providers</div>
          <ResponsiveTable headers={['Provider', 'Account', 'Phone/Link', 'Active', '']}>
            {providers.map(p => (
              <tr key={p.id}>
                <Td><div className="font-medium text-ink">{p.name}</div><div className="text-[11px] text-ink-3">{p.instructions}</div></Td>
                <Td><div>{p.accountName ?? '—'}</div><div className="text-[11px] text-ink-3">{p.accountNumber ?? ''}</div></Td>
                <Td><div>{p.paymentPhone ?? '—'}</div>{p.paymentLink && <a className="text-[11px] text-signal hover:underline" href={p.paymentLink} target="_blank" rel="noreferrer">Payment link</a>}</Td>
                <Td><Badge tone={p.isActive ? 'ok' : 'default'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                <Td><IconButton tone="danger" aria-label={`Delete ${p.name}`} onClick={() => setDeleteProviderId(p.id)}><Trash2 size={14} /></IconButton></Td>
              </tr>
            ))}
            {providers.length === 0 && <EmptyState colSpan={5} title="No providers" body="Add manual or online payment providers for this event." />}
          </ResponsiveTable>
        </Panel>
      </div>

      <Dialog open={providerOpen} onClose={() => setProviderOpen(false)} title="Add payment provider" wide>
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); createProvider.mutate() }} className="space-y-4">
          <Field label="Provider name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account name"><Input value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} /></Field>
            <Field label="Account number"><Input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment phone"><Input value={form.paymentPhone} onChange={e => setForm({ ...form, paymentPhone: e.target.value })} /></Field>
            <Field label="Payment link"><Input value={form.paymentLink} onChange={e => setForm({ ...form, paymentLink: e.target.value })} placeholder="https://..." /></Field>
          </div>
          <Field label="Instructions"><Input value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} /></Field>
          <FileUploadField label="Provider image / QR" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} accept="image/*,.pdf" />
          <div className="border-t border-line-soft pt-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-signal">External fetch adapter (optional)</p>
            <p className="mb-3 text-[11px] text-ink-3">Configure to enable automatic payment proof fetching from provider APIs. Uses &#123;reference&#125; and &#123;eventId&#125; placeholders.</p>
            <Field label="Fetch URL template"><Input value={form.fetchUrlTemplate} onChange={e => setForm({ ...form, fetchUrlTemplate: e.target.value })} placeholder="https://api.provider.com/v1/payments/&#123;reference&#125;?event=&#123;eventId&#125;" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Auth header name"><Input value={form.fetchAuthHeader} onChange={e => setForm({ ...form, fetchAuthHeader: e.target.value })} placeholder="Authorization" /></Field>
              <Field label="Auth header value"><Input value={form.fetchAuthValue} onChange={e => setForm({ ...form, fetchAuthValue: e.target.value })} placeholder="Bearer xxx" type="password" /></Field>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setProviderOpen(false)}>Cancel</Button><Button type="submit" loading={createProvider.isPending}>Add provider</Button></div>
        </form>
      </Dialog>

      {deleteProviderId && <Dialog open={!!deleteProviderId} onClose={() => setDeleteProviderId(null)} title="Delete provider"><p className="text-sm text-ink-2">This payment provider will be removed from the event.</p><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteProviderId(null)}>Cancel</Button><Button className="text-danger" variant="ghost" loading={deleteProvider.isPending} onClick={() => { if (deleteProviderId) deleteProvider.mutate(deleteProviderId) }}>Delete</Button></div></Dialog>}

      <Dialog
        open={!!reviewTarget}
        onClose={() => { if (!review.isPending) setReviewTarget(null) }}
        title="Review payment proof"
        wide
      >
        {reviewTarget && (
          <div data-testid="payment-proof-dialog" className="space-y-4">
            <p className="text-[13px] leading-relaxed text-ink-2">
              Inspect the submitted proof before confirming. Confirming this payment immediately approves the reservation and emails the QR ticket.
            </p>
            <dl className="grid gap-3 border border-line-soft bg-elevated/30 p-3 sm:grid-cols-2">
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Reservation</dt><dd className="mt-0.5 text-[13px] text-ink">{reviewTarget.reservationCode ?? reviewTarget.id.slice(0, 8)}</dd></div>
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Attendee</dt><dd className="mt-0.5 text-[13px] text-ink">{reviewTarget.attendee?.name ?? '—'}</dd></div>
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Amount</dt><dd className="mt-0.5 text-[13px] text-ink">{reviewTarget.price}</dd></div>
              <div><dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Reference</dt><dd className="mt-0.5 break-all font-mono text-[12px] text-ink">{String(reviewMeta.paymentReference ?? reviewTarget.paymentReference ?? '—')}</dd></div>
            </dl>
            {reviewProof ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Submitted proof</span>
                  <a href={reviewProof.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-signal hover:underline"><ExternalLink size={12} /> Open full size</a>
                </div>
                {reviewProof.trusted ? (
                  <div className="flex min-h-48 items-center justify-center overflow-hidden border border-line-soft bg-canvas p-3 sm:min-h-64">
                    {isImageProof(reviewProof.url) ? (
                      <img data-testid="payment-proof-preview" src={reviewProof.url} alt={`Payment proof for reservation ${reviewTarget.reservationCode ?? reviewTarget.id}`} className="max-h-[min(40dvh,22rem)] max-w-full object-contain" />
                    ) : (
                      <object data-testid="payment-proof-preview" data={reviewProof.url} aria-label="Submitted payment proof" className="h-[min(40dvh,22rem)] w-full">
                        <a href={reviewProof.url} target="_blank" rel="noreferrer" className="text-signal hover:underline">Open proof in a new tab</a>
                      </object>
                    )}
                  </div>
                ) : (
                  <div className="border border-line-soft bg-canvas p-4">
                    <p className="text-[13px] text-ink-2">This proof was submitted as an external link. Open it to inspect before confirming.</p>
                    <a data-testid="payment-proof-preview" href={reviewProof.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-signal hover:underline"><ExternalLink size={12} /> Open external proof</a>
                  </div>
                )}
              </div>
            ) : (
              <div data-testid="payment-proof-missing" className="border border-amber/30 bg-amber/5 p-4 text-[13px] text-ink-2">
                No proof file was uploaded for this reservation. Only payment details were submitted — check the reference before confirming.
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-line-soft pt-4">
              <Button variant="ghost" disabled={review.isPending} onClick={() => setReviewTarget(null)}>Cancel</Button>
              <Button data-testid="payment-review-reject" size="sm" variant="ghost" className="!text-danger" disabled={review.isPending} loading={review.isPending && review.variables?.action === 'REJECT'} onClick={() => review.mutate({ ticketId: reviewTarget.id, action: 'REJECT' })}><X size={14} /> Reject payment</Button>
              <Button data-testid="payment-review-confirm" size="sm" disabled={review.isPending} loading={review.isPending && review.variables?.action === 'CONFIRM'} onClick={() => review.mutate({ ticketId: reviewTarget.id, action: 'CONFIRM' })}><Check size={14} /> Confirm &amp; approve reservation</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}