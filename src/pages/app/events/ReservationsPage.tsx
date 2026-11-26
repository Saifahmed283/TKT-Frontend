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
import { ClipboardCheck, QrCode, Download } from 'lucide-react'
import { downloadAuthFile, exportPdf } from '@/lib/export'
import { useEffect, useState } from 'react'

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
  seats?: { id: string; label: string; busId: string; passengerName?: string | null; busName?: string | null }[]
  attendee: { id: string; name: string; email: string | null; phone: string | null; status: string; gender?: string; nationality?: string; identityType?: 'NATIONAL_ID' | 'PASSPORT'; identityNumber?: string }
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
  const [resendTarget, setResendTarget] = useState<ReservationRow | null>(null)
  const [resendEmail, setResendEmail] = useState('')
  const [emailTplOpen, setEmailTplOpen] = useState(false)
  const [emailTpl, setEmailTpl] = useState({ subject: '', preheader: '', title: '', body: '', footer: '' })

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
        ,
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
    mutationFn: ({ ticketId, toEmail }: { ticketId: string; toEmail?: string }) => api.post(`/events/${eventId}/reservations/${ticketId}/resend`, toEmail ? { toEmail } : {}),
    onSuccess: () => {
      toast.success('Ticket email sent')
      setResendTarget(null)
      setResendEmail('')
      void qc.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (e) => {
      toast.error(e instanceof ApiError ? e.message : 'Send failed')
    },
  })

  const eventQ = useQuery({
    queryKey: ['event', eventId, 'emailTpl'],
    queryFn: () => api.get<any>(`/events/${eventId}`),
    enabled: emailTplOpen && !!eventId,
  })
  useEffect(() => {
    if (emailTplOpen && eventQ.data?.settings?.ticketEmail) {
      const s = eventQ.data.settings.ticketEmail as any
      setEmailTpl({ subject: s.subject ?? '', preheader: s.preheader ?? '', title: s.title ?? '', body: s.body ?? '', footer: s.footer ?? '' })
    }
  }, [emailTplOpen, eventQ.data])
  const saveEmailTpl = useMutation({
    mutationFn: () => api.patch(`/events/${eventId}`, { settings: { ...(eventQ.data?.settings ?? {}), ticketEmail: emailTpl } }),
    onSuccess: () => { toast.success('Ticket email template saved'); setEmailTplOpen(false); void qc.invalidateQueries({ queryKey: ['event', eventId] }) },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not save template'),
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
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => { const s = (eventQ.data?.settings?.ticketEmail ?? {}) as any; setEmailTpl({ subject: s.subject ?? '', preheader: s.preheader ?? '', title: s.title ?? '', body: s.body ?? '', footer: s.footer ?? '' }); setEmailTplOpen(true) }}>Email template</Button>
            <Button size="sm" variant="ghost" onClick={() => void downloadAuthFile(`/events/${eventId}/reservations/export.xlsx?status=${filter}`, `reservations-${eventId}.xlsx`).catch(() => toast.error('Export failed'))}><Download size={14} /> Excel</Button>
            <Button size="sm" variant="ghost" onClick={() => void downloadAuthFile(`/events/${eventId}/reservations/deliveries/export.xlsx`, `deliveries-${eventId}.xlsx`).catch(() => toast.error('Export failed'))}><Download size={14} /> Delivery log</Button>
            <Button size="sm" variant="ghost" onClick={() => exportPdf(`reservations-${eventId}`, 'Reservations', ['Code', 'Name', 'Email', 'Ticket', 'Amount', 'Approval', 'Payment', 'Issued'], (data.rows ?? []).map(r => [r.reservationCode ?? r.id.slice(0, 8), r.attendee.name, r.attendee.email ?? '', r.ticketType.name, r.price, r.approval, r.paymentStatus ?? '', timeAgo(r.issuedAt)]))}><Download size={14} /> PDF</Button>
          <div className="flex w-full flex-wrap gap-1 rounded-none border border-line bg-raised p-1 sm:w-auto">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  setPage(1)
                }}
                className={`min-h-11 rounded-none px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors ${
                  filter === f ? 'bg-signal text-on-signal' : 'text-ink-2 hover:bg-elevated hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          </div>
        }
      />
      <div className="pt-5">
        <Table dense headers={['Reservation', 'Attendee', 'Ticket', 'Approval', 'Payment', 'QR', 'When', 'Actions']}>
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
                {r.attendee.identityNumber && (
                  <details className="mt-1 text-[10px]">
                    <summary className="cursor-pointer text-signal">{r.attendee.identityType === 'NATIONAL_ID' ? 'National ID details' : 'Passport details'}</summary>
                    <div className="mt-1 space-y-0.5 border-s border-line-soft ps-2 text-ink-2">
                      <p>Gender: {r.attendee.gender ?? '—'}</p>
                      <p>Nationality: {r.attendee.nationality === 'EG' ? 'Egyptian' : 'Non-Egyptian'}</p>
                      <p className="break-all font-mono">{r.attendee.identityNumber}</p>
                    </div>
                  </details>
                )}
              </Td>
              <Td>
                <p className="text-[13px]">{r.ticketType.name}{(r.ticketType as any).tier ? <span className="ml-1 font-mono text-[10px] text-ink-3">{(r.ticketType as any).tier}</span> : null}</p>
                <p className="font-mono text-[10px] text-ink-3">
                  {Number(r.price) > 0 ? `EGP ${Number(r.price).toLocaleString()}` : 'FREE'}
                </p>
                {r.seats && r.seats.length > 0 && <p className="mt-1 font-mono text-[10px] text-signal">{r.seats.map(s => `${s.busName ? s.busName + ' ' : ''}${s.label}`).join(', ')}</p>}
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
                   <div className="flex flex-col items-end gap-2">
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
                         <Button
                           size="sm"
                           data-testid="manual-approve"
                           disabled={r.paymentStatus === 'PENDING'}
                           loading={decide.isPending && decide.variables?.ticketId === r.id && decide.variables?.approved}
                         >
                           Approve
                         </Button>
                       </ConfirmDialog>
                     </div>
                     {r.paymentStatus === 'PENDING' && <span className="font-mono text-[10px] text-ink-3">Confirm payment proof first</span>}
                   </div>
                 ) : r.credential && r.approval === 'APPROVED' ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setHistoryTicketId(r.id)}>
                      History
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setResendTarget(r); setResendEmail(r.attendee.email ?? '') }}
                    >
                      Send
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
              className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px] text-ink outline-none transition focus:border-gold/40"
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

      <Dialog open={!!resendTarget} onClose={() => { if (!resend.isPending) { setResendTarget(null); setResendEmail('') } }} title="Send ticket email">
        <div className="space-y-4">
          <p className="text-[13px] text-ink-2">Send the signed QR ticket for <span className="font-medium text-ink">{resendTarget?.attendee.name}</span>. Leave email as-is to resend, or change it to self-send / forward.</p>
          <label className="block space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Recipient email</span>
            <input value={resendEmail} onChange={e => setResendEmail(e.target.value)} type="email" className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px] text-ink outline-none transition focus:border-gold/40" />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setResendTarget(null); setResendEmail('') }} disabled={resend.isPending}>Cancel</Button>
            <Button loading={resend.isPending} disabled={!resendEmail.trim()} onClick={() => resendTarget && resend.mutate({ ticketId: resendTarget.id, toEmail: resendEmail.trim() })}>Send ticket</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={emailTplOpen} onClose={() => setEmailTplOpen(false)} title="Ticket email template" wide>
        <div className="space-y-3">
          <p className="text-[12px] text-ink-3">Customize reservation/ticket email text. Use {'{event}'} in subject/title/body. Leave blank to use defaults.</p>
          <label className="block space-y-1"><span className="text-[11px] text-ink-3">Subject</span><input className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px]" value={emailTpl.subject} onChange={e => setEmailTpl({ ...emailTpl, subject: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-[11px] text-ink-3">Preheader</span><input className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px]" value={emailTpl.preheader} onChange={e => setEmailTpl({ ...emailTpl, preheader: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-[11px] text-ink-3">Title</span><input className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px]" value={emailTpl.title} onChange={e => setEmailTpl({ ...emailTpl, title: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-[11px] text-ink-3">Body</span><textarea rows={4} className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px]" value={emailTpl.body} onChange={e => setEmailTpl({ ...emailTpl, body: e.target.value })} /></label>
          <label className="block space-y-1"><span className="text-[11px] text-ink-3">Footer</span><input className="w-full rounded-none border border-line bg-panel px-3 py-2 text-[13px]" value={emailTpl.footer} onChange={e => setEmailTpl({ ...emailTpl, footer: e.target.value })} /></label>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEmailTplOpen(false)}>Cancel</Button><Button loading={saveEmailTpl.isPending} onClick={() => saveEmailTpl.mutate()}>Save template</Button></div>
        </div>
      </Dialog>
    </div>
  )
}