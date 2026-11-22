import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Users, Ticket, QrCode, Shield, ListTodo, AlertTriangle, Megaphone, BarChart3, Play, Archive, UserCog, Check, X, Radar, ClipboardCheck, Layers, Globe, Lock, Unlock, CalendarClock } from 'lucide-react'
import { api } from '../lib/api'
import type { Overview } from '../lib/types'
import { ErrorBanner, PageHeader, Spinner, StatCard, StatusBadge, fmtDateTime, fmtTime, Corners, Blink } from '../components/ui'

const moduleCards = [
  { to: 'attendees', icon: Users, label: 'Attendees', desc: 'People, check-in status, demographics' },
  { to: 'tickets', icon: Ticket, label: 'Tickets', desc: 'Types, sales, validation' },
  { to: 'reservations', icon: ClipboardCheck, label: 'Reservations', desc: 'Public registrations & approvals' },
  { to: 'credentials', icon: QrCode, label: 'Credentials', desc: 'Signed access codes, revocation' },
  { to: 'access', icon: Shield, label: 'Access log', desc: 'Every scan decision, live' },
  { to: 'tasks', icon: ListTodo, label: 'Tasks', desc: 'Assign work across teams' },
  { to: 'incidents', icon: AlertTriangle, label: 'Incidents', desc: 'Track and resolve issues' },
  { to: 'comms', icon: Megaphone, label: 'Comms', desc: 'Announcements to staff' },
  { to: 'staff', icon: UserCog, label: 'Staff', desc: 'Members, roles and area scopes' },
  { to: 'teams', icon: Layers, label: 'Teams', desc: 'Organize staff into squads' },
  { to: 'areas', icon: Shield, label: 'Areas', desc: 'Zones, gates and scanner scopes' },
  { to: 'audit', icon: BarChart3, label: 'Audit', desc: 'Immutable activity ledger' },
  { to: 'reports', icon: BarChart3, label: 'Reports', desc: 'Attendance & access analytics' },
]

export default function EventDetail() {
  const { eventId = '' } = useParams()
  const qc = useQueryClient()
  const [winStart, setWinStart] = useState('')
  const [winEnd, setWinEnd] = useState('')

  const q = useQuery({
    queryKey: ['event-overview', eventId],
    queryFn: () => api<Overview>(`/events/${eventId}/overview`),
  })

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      api(`/events/${eventId}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-overview', eventId] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const saveReg = useMutation({
    mutationFn: (patch: { open?: boolean; startAt?: string | null; endAt?: string | null }) =>
      api(`/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          settings: {
            ...(q.data?.event.settings ?? {}),
            registration: {
              enabled: true,
              ...(q.data?.event.settings?.registration ?? {}),
              ...patch,
            },
          },
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-overview', eventId] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const reg = q.data?.event.settings?.registration ?? {}

  useEffect(() => {
    setWinStart(reg.startAt ? reg.startAt.slice(0, 16) : '')
    setWinEnd(reg.endAt ? reg.endAt.slice(0, 16) : '')
  }, [eventId, reg.startAt, reg.endAt])

  if (q.isLoading) return <Spinner label="Loading event…" />
  if (q.isError) return <ErrorBanner error={q.error} />
  const data = q.data!
  const { event, kpis } = data

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={event.name}
        subtitle={`${event.type} · ${fmtDateTime(event.startAt)} · ${event.timezone}${event.venueName ? ` · ${event.venueName}` : ''}`}
        actions={
          <>
            <StatusBadge status={event.status} />
            {event.status !== 'LIVE' && event.status !== 'ARCHIVED' && (
              <button className="btn-primary" onClick={() => setStatus.mutate('LIVE')} disabled={setStatus.isPending}>
                <Play size={14} /> Go live
              </button>
            )}
            {event.status !== 'ARCHIVED' && (
              <button className="btn-ghost" onClick={() => setStatus.mutate('ARCHIVED')} disabled={setStatus.isPending}>
                <Archive size={14} /> Archive
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-px border border-line-soft bg-line-soft sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Attendees" value={kpis.attendees} sub={`${kpis.checkedIn} checked in`} accent />
        <StatCard label="Check-in rate" value={`${kpis.checkInRate}%`} sub={`${kpis.todayScans} scans in 24h`} />
        <StatCard label="Access success" value={`${kpis.accessSuccessRate}%`} sub={`${kpis.granted} granted · ${kpis.denied} denied`} />
        <StatCard label="Active staff" value={kpis.activeStaff} />
        <StatCard label="Open" value={kpis.openTasks + kpis.activeIncidents} sub={`${kpis.openTasks} tasks · ${kpis.activeIncidents} incidents`} />
      </div>

      <div className="panel relative mt-8 p-5">
        <Corners />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center border border-signal/30 bg-signal/10 text-signal">
              <Globe size={16} />
              <Corners className="h-2 w-2" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-ink-0">Public registration</h2>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                {reg.open !== false ? (
                  <span className="flex items-center gap-1.5 text-ok">
                    <Blink className="bg-ok" /> open to the public
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-warn">
                    <Lock size={11} /> locked
                  </span>
                )}
                {reg.startAt && (
                  <span className="text-ink-3">
                    <CalendarClock size={11} className="inline text-signal" /> opens {fmtDateTime(reg.startAt)}
                  </span>
                )}
                {reg.endAt && <span className="text-ink-3">closes {fmtDateTime(reg.endAt)}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => saveReg.mutate({ open: reg.open === false })}
            disabled={saveReg.isPending}
            className={reg.open === false ? 'btn-primary !py-1.5 text-xs' : 'btn-ghost !py-1.5 text-xs'}
          >
            {reg.open === false ? (
              <>
                <Unlock size={12} /> Open registration
              </>
            ) : (
              <>
                <Lock size={12} /> Close registration
              </>
            )}
          </button>
        </div>
        <div className="mt-5 grid gap-3 border-t border-line-soft pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="label mb-1.5 block text-ink-3">Opening window</label>
            <input type="datetime-local" className="input" value={winStart} onChange={(e) => setWinStart(e.target.value)} />
          </div>
          <div>
            <label className="label mb-1.5 block text-ink-3">Closing window</label>
            <input type="datetime-local" className="input" value={winEnd} onChange={(e) => setWinEnd(e.target.value)} />
          </div>
          <button
            onClick={() =>
              saveReg.mutate({
                startAt: winStart ? new Date(winStart).toISOString() : null,
                endAt: winEnd ? new Date(winEnd).toISOString() : null,
              })
            }
            disabled={saveReg.isPending}
            className="btn-ghost"
          >
            Save window
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="panel relative overflow-hidden p-0 lg:col-span-2">
          <Corners />
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-signal">
              <Blink className="bg-ok" />
              Recent access decisions
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">SSE · live</span>
          </div>
          {data.recentAccess.length === 0 ? (
            <p className="py-10 text-center font-mono text-[12px] uppercase tracking-[0.15em] text-ink-3">
              No scans yet — open the Scanner and validate your first credential
            </p>
          ) : (
            <div className="divide-y divide-line-soft">
              {data.recentAccess.map((a) => {
                const granted = a.result === 'GRANTED'
                return (
                  <div key={a.id} className="flex min-w-0 items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-raised">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center border ${granted ? 'border-ok/30 bg-ok/10 text-ok' : 'border-danger/30 bg-danger/10 text-danger'}`}
                      >
                        {granted ? <Check size={11} /> : <X size={11} />}
                      </span>
                      <span className={`shrink-0 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] ${granted ? 'text-ok' : 'text-danger'}`}>
                        {a.result}
                      </span>
                      <span className="truncate font-mono text-[11px] text-ink-3">{a.credential?.code ?? '—'}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 font-mono text-[11px] text-ink-3">
                      <span className="hidden sm:inline">{a.area?.name ?? '—'}</span>
                      <span className="tabular-nums">{fmtTime(a.timestamp)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel relative p-5">
            <Corners />
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-signal">
              <AlertTriangle size={12} />
              Latest incidents
            </p>
            {data.recentIncidents.length === 0 ? (
              <p className="py-6 text-center font-mono text-[12px] uppercase tracking-[0.15em] text-ink-3">
                <span className="text-ok">●</span> All clear
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentIncidents.map((i) => (
                  <div key={i.id} className="border-l-2 border-warn/50 pl-3">
                    <p className="text-sm font-medium text-ink-0">{i.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
                      {i.priority} · {i.area?.name ?? '—'} · {fmtTime(i.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel relative p-5">
            <Corners />
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-signal">
              <ListTodo size={12} />
              Latest tasks
            </p>
            {data.recentTasks.length === 0 ? (
              <p className="py-6 text-center font-mono text-[12px] uppercase tracking-[0.15em] text-ink-3">No tasks yet</p>
            ) : (
              <div className="space-y-3">
                {data.recentTasks.map((t) => (
                  <div key={t.id} className="border-l-2 border-signal/50 pl-3">
                    <p className="text-sm font-medium text-ink-0">{t.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">
                      {t.status} · {t.assignee?.name ?? 'Unassigned'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 mt-10 flex items-center gap-2">
        <p className="label">Modules</p>
        <span className="h-px flex-1 bg-line-soft" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">13 instruments</span>
      </div>
      <div className="grid gap-px border border-line-soft bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
        {moduleCards.map((m) => (
          <Link key={m.to} to={m.to} className="card card-hover group relative p-5">
            <Corners className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="flex items-center justify-between">
              <span className="relative grid h-9 w-9 place-items-center border border-signal/30 bg-signal/10 text-signal">
                <m.icon size={16} />
                <Corners className="h-2 w-2" />
              </span>
              <ArrowRight size={15} className="text-ink-3 transition-all group-hover:translate-x-0.5 group-hover:text-signal" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide text-ink-0 group-hover:text-signal">{m.label}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">{m.desc}</p>
          </Link>
        ))}
        <Link to={`/app/events/${eventId}/reports`} className="card card-hover group relative hidden items-center justify-center gap-2 p-5 lg:flex">
          <Radar size={16} className="text-signal" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2 group-hover:text-signal">Open all instruments</span>
        </Link>
      </div>
    </div>
  )
}