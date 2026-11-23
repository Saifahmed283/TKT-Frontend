import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/table'
import { Dialog } from '@/components/ui/dialog'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { UsersRound, Plus } from 'lucide-react'

type Team = {
  id: string
  name: string
  description: string | null
  active: boolean
  members: { user: { id: string; name: string }; role: { name: string } }[]
  areas: { area: { id: string; name: string; type: string } }[]
  _count: { members: number; tasks: number }
}

export function TeamsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teams', eventId],
    queryFn: () => api.get<Team[]>(`/events/${eventId}/teams`),
  })

  const create = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/teams`, { name, description: desc || null }),
    onSuccess: () => {
      toast.success('Team created')
      setOpen(false)
      setName('')
      setDesc('')
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not create team'),
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load teams." onRetry={refetch} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate()
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Teams"
        subtitle="Operational units with leads, members and assigned areas."
        icon={<UsersRound className="size-5" />}
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
            New Team
          </Button>
        }
      />
      <div className="px-6 pt-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 && (
            <div className="col-span-full">
              <EmptyState colSpan={1} title="No teams yet" />
            </div>
          )}
          {data.map((t) => (
            <div key={t.id} className="rounded-xl border border-line bg-raised/70 p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-[15px] font-semibold">{t.name}</h3>
                <span className="rounded-full border border-line bg-elevated px-2 py-0.5 text-[10px] text-ink-3">
                  {t._count.tasks} tasks
                </span>
              </div>
              {t.description && <p className="mt-1.5 text-[13px] text-ink-3 line-clamp-2">{t.description}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t.areas.map((a) => (
                  <span key={a.area.id} className="rounded border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
                    {a.area.name}
                  </span>
                ))}
              </div>
              <div className="mt-4 border-t border-line-soft pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  Members ({t._count.members})
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {t.members.map((m) => (
                    <span
                      key={m.user.id}
                      className="rounded-full border border-line bg-elevated px-2 py-0.5 text-[11px] text-ink-2"
                      title={m.role.name}
                    >
                      {m.user.name}
                    </span>
                  ))}
                  {t.members.length === 0 && <span className="text-[12px] text-ink-3">No members yet</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Create team">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Team name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Technical Team" />
          </Field>
          <Field label="Description" hint="Optional">
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
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