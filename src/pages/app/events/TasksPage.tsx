import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useSse } from '@/lib/sse'
import { useToast } from '@/components/ui/toast'
import { cn, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select, Field } from '@/components/ui/input'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { IconButton } from '@/components/ui/icon-button'
import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { ListTodo, Plus, Check, Clock, Flag, Siren, Trash2 } from 'lucide-react'
import { egyptDateTimeLocalToIso } from '@/lib/time'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueAt: string | null
  assignee: { id: string; name: string } | null
  team: { id: string; name: string } | null
  area: { id: string; name: string } | null
  createdBy: { id: string; name: string }
}

type Staff = { id: string; user: { name: string } }

const columns: { key: string; label: string; dot: string }[] = [
  { key: 'TODO', label: 'To do', dot: 'bg-ink-3' },
  { key: 'IN_PROGRESS', label: 'In progress', dot: 'bg-signal' },
  { key: 'DONE', label: 'Done', dot: 'bg-ok' },
]

export function TasksPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const sse = useSse(eventId, 'task')
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(params.get('new') === '1')
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueAt: '' })
  const [error, setError] = useState('')

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['tasks', eventId, sse],
    queryFn: () => api.get<Task[]>(`/events/${eventId}/tasks`),
  })

  const staff = useQuery({
    queryKey: ['staff', eventId],
    queryFn: () => api.get<Staff[]>(`/events/${eventId}/members`),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post(`/events/${eventId}/tasks`, {
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        assigneeId: form.assigneeId || null,
        dueAt: egyptDateTimeLocalToIso(form.dueAt) ?? null,
      }),
    onSuccess: () => {
      toast.success('Task created')
      setOpen(false)
      setForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueAt: '' })
      setError('')
      setParams({}, { replace: true })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not create task'),
  })

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/events/${eventId}/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/tasks/${id}`),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries({ queryKey: ['tasks'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete task'),
  })

  if (isLoading) return <FullPageSpinner />
  if (queryError || !data) return <InlineError message="Could not load tasks." onRetry={refetch} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    create.mutate()
  }

  const grouped = columns.map((c) => ({
    ...c,
    tasks: data.filter((t) => t.status === c.key),
  }))

  return (
    <div className="pb-16">
      <PageHeader
        title="Tasks"
        subtitle="Operational checklist across teams, areas and staff."
        icon={<ListTodo className="size-5" />}
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
            New Task
          </Button>
        }
      />

      <div className="flex gap-3 overflow-x-auto pb-6 pt-5">
        {grouped.map((col) => (
          <div key={col.key} className="flex min-w-[280px] flex-1 flex-col rounded-none border border-line bg-raised/50 p-3">
            <div className="flex items-center gap-2 px-1 pb-3">
              <span className={cn('size-1.5 rounded-full', col.dot)} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2">{col.label}</span>
              <span className="ml-auto rounded-full bg-elevated px-2 py-0.5 text-[10px] tabular text-ink-3">
                {col.tasks.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {col.tasks.length === 0 && (
                <div className="rounded-none border border-dashed border-line px-3 py-6 text-center text-[11px] text-ink-3">
                  Drop zone
                </div>
              )}
              {col.tasks.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                  className="group rounded-none border border-line bg-elevated p-3.5 transition-colors hover:border-line/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium leading-snug">{t.title}</p>
                    <div className="flex items-center gap-1">
                      <PriorityIcon p={t.priority} />
                      <ConfirmDialog title="Delete task?" body={`Delete "${t.title}"?`} confirmLabel="Delete" onConfirm={() => remove.mutate(t.id)}>
                        <IconButton tone="quiet-danger" aria-label="Delete task"><Trash2 className="size-3.5" /></IconButton>
                      </ConfirmDialog>
                    </div>
                  </div>
                  {t.description && (
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-ink-3">{t.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-3">
                    {t.assignee && (
                      <span className="rounded-none border border-line bg-canvas px-1.5 py-0.5">{t.assignee.name}</span>
                    )}
                    {t.team && <span>{t.team.name}</span>}
                    {t.dueAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(t.dueAt)}
                      </span>
                    )}
                  </div>
                  {col.key !== 'DONE' ? (
                    <button
                      onClick={() => setStatus.mutate({ id: t.id, status: col.key === 'TODO' ? 'IN_PROGRESS' : 'DONE' })}
                      className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-none border border-line py-1.5 text-[11px] font-medium text-ink-2 transition-colors hover:bg-raised"
                    >
                      <Check className="size-3" />
                      {col.key === 'TODO' ? 'Start' : 'Complete'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus.mutate({ id: t.id, status: 'TODO' })}
                      className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-none border border-line py-1.5 text-[11px] font-medium text-ink-3 transition-colors hover:bg-raised"
                    >
                      Reopen
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onClose={() => { setOpen(false); setParams({}, { replace: true }) }} title="Create task">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
            <Field label="Due">
              <Input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
            </Field>
          </div>
          <Field label="Assignee" hint="Optional">
            <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {staff.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p role="alert" className="rounded-none border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

function PriorityIcon({ p }: { p: string }) {
  if (p === 'CRITICAL') return <Siren className="size-3.5 text-danger" />
  if (p === 'HIGH') return <Flag className="size-3.5 text-warn" />
  return <Flag className="size-3.5 text-ink-3" />
}