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
  titleAr?: string
  body?: string
  bodyAr?: string
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
  title: 'Booking Confirmation & Ticket Issuance',
  titleAr: 'تأكيد الحجز وإصدار التذكرة',
  body: 'Hello, thank you for booking with TKT. Your ticket details are below.',
  bodyAr: 'مرحباً، شكراً لحجزك معنا. يسعدنا تأكيد مشاركتك في الحدث التالي.',
  footer: 'Your Partner in Travel, Events & Special Occasions',
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
            <Field label="Title (English)"><Input value={emailTpl.title ?? ''} onChange={e => setEmailTpl({ ...emailTpl, title: e.target.value })} placeholder={DEFAULT_TEMPLATE.title} /></Field>
            <Field label="العنوان بالعربية"><Input dir="rtl" value={emailTpl.titleAr ?? ''} onChange={e => setEmailTpl({ ...emailTpl, titleAr: e.target.value })} placeholder={DEFAULT_TEMPLATE.titleAr} /></Field>
            <Field label="Body (English)">
              <Textarea rows={4} value={emailTpl.body ?? ''} onChange={e => setEmailTpl({ ...emailTpl, body: e.target.value })} placeholder={DEFAULT_TEMPLATE.body} />
            </Field>
            <Field label="نص الرسالة بالعربية">
              <Textarea dir="rtl" rows={4} value={emailTpl.bodyAr ?? ''} onChange={e => setEmailTpl({ ...emailTpl, bodyAr: e.target.value })} placeholder={DEFAULT_TEMPLATE.bodyAr} />
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

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title="Email Preview — Figma Design" wide>
        <div className="max-h-[78vh] space-y-4 overflow-y-auto">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-line-soft bg-elevated/30 p-3 text-[12px]">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Subject</div>
              <div className="break-words text-ink">{(emailTpl.subject ?? DEFAULT_TEMPLATE.subject)?.replaceAll('{event}', event.name)}</div>
            </div>
            <div className="border border-line-soft bg-elevated/30 p-3 text-[12px]">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">Preheader</div>
              <div className="break-words text-ink">{(emailTpl.preheader ?? DEFAULT_TEMPLATE.preheader)?.replaceAll('{event}', event.name)}</div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px] overflow-hidden rounded-2xl border border-[#e8e3d9] bg-[#fdfbf7] shadow-xl" style={{ color: '#172033' }}>
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0b0b0c] px-6 py-6 sm:px-9">
              <div dir="ltr" className="font-serif text-4xl tracking-wide text-[#c8a25c]">TKT</div>
              <div className="text-right">
                <p dir="rtl" className="text-sm text-white">رحلتك تبدأ معنا</p>
                <p dir="ltr" className="mt-1 text-[10px] tracking-widest text-white">YOUR EXPERIENCE STARTS HERE</p>
              </div>
            </div>

            <div className="space-y-4 px-5 py-7 sm:px-9">
              <div>
                <h2 dir="rtl" className="text-right text-2xl font-bold leading-relaxed text-[#0b1f44]">{(emailTpl.titleAr ?? DEFAULT_TEMPLATE.titleAr)?.replaceAll('{event}', event.name)}</h2>
                <p dir="ltr" className="mt-1 text-left text-base font-bold text-[#c8a25c]">{(emailTpl.title ?? DEFAULT_TEMPLATE.title)?.replaceAll('{event}', event.name)}</p>
                <p dir="rtl" className="mt-5 whitespace-pre-wrap text-right text-sm leading-8 text-[#172033]">{(emailTpl.bodyAr ?? DEFAULT_TEMPLATE.bodyAr)?.replaceAll('{event}', event.name)}</p>
                <p dir="ltr" className="mt-2 whitespace-pre-wrap text-left text-sm leading-7 text-[#172033]">{(emailTpl.body ?? DEFAULT_TEMPLATE.body)?.replaceAll('{event}', event.name)}</p>
              </div>

              <section className="rounded-2xl bg-[#f1ede4] p-5">
                <h3 dir="rtl" className="text-right text-base font-bold text-[#0b1f44]">تفاصيل الحجز</h3>
                <p dir="ltr" className="mt-1 text-left text-[10px] font-semibold tracking-widest text-[#0b1f44]">BOOKING DETAILS</p>
                <div className="mt-4 divide-y divide-[#e3ddd2]">
                  {[
                    ['الفعالية', 'EVENT', event.name],
                    ['نوع التذكرة', 'TICKET', 'General Admission'],
                    ['التاريخ والوقت', 'DATE', 'As scheduled'],
                    ['الرقم المرجعي', 'REFERENCE', 'TKT-XXXXXX'],
                  ].map(([ar, en, value]) => (
                    <div key={en} className="grid grid-cols-[1fr_.8fr_1.2fr] gap-2 py-3 text-[11px] sm:text-xs">
                      <span dir="rtl" className="text-right text-[#6d6a64]">{ar}</span>
                      <span dir="ltr" className="text-left font-semibold tracking-wide text-[#172033]">{en}</span>
                      <span className="break-words text-right font-semibold text-[#172033]">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col items-center gap-4 rounded-2xl bg-[#faf8f4] p-4 sm:flex-row sm:gap-5">
                <div className="flex size-28 shrink-0 items-center justify-center border-4 border-white bg-white p-2 shadow-sm" aria-label="Sample QR placeholder, not a real ticket code">
                  <svg viewBox="0 0 21 21" role="img" aria-label="Sample QR placeholder only" className="size-full" shapeRendering="crispEdges">
                    <rect width="21" height="21" fill="#fff"/>
                    <path fill="#0b0b0c" d="M0 0h7v7H0zM14 0h7v7h-7zM0 14h7v7H0zM2 2v3h3V2zM16 2v3h3V2zM2 16v3h3v-3zM9 0h2v2H9zM8 4h2v2H8zM9 8h3v3H9zM13 9h2v2h-2zM17 9h2v3h-2zM8 13h2v2H8zM11 14h2v2h-2zM14 13h2v2h-2zM9 17h2v3H9zM13 17h3v2h-3zM18 16h3v2h-3z"/>
                  </svg>
                </div>
                <div className="text-center sm:text-right">
                  <p dir="rtl" className="text-sm font-bold leading-7 text-[#0b1f44]">امسح الرمز للتحقق من صلاحية التذكرة</p>
                  <p dir="ltr" className="mt-1 text-xs leading-6 text-[#565e6b]">Scan this code to verify your ticket</p>
                  <p className="mt-2 text-[10px] text-[#8a6a35]">Preview sample — actual QR is generated per ticket</p>
                </div>
              </section>

              <div className="rounded-full bg-[#c8a25c] px-5 py-4 text-center text-sm font-bold text-white">عرض التذكرة&nbsp; / &nbsp;VIEW TICKET</div>

              <div className="border-t border-[#e8e3d9] pt-5 text-center">
                <p dir="rtl" className="text-sm font-bold text-[#0b1f44]">TKT لتنظيم الرحلات والفعاليات والمناسبات</p>
                <p dir="ltr" className="mt-1 text-xs text-[#687080]">{(emailTpl.footer ?? DEFAULT_TEMPLATE.footer)?.replaceAll('{event}', event.name)}</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-ink-3">This is a visual preview. A unique, signed QR image and the live ticket link are added when the ticket email is sent.</p>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}