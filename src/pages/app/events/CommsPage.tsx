import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { timeAgo } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Field } from '@/components/ui/input'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { Megaphone, Siren, MessageSquare, Trash2 } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  body: string
  priority: string
  targetAudience: { scope: string } | null
  createdAt: string
  author: { name: string }
}
type OpsAlert = { id: string; type: string; message: string; createdAt: string; resolved: boolean }
type ChatMsg = { id: string; text: string; createdAt: string; teamId?: string | null; userId?: string | null }

export function CommsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', targetType: 'ALL' })
  const [error, setError] = useState('')
  const [alertMsg, setAlertMsg] = useState('')
  const [chatMsg, setChatMsg] = useState('')

  const { data, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['announcements', eventId],
    queryFn: () =>
      api.get<Announcement[]>(`/events/${eventId}/communications/announcements`),
  })
  const alerts = useQuery({ queryKey: ['ops-alerts', eventId], queryFn: () => api.get<OpsAlert[]>(`/events/${eventId}/communications/alerts`), refetchInterval: 15000 })
  const chat = useQuery({ queryKey: ['team-chat', eventId], queryFn: () => api.get<ChatMsg[]>(`/events/${eventId}/communications/chat`), refetchInterval: 10000 })

  const create = useMutation({
    mutationFn: () =>
      api.post(`/events/${eventId}/communications/announcements`, {
        title: form.title,
        body: form.body,
        priority: 'MEDIUM',
        targetAudience: { scope: form.targetType === 'MANAGERS' ? 'ROLES' : form.targetType === 'STAFF' ? 'TEAMS' : 'ALL_STAFF' },
      }),
    onSuccess: () => {
      toast.success('Announcement broadcast')
      setOpen(false)
      setForm({ title: '', body: '', targetType: 'ALL' })
      setError('')
      qc.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not send announcement'),
  })
  const createAlert = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/communications/alerts`, { type: 'help', message: alertMsg }),
    onSuccess: () => { setAlertMsg(''); qc.invalidateQueries({ queryKey: ['ops-alerts'] }); toast.success('Alert sent') },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not send alert'),
  })
  const sendChat = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/communications/chat`, { text: chatMsg }),
    onSuccess: () => { setChatMsg(''); qc.invalidateQueries({ queryKey: ['team-chat'] }) },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not send message'),
  })
  const removeAnnouncement = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/communications/announcements/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement deleted') },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete announcement'),
  })
  const removeAlert = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/communications/alerts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ops-alerts'] }); toast.success('Alert deleted') },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete alert'),
  })
  const removeChat = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/communications/chat/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-chat'] }); toast.success('Message deleted') },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete message'),
  })

  if (isLoading) return <FullPageSpinner />
  if (loadError || !data) return <InlineError message="Could not load communications." onRetry={refetch} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    create.mutate()
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Communications"
        subtitle="Broadcast announcements to everyone — or to specific teams and areas."
        icon={<Megaphone className="size-5" />}
        actions={
          <Button onClick={() => setOpen(true)} icon={<Megaphone className="size-4" />}>
            Broadcast
          </Button>
        }
      />

      <div className="px-6 pt-5 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Announcements</h2>
          {data.length === 0 && (
            <div className="rounded-xl border border-dashed border-line py-16 text-center">
              <Megaphone className="mx-auto size-7 text-ink-3" />
              <p className="mt-3 text-sm text-ink-2">No announcements yet</p>
            </div>
          )}
          {data.map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-raised/70 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-semibold">{a.title}</h3>
                <Badge tone="live">{a.targetAudience?.scope ?? 'ALL_STAFF'}</Badge>
                <span className="ml-auto text-[11px] text-ink-3">
                  {a.author.name} · {timeAgo(a.createdAt)}
                </span>
                <ConfirmDialog title="Delete announcement?" body={`Delete "${a.title}"?`} confirmLabel="Delete" onConfirm={() => removeAnnouncement.mutate(a.id)}>
                  <button className="rounded p-1 text-ink-3 hover:bg-danger/10 hover:text-danger" aria-label="Delete announcement"><Trash2 className="size-3.5" /></button>
                </ConfirmDialog>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{a.body}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-raised/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Siren className="size-4 text-danger" /> Ops Alerts</h2>
            <div className="flex gap-2">
              <Input value={alertMsg} onChange={(e) => setAlertMsg(e.target.value)} placeholder="Help needed at Gate A..." />
              <Button size="sm" onClick={() => alertMsg.trim() && createAlert.mutate()} disabled={createAlert.isPending}>Send</Button>
            </div>
            <div className="space-y-2 max-h-56 overflow-auto">
              {(alerts.data ?? []).slice(0, 8).map((a) => (
                <div key={a.id} className="rounded-lg border border-line/60 px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-ink-3">
                    <Badge tone={a.resolved ? 'ok' : 'warn'}>{a.type}</Badge><span>{timeAgo(a.createdAt)}</span>
                    <ConfirmDialog title="Delete alert?" body="Delete this alert?" confirmLabel="Delete" onConfirm={() => removeAlert.mutate(a.id)}>
                      <button className="ml-auto rounded p-1 text-ink-3 hover:bg-danger/10 hover:text-danger" aria-label="Delete alert"><Trash2 className="size-3.5" /></button>
                    </ConfirmDialog>
                  </div>
                  <p className="text-[12px] text-ink-2 mt-1">{a.message}</p>
                </div>
              ))}
              {(alerts.data ?? []).length === 0 && <p className="text-[12px] text-ink-3">No alerts.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-raised/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="size-4" /> Team Chat</h2>
            <div className="flex gap-2">
              <Input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} placeholder="Message event staff..." />
              <Button size="sm" onClick={() => chatMsg.trim() && sendChat.mutate()} disabled={sendChat.isPending}>Send</Button>
            </div>
            <div className="space-y-2 max-h-56 overflow-auto">
              {(chat.data ?? []).slice(0, 10).map((m) => (
                <div key={m.id} className="rounded-lg border border-line/60 px-3 py-2">
                  <div className="flex items-center gap-2 text-[11px] text-ink-3">
                    <span>{timeAgo(m.createdAt)}</span>
                    <ConfirmDialog title="Delete message?" body="Delete this chat message?" confirmLabel="Delete" onConfirm={() => removeChat.mutate(m.id)}>
                      <button className="ml-auto rounded p-1 text-ink-3 hover:bg-danger/10 hover:text-danger" aria-label="Delete message"><Trash2 className="size-3.5" /></button>
                    </ConfirmDialog>
                  </div>
                  <p className="text-[12px] text-ink-2 mt-1">{m.text}</p>
                </div>
              ))}
              {(chat.data ?? []).length === 0 && <p className="text-[12px] text-ink-3">No messages.</p>}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Broadcast announcement">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Message">
            <Textarea required rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            {['ALL', 'STAFF', 'MANAGERS'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, targetType: t })}
                className={
                  form.targetType === t
                    ? 'rounded-md bg-signal px-3 py-1.5 text-[12px] font-semibold text-black'
                    : 'rounded-md border border-line px-3 py-1.5 text-[12px] text-ink-2 hover:bg-raised'
                }
              >
                {t}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Broadcast
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}