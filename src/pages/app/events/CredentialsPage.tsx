import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Select, Field } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { BadgeCheck, QrCode, Ban, Download, CreditCard } from 'lucide-react'
import { downloadTicketPdf, downloadIdCardPdf, type CardIdentity } from '@/lib/cards'

type Credential = {
  id: string
  code: string
  status: string
  payloadVersion: string
  issuedAt: string
  lastUsedAt: string | null
  attendee: { id: string; name: string }
  ticket: { id: string; typeName: string }
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
  const sse = useSse(eventId, 'activity')
  const [issueOpen, setIssueOpen] = useState(false)
  const [attendeeId, setAttendeeId] = useState('')
  const [showQr, setShowQr] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['credentials', eventId, sse],
    queryFn: () => api.get<Credential[]>(`/events/${eventId}/credentials`).catch(() => []),
  })

  const event = useQuery({
    queryKey: ['event-summary', eventId],
    queryFn: () => api.get<EventSummary>(`/events/${eventId}`).catch(() => null),
  })

  const pdfIdentity = (c: Credential): CardIdentity => ({
    eventName: event.data?.name ?? 'TKT Event',
    eventDate: event.data?.startAt ? new Date(event.data.startAt).toLocaleDateString() : '',
    venue: event.data?.venueName ?? null,
    attendeeName: c.attendee.name,
    ticketType: c.ticket.typeName,
    code: c.code,
  })

  const attendees = useQuery({
    queryKey: ['attendees-eligible', eventId],
    queryFn: () =>
      api
        .get<{ rows: { id: string; name: string; credential: { id: string } | null }[] }>(`/events/${eventId}/attendees?page=1&limit=200`)
        .then((r) => r.rows.filter((a) => !a.credential))
        .catch(() => []),
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

      <div className="px-6 pt-5">
        <Table headers={['Credential', 'Attendee', 'Ticket', 'Status', 'Issued', 'Last used', '']}>
          {data.length === 0 && <EmptyState colSpan={7} title="No credentials issued" />}
          {data.map((c) => (
            <tr key={c.id} className="group">
              <Td>
                <span className="font-mono text-[12px] text-signal">{c.code}</span>
              </Td>
              <Td className="text-[13px]">{c.attendee.name}</Td>
              <Td>
                <span className="rounded border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
                  {c.ticket.typeName}
                </span>
              </Td>
              <Td>
                <Badge tone={c.status === 'ACTIVE' ? 'ok' : 'default'}>{c.status}</Badge>
              </Td>
              <Td className="text-[12px] text-ink-3">{c.issuedAt.split('T')[0]}</Td>
              <Td className="text-[12px] text-ink-3">{c.lastUsedAt ? c.lastUsedAt.split('T')[0] : '—'}</Td>
              <Td>
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="rounded p-1.5 text-ink-2 hover:bg-raised"
                    onClick={() => setShowQr(c.id)}
                    aria-label="Show QR"
                  >
                    <QrCode className="size-4" />
                  </button>
                  <button
                    className="rounded p-1.5 text-ink-2 hover:bg-raised"
                    onClick={() => void downloadTicketPdf(pdfIdentity(c))}
                    aria-label="Download ticket PDF"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    className="rounded p-1.5 text-ink-2 hover:bg-raised"
                    onClick={() => void downloadIdCardPdf(pdfIdentity(c))}
                    aria-label="Download ID card PDF"
                  >
                    <CreditCard className="size-4" />
                  </button>
                  {c.status === 'ACTIVE' && (
                    <button
                      className="rounded p-1.5 text-danger hover:bg-danger/10"
                      onClick={() => revoke.mutate(c.id)}
                      aria-label="Revoke"
                    >
                      <Ban className="size-4" />
                    </button>
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
    queryFn: () => api.get<Credential>(`/events/${eventId}/credentials/${credentialId}/offline-payload`).catch(() => null),
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
    <Dialog open={open} onClose={onClose} title={data ? data.code.split('.').slice(0, 2).join('.') + '…' : 'Credential'}>
      <div className="flex flex-col items-center gap-4">
        {data && (
          <>
            <p className="max-w-full break-all rounded-md border border-line bg-canvas px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-ink-2">
              {data.code}
            </p>
            <div className="w-full rounded-lg border border-line bg-raised px-4 py-3 text-center">
              <p className="text-[13px] font-medium">{data.attendee.name}</p>
              <p className="mt-0.5 text-[11px] text-ink-3">
                {data.ticket.typeName} · {data.status}
              </p>
            </div>
            <Button variant="outline" onClick={() => download(data.code, data.code.slice(0, 16))} icon={<Download className="size-4" />}>
              Download payload
            </Button>
          </>
        )}
      </div>
    </Dialog>
  )
}