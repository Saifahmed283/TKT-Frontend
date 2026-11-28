import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useMemo, useState, type FormEvent } from 'react'
import { Shield, Users, Plus, Trash2, Pencil, Search, CheckSquare, Square, FolderPlus, Folder, ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { FileUploadField } from '@/components/ui/file-upload'
import { Td, EmptyState } from '@/components/ui/table'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'

type OrgFolder = { id: string; name: string; color?: string | null; sortOrder: number; _count?: { events: number } }
type OrgEvent = { id: string; name: string; status: string; startAt?: string | null; type?: string; folderId?: string | null }
type Org = { id: string; name: string; slug: string; description?: string | null; logoUrl?: string | null; myRole: string; folders?: OrgFolder[]; events?: OrgEvent[]; _count: { events: number; members: number } }
type Member = { id: string; role: string; status: string; user: { id: string; name: string; email: string } }
type Role = { id: string; code: string; name: string; description?: string | null; scope: string; permissions: string[]; kind?: string; system?: boolean }
type CatalogPerm = { code: string; description: string }

const SCOPES = ['EVENT', 'TEAM', 'AREA', 'ORGANIZATION'] as const

function groupPermissions(perms: CatalogPerm[]) {
  const groups: Record<string, CatalogPerm[]> = {}
  for (const p of perms) {
    const group = p.code.split('.')[0] || 'other'
    ;(groups[group] ||= []).push(p)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

function RoleEditor({ open, onClose, initial, catalog, onSave, saving, error }: { open: boolean; onClose: () => void; initial?: Role | null; catalog: CatalogPerm[]; onSave: (data: { name: string; description: string; scope: string; permissions: string[] }) => void; saving: boolean; error: string }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [scope, setScope] = useState(initial?.scope ?? 'EVENT')
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? [])
  const [q, setQ] = useState('')

  const groups = useMemo(() => {
    const filtered = q ? catalog.filter(p => p.code.includes(q.toLowerCase()) || p.description.toLowerCase().includes(q.toLowerCase())) : catalog
    return groupPermissions(filtered)
  }, [catalog, q])

  const toggle = (code: string) => setPermissions(prev => prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code])
  const toggleGroup = (codes: string[], allSelected: boolean) => setPermissions(prev => allSelected ? prev.filter(p => !codes.includes(p)) : Array.from(new Set([...prev, ...codes])))

  return (
    <Dialog open={open} onClose={onClose} title={initial ? 'Edit role' : 'Create custom role'} wide>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); onSave({ name, description, scope, permissions }) }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role name"><Input value={name} onChange={e => setName(e.target.value)} required /></Field>
          <Field label="Scope"><Select value={scope} onChange={e => setScope(e.target.value)}>{SCOPES.map(s => <option key={s} value={s}>{s}</option>)}</Select></Field>
        </div>
        <Field label="Description"><Input value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <Field label="Permissions">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1"><Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" /><Input className="ps-8" aria-label="Search permissions" value={q} onChange={e => setQ(e.target.value)} placeholder="Search permissions..." /></div>
              <Badge tone="default">{permissions.length} selected</Badge>
            </div>
            <div className="max-h-[50vh] overflow-auto rounded-none border border-[--color-structure] p-3 space-y-4">
              {groups.map(([group, perms]) => {
                const codes = perms.map(p => p.code)
                const allSelected = codes.every(c => permissions.includes(c))
                return (
                  <div key={group}>
                    <div className="mb-2 flex items-center justify-between">
                      <button type="button" className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-2" onClick={() => toggleGroup(codes, allSelected)}>
                        {allSelected ? <CheckSquare size={14} className="text-signal" /> : <Square size={14} />} {group}
                      </button>
                      <span className="text-[11px] text-ink-3">{codes.filter(c => permissions.includes(c)).length}/{codes.length}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {perms.map(p => {
                        const selected = permissions.includes(p.code)
                        return (
                          <label key={p.code} className={`flex cursor-pointer items-start gap-2 rounded-none border px-3 py-2 text-[12px] ${selected ? 'border-signal/40 bg-signal/5' : 'border-[--color-structure]'}`}>
                            <input type="checkbox" className="mt-0.5" checked={selected} onChange={() => toggle(p.code)} />
                            <div><div className="font-mono text-[11px] text-ink">{p.code}</div><div className="text-ink-3">{p.description}</div></div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {groups.length === 0 && <div className="text-sm text-ink-3">No permissions match.</div>}
            </div>
          </div>
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving} disabled={permissions.length === 0}>{initial ? 'Save role' : 'Create role'}</Button></div>
      </form>
    </Dialog>
  )
}

export function OrganizationDetailPage() {
  const { orgId = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const [memberOpen, setMemberOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const [memberForm, setMemberForm] = useState({ email: '', name: '', role: 'MEMBER' })
  const [memberErr, setMemberErr] = useState('')
  const [roleErr, setRoleErr] = useState('')
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderErr, setFolderErr] = useState('')
  const [activeFolderId, setActiveFolderId] = useState<string | 'all' | 'none'>('all')

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.get<Org>(`/organizations/${orgId}`), enabled: !!orgId })
  const membersQ = useQuery({ queryKey: ['org', orgId, 'members'], queryFn: () => api.get<Member[]>(`/organizations/${orgId}/members`), enabled: !!orgId })
  const rolesQ = useQuery({ queryKey: ['org', orgId, 'roles'], queryFn: () => api.get<{ system: Role[]; custom: Role[] }>(`/organizations/${orgId}/roles`), enabled: !!orgId })
  const catalogQ = useQuery({ queryKey: ['permissions-catalog'], queryFn: () => api.get<{ permissions: CatalogPerm[] }>('/organizations/permissions/catalog') })

  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['org', orgId] }) }
  const addMember = useMutation({
    mutationFn: () => api.post(`/organizations/${orgId}/members`, memberForm),
    onSuccess: () => { toast.success('Member added'); setMemberOpen(false); setMemberForm({ email: '', name: '', role: 'MEMBER' }); invalidate() },
    onError: (e) => setMemberErr(e instanceof ApiError ? e.message : 'Failed'),
  })
  const removeMember = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${orgId}/members/${id}`),
    onSuccess: () => { toast.success('Member removed'); invalidate() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  })
  const saveRole = useMutation({
    mutationFn: (data: { name: string; description: string; scope: string; permissions: string[] }) => editRole ? api.patch(`/organizations/${orgId}/roles/${editRole.id}`, data) : api.post(`/organizations/${orgId}/roles`, data),
    onSuccess: () => { toast.success(editRole ? 'Role updated' : 'Role created'); setRoleOpen(false); setEditRole(null); setRoleErr(''); invalidate() },
    onError: (e) => setRoleErr(e instanceof ApiError ? e.message : 'Failed'),
  })
  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${orgId}/roles/${id}`),
    onSuccess: () => { toast.success('Role deleted'); setDeleteRoleId(null); invalidate() },
    onError: (e) => { toast.error(e instanceof ApiError ? e.message : 'Failed'); setDeleteRoleId(null) },
  })

  const deleteOrg = useMutation({
    mutationFn: () => api.delete(`/organizations/${orgId}`),
    onSuccess: () => { toast.success('Organization deleted'); qc.invalidateQueries({ queryKey: ['organizations'] }); navigate('/app/organizations') },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to delete organization'),
  })
  const updateLogo = useMutation({
    mutationFn: (logoUrl: string | null) => api.patch(`/organizations/${orgId}`, { logoUrl }),
    onSuccess: () => { toast.success('Organization logo updated'); invalidate() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to update logo'),
  })
  const createFolder = useMutation({
    mutationFn: () => api.post(`/organizations/${orgId}/folders`, { name: folderName.trim() }),
    onSuccess: () => { toast.success('Folder created'); setFolderOpen(false); setFolderName(''); setFolderErr(''); invalidate() },
    onError: (e) => setFolderErr(e instanceof ApiError ? e.message : 'Failed to create folder'),
  })
  const deleteFolder = useMutation({
    mutationFn: (folderId: string) => api.delete(`/organizations/${orgId}/folders/${folderId}`),
    onSuccess: () => { toast.success('Folder deleted'); if (activeFolderId !== 'all' && activeFolderId !== 'none') setActiveFolderId('all'); invalidate() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to delete folder'),
  })
  const moveEvent = useMutation({
    mutationFn: ({ eventId, folderId }: { eventId: string; folderId: string | null }) => api.patch(`/events/${eventId}`, { folderId }),
    onSuccess: () => { toast.success('Event moved'); invalidate() },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed to move event'),
  })
  const assignableRoles = useMemo(() => {
    const byCode = new Map([...(rolesQ.data?.system ?? []), ...(rolesQ.data?.custom ?? [])].map(r => [r.code, r]))
    for (const code of ['OWNER', 'ADMIN', 'MEMBER']) {
      if (!byCode.has(code)) byCode.set(code, { id: code, code, name: code, scope: 'ORGANIZATION', permissions: [] })
    }
    return [...byCode.values()]
  }, [rolesQ.data])

  if (orgQ.isLoading) return <FullPageSpinner />
  if (orgQ.error || !orgQ.data) return <InlineError message={orgQ.error instanceof Error ? orgQ.error.message : "Failed to load organization"} />
  const org = orgQ.data
  const canManage = org.myRole === 'OWNER' || org.myRole === 'ADMIN'
  const catalog = catalogQ.data?.permissions ?? []
  const folders = org.folders ?? []
  const events = org.events ?? []
  const visibleEvents = activeFolderId === 'all' ? events : activeFolderId === 'none' ? events.filter(e => !e.folderId) : events.filter(e => e.folderId === activeFolderId)

  return (
    <div>
      <PageHeader title={org.name} subtitle={org.description ?? org.slug}
        actions={canManage ? <div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setFolderOpen(true)} icon={<FolderPlus className="size-4" />}>New folder</Button><Button size="sm" variant="ghost" onClick={() => { setEditRole(null); setRoleErr(''); setRoleOpen(true) }} icon={<Plus className="size-4" />}>New role</Button><Button size="sm" onClick={() => { setMemberErr(''); setMemberForm({ email: '', name: '', role: 'MEMBER' }); setMemberOpen(true) }} icon={<Plus className="size-4" />}>Add member</Button><Button size="sm" variant="ghost" className="!text-danger" icon={<Trash2 className="size-4" />} onClick={() => setDeleteOrgOpen(true)}>Delete org</Button></div> : undefined} />

      <div className="space-y-6 pt-6">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2"><ImageIcon size={16} className="text-signal" /><h2 className="font-display text-lg font-semibold">Organization identity</h2></div>
            <div className="mb-4 flex items-center gap-4">
              <div className="grid size-20 place-items-center overflow-hidden border border-line bg-elevated">
                {org.logoUrl ? <img src={org.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="font-display text-2xl font-semibold text-signal">{org.name.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-ink">{org.name}</p>
                <p className="text-[12px] text-ink-3">{org.slug}</p>
                {canManage && <div className="mt-3 max-w-xs"><FileUploadField label="" value={org.logoUrl ?? ''} onChange={(v) => updateLogo.mutate(v || null)} accept="image/*" /></div>}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-line-soft p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-ink-3">Your role</p><p className="mt-1 font-display text-xl font-semibold text-signal">{org.myRole}</p></div>
              <div className="border border-line-soft p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-ink-3">Members</p><p className="mt-1 font-display text-xl font-semibold">{org._count.members}</p></div>
              <div className="border border-line-soft p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-ink-3">Events</p><p className="mt-1 font-display text-xl font-semibold">{org._count.events}</p></div>
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Folder size={16} className="text-signal" /><h2 className="font-display text-lg font-semibold">Folders & events</h2></div>{canManage && <Button size="sm" variant="ghost" onClick={() => setFolderOpen(true)} icon={<FolderPlus className="size-4" />}>Folder</Button>}</div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button type="button" aria-pressed={activeFolderId === 'all'} onClick={() => setActiveFolderId('all')} className={`border px-3 py-1.5 text-[12px] ${activeFolderId === 'all' ? 'border-signal/40 bg-signal/10 text-signal' : 'border-line text-ink-2'}`}>All ({events.length})</button>
              <button type="button" aria-pressed={activeFolderId === 'none'} onClick={() => setActiveFolderId('none')} className={`border px-3 py-1.5 text-[12px] ${activeFolderId === 'none' ? 'border-signal/40 bg-signal/10 text-signal' : 'border-line text-ink-2'}`}>Unfiled ({events.filter(e => !e.folderId).length})</button>
              {folders.map(f => (
                <div key={f.id} className={`flex items-center border ${activeFolderId === f.id ? 'border-signal/40 bg-signal/10 text-signal' : 'border-line text-ink-2'}`}>
                  <button type="button" aria-pressed={activeFolderId === f.id} onClick={() => setActiveFolderId(f.id)} className="px-3 py-1.5 text-[12px]">{f.name} ({f._count?.events ?? events.filter(e => e.folderId === f.id).length})</button>
                  {canManage && (
                    <ConfirmDialog title="Delete folder?" body={`Delete "${f.name}"? Events in it will become unfiled.`} confirmLabel="Delete" onConfirm={() => deleteFolder.mutate(f.id)}>
                      <IconButton className="border-s border-line" tone="quiet-danger" aria-label={`Delete folder ${f.name}`} disabled={deleteFolder.isPending}><Trash2 size={12} /></IconButton>
                    </ConfirmDialog>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {visibleEvents.map(e => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 border border-line-soft px-3 py-2">
                  <Link to={`/app/events/${e.id}`} className="min-w-0 flex-1 truncate text-[13px] font-medium hover:text-signal">{e.name}</Link>
                  <Badge tone={e.status === 'LIVE' ? 'live' : 'default'}>{e.status}</Badge>
                  {canManage && (
                    <select aria-label={`Folder for ${e.name}`} className="border border-line bg-canvas px-2 py-1 text-[11px] text-ink-2" value={e.folderId ?? ''} onChange={ev => moveEvent.mutate({ eventId: e.id, folderId: ev.target.value || null })}>
                      <option value="">Unfiled</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                </div>
              ))}
              {visibleEvents.length === 0 && <div className="border border-dashed border-line p-6 text-center text-sm text-ink-3">No events in this view.</div>}
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center gap-2"><Users size={16} className="text-signal" /><h2 className="font-display text-lg font-semibold">Members</h2></div>
          <ResponsiveTable headers={['Member', 'Email', 'Role', 'Status', '']}>
            {(membersQ.data ?? []).map(m => (
              <tr key={m.id}>
                <Td><span className="font-medium text-ink">{m.user.name}</span></Td>
                <Td className="text-ink-2">{m.user.email}</Td>
                <Td><Badge tone={m.role === 'OWNER' ? 'live' : 'default'}>{m.role}</Badge></Td>
                <Td><Badge tone={m.status === 'ACTIVE' ? 'ok' : 'warn'}>{m.status}</Badge></Td>
                <Td>{canManage && m.role !== 'OWNER' && (
                  <ConfirmDialog title="Remove member?" body={`Remove ${m.user.name} from this organization?`} confirmLabel="Remove" onConfirm={() => removeMember.mutate(m.id)}>
                    <IconButton tone="danger" aria-label={`Remove ${m.user.name}`} disabled={removeMember.isPending}><Trash2 size={14} /></IconButton>
                  </ConfirmDialog>
                )}</Td>
              </tr>
            ))}
            {(membersQ.data ?? []).length === 0 && <EmptyState colSpan={5} title="No members" />}
          </ResponsiveTable>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Shield size={16} className="text-signal" /><h2 className="font-display text-lg font-semibold">Roles & permissions</h2></div>
            {canManage && <Button size="sm" variant="ghost" onClick={() => { setEditRole(null); setRoleErr(''); setRoleOpen(true) }}><Plus size={14} /> Custom role</Button>}
          </div>
          <p className="mb-4 text-sm text-ink-3">System roles are read-only templates. Create custom roles to assign precise permissions per organization/event scope.</p>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Custom roles</h3>
          <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(rolesQ.data?.custom ?? []).map(r => (
              <div key={r.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold">{r.name}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{r.code} · {r.scope}</p></div><Badge tone="default">CUSTOM</Badge></div>
                {r.description && <p className="mt-2 text-[12px] text-ink-3">{r.description}</p>}
                <p className="mt-3 text-[11px] text-ink-3">{r.permissions.length} permissions</p>
                {canManage && <div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => { setEditRole(r); setRoleErr(''); setRoleOpen(true) }}><Pencil size={14} /> Edit</Button><Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleteRoleId(r.id)}><Trash2 size={14} /> Delete</Button></div>}
              </div>
            ))}
            {(rolesQ.data?.custom ?? []).length === 0 && <div className="panel p-4 text-sm text-ink-3">No custom roles yet.</div>}
          </div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">System roles</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(rolesQ.data?.system ?? []).map(r => (
              <div key={r.code} className="panel p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold">{r.name}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{r.code} · {r.scope}</p></div><Badge tone="live">SYSTEM</Badge></div>
                {r.description && <p className="mt-2 text-[12px] text-ink-3">{r.description}</p>}
                <p className="mt-3 text-[11px] text-ink-3">{r.permissions.length} permissions</p>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[12px] text-ink-3"><Link to="/app/organizations" className="text-signal hover:underline">Back to organizations</Link></div>
      </div>

      <Dialog open={memberOpen} onClose={() => setMemberOpen(false)} title="Add organization member">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); setMemberErr(''); addMember.mutate() }} className="space-y-4">
          <Field label="Email"><Input type="email" value={memberForm.email} onChange={e => setMemberForm({ ...memberForm, email: e.target.value })} required /></Field>
          <Field label="Name"><Input value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} /></Field>
          <Field label="Role"><Select value={memberForm.role} onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}>{assignableRoles.map(r => <option key={r.code} value={r.code}>{r.name === r.code ? r.code : `${r.name} (${r.code})`}</option>)}</Select></Field>
          {memberErr && <p className="text-sm text-danger">{memberErr}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setMemberOpen(false)}>Cancel</Button><Button type="submit" loading={addMember.isPending}>Add member</Button></div>
        </form>
      </Dialog>

      {roleOpen && <RoleEditor key={editRole?.id ?? 'new'} open={roleOpen} onClose={() => { setRoleOpen(false); setEditRole(null) }} initial={editRole} catalog={catalog} onSave={(d) => { setRoleErr(''); saveRole.mutate(d) }} saving={saveRole.isPending} error={roleErr} />}
      {deleteRoleId && <Dialog open={!!deleteRoleId} onClose={() => setDeleteRoleId(null)} title="Delete custom role"><p className="text-sm text-ink-2">This role will be removed. It must not be assigned to staff.</p><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteRoleId(null)}>Cancel</Button><Button variant="danger" loading={deleteRole.isPending} onClick={() => { if (deleteRoleId) deleteRole.mutate(deleteRoleId) }}>Delete</Button></div></Dialog>}
      <Dialog open={deleteOrgOpen} onClose={() => setDeleteOrgOpen(false)} title="Delete organization">
        <div className="space-y-4">
          <div className="rounded-none border border-danger/30 bg-danger/10 p-4 text-[13px] text-ink-2">
            <p className="font-semibold text-danger">Permanent action</p>
            <p className="mt-1">Delete <span className="font-semibold text-ink">{org.name}</span> and all its events, tickets, credentials, buses, payments, and staff data. This cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOrgOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleteOrg.isPending} onClick={() => deleteOrg.mutate()}>Delete organization</Button>
          </div>
        </div>
      </Dialog>
      <Dialog open={folderOpen} onClose={() => setFolderOpen(false)} title="Create folder">
        <form onSubmit={(e: FormEvent) => { e.preventDefault(); setFolderErr(''); if (!folderName.trim()) { setFolderErr('Folder name is required'); return } createFolder.mutate() }} className="space-y-4">
          <Field label="Folder name"><Input value={folderName} onChange={e => setFolderName(e.target.value)} required maxLength={80} /></Field>
          {folderErr && <p className="text-sm text-danger">{folderErr}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setFolderOpen(false)}>Cancel</Button><Button type="submit" loading={createFolder.isPending}>Create folder</Button></div>
        </form>
      </Dialog>
    </div>
  )
}


