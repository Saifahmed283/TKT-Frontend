import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { timeAgo } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Field } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { Megaphone } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  body: string
  priority: string
  targetAudience: { scope: string } | null
  createdAt: string
  author: { name: string }
}

export function CommsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', targetType: 'ALL' })
  const [error, setError] = useState('')

  const { data, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['announcements', eventId],
    queryFn: () =>
      api.get<Announcement[]>(`/events/${eventId}/communications/announcements`).catch(() => []),
  })

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

      <div className="px-6 pt-5">
        <div className="space-y-3">
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
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{a.body}</p>
            </div>
          ))}
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