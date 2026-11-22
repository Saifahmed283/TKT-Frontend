import { PageHeader } from '@/components/layout/page-header'
import { LifeBuoy } from 'lucide-react'

const sections = [
  {
    title: 'The lifecycle',
    body: 'Events move DRAFT → PLANNING → READY → PUBLISHED → LIVE → COMPLETED → ARCHIVED. Use "Move to …" in the event header to advance. Only a LIVE event accepts check-ins.',
  },
  {
    title: 'Roles and scopes',
    body: 'Permissions are atomic. EVENT-scope roles (event manager, scanner) apply across the whole event; AREA-scope roles (gate scanner, usher) are bound to specific areas. A scanner assigned to Main Gate cannot validate at Backstage.',
  },
  {
    title: 'Credentials',
    body: 'Issue a credential per ticket holder. It carries a signed payload (TKT1.*) that the offline scanner verifies with the server key — QR codes work even with no connectivity.',
  },
  {
    title: 'Access decisions',
    body: 'GRANTED means the holder entered. ALREADY_USED means the single-use credential was consumed. Every decision — grant or denial — lands in Access Logs and streams into live views.',
  },
  {
    title: 'Incidents and tasks',
    body: 'Log incidents with severity; CRITICAL alerts notify assigned staff immediately. Tasks move through TODO → IN_PROGRESS → DONE on the kanban. All of it is realtime via SSE.',
  },
  {
    title: 'Reports and audit',
    body: 'Reports page compiles attendance, access, incidents, tasks and finance. Export JSON from Reports, CSV from Audit. The audit trail is immutable — entries cannot be edited or deleted.',
  },
]

export function Guide() {
  return (
    <div className="mx-auto max-w-2xl pb-16">
      <PageHeader
        title="Operator Guide"
        subtitle="How TKT runs a live event."
        icon={<LifeBuoy className="size-5" />}
      />
      <div className="space-y-3 px-6 pt-6">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border border-line bg-raised/70 p-5">
            <h3 className="text-[14px] font-semibold">{s.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{s.body}</p>
          </div>
        ))}
        <div className="rounded-xl border border-line bg-elevated p-5">
          <h3 className="text-[14px] font-semibold">Keyboard</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[11px]">Ctrl/⌘</kbd> +{' '}
            <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[11px]">K</kbd> opens the command
            palette — search across events, attendees, staff, tasks and incidents.
          </p>
        </div>
      </div>
    </div>
  )
}