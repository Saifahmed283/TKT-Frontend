import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { timeAgo, cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select, Field } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { Siren, Plus } from 'lucide-react'

type Incident = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  createdAt: string
  resolvedAt: string | null
  creator: { name: string }
  assignee: { id: string; name: string } | null
  comments: { id: string; body: string; createdAt: string; author: { name: string } }[]
}

type Staff = { id: string; user: { name: string } }

export function IncidentsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'incident')
  const [params, setParams] = useSearchParams()
  const [dialogOpen, setDialogOpen] = useState(params.get('new') === '1')
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assignedToId: '' })
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['incidents', eventId, sse],
    queryFn: () => api.get<Incident[]>(`/events/${eventId}/incidents`).catch(() => []),
  })

  const staff = useQuery({
    queryKey: ['staff', eventId],
    queryFn: () => api.get<Staff[]>(`/events/${eventId}/members`).catch(() => []),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post(`/events/${eventId}/incidents`, {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        assignedToId: form.assignedToId || null,
      }),
    onSuccess: () => {
      toast.success('Incident logged')
      setDialogOpen(false)
      setForm({ title: '', description: '', priority: 'MEDIUM', assignedToId: '' })
      setError('')
      setParams({}, { replace: true })
      qc.invalidateQueries({ queryKey: ['incidents'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not log incident'),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/events/${eventId}/incidents/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  })

  const addComment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post(`/events/${eventId}/incidents/${id}/comments`, { body }),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['incidents'] })
    },
  })

  if (isLoading) return <FullPageSpinner />
  if (queryError || !data) return <InlineError message="Could not load incidents." onRetry={refetch} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    create.mutate()
  }

  const openCount = data.filter((i) => i.status === 'OPEN').length
  const resolvedCount = data.filter((i) => i.status === 'RESOLVED').length

  return (
    <div className="pb-16">
      <PageHeader
        title="Incidents"
        subtitle={`${openCount} open · ${resolvedCount} resolved`}
        icon={<Siren className="size-5" />}
        actions={
          <Button onClick={() => setDialogOpen(true)} icon={<Plus className="size-4" />}>
            Log Incident
          </Button>
        }
      />

      <div className="grid gap-4 px-6 pb-6 pt-5 lg:grid-cols-2">
        {data.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-line py-16 text-center">
            <Siren className="mx-auto size-7 text-ink-3" />
            <p className="mt-3 text-sm text-ink-2">All clear — no incidents</p>
          </div>
        )}
        {data.map((i) => (
          <motion.div
            key={i.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-xl border p-5',
              i.priority === 'CRITICAL' && i.status === 'OPEN'
                ? 'border-danger/30 bg-danger/5'
                : 'border-line bg-raised/70',
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border',
                  i.priority === 'CRITICAL' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warn/30 bg-warn/10 text-warn',
                )}
              >
                <Siren className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14px] font-semibold">{i.title}</h3>
                  <Badge tone={i.priority === 'CRITICAL' ? 'danger' : 'warn'}>{i.priority}</Badge>
                  <Badge tone={i.status === 'RESOLVED' ? 'ok' : 'default'}>{i.status}</Badge>
                </div>
                {i.description && <p className="mt-1.5 text-[13px] leading-snug text-ink-3">{i.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-3">
                  <span>by {i.creator.name}</span>
                  {i.assignee && <span>→ {i.assignee.name}</span>}
                  <span>{timeAgo(i.createdAt)}</span>
                </div>

                {/* Comments */}
                <div className="mt-4 space-y-2">
                  {i.comments.map((c) => (
                    <div key={c.id} className="rounded-md border border-line-soft bg-canvas/60 px-3 py-2">
                      <p className="text-[13px] leading-snug">{c.body}</p>
                      <p className="mt-1 text-[10px] text-ink-3">
                        {c.author.name} · {timeAgo(c.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>

                {i.status === 'OPEN' && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      className="h-8 text-[12px]"
                      placeholder="Add a comment…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && comment.trim()) addComment.mutate({ id: i.id, body: comment.trim() })
                      }}
                    />
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: i.id, status: 'RESOLVED' })}>
                      Resolve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setParams({}, { replace: true }) }} title="Log incident">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </Field>
            <Field label="Assign to" hint="Optional">
              <Select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">Unassigned</option>
                {staff.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Log Incident
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}