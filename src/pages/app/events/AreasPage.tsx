import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input, Field } from '@/components/ui/input'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useState, type FormEvent } from 'react'
import { MapPin, Plus, Users, Trash2 } from 'lucide-react'

type Area = {
  id: string
  name: string
  active: boolean
  type: string
  accessPolicy: string
  capacity: number | null
  teamAssignments: { team: { id: string; name: string } }[]
  assignments: { member: { id: string; user: { id: string; name: string } } }[]
  _count: { assignments: number; teamAssignments: number; accessLogs: number }
}

export function AreasPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['areas', eventId],
    queryFn: () => api.get<Area[]>(`/events/${eventId}/areas`),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post(`/events/${eventId}/areas`, {
        name,
        capacity: capacity ? Number(capacity) : null,
      }),
    onSuccess: () => {
      toast.success('Area created')
      setOpen(false)
      setName('')
      setCapacity('')
      qc.invalidateQueries({ queryKey: ['areas'] })
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not create area'),
  })

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/events/${eventId}/areas/${id}`, { active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/areas/${id}`),
    onSuccess: () => { toast.success('Area deleted'); qc.invalidateQueries({ queryKey: ['areas'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete area'),
  })

  if (isLoading) return <FullPageSpinner />
  if (error || !data) return <InlineError message="Could not load areas." onRetry={refetch} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate()
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Areas"
        subtitle="Every gate, hall and lounge where access is controlled."
        icon={<MapPin className="size-5" />}
        actions={
          <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
            New Area
          </Button>
        }
      />
      <div className="pt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 && (
            <div className="col-span-full rounded-none border border-dashed border-line py-16 text-center">
              <MapPin className="mx-auto size-7 text-ink-3" />
              <p className="mt-3 text-sm text-ink-2">No areas defined</p>
            </div>
          )}
          {data.map((a) => (
            <div key={a.id} className="rounded-none border border-line bg-raised/70 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold">{a.name}</h3>
                {!a.active && <Badge tone="danger">INACTIVE</Badge>}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-3">
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {a._count.accessLogs} scans
                </span>
                {a.capacity && <span>cap {a.capacity}</span>}
                <span className="rounded-none border border-line bg-elevated px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  {a.accessPolicy}
                </span>
              </div>
              {a.teamAssignments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {a.teamAssignments.map((t) => (
                    <span key={t.team.id} className="rounded-none border border-signal/25 bg-signal-soft px-1.5 py-0.5 text-[10px] text-signal">
                      {t.team.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 border-t border-line-soft pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Assigned staff</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.assignments.map((s) => (
                    <span key={s.member.id} className="rounded-none border border-line bg-elevated px-1.5 py-0.5 text-[10px] text-ink-2">
                      {s.member.user.name}
                    </span>
                  ))}
                  {a.assignments.length === 0 && <span className="text-[11px] text-ink-3">None</span>}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggle.mutate({ id: a.id, active: !a.active })}
                    className="text-[12px] font-medium text-signal hover:underline"
                  >
                    {a.active ? 'Deactivate area' : 'Reactivate area'}
                  </button>
                  <ConfirmDialog title="Delete area?" body={`Delete ${a.name}? Access logs and assignments may block deletion depending on backend constraints.`} confirmLabel="Delete" onConfirm={() => remove.mutate(a.id)}>
                    <button className="rounded-none p-1.5 text-danger hover:bg-danger/10" aria-label="Delete area"><Trash2 className="size-4" /></button>
                  </ConfirmDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Create area">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Area name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Gate" />
          </Field>
          <Field label="Capacity" hint="Optional">
            <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="1000" />
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