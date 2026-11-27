import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Field, Select } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { UserCog, UserPlus, Trash2, Radio, Activity, Copy, X } from 'lucide-react'
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

const ASSIGNABLE_ROLE_SCOPES = new Set(['EVENT', 'TEAM', 'AREA'])

const emptyStaffForm = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  teamId: '',
  areaIds: [] as string[],
}

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
  const [form, setForm] = useState(emptyStaffForm)
  const [error, setError] = useState('')
  const [issuedPassword, setIssuedPassword] = useState<{ email: string; password: string } | null>(null)

  useHeartbeat(eventId)

  const { data: staff, isLoading, error: staffError, refetch } = useQuery({
    queryKey: ['staff', eventId],
    queryFn: () => api.get<Staff[]>(`/events/${eventId}/members`),
  })

  const presence = useQuery({
    queryKey: ['presence', eventId, sse],
    queryFn: ({ signal }) => api.get<PresenceRow[]>(`/events/${eventId}/presence`, { signal }),
    refetchInterval: 20_000,
  })

  // Activity is driven by the SSE tick; polling it as well doubled requests.
  const activity = useQuery({
    queryKey: ['activity', eventId, sse],
    queryFn: ({ signal }) => api.get<ActivityItem[]>(`/events/${eventId}/activity?limit=40`, { signal }),
  })

  const roles = useQuery({
    queryKey: ['event-roles', eventId],
    queryFn: () => api.get<{ system: Role[]; custom: Role[] }>(`/events/${eventId}/roles`).catch(() => ({ system: [], custom: [] })),
  })

  const teams = useQuery({
    queryKey: ['teams', eventId],
    queryFn: () => api.get<{ id: string; name: string }[]>(`/events/${eventId}/teams`),
  })

  const areas = useQuery({
    queryKey: ['areas', eventId],
    queryFn: () => api.get<{ id: string; name: string; active: boolean }[]>(`/events/${eventId}/areas`),
  })

  const allRoles = [...(roles.data?.custom ?? []), ...(roles.data?.system ?? [])]
    .filter((role) => ASSIGNABLE_ROLE_SCOPES.has(role.scope))
  const selectedRole = allRoles.find((role) => role.id === form.roleId)

  const add = useMutation({
    mutationFn: () =>
      api.post<{ temporaryPassword?: string }>(`/events/${eventId}/members`, {
        name: form.name.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
        roleId: form.roleId,
        teamId: form.teamId || null,
        areaIds: form.areaIds,
      }),
    onSuccess: (result) => {
      if (result.temporaryPassword) {
        setIssuedPassword({ email: form.email.trim().toLowerCase(), password: result.temporaryPassword })
      }
      toast.success(result.temporaryPassword ? 'Staff account created' : 'Staff member added')
      setOpen(false)
      setForm(emptyStaffForm)
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

  if (isLoading) return <FullPageSpinner />
  if (staffError || !staff) return <InlineError message="Could not load staff." onRetry={refetch} />

  const toggleArea = (areaId: string) => {
    setForm((current) => ({
      ...current,
      areaIds: current.areaIds.includes(areaId)
        ? current.areaIds.filter((id) => id !== areaId)
        : [...current.areaIds, areaId],
    }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim()) return setError('Email is required')
    if (!form.roleId) return setError('Choose a role')
    if (selectedRole?.scope === 'TEAM' && !form.teamId) return setError('Choose a team for this role')
    if (selectedRole?.scope === 'AREA' && form.areaIds.length === 0) return setError('Choose at least one area for this role')
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

      {issuedPassword && (
        <div className="mt-4 border border-signal/35 bg-signal/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
                One-time staff credentials
              </p>
              <p className="mt-1 text-[13px] text-ink-2">
                Send this password to <span className="font-medium text-ink-0">{issuedPassword.email}</span>. It will not be shown again.
              </p>
              <p className="mt-2 select-all break-all font-mono text-[13px] text-ink-0">{issuedPassword.password}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                icon={<Copy className="size-4" />}
                onClick={() => {
                  void navigator.clipboard?.writeText(issuedPassword.password)
                  toast.success('Password copied')
                }}
              >
                Copy
              </Button>
              <button
                type="button"
                aria-label="Dismiss credentials"
                className="grid size-9 place-items-center text-ink-3 hover:text-ink-0"
                onClick={() => setIssuedPassword(null)}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-5">
        <Table dense headers={['Staff', 'Role', 'Scope', 'Team', 'Areas', 'Presence', '']}>
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
                      <span key={a.area.id} className="rounded-none border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
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
                        <span className="rounded-none border border-ok/25 bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ok">
                          {fmtShift(p.onShiftSeconds)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] text-ink-3">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <ConfirmDialog
                      title="Remove staff member"
                      body={`Remove ${s.user.name} from this event?`}
                      confirmLabel="Remove"
                      onConfirm={() => remove.mutate(s.id)}
                    >
                      <button className="grid min-h-11 min-w-11 place-items-center rounded-none text-danger hover:bg-danger/10" aria-label="Remove">
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
          <p className="text-[12px] leading-relaxed text-ink-3">
            Create the account and assign its dashboard role in one step. No invitation or verification round trip.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" hint="New accounts only">
              <Input
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mona Ali"
              />
            </Field>
            <Field label="Email" hint="Existing accounts are reused">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@example.com"
              />
            </Field>
          </div>

          <Field label="Password" hint="Optional — generated if blank">
            <Input
              type="text"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Leave blank to generate a temporary password"
            />
          </Field>

          <Field label="Role" hint="Any event role">
            <Select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              <option value="">Select role…</option>
              {allRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.scope}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Team" hint={selectedRole?.scope === 'TEAM' ? 'Required for this role' : 'Optional'}>
            <Select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              <option value="">No team</option>
              {teams.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>

          {selectedRole?.scope === 'AREA' && (
            <fieldset>
              <legend className="mb-1.5 flex w-full items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">Areas</span>
                <span className="text-[11px] text-ink-3">Choose one or more</span>
              </legend>
              <div className="max-h-32 space-y-0.5 overflow-y-auto border border-line bg-elevated p-2">
                {areas.data?.length ? areas.data.map((area) => (
                  <label key={area.id} className="flex cursor-pointer items-center gap-2 px-1.5 py-1 text-[12px] text-ink-2 hover:text-ink-0">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-signal"
                      checked={form.areaIds.includes(area.id)}
                      onChange={() => toggleArea(area.id)}
                    />
                    <span>{area.name}</span>
                    {!area.active && (
                      <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">inactive</span>
                    )}
                  </label>
                )) : (
                  <p className="px-1.5 py-2 text-[12px] text-ink-3">No areas yet. Create one on the Areas page first.</p>
                )}
              </div>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-none border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={add.isPending}>
              Add Staff
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}