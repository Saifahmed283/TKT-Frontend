import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { StatCard } from '@/components/motion/primitives'
import { Radio, Wifi, WifiOff, ShieldOff, RefreshCw } from 'lucide-react'

type Device = {
  id: string
  name: string
  type: string
  status: 'REGISTERED' | 'ACTIVE' | 'DISABLED' | 'REVOKED'
  networkStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  lastSeenAt?: string | null
  lastHeartbeatAt?: string | null
  lastIp?: string | null
  appVersion?: string | null
  presence: 'online' | 'stale' | 'offline' | 'never'
  secondsSinceSeen?: number | null
  owner?: { id: string; name: string; email: string } | null
  _count?: { accessLogs: number }
}

type Stats = { total: number; online: number; stale: number; offline: number; disabled: number; networkOnline: number }

function fmtAgo(seconds?: number | null) {
  if (seconds == null) return 'Never'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

export function DevicesPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'activity')

  const devices = useQuery({
    queryKey: ['devices', eventId, sse],
    queryFn: () => api.get<Device[]>(`/events/${eventId}/devices`),
    refetchInterval: 15000,
  })
  const stats = useQuery({
    queryKey: ['device-stats', eventId, sse],
    queryFn: () => api.get<Stats>(`/events/${eventId}/devices/stats`),
    refetchInterval: 15000,
  })

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'DISABLED' | 'REVOKED' }) =>
      api.patch(`/events/${eventId}/devices/${id}`, { status }),
    onSuccess: () => { toast.success('Device updated'); qc.invalidateQueries({ queryKey: ['devices'] }); qc.invalidateQueries({ queryKey: ['device-stats'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not update device'),
  })

  if (devices.isLoading) return <FullPageSpinner />
  if (devices.error) return <InlineError message="Could not load devices." onRetry={() => devices.refetch()} />

  const s = stats.data
  return (
    <div className="pb-16">
      <PageHeader title="Devices & Scan Ops" subtitle="Monitor scanner devices, heartbeats, network state, and disable compromised devices." icon={<Radio className="size-5" />} actions={<Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => { devices.refetch(); stats.refetch() }}>Refresh</Button>} />
      <div className="grid gap-4 px-6 pt-6 md:grid-cols-4">
        <StatCard label="Total devices" value={String(s?.total ?? 0)} icon={<Radio className="size-4" />} />
        <StatCard label="Online now" value={String(s?.online ?? 0)} icon={<Wifi className="size-4" />} />
        <StatCard label="Stale / offline" value={String((s?.stale ?? 0) + (s?.offline ?? 0))} icon={<WifiOff className="size-4" />} />
        <StatCard label="Disabled / revoked" value={String(s?.disabled ?? 0)} icon={<ShieldOff className="size-4" />} />
      </div>
      <div className="px-6 pt-6">
        <Table headers={['Device', 'Owner', 'Status', 'Network', 'Last seen', 'Scans', '']}>
          {(devices.data ?? []).length === 0 && <EmptyState colSpan={7} title="No devices registered" body="Devices register when a scanner signs in and enables offline mode." />}
          {(devices.data ?? []).map((d) => (
            <tr key={d.id}>
              <Td><div className="font-medium text-ink">{d.name}</div><div className="text-[11px] text-ink-3">{d.type} {d.appVersion ? `· v${d.appVersion}` : ''}</div></Td>
              <Td><div className="text-[12px]">{d.owner?.name ?? '—'}</div><div className="text-[11px] text-ink-3">{d.lastIp ?? ''}</div></Td>
              <Td><Badge tone={d.status === 'ACTIVE' ? 'ok' : d.status === 'REGISTERED' ? 'warn' : 'danger'}>{d.status}</Badge></Td>
              <Td><Badge tone={d.presence === 'online' ? 'ok' : d.presence === 'stale' ? 'warn' : 'danger'}>{d.presence}</Badge><div className="text-[11px] text-ink-3 mt-1">{d.networkStatus}</div></Td>
              <Td className="text-[12px]">{fmtAgo(d.secondsSinceSeen)}</Td>
              <Td className="text-[12px]">{d._count?.accessLogs ?? 0}</Td>
              <Td>
                <div className="flex justify-end gap-2">
                  {d.status !== 'DISABLED' && d.status !== 'REVOKED' && <Button variant="ghost" size="sm" className="text-danger" onClick={() => patch.mutate({ id: d.id, status: 'DISABLED' })}>Disable</Button>}
                  {(d.status === 'DISABLED' || d.status === 'REVOKED') && <Button variant="ghost" size="sm" onClick={() => patch.mutate({ id: d.id, status: 'ACTIVE' })}>Enable</Button>}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
