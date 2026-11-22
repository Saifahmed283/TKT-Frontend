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
import { ClipboardCheck, QrCode } from 'lucide-react'
import { useState } from 'react'

type ReservationRow = {
  id: string
  status: string
  reservationCode: string | null
  approval: 'PENDING' | 'APPROVED' | 'REJECTED'
  price: string
  issuedAt: string
  attendee: { id: string; name: string; email: string | null; phone: string | null; status: string }
  ticketType: { id: string; name: string; price: string | null }
  credential: { id: string; code: string; status: string } | null
}

type Filter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'

export function ReservationsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'activity')
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Filter>('PENDING')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reservations', eventId, page, filter, sse],
    queryFn: () =>
      api
        .get<{ rows: ReservationRow[]; total: number; page: number; pageSize: number }>(
          `/events/${eventId}/reservations?status=${filter}&page=${page}`,
        )
        .catch(() => null),
  })

  const decide = useMutation({
    mutationFn: ({ ticketId, approved }: { ticketId: string; approved: boolean }) =>
      api.post(`/events/${eventId}/reservations/${ticketId}/decision`, { approved }),
    onSuccess: (_d, vars) => {
      toast.success(vars.approved ? 'Reservation approved — QR ticket emailed' : 'Reservation rejected')
      void qc.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : 'Decision failed')
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
        <Table headers={['Reservation', 'Attendee', 'Ticket', 'Approval', 'QR', 'When', 'Actions']}>
          {data.rows.length === 0 && (
            <EmptyState colSpan={7} title="No reservations in this view" />
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
              </Td>
              <Td>
                {r.credential ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-ok">
                    <QrCode className="size-3.5" /> issued
                  </span>
                ) : r.approval === 'PENDING' ? (
                  <span className="font-mono text-[10px] text-ink-3">—</span>
                ) : (
                  <span className="font-mono text-[10px] text-ink-3">—</span>
                )}
              </Td>
              <Td className="text-[12px] text-ink-3">{timeAgo(r.issuedAt)}</Td>
              {r.approval === 'PENDING' && (
                <Td className="text-end">
                  <div className="flex justify-end gap-2">
                    <ConfirmDialog
                      title="Reject reservation?"
                      body={`Rejecting cancels the ticket for ${r.attendee.name} and notifies them by email.`}
                      confirmLabel="Reject"
                      onConfirm={() => decide.mutate({ ticketId: r.id, approved: false })}
                    >
                      <Button size="sm" variant="outline" className="!text-danger">
                        Reject
                      </Button>
                    </ConfirmDialog>
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
                </Td>
              )}
            </tr>
          ))}
        </Table>
        {pages > 1 && <Pagination page={data.page} pages={pages} onPage={setPage} />}
      </div>
    </div>
  )
}