import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { timeAgo } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Table, Td, Pagination, EmptyState } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'
import { useSse } from '@/lib/sse'
import { Dialog } from '@/components/ui/dialog'
import { ClipboardCheck, QrCode } from 'lucide-react'
import { useState } from 'react'

type ReservationRow = {
  id: string
  status: string
  reservationCode: string | null
  approval: 'PENDING' | 'APPROVED' | 'REJECTED'
  paymentStatus?: 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'
  deliveryStatus?: string
  deliveryChannel?: string
  price: string
  issuedAt: string
  approvedAt?: string | null
  rejectedReason?: string | null
  attendee: { id: string; name: string; email: string | null; phone: string | null; status: string }
  ticketType: { id: string; name: string; price: string | null }
  credential: { id: string; code: string; status: string } | null
}

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'

export function ReservationsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const activitySse = useSse(eventId, 'activity')
  const reservationSse = useSse(eventId, 'reservation')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [rejectTarget, setRejectTarget] = useState<ReservationRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [historyTicketId, setHistoryTicketId] = useState<string | null>(null)

  const history = useQuery({
    queryKey: ['reservation-deliveries', eventId, historyTicketId],
    queryFn: () =>
      api.get<Array<{ id: string; channel: string; status: string; recipient: string | null; provider: string | null; attempt: number; createdAt: string; error: string | null }>>(
        `/events/${eventId}/reservations/${historyTicketId}/deliveries`,
      ),
    enabled: !!historyTicketId,
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reservations', eventId, page, filter, activitySse, reservationSse],
    queryFn: () =>
      api
        .get<{ rows: ReservationRow[]; total: number; page: number; pageSize: number }>(
          `/events/${eventId}/reservations?status=${filter}&page=${page}`,
        )
        .catch(() => null),
  })

  const decide = useMutation({
    mutationFn: ({ ticketId, approved, reason }: { ticketId: string; approved: boolean; reason?: string }) =>
      api.post(`/events/${eventId}/reservations/${ticketId}/decision`, { approved, reason }),
    onSuccess: (_d, vars) => {
      toast.success(vars.approved ? 'Reservation approved — QR ticket emailed' : 'Reservation rejected')
      setRejectTarget(null)
      setRejectReason('')
      void qc.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : 'Decision failed')
    },
  })

  const resend = useMutation({
    mutationFn: (ticketId: string) => api.post(`/events/${eventId}/reservations/${ticketId}/resend`, {}),
    onSuccess: () => {
      toast.success('Ticket email resent')
      void qc.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : 'Resend failed')
    },
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load reservations." onRetry={refetch} />

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <div className="pb-16">
      <PageHeader
        title="Reservations"
        subtitle={`${data.total} public registrations. Paid reservations wait for your decision before a QR is issued.`}
        icon={<ClipboardCheck className="size-5" />}
        actions={
          <div className="flex gap-1 rounded-lg border border-line bg-raised p-1">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  setPage(1)
                }}
                className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                  filter === f ? 'bg-signal text-black' : 'text-ink-2 hover:bg-elevated hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />
      <div className="px-6 pt-5">
        <Table headers={['Reservation', 'Attendee', 'Ticket', 'Approval', 'Payment', 'QR', 'When', 'Actions']}>
          {data.rows.length === 0 && (
            <EmptyState colSpan={8} title="No reservations in this view" />
          )}
          {data.rows.map((r) => (
            <tr key={r.id}>
              <Td>
                <span className="font-mono text-[11px] text-signal">{r.reservationCode ?? r.id.slice(0, 8)}</span>
              </Td>
              <Td>
                <p className="text-[13px]">{r.attendee.name}</p>
                <p className="font-mono text-[10px] text-ink-3">{r.attendee.email}</p>
              </Td>
              <Td>
                <p className="text-[13px]">{r.ticketType.name}</p>
                <p className="font-mono text-[10px] text-ink-3">
                  {Number(r.price) > 0 ? `$${Number(r.price).toLocaleString()}` : 'FREE'}
                </p>
              </Td>
              <Td>
                {r.approval === 'APPROVED' ? (
                  <Badge tone="ok">APPROVED</Badge>
                ) : r.approval === 'REJECTED' ? (
                  <Badge tone="danger">REJECTED</Badge>
                ) : (
                  <Badge tone="live">PENDING</Badge>
                )}
                {r.rejectedReason && <p className="mt-1 max-w-48 text-[11px] text-ink-3">{r.rejectedReason}</p>}
              </Td>
              <Td>
                {r.paymentStatus === 'CONFIRMED' ? (
                  <Badge tone="ok">CONFIRMED</Badge>
                ) : r.paymentStatus === 'PENDING' ? (
                  <Badge tone="live">PENDING</Badge>
                ) : r.paymentStatus === 'FAILED' || r.paymentStatus === 'REFUNDED' ? (
                  <Badge tone="danger">{r.paymentStatus}</Badge>
                ) : (
                  <span className="font-mono text-[10px] text-ink-3">N/A</span>
                )}
              </Td>
              <Td>
                {r.credential ? (
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-ok">
                      <QrCode className="size-3.5" /> issued
                    </span>
                    <span className="font-mono text-[10px] text-ink-3">{r.deliveryStatus ?? 'PENDING'}</span>
                  </div>
                ) : r.approval === 'PENDING' ? (
                  <span className="font-mono text-[10px] text-ink-3">awaiting approval</span>
                ) : (
                  <span className="font-mono text-[10px] text-ink-3">—</span>
                )}
              </Td>
              <Td className="text-[12px] text-ink-3">{timeAgo(r.issuedAt)}</Td>
              <Td className="text-end">
                {r.approval === 'PENDING' ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="!text-danger"
                      disabled={decide.isPending}
                      onClick={() => {
                        setRejectTarget(r)
                        setRejectReason('')
                      }}
                    >
                      Reject
                    </Button>
                    <ConfirmDialog
                      title="Approve reservation?"
                      body={`Approving issues a signed QR ticket for ${r.attendee.name} and emails it immediately.`}
                      confirmLabel="Approve"
                      onConfirm={() => decide.mutate({ ticketId: r.id, approved: true })}
                    >
                      <Button size="sm" loading={decide.isPending && decide.variables?.ticketId === r.id && decide.variables?.approved}>
                        Approve
                      </Button>
                    </ConfirmDialog>
                  </div>
                ) : r.credential && r.approval === 'APPROVED' ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setHistoryTicketId(r.id)}>
                      History
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resend.isPending}
                      loading={resend.isPending && resend.variables === r.id}
                      onClick={() => resend.mutate(r.id)}
                    >
                      Resend
                    </Button>
                  </div>
                ) : (
                  <span className="font-mono text-[10px] text-ink-3">—</span>
                )}
              </Td>
            </tr>
          ))}
        </Table>
        {pages > 1 && <Pagination page={data.page} pages={pages} onPage={setPage} />}
      </div>

      <Dialog
        open={!!rejectTarget}
        onClose={() => {
          if (decide.isPending) return
          setRejectTarget(null)
          setRejectReason('')
        }}
        title="Reject reservation"
      >
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-ink-2">
            Rejecting cancels the ticket for <span className="font-medium text-ink">{rejectTarget?.attendee.name}</span> and notifies them by email.
          </p>
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Reason (optional)</span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={280}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-[13px] text-ink outline-none transition focus:border-gold/40"
              placeholder="Optional note for audit/internal context"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason('')
              }}
              disabled={decide.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={decide.isPending && !!rejectTarget && decide.variables?.ticketId === rejectTarget.id && !decide.variables?.approved}
              onClick={() => {
                if (!rejectTarget) return
                decide.mutate({ ticketId: rejectTarget.id, approved: false, reason: rejectReason.trim() || undefined })
              }}
            >
              Reject reservation
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!historyTicketId} onClose={() => setHistoryTicketId(null)} title="Delivery history">
        <div className="space-y-2">
          {history.isLoading && <p className="text-[13px] text-ink-3">Loading...</p>}
          {!history.isLoading && (history.data?.length ?? 0) === 0 && <p className="text-[13px] text-ink-3">No delivery attempts recorded.</p>}
          {history.data?.map((d) => (
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
    </div>
  )
}