import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useTaxonomy } from '../../lib/taxonomy'
import type { Organization } from '../../lib/types'
import { ErrorBanner, Modal } from '../ui'

export function EventFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const taxonomyQ = useTaxonomy()
  const orgsQ = useQuery({
    queryKey: ['my-orgs'],
    queryFn: () => api<Organization[]>('/organizations'),
    enabled: open,
  })

  const [orgId, setOrgId] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('CONFERENCE')
  const [category, setCategory] = useState('OTHER')
  const [domain, setDomain] = useState('OTHER')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [venueName, setVenueName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      const first = orgsQ.data?.[0]
      setOrgId(first?.id ?? '')
      setStartAt(new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16))
      setEndAt('')
    }
  }, [open, orgsQ.data])

  const create = useMutation({
    mutationFn: () =>
      api<{ id: string }>('/events', {
        method: 'POST',
        body: JSON.stringify({
          organizationId: orgId,
          name,
          type,
          category,
          domain,
          startAt: new Date(startAt).toISOString(),
          ...(endAt ? { endAt: new Date(endAt).toISOString() } : {}),
          ...(venueName ? { venueName } : {}),
          ...(description ? { description } : {}),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      onClose()
    },
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <Modal open={open} onClose={onClose} title="New event">
      <form onSubmit={onSubmit} className="space-y-4">
        {orgsQ.isLoading ? (
          <p className="text-sm text-ink-400">Loading organizations…</p>
        ) : (orgsQ.data ?? []).length === 0 ? (
          <p className="rounded-none border border-warn-400/25 bg-warn-400/10 px-3 py-2 text-sm text-warn-400">
            You are not a member of any organization yet. Events are created inside an organization.
          </p>
        ) : (
          <>
            <div>
              <label className="label mb-1.5 block">Organization</label>
              <select className="input" value={orgId} onChange={(e) => setOrgId(e.target.value)} required>
                {(orgsQ.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Summit 2026" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label mb-1.5 block">Event type</label>
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                  {taxonomyQ.data.eventFormats.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Event category</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {taxonomyQ.data.eventCategories.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1.5 block">Domain</label>
                <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)}>
                  {taxonomyQ.data.eventDomains.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Venue</label>
              <input className="input" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Main Hall" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label mb-1.5 block">Starts</label>
                <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
              </div>
              <div>
                <label className="label mb-1.5 block">Ends (optional)</label>
                <input type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Description</label>
              <textarea className="input min-h-20 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {create.isError && <ErrorBanner error={create.error} />}
            <button type="submit" disabled={create.isPending} className="btn-primary w-full py-2.5">
              {create.isPending ? 'Creating…' : 'Create event'}
            </button>
          </>
        )}
      </form>
    </Modal>
  )
}