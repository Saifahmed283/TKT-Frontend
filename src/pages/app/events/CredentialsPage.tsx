import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Select, Field } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { BadgeCheck, QrCode, Ban, Download, CreditCard, Send, Trash2 } from 'lucide-react'
import { downloadTicketPdf, downloadIdCardPdf, type CardIdentity } from '@/lib/cards'

type Credential = {
  id: string
  shortCode?: string | null
  code: string
  status: string
  payloadVersion?: string
  issuedAt: string
  lastUsedAt?: string | null
  attendee?: { id: string; name: string; email?: string | null } | null
  ticket?: {
    id: string
    typeName?: string
    deliveryStatus?: string | null
    deliveryChannel?: string | null
    lastDeliveryAt?: string | null
    ticketType?: { name?: string | null } | null
    busSeats?: { id: string; label: string; passengerName?: string | null; bus?: { name?: string | null } | null }[]
  } | null
}

type EventSummary = {
  id: string
  name: string
  startAt: string
  venueName: string | null
}

export function CredentialsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const activitySse = useSse(eventId, 'activity')
  const reservationSse = useSse(eventId, 'reservation')
  const [issueOpen, setIssueOpen] = useState(false)
  const [attendeeId, setAttendeeId] = useState('')
  const [showQr, setShowQr] = useState<string | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [resendTarget, setResendTarget] = useState<Credential | null>(null)
  const [resendEmail, setResendEmail] = useState('')

  const history = useQuery({
    queryKey: ['credential-detail', eventId, historyId],
    queryFn: () =>
      api.get<{ deliveryLogs?: Array<{ id: string; channel: string; status: string; recipient: string | null; provider: string | null; attempt: number; createdAt: string; error: string | null }> }>(
        `/events/${eventId}/credentials/${historyId}`,
      ),
    enabled: !!historyId,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['credentials', eventId, activitySse, reservationSse],
    queryFn: () => api.get<Credential[] | { rows: Credential[] }>(`/events/${eventId}/credentials`).then((r) => Array.isArray(r) ? r : r.rows ?? []),
  })

  const event = useQuery({
    queryKey: ['event-summary', eventId],
    queryFn: () => api.get<EventSummary>(`/events/${eventId}`),
  })

  const ticketTypeName = (c: Credential) => c.ticket?.ticketType?.name ?? c.ticket?.typeName ?? 'Ticket'

  const pdfIdentity = (c: Credential): CardIdentity => ({
    eventName: event.data?.name ?? 'TKT Event',
    eventDate: event.data?.startAt ? new Date(event.data.startAt).toLocaleDateString() : '',
    venue: event.data?.venueName ?? null,
    attendeeName: c.attendee?.name ?? 'Attendee',
    ticketType: ticketTypeName(c),
    shortCode: c.shortCode ?? null,
    code: c.code,
    seats: (c.ticket?.busSeats ?? []).map(s => ({ label: s.label, busName: s.bus?.name ?? null, passengerName: s.passengerName ?? null })),
  })

  const attendees = useQuery({
    queryKey: ['attendees-eligible', eventId],
    queryFn: () =>
      api
        .get<{ rows: { id: string; name: string; credential: { id: string } | null }[] }>(`/events/${eventId}/attendees?page=1&limit=200`)
        .then((r) => r.rows.filter((a) => !a.credential)),
  })

  const issue = useMutation({
    mutationFn: () => api.post<{ id: string; code: string }>(`/events/${eventId}/credentials`, { attendeeId }),
    onSuccess: (res) => {
      toast.success('Credential issued')
      setIssueOpen(false)
      setAttendeeId('')
      qc.invalidateQueries({ queryKey: ['credentials'] })
      qc.invalidateQueries({ queryKey: ['attendees-eligible'] })
      setShowQr(res.id)
    },
    onError: () => toast.error('Could not issue credential'),
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.patch(`/events/${eventId}/credentials/${id}/status`, { status: 'REVOKED' }),
    onSuccess: () => {
      toast.success('Credential revoked')
      qc.invalidateQueries({ queryKey: ['credentials'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/credentials/${id}`),
    onSuccess: () => {
      toast.success('Credential deleted')
      qc.invalidateQueries({ queryKey: ['credentials'] })
      qc.invalidateQueries({ queryKey: ['attendees-eligible'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete credential'),
  })

  const resend = useMutation({
    mutationFn: ({ ticketId, toEmail }: { ticketId: string; toEmail: string }) => api.post(`/events/${eventId}/reservations/${ticketId}/resend`, { toEmail }),
    onSuccess: () => { toast.success('Ticket email sent'); setResendTarget(null); setResendEmail(''); qc.invalidateQueries({ queryKey: ['credentials'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not send ticket'),
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load credentials." onRetry={refetch} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    issue.mutate()
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Credentials"
        subtitle="Signed access passes. Issue one per ticket holder."
        icon={<BadgeCheck className="size-5" />}
        actions={
          <Button onClick={() => setIssueOpen(true)} icon={<QrCode className="size-4" />}>
            Issue Credential
          </Button>
        }
      />

      <div className="pt-5">
        <Table dense headers={['Credential', 'Attendee', 'Ticket', 'Status', 'Delivery', 'Issued', 'Last used', '']}>
          {data.length === 0 && <EmptyState colSpan={8} title="No credentials issued" />}
          {data.map((c) => (
            <tr key={c.id} className="group">
              <Td>
                <div className="flex flex-col gap-1">
                  <span className="inline-flex w-fit items-center rounded-none border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-signal">
                    {c.shortCode ?? c.code.slice(0, 12)}
                  </span>
                  <span className="font-mono text-[10px] text-ink-3" title={c.code}>
                    secure QR payload
                  </span>
                </div>
              </Td>
              <Td className="text-[13px]">{c.attendee?.name ?? 'Unknown attendee'}</Td>
              <Td>
                <span className="rounded-none border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
                  {ticketTypeName(c)}
                </span>
              </Td>
              <Td>
                <Badge tone={c.status === 'ACTIVE' ? 'ok' : 'default'}>{c.status}</Badge>
              </Td>
              <Td>
                <div className="flex flex-col gap-0.5 font-mono text-[10px] text-ink-3">
                  <span>{c.ticket?.deliveryChannel ?? 'EMAIL'}</span>
                  <span>{c.ticket?.deliveryStatus ?? 'PENDING'}</span>
                </div>
              </Td>
              <Td className="text-[12px] text-ink-3">{c.issuedAt.split('T')[0]}</Td>
              <Td className="text-[12px] text-ink-3">{c.lastUsedAt ? c.lastUsedAt.split('T')[0] : '—'}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <button data-testid="credential-reveal" className="grid min-h-11 min-w-11 place-items-center rounded-none text-ink-2 hover:bg-raised" onClick={() => setShowQr(c.id)} aria-label="Show QR"><QrCode className="size-4" /></button>
                  {c.ticket?.id && <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-ink-2 hover:bg-raised" onClick={() => { setResendTarget(c); setResendEmail(c.attendee?.email ?? '') }} aria-label="Send ticket"><Send className="size-4" /></button>}
                  <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-ink-2 hover:bg-raised" onClick={() => setHistoryId(c.id)} aria-label="Delivery history"><span className="font-mono text-[10px]">LOG</span></button>
                  <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-ink-2 hover:bg-raised" onClick={() => void downloadTicketPdf(pdfIdentity(c))} aria-label="Download ticket PDF"><Download className="size-4" /></button>
                  <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-ink-2 hover:bg-raised" onClick={() => void downloadIdCardPdf(pdfIdentity(c))} aria-label="Download ID card PDF"><CreditCard className="size-4" /></button>
                  {c.status === 'ACTIVE' && (
                    <ConfirmDialog title="Revoke credential?" body={`Revoke credential for ${c.attendee?.name ?? 'this attendee'}? This disables access.`} confirmLabel="Revoke" onConfirm={() => revoke.mutate(c.id)}>
                      <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-danger hover:bg-danger/10" aria-label="Revoke"><Ban className="size-4" /></button>
                    </ConfirmDialog>
                  )}
                  {c.status !== 'ACTIVE' && (
                    <ConfirmDialog title="Delete credential?" body="Delete this credential permanently? Only allowed when there are no access logs." confirmLabel="Delete" onConfirm={() => remove.mutate(c.id)}>
                      <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-danger hover:bg-danger/10" aria-label="Delete"><Trash2 className="size-4" /></button>
                    </ConfirmDialog>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      {/* Issue dialog */}
      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} title="Issue credential">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Attendee" hint="Only attendees without a credential are listed">
            <Select required value={attendeeId} onChange={(e) => setAttendeeId(e.target.value)}>
              <option value="">Select attendee…</option>
              {attendees.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={issue.isPending}>
              Issue & sign
            </Button>
          </div>
        </form>
      </Dialog>

      {/* QR / payload dialog */}
      <CredentialQrDialog
        open={showQr !== null}
        onClose={() => setShowQr(null)}
        eventId={eventId!}
        credentialId={showQr}
      />

      <Dialog open={!!historyId} onClose={() => setHistoryId(null)} title="Delivery history">
        <div className="space-y-2">
          {history.isLoading && <p className="text-[13px] text-ink-3">Loading...</p>}
          {!history.isLoading && (history.data?.deliveryLogs?.length ?? 0) === 0 && <p className="text-[13px] text-ink-3">No delivery attempts recorded.</p>}
          {history.data?.deliveryLogs?.map((d) => (
            <div key={d.id} className="border border-line-soft bg-elevated/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="font-mono text-ink-2">{d.channel} · {d.status}</span>
                <span className="text-ink-3">{new Date(d.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-ink-3">{d.recipient ?? '—'} · attempt {d.attempt}{d.provider ? ` · ${d.provider}` : ''}{d.error ? ` · ${d.error}` : ''}</p>
            </div>
          ))}
        </div>
      </Dialog>

      <Dialog open={!!resendTarget} onClose={() => { if (!resend.isPending) { setResendTarget(null); setResendEmail('') } }} title="Send ticket email">
        <div className="space-y-4">
          <p className="text-[13px] text-ink-2">Send ticket for <span className="font-medium text-ink">{resendTarget?.attendee?.name ?? 'attendee'}</span>.</p>
          <Field label="Recipient email"><input value={resendEmail} onChange={e => setResendEmail(e.target.value)} type="email" className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px] text-ink outline-none transition focus:border-gold/40" /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setResendTarget(null); setResendEmail('') }} disabled={resend.isPending}>Cancel</Button>
            <Button loading={resend.isPending} disabled={!resendEmail.trim() || !resendTarget?.ticket?.id} onClick={() => resendTarget?.ticket?.id && resend.mutate({ ticketId: resendTarget.ticket.id, toEmail: resendEmail.trim() })}>Send ticket</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function CredentialQrDialog({
  open,
  onClose,
  eventId,
  credentialId,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  credentialId: string | null
}) {
  const { data } = useQuery({
    queryKey: ['credential-payload', eventId, credentialId],
    queryFn: () => api.get<Credential>(`/events/${eventId}/credentials/${credentialId}/offline-payload`),
    enabled: open && !!credentialId,
  })

  const download = (payload: string, code: string) => {
    const blob = new Blob([payload], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${code}.tkt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onClose={onClose} title={data?.shortCode ?? 'Credential'}>
      <div className="flex flex-col items-center gap-4">
        {data && (
          <>
            <div className="rounded-none border border-signal/30 bg-signal/10 px-5 py-3 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-3">Ticket code</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.12em] text-signal">{data.shortCode ?? 'PENDING'}</p>
            </div>
            <p data-testid="qr-payload" className="max-w-full break-all rounded-none border border-line bg-canvas px-3 py-2 text-center font-mono text-[10px] leading-relaxed text-ink-3">
              Secure signed QR payload attached to this code
            </p>
            <div className="w-full rounded-none border border-line bg-raised px-4 py-3 text-center">
              <p className="text-[13px] font-medium">{data.attendee?.name ?? 'Unknown attendee'}</p>
              <p className="mt-0.5 text-[11px] text-ink-3">
                {(data.ticket?.ticketType?.name ?? data.ticket?.typeName ?? 'Ticket')} · {data.status}
              </p>

              {(data.ticket?.busSeats?.length ?? 0) > 0 && (
                <div className="border border-line-soft bg-elevated/20 px-3 py-2 text-[12px] text-ink-2">
                  <span className="text-ink-3">Seats: </span>
                  {(data.ticket?.busSeats ?? []).map((s: any) => (s.bus?.name ? s.bus.name + ' ' : '') + s.label + (s.passengerName ? ` (${s.passengerName})` : '')).join(', ')}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => download(data.code, data.shortCode ?? data.code.slice(0, 16))} icon={<Download className="size-4" />}>
              Download payload
            </Button>
          </>
        )}
      </div>
    </Dialog>
  )
}