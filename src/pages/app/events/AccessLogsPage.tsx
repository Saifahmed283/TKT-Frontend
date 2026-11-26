import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { timeAgo, cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Table, Td, Pagination, EmptyState } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { ScanLine, FileText, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'
import { exportCsv, exportPdf } from '@/lib/export'

type AccessLog = {
  id: string
  result: 'GRANTED' | 'DENIED'
  reason: string
  timestamp: string
  offline: boolean
  metadata?: { parseSource?: string; lookupMethod?: string; tampered?: boolean } | null
  area: { id: string; name: string } | null
  operator: { id: string; name: string } | null
  attendee: { id: string; name: string } | null
  credential: { id: string; code: string; ticket?: { ticketType?: { name: string } | null; busSeats?: { id: string; label: string; passengerName?: string | null; bus?: { name: string } | null }[] } | null } | null
}

export function AccessLogsPage() {
  const { eventId } = useParams()
  const sse = useSse(eventId, 'access')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['access-logs', eventId, page, sse],
    queryFn: () =>
      api.get<{ rows: AccessLog[]; total: number; page: number; pages: number }>(
        `/events/${eventId}/access/logs?page=${page}`,
      ),
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load access logs." onRetry={refetch} />

  const exportAll = async (kind: 'csv' | 'pdf') => {
    const eid = eventId ?? ''
    const all = await api.get<{ rows: AccessLog[] }>(`/events/${eid}/access/logs?page=1&pageSize=100000`)
    const headers = ['Attendee', 'Credential', 'Area', 'Result', 'Reason', 'Parse', 'Lookup', 'Operator', 'Timestamp']
    const rows = all.rows.map((l) => [
      l.attendee?.name ?? 'Unknown',
      l.credential?.code ?? '',
      l.area?.name ?? '',
      l.result,
      l.reason,
      l.metadata?.parseSource ?? '',
      l.metadata?.lookupMethod ?? '',
      l.operator?.name ?? '',
      new Date(l.timestamp).toLocaleString(),
    ])
    if (kind === 'csv') exportCsv(`access-logs-${eid.slice(0, 8)}`, headers, rows)
    else exportPdf(`access-logs-${eid.slice(0, 8)}`, 'Access Logs', headers, rows)
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Access Logs"
        subtitle={`${data.total} decisions recorded. Grants and denials stream in live.`}
        icon={<ScanLine className="size-5" />}
        actions={
          <>
            <button
              onClick={() => void exportAll('csv')}
              className="inline-flex h-10 items-center gap-2 rounded-none border border-line-soft bg-raised px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-signal/40 hover:text-ink"
            >
              <FileSpreadsheet className="size-4" /> CSV
            </button>
            <button
              onClick={() => void exportAll('pdf')}
              className="inline-flex h-10 items-center gap-2 rounded-none border border-line-soft bg-raised px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-signal/40 hover:text-ink"
            >
              <FileText className="size-4" /> PDF
            </button>
          </>
        }
      />
      <div className="pt-5">
        <Table headers={['Attendee', 'Credential', 'Area', 'Decision', 'Source', 'Operator', 'When']}>
          {data.rows.length === 0 && <EmptyState colSpan={7} title="No scans recorded" />}
          {data.rows.map((l) => (
            <tr key={l.id}>
              <Td className="text-[13px]"><div>{l.attendee?.name ?? 'Unknown'}</div>{(l.credential?.ticket?.busSeats?.length ?? 0) > 0 && <div className="mt-0.5 font-mono text-[10px] text-signal">{(l.credential?.ticket?.busSeats ?? []).map(s => `${s.bus?.name ? s.bus.name + ' ' : ''}${s.label}`).join(', ')}</div>}</Td>
              <Td>
                <span className="font-mono text-[11px] text-ink-2">{l.credential?.code.slice(0, 14) ?? '—'}</span>
              </Td>
              <Td className="text-[13px]">{l.area?.name ?? '—'}</Td>
              <Td>
                {l.result === 'GRANTED' ? (
                  <Badge tone="ok">GRANTED</Badge>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Badge tone="danger">DENIED</Badge>
                    <span className="font-mono text-[10px] text-ink-3">{l.reason}</span>
                  </span>
                )}
              </Td>
              <Td>
                <div className="flex flex-col gap-0.5 font-mono text-[10px] text-ink-3">
                  <span>{l.metadata?.parseSource ?? 'unknown'}</span>
                  <span>{l.metadata?.lookupMethod ?? 'none'}</span>
                </div>
              </Td>
              <Td className="text-[12px] text-ink-3">{l.operator?.name ?? '—'}</Td>
              <Td className={cn('text-[12px] text-ink-3', sse > 0 && 'text-signal')}>{timeAgo(l.timestamp)}</Td>
            </tr>
          ))}
        </Table>
        {data.pages > 1 && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}
      </div>
    </div>
  )
}