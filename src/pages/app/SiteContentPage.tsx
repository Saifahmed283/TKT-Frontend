import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpRight, Globe, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { ABOUT_CONTENT_QUERY_KEY, type AboutContent, type LocalizedText } from '@/lib/public'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/input'
import { FullPageSpinner, InlineError } from '@/components/ui/spinner'
import { useToast } from '@/components/ui/toast'

type Section = 'team' | 'partners' | 'reports'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'team', label: 'The Team' },
  { id: 'partners', label: 'Our Partners' },
  { id: 'reports', label: 'Field Reports' },
]

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function withText(value: LocalizedText, lang: 'en' | 'ar', next: string): LocalizedText {
  return { ...value, [lang]: next }
}

function updateAt<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, i) => (i === index ? { ...item, ...patch } : item))
}

function moveAt<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  optional = false,
}: {
  label: string
  value: LocalizedText
  onChange: (next: LocalizedText) => void
  multiline?: boolean
  optional?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={`${label} · EN`} hint={optional ? 'Optional' : undefined}>
        {multiline ? (
          <Textarea required={!optional} rows={3} value={value.en} onChange={(e) => onChange(withText(value, 'en', e.target.value))} />
        ) : (
          <Input required={!optional} value={value.en} onChange={(e) => onChange(withText(value, 'en', e.target.value))} />
        )}
      </Field>
      <Field label={`${label} · AR`} hint={optional ? 'Optional' : undefined}>
        {multiline ? (
          <Textarea required={!optional} rows={3} dir="rtl" value={value.ar} onChange={(e) => onChange(withText(value, 'ar', e.target.value))} />
        ) : (
          <Input required={!optional} dir="rtl" value={value.ar} onChange={(e) => onChange(withText(value, 'ar', e.target.value))} />
        )}
      </Field>
    </div>
  )
}

type CopyFieldsValue = { eyebrow: LocalizedText; titleA: LocalizedText; titleB: LocalizedText; badge?: LocalizedText }

function CopyFields({
  value,
  onChange,
}: {
  value: CopyFieldsValue
  onChange: (next: CopyFieldsValue) => void
}) {
  return (
    <div className="space-y-4 border border-line bg-elevated/40 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-signal-dim">Section headings</p>
      <LocalizedField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => onChange({ ...value, eyebrow })} />
      <LocalizedField label="Title first part" value={value.titleA} onChange={(titleA) => onChange({ ...value, titleA })} />
      <LocalizedField label="Title highlighted part" value={value.titleB} onChange={(titleB) => onChange({ ...value, titleB })} />
      {value.badge && (
        <LocalizedField label="Side badge" value={value.badge} onChange={(badge) => onChange({ ...value, badge })} />
      )}
    </div>
  )
}

function ItemToolbar({
  index,
  total,
  onMove,
  onRemove,
  testIdPrefix,
}: {
  index: number
  total: number
  onMove: (delta: number) => void
  onRemove: () => void
  testIdPrefix: string
}) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="p-1.5 text-ink-3 hover:text-signal disabled:opacity-30">
        <ArrowUp className="size-4" />
      </button>
      <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1.5 text-ink-3 hover:text-signal disabled:opacity-30">
        <ArrowDown className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Remove"
        data-testid={`${testIdPrefix}-remove-${index}`}
        onClick={onRemove}
        className="p-1.5 text-danger hover:bg-danger/10"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

export function SiteContentPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [section, setSection] = useState<Section>('team')
  const [form, setForm] = useState<AboutContent | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['site-content-admin'],
    queryFn: () => api.get<AboutContent>('/site-content/about'),
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const save = useMutation({
    mutationFn: (payload: AboutContent) => api.put<AboutContent>('/site-content/about', payload as unknown as Record<string, unknown>),
    onSuccess: (result) => {
      setForm(result)
      qc.setQueryData(['site-content-admin'], result)
      qc.setQueryData(ABOUT_CONTENT_QUERY_KEY, result)
      toast.success('Website content saved')
    },
    onError: (err: any) => toast.error(err?.message ?? 'Could not save website content'),
  })

  if (isLoading) return <FullPageSpinner />
  if (error) return <InlineError message="Could not load website content." onRetry={refetch} />
  if (!form) return null

  const dirty = JSON.stringify({ ...form, updatedAt: null }) !== JSON.stringify({ ...data, updatedAt: null })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate(form)
  }

  return (
    <div className="pb-16">
      <PageHeader
        title="Website content"
        subtitle="Edit the public About page. Save to publish to ticketak.vercel.app."
        icon={<Globe className="size-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/about"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 border border-line-soft bg-raised px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-signal/40 hover:text-signal"
            >
              View page <ArrowUpRight className="size-4" />
            </Link>
            <Button
              type="button"
              variant="ghost"
              icon={<RotateCcw className="size-4" />}
              disabled={!dirty || save.isPending}
              onClick={() => setForm(data ?? null)}
            >
              Reset
            </Button>
            <Button
              type="submit"
              form="site-content-form"
              icon={<Save className="size-4" />}
              loading={save.isPending}
              disabled={!dirty}
              data-testid="site-content-save"
            >
              Save changes
            </Button>
          </div>
        }
      />

      <div className="border-b border-line px-6 pt-6">
        <div className="flex flex-wrap gap-1">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`border-b-2 px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                section === item.id ? 'border-signal text-signal' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <form id="site-content-form" onSubmit={submit} className="mx-auto max-w-5xl space-y-5 px-6 pt-6">
        {section === 'team' && (
          <>
            <CopyFields
              value={form.copy.team}
              onChange={(copy) => setForm({ ...form, copy: { ...form.copy, team: { ...form.copy.team, ...copy } } })}
            />
            {form.members.map((member, index) => (
              <div key={member.id} className="space-y-4 border border-line bg-raised/60 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Member {String(index + 1).padStart(2, '0')}</p>
                  <ItemToolbar
                    index={index}
                    total={form.members.length}
                    onMove={(delta) => setForm({ ...form, members: moveAt(form.members, index, delta) })}
                    onRemove={() => setForm({ ...form, members: form.members.filter((_, i) => i !== index) })}
                    testIdPrefix="site-content-member"
                  />
                </div>
                <LocalizedField label="Name" value={member.name} onChange={(name) => setForm({ ...form, members: updateAt(form.members, index, { name }) })} />
                <LocalizedField label="Role" value={member.role} onChange={(role) => setForm({ ...form, members: updateAt(form.members, index, { role }) })} />
                <LocalizedField label="Bio" multiline value={member.bio} onChange={(bio) => setForm({ ...form, members: updateAt(form.members, index, { bio }) })} />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="size-4" />}
              data-testid="site-content-add-member"
              onClick={() =>
                setForm({
                  ...form,
                  members: [...form.members, {
                    id: newId(),
                    name: { en: 'New team member', ar: 'عضو فريق جديد' },
                    role: { en: 'Role', ar: 'الدور' },
                    bio: { en: 'Describe this team member.', ar: 'صف هذا العضو.' },
                  }],
                })
              }
            >
              Add member
            </Button>
          </>
        )}

        {section === 'partners' && (
          <>
            <CopyFields
              value={form.copy.partners}
              onChange={(copy) => setForm({ ...form, copy: { ...form.copy, partners: { ...form.copy.partners, ...copy } } })}
            />
            {form.partners.map((partner, index) => (
              <div key={partner.id} className="flex items-start gap-4 border border-line bg-raised/60 p-5">
                <div className="flex-1">
                  <LocalizedField label="Partner name" value={partner.name} onChange={(name) => setForm({ ...form, partners: updateAt(form.partners, index, { name }) })} />
                </div>
                <ItemToolbar
                  index={index}
                  total={form.partners.length}
                  onMove={(delta) => setForm({ ...form, partners: moveAt(form.partners, index, delta) })}
                  onRemove={() => setForm({ ...form, partners: form.partners.filter((_, i) => i !== index) })}
                  testIdPrefix="site-content-partner"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="size-4" />}
              data-testid="site-content-add-partner"
              onClick={() =>
                setForm({
                  ...form,
                  partners: [...form.partners, { id: newId(), name: { en: 'NEW PARTNER', ar: 'NEW PARTNER' } }],
                })
              }
            >
              Add partner
            </Button>
          </>
        )}

        {section === 'reports' && (
          <>
            <CopyFields
              value={form.copy.reports}
              onChange={(copy) => setForm({ ...form, copy: { ...form.copy, reports: { ...form.copy.reports, ...copy } } })}
            />
            {form.reports.map((report, index) => (
              <div key={report.id} className="space-y-4 border border-line bg-raised/60 p-5">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">Report {String(index + 1).padStart(2, '0')}</p>
                  <ItemToolbar
                    index={index}
                    total={form.reports.length}
                    onMove={(delta) => setForm({ ...form, reports: moveAt(form.reports, index, delta) })}
                    onRemove={() => setForm({ ...form, reports: form.reports.filter((_, i) => i !== index) })}
                    testIdPrefix="site-content-report"
                  />
                </div>
                <LocalizedField label="Author" value={report.author} onChange={(author) => setForm({ ...form, reports: updateAt(form.reports, index, { author }) })} />
                <LocalizedField label="Role" optional value={report.role} onChange={(role) => setForm({ ...form, reports: updateAt(form.reports, index, { role }) })} />
                <LocalizedField label="Event" optional value={report.eventName} onChange={(eventName) => setForm({ ...form, reports: updateAt(form.reports, index, { eventName }) })} />
                <LocalizedField label="Quote" multiline value={report.content} onChange={(content) => setForm({ ...form, reports: updateAt(form.reports, index, { content }) })} />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="size-4" />}
              data-testid="site-content-add-report"
              onClick={() =>
                setForm({
                  ...form,
                  reports: [...form.reports, {
                    id: newId(),
                    author: { en: 'Guest name', ar: 'اسم الضيف' },
                    role: { en: '', ar: '' },
                    eventName: { en: '', ar: '' },
                    content: { en: 'Add the field report here.', ar: 'أضف التقرير الميداني هنا.' },
                  }],
                })
              }
            >
              Add field report
            </Button>
          </>
        )}

        <p className="border-t border-line pt-4 text-[11px] text-ink-3">
          {data?.updatedAt ? `Last published ${new Date(data.updatedAt).toLocaleString()}` : 'Using default content until you save changes.'}
        </p>
      </form>
    </div>
  )
}
