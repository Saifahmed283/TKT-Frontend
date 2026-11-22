import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle, Clock, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Corners, Blink } from '@/components/instruments'
import { Badge } from '@/components/ui/badge'

export type FeedActivity = {
  id: string
  result: 'GRANTED' | 'DENIED'
  reason: string
  timestamp: string
  offline: boolean
  event: { id: string; name: string }
  area: { name: string } | null
  operator: { name: string } | null
  attendee: { name: string } | null
  credential: { code: string } | null
}

type ResultFilter = 'all' | 'valid' | 'invalid'

function ResultIcon({ result }: { result: string }) {
  if (result === 'GRANTED') return <CheckCircle2 className="size-5 shrink-0 text-ok" />
  if (result === 'DENIED') return <XCircle className="size-5 shrink-0 text-danger" />
  return <Clock className="size-5 shrink-0 text-warn" />
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function LiveActivityFeed({ activities }: { activities: FeedActivity[] }) {
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')
  const [eventFilter, setEventFilter] = useState('all')

  const eventOptions = useMemo(() => {
    const names = new Set<string>()
    for (const a of activities) names.add(a.event?.name?.trim() || 'Unassigned Event')
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [activities])

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const eventName = a.event?.name?.trim() || 'Unassigned Event'
      const valid = a.result === 'GRANTED'
      const matchesResult =
        resultFilter === 'all' || (resultFilter === 'valid' && valid) || (resultFilter === 'invalid' && !valid)
      const matchesEvent = eventFilter === 'all' || eventName === eventFilter
      return matchesResult && matchesEvent
    })
  }, [activities, resultFilter, eventFilter])

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    const groups = new Map<string, FeedActivity[]>()
    for (const a of sorted) {
      const key = a.event?.name?.trim() || 'Unassigned Event'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(a)
    }
    return Array.from(groups.entries())
  }, [filtered])

  const hasFilters = resultFilter !== 'all' || eventFilter !== 'all'

  return (
    <div className="panel relative p-5">
      <Corners />
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-signal">
          <ScanLine size={12} /> Live scan activity
        </p>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
          <Blink className="bg-ok" /> Live
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(['all', 'valid', 'invalid'] as ResultFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setResultFilter(f)}
            className={cn(
              'rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors',
              resultFilter === f ? 'bg-signal-soft text-signal' : 'border border-line-soft text-ink-2 hover:bg-raised hover:text-ink',
            )}
          >
            {f === 'all' ? 'All' : f === 'valid' ? 'Valid' : 'Invalid'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select
            className="input !w-auto !py-1.5 text-xs"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="all">All events</option>
            {eventOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              className="btn-ghost !px-2.5 !py-1 text-[10px]"
              onClick={() => {
                setResultFilter('all')
                setEventFilter('all')
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-ink-3">
            <Clock className="mb-3 size-10 opacity-50" />
            <p className="text-sm">{hasFilters ? 'No activity for the selected filters' : 'No recent activity'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([eventName, items]) => (
              <div key={eventName}>
                <div className="mb-2 flex items-center justify-between border-b border-line-soft pb-1">
                  <p className="truncate font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-0">{eventName}</p>
                  <Badge tone="info">{items.length} scan{items.length === 1 ? '' : 's'}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((a) => {
                    const valid = a.result === 'GRANTED'
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border bg-raised/70 p-3 transition-colors hover:bg-raised',
                          valid ? 'border-ok/20' : 'border-danger/20',
                        )}
                      >
                        <div className="mt-0.5">{<ResultIcon result={a.result} />}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-medium text-ink-0">{a.attendee?.name ?? 'Unknown guest'}</p>
                            <span className="shrink-0 font-mono text-[10px] text-ink-3">{formatDateTime(a.timestamp)}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge tone={valid ? 'ok' : 'danger'}>{valid ? 'GRANTED' : 'DENIED'}</Badge>
                            {a.offline && <Badge tone="warn">OFFLINE</Badge>}
                            {a.area?.name && <Badge tone="default">{a.area.name}</Badge>}
                          </div>
                          <p className="mt-1 truncate font-mono text-[10px] text-ink-3">
                            {a.credential?.code ?? '—'} · by {a.operator?.name ?? 'Unknown'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}