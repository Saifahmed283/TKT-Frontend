import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, Input, Textarea } from '@/components/ui/input'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { Building2, CalendarDays, ChevronRight, Plus, Trash2 } from 'lucide-react'

type Org = {
  id: string
  name: string
  logoUrl?: string | null
  createdAt: string
  myRole: { name: string } | string | null
  _count: { members: number; events: number; folders?: number }
  events: { id: string; name: string; status: string }[]
}

export function OrganizationsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Org[]>('/organizations'),
  })

  const create = useMutation({
    mutationFn: () => api.post('/organizations', { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      toast.success('Organization created')
      setOpen(false)
      setName('')
      setDescription('')
      qc.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not create organization'),
  })

  const remove = useMutation({
    mutationFn: (orgId: string) => api.delete(`/organizations/${orgId}`),
    onSuccess: () => { toast.success('Organization deleted'); qc.invalidateQueries({ queryKey: ['organizations'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete organization'),
  })

  if (isLoading) return <FullPageSpinner />
  if (error) return <InlineError message="Could not load organizations." onRetry={refetch} />

  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate() }

  return (
    <div className="pb-16">
      <PageHeader
        title="Organizations"
        subtitle="Organizations own events. Members, roles and scopes live here."
        icon={<Building2 className="size-5" />}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>New organization</Button>}
      />
      <div className="grid gap-4 px-6 pt-6 md:grid-cols-2">
        {data?.length === 0 && (
          <div className="col-span-full rounded-none border border-dashed border-line py-16 text-center">
            <Building2 className="mx-auto size-7 text-ink-3" />
            <p className="mt-3 text-sm text-ink-2">You're not a member of any organization yet</p>
            <Button className="mt-4" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Create organization</Button>
          </div>
        )}
        {data?.map((o) => (
          <div key={o.id} className="rounded-none border border-line bg-raised/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center overflow-hidden border border-line bg-elevated text-signal">
                  {o.logoUrl ? <img src={o.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-sm font-semibold">{o.name.slice(0, 1).toUpperCase()}</span>}
                </div>
                <div>
                  <Link to={`/app/organizations/${o.id}`} className="text-[15px] font-semibold hover:text-signal transition-colors">{o.name}</Link>
                  {o.myRole && <Badge tone="live" className="mt-1.5">{typeof o.myRole === 'string' ? o.myRole : o.myRole.name}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-3">{o._count.members} members · {o._count.folders ?? 0} folders</span>
                {(typeof o.myRole === 'string' ? o.myRole : o.myRole?.name) === 'OWNER' && (
                  <ConfirmDialog title="Delete organization?" body={`Delete "${o.name}" and all its events/data? This cannot be undone.`} confirmLabel="Delete" onConfirm={() => remove.mutate(o.id)}>
                    <button className="rounded-none p-1.5 text-danger hover:bg-danger/10" aria-label="Delete organization"><Trash2 className="size-4" /></button>
                  </ConfirmDialog>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-line-soft pt-4">
              {o.events.map((e) => (
                <Link
                  key={e.id}
                  to={`/app/events/${e.id}`}
                  className="group flex items-center gap-3 rounded-none px-2 py-1.5 text-[13px] transition-colors hover:bg-raised"
                >
                  <CalendarDays className="size-4 text-ink-3" />
                  <span className="min-w-0 flex-1 truncate">{e.name}</span>
                  <Badge tone={e.status === 'LIVE' ? 'live' : 'default'}>{e.status}</Badge>
                  <ChevronRight className="size-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
              {o.events.length === 0 && <p className="text-[12px] text-ink-3">No events in this organization yet.</p>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Create organization">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Organization name"><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova Events" /></Field>
          <Field label="Description" hint="Optional"><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Create</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
