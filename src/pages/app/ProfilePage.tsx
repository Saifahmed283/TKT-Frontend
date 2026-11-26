import { useAuth } from '@/lib/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserCircle, LogOut, Shield, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <div className="pb-16">
      <PageHeader title="Profile" subtitle="Your account, roles, and access." icon={<UserCircle className="size-5" />} />
      <div className="max-w-3xl space-y-6 pt-6">
        <div className="panel p-4 sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">Account</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink-0">{user.name}</p>
          <p className="font-mono text-sm text-ink-3">{user.email}</p>
          {user.platformRole && <Badge tone="live" className="mt-3">{user.platformRole}</Badge>}
        </div>

        <div className="panel p-4 sm:p-6">
          <div className="flex items-center gap-2"><Building2 className="size-4 text-signal" /><h2 className="text-sm font-semibold">Organization memberships</h2></div>
          <div className="mt-4 space-y-2">
            {(user.orgMemberships ?? []).length === 0 && <p className="text-sm text-ink-3">No organization memberships.</p>}
            {(user.orgMemberships ?? []).map((m) => (
              <div key={m.org.id} className="flex items-center justify-between border border-line-soft px-3 py-2">
                <span className="text-sm">{m.org.name}</span>
                <Badge tone="default">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4 sm:p-6">
          <div className="flex items-center gap-2"><Shield className="size-4 text-signal" /><h2 className="text-sm font-semibold">Event memberships</h2></div>
          <div className="mt-4 space-y-2">
            {(user.eventMemberships ?? []).length === 0 && <p className="text-sm text-ink-3">No event memberships.</p>}
            {(user.eventMemberships ?? []).map((m) => (
              <div key={m.event.id} className="flex items-center justify-between border border-line-soft px-3 py-2">
                <span className="text-sm">{m.event.name}</span>
                <Badge tone="default">{m.role?.name ?? m.role?.code ?? 'Member'}</Badge>
              </div>
            ))}
          </div>
        </div>

        <Button variant="danger" icon={<LogOut className="size-4" />} onClick={async () => { await logout(); navigate('/login') }}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
