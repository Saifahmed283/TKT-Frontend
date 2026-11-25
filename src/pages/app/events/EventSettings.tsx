import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { Panel } from '@/components/motion/primitives'
import { Save, Mail, Eye } from 'lucide-react'
import { useState, useEffect, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/dialog'

type EmailTemplate = {
  subject?: string
  preheader?: string
  title?: string
  body?: string
  footer?: string
}

type EventSettingsData = {
  id: string
  name: string
  settings?: {
    registration?: { enabled?: boolean; open?: boolean; startAt?: string; endAt?: string }
    ticketEmail?: EmailTemplate
    finance?: { estimatedCost?: number; currency?: string; notes?: string }
  }
}

const DEFAULT_TEMPLATE: EmailTemplate = {
  subject: 'Your ticket — {event}',
  preheader: 'Ticket for {event} — present your QR at check-in',
  title: 'You\'re in, {event}',
  body: 'Your reservation for <strong>{event}</strong> is confirmed. Show this QR at the gate — it is signed, single-use and cannot be forged.',
  footer: 'TKT · Control center for live events',
}

export function EventSettingsPage() {
  const { eventId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [emailTpl, setEmailTpl] = useState<EmailTemplate>(DEFAULT_TEMPLATE)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const eventQ = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.get<EventSettingsData>(`/events/${eventId}`),
    enabled: !!eventId,
  })

  useEffect(() => {
    if (eventQ.data?.settings?.ticketEmail) {
      setEmailTpl({ ...DEFAULT_TEMPLATE, ...eventQ.data.settings.ticketEmail })
    }
  }, [eventQ.data])

  const saveSettings = useMutation({
    mutationFn: (settings: Partial<EventSettingsData['settings']>) =>
      api.patch(`/events/${eventId}`, { settings: { ...(eventQ.data?.settings ?? {}), ...settings } }),
    onSuccess: () => {
      toast.success('Settings saved')
      setSaving(false)
      void qc.invalidateQueries({ queryKey: ['event', eventId] })
    },
    onError: (e: any) => {
      toast.error(e?.message ?? 'Failed to save settings')
      setSaving(false)
    },
  })

  const handleSaveEmailTemplate = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    saveSettings.mutate({ ticketEmail: emailTpl })
  }

  const handlePreview = () => {
    setPreviewOpen(true)
  }

  if (!eventId) return <div className="h-screen flex items-center justify-center text-ink-3">Event not found</div>
  if (eventQ.isLoading) return <FullPageSpinner />
  if (eventQ.error || !eventQ.data) return <InlineError message="Could not load event" onRetry={() => eventQ.refetch()} />

  const event = eventQ.data

  return (
    <div className="pb-16">
      <PageHeader title="Event Settings" subtitle="Configure registration, ticket emails, finance estimates, and more." icon={<Mail size={18} />} />

      <div className="space-y-6 p-6">
        <Panel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Registration</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration enabled">
              <select className="input" value={String(event.settings?.registration?.enabled ?? true)} onChange={e => saveSettings.mutate({ registration: { ...event.settings?.registration, enabled: e.target.value === 'true' } })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field label="Registration open">
              <select className="input" value={String(event.settings?.registration?.open ?? false)} onChange={e => saveSettings.mutate({ registration: { ...event.settings?.registration, open: e.target.value === 'true' } })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
            <Field label="Opens at">
              <input type="datetime-local" className="input" value={event.settings?.registration?.startAt?.slice(0, 16) ?? ''} onChange={e => saveSettings.mutate({ registration: { ...event.settings?.registration, startAt: e.target.value ? new Date(e.target.value).toISOString() : undefined } })} />
            </Field>
            <Field label="Closes at">
              <input type="datetime-local" className="input" value={event.settings?.registration?.endAt?.slice(0, 16) ?? ''} onChange={e => saveSettings.mutate({ registration: { ...event.settings?.registration, endAt: e.target.value ? new Date(e.target.value).toISOString() : undefined } })} />
            </Field>
          </div>
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Ticket Email Template</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handlePreview}><Eye size={14} /> Preview</Button>
              <Button size="sm" onClick={handleSaveEmailTemplate} loading={saving}><Save size={14} /> Save template</Button>
            </div>
          </div>
          <form onSubmit={handleSaveEmailTemplate} className="space-y-4">
            <p className="text-[11px] text-ink-3">Use <code className="font-mono bg-elevated px-1.5 rounded-none">{'{'}</code>event<code className="font-mono bg-elevated px-1.5 rounded-none">{'}'}</code> placeholder for event name. Leave blank to use defaults.</p>
            <Field label="Subject"><Input value={emailTpl.subject ?? ''} onChange={e => setEmailTpl({ ...emailTpl, subject: e.target.value })} placeholder={DEFAULT_TEMPLATE.subject} /></Field>
            <Field label="Preheader"><Input value={emailTpl.preheader ?? ''} onChange={e => setEmailTpl({ ...emailTpl, preheader: e.target.value })} placeholder={DEFAULT_TEMPLATE.preheader} /></Field>
            <Field label="Title"><Input value={emailTpl.title ?? ''} onChange={e => setEmailTpl({ ...emailTpl, title: e.target.value })} placeholder={DEFAULT_TEMPLATE.title} /></Field>
            <Field label="Body (HTML)">
              <Textarea rows={6} value={emailTpl.body ?? ''} onChange={e => setEmailTpl({ ...emailTpl, body: e.target.value })} placeholder={DEFAULT_TEMPLATE.body} />
            </Field>
            <Field label="Footer"><Input value={emailTpl.footer ?? ''} onChange={e => setEmailTpl({ ...emailTpl, footer: e.target.value })} placeholder={DEFAULT_TEMPLATE.footer} /></Field>
          </form>
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-3">Finance Estimates</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Estimated cost"><Input type="number" step="0.01" value={event.settings?.finance?.estimatedCost ?? ''} onChange={e => saveSettings.mutate({ finance: { ...event.settings?.finance, estimatedCost: e.target.value ? Number(e.target.value) : undefined } })} /></Field>
            <Field label="Currency"><Input value={event.settings?.finance?.currency ?? 'EGP'} onChange={e => saveSettings.mutate({ finance: { ...event.settings?.finance, currency: e.target.value.toUpperCase() } })} /></Field>
            <Field label="Notes"><Input value={event.settings?.finance?.notes ?? ''} onChange={e => saveSettings.mutate({ finance: { ...event.settings?.finance, notes: e.target.value } })} /></Field>
          </div>
        </Panel>
      </div>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title="Email Preview" wide>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="border border-line-soft bg-elevated/30 p-4 font-mono text-[12px]">
            <div className="text-ink-3">Subject:</div>
            <div className="text-ink">{emailTpl.subject ?? DEFAULT_TEMPLATE.subject}</div>
          </div>
          <div className="border border-line-soft bg-elevated/30 p-4 font-mono text-[12px]">
            <div className="text-ink-3">Preheader:</div>
            <div className="text-ink">{emailTpl.preheader ?? DEFAULT_TEMPLATE.preheader}</div>
          </div>
          <div className="border border-line-soft bg-elevated/30 p-4 font-mono text-[12px]">
            <div className="text-ink-3">Title:</div>
            <div className="text-ink">{emailTpl.title ?? DEFAULT_TEMPLATE.title}</div>
          </div>
          <div className="border border-line-soft bg-elevated/30 p-4">
            <div className="text-ink-3 font-mono text-[11px] mb-2">Body:</div>
            {/* Show stored template markup as text; rendering it would execute
                author-controlled HTML in the authenticated dashboard origin. */}
            <div className="prose prose-invert max-w-none whitespace-pre-wrap break-words">{emailTpl.body ?? DEFAULT_TEMPLATE.body ?? ''}</div>
          </div>
          <div className="border border-line-soft bg-elevated/30 p-4 font-mono text-[12px]">
            <div className="text-ink-3">Footer:</div>
            <div className="text-ink">{emailTpl.footer ?? DEFAULT_TEMPLATE.footer}</div>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}