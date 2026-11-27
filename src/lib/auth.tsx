import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, refreshSession, setAccessToken } from './api'
import type { User } from './types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Reuses the refresh cookie to restore the session and user in one call. */
  refresh: () => Promise<void>
  /** Alias of refresh. */
  loadMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const hydratedFor = useRef<string | null>(null)

  // Older sessions can still hold a minimal auth user without memberships.
  // Hydrate once from /auth/me so permission gates and the gate scanner do
  // not treat a valid staff account as role-less.
  const ensureFullUser = useCallback(async (value: User | null): Promise<User | null> => {
    if (!value) return null
    if (Array.isArray(value.eventMemberships) && Array.isArray(value.orgMemberships)) return value
    if (hydratedFor.current === value.id) return value
    hydratedFor.current = value.id
    try {
      return await api<User>('/auth/me')
    } catch {
      return value
    }
  }, [])

  const applySession = useCallback((session: Awaited<ReturnType<typeof refreshSession>>) => {
    if (session) {
      setAccessToken(session.token)
      setUser(session.user as User)
    } else {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    applySession(await refreshSession())
  }, [applySession])

  useEffect(() => {
    let alive = true
    // /auth/refresh returns both a token and the user, so boot needs one
    // request instead of refresh -> /auth/me. Guests simply get no session.
    void (async () => {
      try {
        const session = await refreshSession()
        const next = session
          ? { ...session, user: await ensureFullUser(session.user as User) }
          : null
        if (alive) applySession(next)
      } catch {
        if (alive) applySession(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [applySession, ensureFullUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setAccessToken(res.token)
    setUser(await ensureFullUser(res.user))
  }, [ensureFullUser])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setAccessToken(res.token)
    setUser(await ensureFullUser(res.user))
  }, [ensureFullUser])

  const logout = useCallback(async () => {
    try {
      await api<{ ok: boolean }>('/auth/logout', { method: 'POST' })
    } finally {
      // Offline scanner identities and queues belong to the signed-in user.
      // Leaving them behind lets a later browser user impersonate that device.
      for (const key of ['tkt_device_keys', 'tkt_device_private_jwk', 'tkt_offline_queue']) {
        localStorage.removeItem(key)
      }
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, loadMe: refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** UI-level permission gate. Server remains source of truth. */
export function usePermissions() {
  const { user } = useAuth()
  const has = useCallback(
    (permission: string, eventId?: string) => {
      if (!user) return false
      if (user.platformRole === 'super_admin') return true
      if (eventId) {
        const m = user.eventMemberships?.find((em) => em.event.id === eventId)
        if (m?.role?.permissions?.includes(permission)) return true
        const orgId = m?.event?.org?.id
        const org = user.orgMemberships?.find((o) => o.org.id === orgId && o.status === 'ACTIVE')
        if (org && (org.role === 'OWNER' || org.role === 'ADMIN')) return true
        return false
      }
      if (user.eventMemberships?.some((m) => m.role?.permissions?.includes(permission))) return true
      return user.orgMemberships?.some((o) => o.status === 'ACTIVE' && (o.role === 'OWNER' || o.role === 'ADMIN'))
    },
    [user],
  )
  return { has, isSuperAdmin: user?.platformRole === 'super_admin' }
}
