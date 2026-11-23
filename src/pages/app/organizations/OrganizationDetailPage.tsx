import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Building2, Shield, Users, Plus, Trash2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'

type Org = { id: string; name: string; slug: string; description?: string | null; myRole: string; _count: { events: number; members: number } }
type Member = { id: string; role: string; status: string; user: { id: string; name: string; email: string } }
type Role = { id: string; code: string; name: string; scope: string; permissions: string[]; kind?: string; system?: boolean }

export function OrganizationDetailPage() {
  const { orgId = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [memberOpen, setMemberOpen] = useState(false)
  const [memberForm, setMemberForm] = useState({ email: '', role: 'VIEWER' })
  const [memberErr, setMemberErr] = useState('')
  const [roleOpen, setRoleOpen] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', scope: 'EVENT', permissionsText: '' })

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.get<Org>(`/organizations/${orgId}`) })
  const membersQ = useQuery({ queryKey: ['org-members', orgId], queryFn: () => api.get<Member[]>(`/organizations/${orgId}/members`) })
  const rolesQ = useQuery({
    queryKey: ['org-roles', orgId],
    queryFn: async () => {
      const data = await api.get<Role[] | { system: Role[]; custom: Role[] }>(`/organizations/${orgId}/roles`)
      if (Array.isArray(data)) return data
      return [...(data.system ?? []), ...(data.custom ?? [])]
    },
  })

  const addMember = useMutation({
    mutationFn: () => api.post(`/organizations/${orgId}/members`, memberForm),
    onSuccess: () => { toast.success('Member added'); setMemberOpen(false); setMemberForm({ email: '', role: 'VIEWER' }); setMemberErr(''); qc.invalidateQueries({ queryKey: ['org-members', orgId] }); qc.invalidateQueries({ queryKey: ['org', orgId] }) },
    onError: (e) => setMemberErr(e instanceof ApiError ? e.message : 'Could not add member'),
  })
  const removeMember = useMutation({
    mutationFn: (memberId: string) => api.delete(`/organizations/${orgId}/members/${memberId}`),
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries({ queryKey: ['org-members', orgId] }); qc.invalidateQueries({ queryKey: ['org', orgId] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not remove member'),
  })
  const updateMember = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) => api.patch(`/organizations/${orgId}/members/${memberId}`, { role }),
    onSuccess: () => { toast.success('Member role updated'); qc.invalidateQueries({ queryKey: ['org-members', orgId] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not update member'),
  })
  const createRole = useMutation({
    mutationFn: () => api.post(`/organizations/${orgId}/roles`, {
      name: roleForm.name,
      description: roleForm.description || undefined,
      scope: roleForm.scope,
      permissions: roleForm.permissionsText.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => { toast.success('Role created'); setRoleOpen(false); setRoleForm({ name: '', description: '', scope: 'EVENT', permissionsText: '' }); qc.invalidateQueries({ queryKey: ['org-roles', orgId] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not create role'),
  })
  const deleteRole = useMutation({
    mutationFn: (roleId: string) => api.delete(`/organizations/${orgId}/roles/${roleId}`),
    onSuccess: () => { toast.success('Role deleted'); qc.invalidateQueries({ queryKey: ['org-roles', orgId] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete role'),
  })

  if (orgQ.isLoading) return <FullPageSpinner />
  if (orgQ.error || !orgQ.data) return <InlineError message="Could not load organization." onRetry={() => orgQ.refetch()} />
  const org = orgQ.data
  const canManage = org.myRole === 'OWNER' || org.myRole === 'ADMIN'

  return (
    <div className="pb-16">
      <PageHeader title={org.name} subtitle={org.description || 'Organization roles, members, and event ownership.'} icon={<Building2 className="size-5" />} actions={canManage ? <Button icon={<Plus className="size-4" />} onClick={() => setMemberOpen(true)}>Add member</Button> : undefined} />
      <div className="px-6 pt-6 space-y-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="panel p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-ink-3">Your role</p><p className="mt-2 font-display text-lg font-semibold">{org.myRole}</p></div>
          <div className="panel p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-ink-3">Members</p><p className="mt-2 font-display text-lg font-semibold">{org._count.members}</p></div>
          <div className="panel p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-ink-3">Events</p><p className="mt-2 font-display text-lg font-semibold">{org._count.events}</p></div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2"><Users className="size-4 text-signal" /><h2 className="text-sm font-semibold">Members</h2></div>
          <Table headers={['User', 'Org role', 'Status', '']}>
            {(membersQ.data ?? []).length === 0 && <EmptyState colSpan={4} title="No members" />}
            {(membersQ.data ?? []).map((m) => (
              <tr key={m.id}>
                <Td><p className="text-[13px] font-medium">{m.user.name}</p><p className="text-[11px] text-ink-3">{m.user.email}</p></Td>
                <Td>
                  {canManage ? (
                    <Select value={m.role} onChange={(e) => updateMember.mutate({ memberId: m.id, role: e.target.value })} className="!h-8 max-w-[160px] text-xs">
                      <option value="OWNER">OWNER</option><option value="ADMIN">ADMIN</option><option value="VIEWER">VIEWER</option>
                    </Select>
                  ) : <Badge tone="default">{m.role}</Badge>}
                </Td>
                <Td><Badge tone={m.status === 'ACTIVE' ? 'ok' : 'warn'}>{m.status}</Badge></Td>
                <Td>
                  {canManage && (
                    <div className="flex justify-end">
                      <ConfirmDialog title="Remove member" body={`Remove ${m.user.name} from this organization?`} confirmLabel="Remove" onConfirm={() => removeMember.mutate(m.id)}>
                        <button className="rounded p-1.5 text-danger hover:bg-danger/10" aria-label="Remove"><Trash2 className="size-4" /></button>
                      </ConfirmDialog>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Shield className="size-4 text-signal" /><h2 className="text-sm font-semibold">Role catalog</h2></div>{canManage && <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setRoleOpen(true)}>Custom role</Button>}</div>
          <div className="grid gap-3 lg:grid-cols-2">
            {(rolesQ.data ?? []).map((r) => (
              <div key={r.id} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="text-[13px] font-semibold">{r.name}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{r.code} · {r.scope}</p></div>
                  <Badge tone={r.system ? 'live' : 'default'}>{r.system ? 'SYSTEM' : 'CUSTOM'}</Badge>
                </div>
                <p className="mt-3 text-[11px] text-ink-3">{r.permissions.length} permissions</p>
                {canManage && !r.system && (
                  <div className="mt-3 flex justify-end"><Button size="sm" variant="ghost" className="text-danger" onClick={() => deleteRole.mutate(r.id)}>Delete</Button></div>
                )}
              </div>
            ))}
            {(rolesQ.data ?? []).length === 0 && <div className="panel p-4 text-sm text-ink-3">No roles found.</div>}
          </div>
        </div>

        <div className="text-[12px] text-ink-3"><Link to="/app/organizations" className="text-signal hover:underline">Back to organizations</Link></div>
      </div>

      <Dialog open={memberOpen} onClose={() => setMemberOpen(false)} title="Add organization member">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); setMemberErr(''); addMember.mutate() }} className="space-y-4">
          <Field label="Email"><Input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} required /></Field>
          <Field label="Role"><Select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}><option value="OWNER">OWNER</option><option value="ADMIN">ADMIN</option><option value="VIEWER">VIEWER</option></Select></Field>
          {memberErr && <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-[13px] text-danger">{memberErr}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setMemberOpen(false)}>Cancel</Button><Button type="submit" loading={addMember.isPending}>Add member</Button></div>
        </form>
      </Dialog>

      <Dialog open={roleOpen} onClose={() => setRoleOpen(false)} title="Create custom role">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); createRole.mutate() }} className="space-y-4">
          <Field label="Role name"><Input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required /></Field>
          <Field label="Description"><Input value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} /></Field>
          <Field label="Scope"><Select value={roleForm.scope} onChange={(e) => setRoleForm({ ...roleForm, scope: e.target.value })}><option value="EVENT">EVENT</option><option value="AREA">AREA</option><option value="ORGANIZATION">ORGANIZATION</option></Select></Field>
          <Field label="Permissions (comma or space separated)"><Input value={roleForm.permissionsText} onChange={(e) => setRoleForm({ ...roleForm, permissionsText: e.target.value })} placeholder="event.view ticket.view" /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setRoleOpen(false)}>Cancel</Button><Button type="submit" loading={createRole.isPending}>Create role</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
