import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { BriefcaseBusiness, Plus, UserCheck, IdCard } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'

type AppRow = { id: string; fullName: string; email?: string | null; phone?: string | null; requestedRoleCode?: string | null; status: string; notes?: string | null; convertedUserId?: string | null }
type Profile = { id: string; userId: string; workerCode?: string | null; onboardingComplete: boolean; idCardIssuedAt?: string | null; user?: { id: string; name: string; email: string } }

const empty = { fullName: '', email: '', phone: '', requestedRoleCode: '', notes: '' }

export function WorkforcePage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [convertUserId, setConvertUserId] = useState<Record<string, string>>({})

  const apps = useQuery({ queryKey: ['workforce-apps', eventId], queryFn: () => api.get<AppRow[]>(`/events/${eventId}/workforce/applications`) })
  const profiles = useQuery({ queryKey: ['workforce-profiles', eventId], queryFn: () => api.get<Profile[]>(`/events/${eventId}/workforce/profiles`) })

  const create = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/workforce/applications`, { ...form, email: form.email || undefined }),
    onSuccess: () => { toast.success('Application created'); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ['workforce-apps'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not create application'),
  })

  const convert = useMutation({
    mutationFn: (id: string) => api.post(`/events/${eventId}/workforce/applications/${id}/convert`, { userId: convertUserId[id] }),
    onSuccess: () => { toast.success('Applicant converted to staff'); qc.invalidateQueries({ queryKey: ['workforce-apps'] }); qc.invalidateQueries({ queryKey: ['workforce-profiles'] }); qc.invalidateQueries({ queryKey: ['staff'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Conversion failed (provide existing user ID)'),
  })

  const issueId = useMutation({
    mutationFn: (userId: string) => api.post<{ token: string; expiresAt: string }>(`/events/${eventId}/workforce/id-token`, { userId }),
    onSuccess: (d) => { navigator.clipboard?.writeText(d.token).catch(() => {}); toast.success(`ID token issued (copied). Expires ${new Date(d.expiresAt).toLocaleString()}`); qc.invalidateQueries({ queryKey: ['workforce-profiles'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not issue ID token'),
  })

  if (apps.isLoading) return <FullPageSpinner />
  if (apps.error) return <InlineError message="Could not load workforce." onRetry={() => apps.refetch()} />

  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate() }

  return (
    <div className="pb-16">
      <PageHeader title="Workforce / Recruitment" subtitle="Recruitment applications, conversion to staff, and ID ops." icon={<BriefcaseBusiness className="size-5" />} actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>New application</Button>} />
      <div className="px-6 pt-6 space-y-8">
        <div>
          <h2 className="text-sm font-semibold mb-3">Applications</h2>
          <Table headers={['Applicant', 'Requested role', 'Status', 'Convert (existing user ID)', '']}>
            {(apps.data ?? []).length === 0 && <EmptyState colSpan={5} title="No applications" />}
            {(apps.data ?? []).map((a) => (
              <tr key={a.id}>
                <Td><div className="text-[13px] font-medium">{a.fullName}</div><div className="text-[11px] text-ink-3">{a.email || a.phone || '—'}</div></Td>
                <Td className="text-[12px]">{a.requestedRoleCode || '—'}</Td>
                <Td><Badge tone={a.status === 'CONVERTED' ? 'ok' : a.status === 'REJECTED' ? 'danger' : 'warn'}>{a.status}</Badge></Td>
                <Td>{a.status !== 'CONVERTED' ? <Input value={convertUserId[a.id] ?? ''} onChange={e => setConvertUserId(m => ({ ...m, [a.id]: e.target.value }))} placeholder="Existing user UUID" /> : <span className="text-[11px] text-ink-3">{a.convertedUserId}</span>}</Td>
                <Td>{a.status !== 'CONVERTED' && <Button size="sm" variant="ghost" icon={<UserCheck className="size-4" />} onClick={() => convert.mutate(a.id)} disabled={!convertUserId[a.id]}>Convert</Button>}</Td>
              </tr>
            ))}
          </Table>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-3">Staff Profiles / ID Ops</h2>
          <Table headers={['Staff', 'Worker code', 'Onboarding', 'ID issued', '']}>
            {(profiles.data ?? []).length === 0 && <EmptyState colSpan={5} title="No staff profiles" />}
            {(profiles.data ?? []).map((p) => (
              <tr key={p.id}>
                <Td><div className="text-[13px] font-medium">{p.user?.name ?? p.userId}</div><div className="text-[11px] text-ink-3">{p.user?.email ?? ''}</div></Td>
                <Td className="font-mono text-[12px]">{p.workerCode || '—'}</Td>
                <Td><Badge tone={p.onboardingComplete ? 'ok' : 'warn'}>{p.onboardingComplete ? 'Complete' : 'Pending'}</Badge></Td>
                <Td className="text-[12px]">{p.idCardIssuedAt ? new Date(p.idCardIssuedAt).toLocaleString() : '—'}</Td>
                <Td><Button size="sm" variant="ghost" icon={<IdCard className="size-4" />} onClick={() => issueId.mutate(p.userId)}>Issue ID token</Button></Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="New workforce application">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name"><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email"><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          </div>
          <Field label="Requested role code"><Input value={form.requestedRoleCode} onChange={e => setForm(f => ({ ...f, requestedRoleCode: e.target.value }))} placeholder="registration_staff / access_scanner / ..." /></Field>
          <Field label="Notes"><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Create'}</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
