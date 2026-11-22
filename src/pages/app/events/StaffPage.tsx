import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Select, Field } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { UserCog, UserPlus, Trash2, Radio, Activity } from 'lucide-react'
import { useHeartbeat } from '@/lib/presence'
import { useSse } from '@/lib/sse'
import { timeAgo, cn } from '@/lib/utils'

type Staff = {
  id: string
  status: string
  user: { id: string; name: string; email: string }
  role: { id: string; code: string; name: string; scope: string }
  team: { id: string; name: string } | null
  areas: { area: { id: string; name: string } }[]
}

type Role = { id: string; code: string; name: string; scope: string }

type PresenceRow = {
  memberId: string
  user: { id: string; name: string; email: string }
  role: { code: string; name: string }
  team: { name: string } | null
  status: 'active' | 'away' | 'disconnected'
  lastSeen: string | null
  shiftStart: string | null
  onShiftSeconds: number
}

type ActivityItem = {
  id: string
  kind: string
  message: string
  actor: string | null
  at: string
}

const statusDot = {
  active: 'bg-ok',
  away: 'bg-signal',
  disconnected: 'bg-ink-3',
} as const

const statusLabel = {
  active: 'On shift',
  away: 'Away',
  disconnected: 'Offline',
} as const

function fmtShift(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function StaffPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'activity')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ userId: '', roleId: '', teamId: '' })
  const [error, setError] = useState('')

  useHeartbeat(eventId)

  const { data: staff, isLoading, error: staffError, refetch } = useQuery({
    queryKey: ['staff', eventId],
    queryFn: () => api.get<Staff[]>(`/events/${eventId}/members`).catch(() => []),
  })

  const presence = useQuery({
    queryKey: ['presence', eventId, sse],
    queryFn: () => api.get<PresenceRow[]>(`/events/${eventId}/presence`).catch(() => []),
    refetchInterval: 10_000,
  })

  const activity = useQuery({
    queryKey: ['activity', eventId, sse],
    queryFn: () => api.get<ActivityItem[]>(`/events/${eventId}/activity?limit=40`).catch(() => []),
    refetchInterval: 10_000,
  })

  const roles = useQuery({
    queryKey: ['event-roles', eventId],
    queryFn: () => api.get<{ system: Role[]; custom: Role[] }>(`/events/${eventId}/roles`).catch(() => ({ system: [], custom: [] })),
  })

  const teams = useQuery({
    queryKey: ['teams', eventId],
    queryFn: () => api.get<{ id: string; name: string }[]>(`/events/${eventId}/teams`).catch(() => []),
  })

  const candidates = useQuery({
    queryKey: ['org-users', eventId],
    queryFn: () => api.get<{ id: string; name: string; email: string }[]>(`/events/${eventId}/org-users`).catch(() => []),
  })

  if (isLoading) return <FullPageSpinner />
  if (staffError || !staff) return <InlineError message="Could not load staff." onRetry={refetch} />

  const allRoles = [...(roles.data?.custom ?? []), ...(roles.data?.system ?? [])]

  const add = useMutation({
    mutationFn: () =>
      api.post(`/events/${eventId}/members`, {
        userId: form.userId,
        roleId: form.roleId,
        teamId: form.teamId || null,
      }),
    onSuccess: () => {
      toast.success('Staff member added')
      setOpen(false)
      setForm({ userId: '', roleId: '', teamId: '' })
      setError('')
      qc.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not add staff'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/members/${id}`),
    onSuccess: () => {
      toast.success('Staff member removed')
      qc.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    add.mutate()
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Staff"
        subtitle="Event members with roles, teams and area scopes."
        icon={<UserCog className="size-5" />}
        actions={
          <Button onClick={() => setOpen(true)} icon={<UserPlus className="size-4" />}>
            Add Staff
          </Button>
        }
      />
      <div className="px-6 pt-5">
        <Table headers={['Staff', 'Role', 'Scope', 'Team', 'Areas', 'Presence', '']}>
          {staff.length === 0 && <EmptyState colSpan={7} title="No staff yet" />}
          {staff.map((s) => {
            const p = presence.data?.find((row) => row.memberId === s.id)
            const onShift = (p?.onShiftSeconds ?? 0) > 0
            return (
              <tr key={s.id} className="group">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-elevated text-[11px] font-semibold ring-1 ring-line">
                      {s.user.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium">{s.user.name}</p>
                      <p className="text-[11px] text-ink-3">{s.user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-[13px]">{s.role.name}</Td>
                <Td>
                  <Badge tone={s.role.scope === 'EVENT' ? 'live' : s.role.scope === 'AREA' ? 'warn' : 'default'}>
                    {s.role.scope}
                  </Badge>
                </Td>
                <Td className="text-[13px]">{s.team?.name ?? '—'}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {s.areas.map((a) => (
                      <span key={a.area.id} className="rounded border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
                        {a.area.name}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td>
                  {p ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          statusDot[p.status],
                          p.status === 'active' && 'animate-pulse',
                        )}
                      />
                      <span className="font-mono text-[11px] text-ink-2">{statusLabel[p.status]}</span>
                      {onShift && (
                        <span className="rounded border border-ok/25 bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ok">
                          {fmtShift(p.onShiftSeconds)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-ink-3">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                    <ConfirmDialog
                      title="Remove staff member"
                      body={`Remove ${s.user.name} from this event?`}
                      confirmLabel="Remove"
                      onConfirm={() => remove.mutate(s.id)}
                    >
                      <button className="rounded p-1.5 text-danger hover:bg-danger/10" aria-label="Remove">
                        <Trash2 className="size-4" />
                      </button>
                    </ConfirmDialog>
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>

        <div className="mt-6 border border-line-soft bg-raised">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-signal" />
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-2">
                Live activity
              </h2>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ok">
                <Radio className="size-3" /> streaming
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
              {activity.data?.length ?? 0} events
            </span>
          </div>
          <div className="max-h-80 divide-y divide-line-soft overflow-y-auto">
            {!activity.data || activity.data.length === 0 ? (
              <p className="px-5 py-10 text-center text-[13px] text-ink-3">
                No activity yet. Scans, incidents, tasks, announcements, credentials and reservations stream in here.
              </p>
            ) : (
              activity.data.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink-2">{a.message}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
                      {a.kind}
                      {a.actor ? ` · ${a.actor}` : ''} · {timeAgo(a.at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add staff">
        <form onSubmit={submit} className="space-y-4">
          <Field label="User">
            <Select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select user…</option>
              {candidates.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.email}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Role">
            <Select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">Select role…</option>
              {allRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.scope}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Team" hint="Optional">
            <Select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              <option value="">No team</option>
              {teams.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={add.isPending}>
              Add
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}