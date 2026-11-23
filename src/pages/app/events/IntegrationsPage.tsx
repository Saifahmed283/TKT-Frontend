import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { Plug, Plus, Send, ShieldCheck, Map, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/input'
import { FileUploadField } from '@/components/ui/file-upload'
import { Table, Td, EmptyState } from '@/components/ui/table'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'

type Webhook = { id: string; name: string; url: string; active: boolean; events: string[]; deliveries?: { id: string; status: string; eventType: string; createdAt: string }[] }
type Insurance = { id: string; provider: string; policyNumber: string; claimStatus: string; incidentReport?: string | null }
type MapAsset = { id: string; map3dUrl?: string | null; mapImageUrl?: string | null; mapPdfUrl?: string | null; routeNotes?: string | null } | null

export function IntegrationsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [hook, setHook] = useState({ name: '', url: '', events: 'reservation.created,credential.issued', secret: '' })
  const [ins, setIns] = useState({ provider: '', policyNumber: '', coverageDetails: '' })
  const [map, setMap] = useState({ map3dUrl: '', mapImageUrl: '', mapPdfUrl: '', routeNotes: '' })

  const webhooks = useQuery({ queryKey: ['webhooks', eventId], queryFn: () => api.get<Webhook[]>(`/events/${eventId}/integrations/webhooks`) })
  const insurance = useQuery({ queryKey: ['insurance', eventId], queryFn: () => api.get<Insurance[]>(`/events/${eventId}/integrations/insurance`) })
  const mapAsset = useQuery({ queryKey: ['event-map', eventId], queryFn: () => api.get<MapAsset>(`/events/${eventId}/integrations/map`) })

  const createHook = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/integrations/webhooks`, { ...hook, events: hook.events.split(',').map(s => s.trim()).filter(Boolean) }),
    onSuccess: () => { toast.success('Webhook created'); setOpen(false); qc.invalidateQueries({ queryKey: ['webhooks'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not create webhook'),
  })
  const testHook = useMutation({
    mutationFn: (id: string) => api.post(`/events/${eventId}/integrations/webhooks/${id}/test`, {}),
    onSuccess: () => { toast.success('Test delivery queued'); qc.invalidateQueries({ queryKey: ['webhooks'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Webhook test failed'),
  })
  const removeHook = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/integrations/webhooks/${id}`),
    onSuccess: () => { toast.success('Webhook deleted'); qc.invalidateQueries({ queryKey: ['webhooks'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete webhook'),
  })
  const createIns = useMutation({
    mutationFn: () => api.post(`/events/${eventId}/integrations/insurance`, ins),
    onSuccess: () => { toast.success('Insurance policy saved'); setIns({ provider: '', policyNumber: '', coverageDetails: '' }); qc.invalidateQueries({ queryKey: ['insurance'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save insurance'),
  })
  const saveMap = useMutation({
    mutationFn: () => api.put(`/events/${eventId}/integrations/map`, map),
    onSuccess: () => { toast.success('Event map saved'); qc.invalidateQueries({ queryKey: ['event-map'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save map'),
  })
  const removeInsurance = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${eventId}/integrations/insurance/${id}`),
    onSuccess: () => { toast.success('Policy deleted'); qc.invalidateQueries({ queryKey: ['insurance'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not delete policy'),
  })
  const removeMap = useMutation({
    mutationFn: () => api.delete(`/events/${eventId}/integrations/map`),
    onSuccess: () => { toast.success('Map assets removed'); setMap({ map3dUrl: '', mapImageUrl: '', mapPdfUrl: '', routeNotes: '' }); qc.invalidateQueries({ queryKey: ['event-map'] }) },
    onError: (e: any) => toast.error(e?.message ?? 'Could not remove map assets'),
  })

  if (webhooks.isLoading) return <FullPageSpinner />
  if (webhooks.error) return <InlineError message="Could not load integrations." onRetry={() => webhooks.refetch()} />

  const currentMap = mapAsset.data
  const mapForm = { map3dUrl: map.map3dUrl || currentMap?.map3dUrl || '', mapImageUrl: map.mapImageUrl || currentMap?.mapImageUrl || '', mapPdfUrl: map.mapPdfUrl || currentMap?.mapPdfUrl || '', routeNotes: map.routeNotes || currentMap?.routeNotes || '' }

  return (
    <div className="pb-16">
      <PageHeader title="Integrations / Extras" subtitle="Webhooks, insurance, and event map assets." icon={<Plug className="size-5" />} actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Add webhook</Button>} />
      <div className="px-6 pt-6 space-y-8">
        <div>
          <h2 className="text-sm font-semibold mb-3">Webhooks</h2>
          <Table headers={['Name', 'URL', 'Events', 'Status', '']}>
            {(webhooks.data ?? []).length === 0 && <EmptyState colSpan={5} title="No webhooks" />}
            {(webhooks.data ?? []).map(w => (
              <tr key={w.id}>
                <Td className="text-[13px] font-medium">{w.name}</Td>
                <Td className="text-[12px] max-w-[320px] truncate">{w.url}</Td>
                <Td className="text-[11px] text-ink-3">{(w.events || []).join(', ') || '—'}</Td>
                <Td><Badge tone={w.active ? 'ok' : 'warn'}>{w.active ? 'Active' : 'Inactive'}</Badge></Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" icon={<Send className="size-4" />} onClick={() => testHook.mutate(w.id)}>Test</Button>
                    <ConfirmDialog title="Delete webhook?" body={`Delete webhook "${w.name}"?`} confirmLabel="Delete" onConfirm={() => removeHook.mutate(w.id)}>
                      <Button size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} />
                    </ConfirmDialog>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4" /> Insurance</h2>
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); createIns.mutate() }} className="space-y-3 rounded-2xl border border-stroke/30 p-4">
              <Field label="Provider"><Input value={ins.provider} onChange={e => setIns(v => ({ ...v, provider: e.target.value }))} required /></Field>
              <Field label="Policy number"><Input value={ins.policyNumber} onChange={e => setIns(v => ({ ...v, policyNumber: e.target.value }))} required /></Field>
              <Field label="Coverage details"><Input value={ins.coverageDetails} onChange={e => setIns(v => ({ ...v, coverageDetails: e.target.value }))} /></Field>
              <Button type="submit" disabled={createIns.isPending}>{createIns.isPending ? 'Saving…' : 'Add policy'}</Button>
            </form>
            <Table headers={['Provider', 'Policy', 'Claim status', '']}>
              {(insurance.data ?? []).length === 0 && <EmptyState colSpan={4} title="No insurance policies" />}
              {(insurance.data ?? []).map(i => (
                <tr key={i.id}>
                  <Td>{i.provider}</Td>
                  <Td className="font-mono text-[12px]">{i.policyNumber}</Td>
                  <Td><Badge tone={i.claimStatus === 'reported' ? 'warn' : 'ok'}>{i.claimStatus}</Badge></Td>
                  <Td>
                    <div className="flex justify-end">
                      <ConfirmDialog title="Delete insurance policy?" body={`Delete ${i.provider} ${i.policyNumber}?`} confirmLabel="Delete" onConfirm={() => removeInsurance.mutate(i.id)}>
                        <Button size="sm" variant="ghost" className="text-danger" icon={<Trash2 className="size-4" />} />
                      </ConfirmDialog>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Map className="size-4" /> Event Map Assets</h2>
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); saveMap.mutate() }} className="space-y-3 rounded-2xl border border-stroke/30 p-4">
              <FileUploadField label="3D map / model" hint="Optional URL or upload" value={mapForm.map3dUrl} onChange={(url) => setMap(v => ({ ...v, map3dUrl: url }))} accept="image/*,application/pdf,.glb,.gltf,.obj,.zip" />
              <FileUploadField label="Map image" hint="Optional" value={mapForm.mapImageUrl} onChange={(url) => setMap(v => ({ ...v, mapImageUrl: url }))} accept="image/*" />
              <FileUploadField label="Map PDF" hint="Optional" value={mapForm.mapPdfUrl} onChange={(url) => setMap(v => ({ ...v, mapPdfUrl: url }))} accept="application/pdf,image/*" />
              <Field label="Route notes"><Input value={mapForm.routeNotes} onChange={e => setMap(v => ({ ...v, routeNotes: e.target.value }))} /></Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={saveMap.isPending}>{saveMap.isPending ? 'Saving…' : 'Save map assets'}</Button>
                <ConfirmDialog title="Remove map assets?" body="Remove all event map assets?" confirmLabel="Remove" onConfirm={() => removeMap.mutate()}>
                  <Button type="button" variant="ghost" className="text-danger">Remove</Button>
                </ConfirmDialog>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add webhook">
        <form onSubmit={(e) => { e.preventDefault(); createHook.mutate() }} className="space-y-3">
          <Field label="Name"><Input value={hook.name} onChange={e => setHook(v => ({ ...v, name: e.target.value }))} required /></Field>
          <Field label="URL"><Input value={hook.url} onChange={e => setHook(v => ({ ...v, url: e.target.value }))} required placeholder="https://example.com/webhook" /></Field>
          <Field label="Events" hint="Comma separated">
            <Select value={hook.events} onChange={e => setHook(v => ({ ...v, events: e.target.value }))}>
              <option value="reservation.created,credential.issued">Reservation + Credential</option>
              <option value="reservation.created,credential.issued,payment.confirmed,payment.rejected">Reservation + Payments</option>
              <option value="access.granted,access.denied">Access decisions</option>
              <option value="incident.created,incident.updated">Incidents</option>
              <option value="task.created,task.updated">Tasks</option>
              <option value="reservation.created,credential.issued,payment.confirmed,payment.rejected,access.granted,access.denied,incident.created,incident.updated,task.created,task.updated">All common events</option>
            </Select>
          </Field>
          <Field label="Secret (optional)"><Input value={hook.secret} onChange={e => setHook(v => ({ ...v, secret: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createHook.isPending}>{createHook.isPending ? 'Saving…' : 'Create'}</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
