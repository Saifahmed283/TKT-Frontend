import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CalendarDays, Users, QrCode, BarChart3, CornerDownLeft } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Corners, Blink } from '../instruments'

const items = [
  { to: '/app', label: 'Overview', icon: BarChart3, hint: 'Dashboard' },
  { to: '/app/events', label: 'Events', icon: CalendarDays, hint: 'All events' },
  { to: '/app/scanner', label: 'Scanner', icon: QrCode, hint: 'Gate scanning' },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const eventItems = useMemo(
    () =>
      (user?.eventMemberships ?? []).map((em) => ({
        to: `/app/events/${em.event.id}`,
        label: em.event.name,
        hint: `${em.role.name} · ${em.event.status}`,
        icon: CalendarDays,
      })),
    [user],
  )

  const filtered = useMemo(() => {
    const all = [...items, ...eventItems, ...eventItems.map((i) => ({ ...i, to: i.to + '/attendees', label: i.label + ' → Attendees', icon: Users }))]
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((i) => i.label.toLowerCase().includes(q) || i.hint.toLowerCase().includes(q))
  }, [query, eventItems])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fade-in relative w-full max-w-lg overflow-hidden border border-line-soft bg-elevated shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <Corners />
        <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
          <Search size={15} className="text-signal" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events and pages…"
            className="flex-1 bg-transparent font-mono text-[13px] text-ink outline-none placeholder:text-ink-3"
          />
          <span className="flex items-center gap-1 font-mono text-[9px] text-ink-3">
            <span className="border border-line-soft bg-raised px-1.5 py-0.5">esc</span>
          </span>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && <p className="px-3 py-6 text-center font-mono text-[12px] text-ink-3">NO MATCHES</p>}
          {filtered.map((item, i) => (
            <button
              key={item.to + i}
              className="group flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-left transition-colors hover:border-signal/20 hover:bg-raised"
              onClick={() => {
                navigate(item.to)
                onClose()
              }}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center border border-line-soft bg-raised text-signal">
                <item.icon size={13} />
              </span>
              <span className="flex-1 font-mono text-[12px] text-ink">{item.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-3">{item.hint}</span>
              <CornerDownLeft size={12} className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-line-soft px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
          <Blink className="bg-signal" />
          Search indexes events & modules
        </div>
      </div>
    </div>
  )
}