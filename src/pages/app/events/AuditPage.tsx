import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Table, Td, Pagination, EmptyState } from '@/components/ui/table'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { ClipboardList, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AuditEntry = {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  previousValue: unknown | null
  newValue: unknown | null
  result: string
  sourceIp: string | null
  timestamp: string
  actor: { name: string } | null
}

type AuditResponse = {
  rows: AuditEntry[]
  total: number
  page: number
  pageSize: number
}

export function AuditPage() {
  const { eventId } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? '1')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit', eventId, page],
    queryFn: () => api.get<AuditResponse>(`/events/${eventId}/audit-logs?page=${page}`),
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load audit trail." onRetry={refetch} />

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize))

  const exportCsv = () => {
    const header = 'action,entityType,entityId,actor,result,createdAt,details'
    const rows = data.rows.map((r) =>
      [
        r.action,
        r.resourceType,
        r.resourceId ?? '',
        r.actor?.name ?? '',
        r.result,
        r.timestamp,
        JSON.stringify(r.newValue ?? r.previousValue ?? {}),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-${eventId}-p${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Audit Trail"
        subtitle={`${data.total} events recorded. Immutable by design.`}
        icon={<ClipboardList className="size-5" />}
        actions={
          <Button variant="outline" onClick={exportCsv} icon={<Download className="size-4" />}>
            Export CSV
          </Button>
        }
      />
      <div className="pt-5">
        <Table headers={['Action', 'Entity', 'Actor', 'Result', 'Details', 'When']}>
          {data.rows.length === 0 && <EmptyState colSpan={6} title="No audit entries yet" />}
          {data.rows.map((r) => (
            <tr key={r.id}>
              <Td>
                <span className="font-mono text-[12px] text-signal">{r.action}</span>
              </Td>
              <Td>
                <span className="rounded-none border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
                  {r.resourceType}
                </span>
              </Td>
              <Td className="text-[13px]">{r.actor?.name ?? 'System'}</Td>
              <Td>
                <span
                  className={
                    r.result === 'SUCCESS'
                      ? 'rounded-none border border-ok/30 bg-ok/10 px-1.5 py-0.5 text-[10px] text-ok'
                      : 'rounded-none border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[10px] text-danger'
                  }
                >
                  {r.result}
                </span>
              </Td>
              <Td className="max-w-[260px]">
                <span className="block truncate font-mono text-[10px] text-ink-3">
                  {r.newValue ? JSON.stringify(r.newValue) : r.previousValue ? JSON.stringify(r.previousValue) : '—'}
                </span>
              </Td>
              <Td className="text-[12px] text-ink-3">{timeAgo(r.timestamp)}</Td>
            </tr>
          ))}
        </Table>
        {pages > 1 && (
          <Pagination page={data.page} pages={pages} onPage={(p) => setParams({ page: String(p) })} />
        )}
      </div>
    </div>
  )
}