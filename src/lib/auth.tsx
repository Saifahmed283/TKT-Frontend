import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setAccessToken } from './api'
import type { User } from './types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  /** Alias of refresh — re-fetches the current user from /auth/me */
  loadMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const me = await api<User>('/auth/me')
    setUser(me)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        // Try silent refresh first to avoid noisy 401 on /auth/me for guests.
        const res = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (res.ok) {
          const body = (await res.json()) as { data?: { token?: string } }
          if (body.data?.token) setAccessToken(body.data.token)
          await refresh()
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setAccessToken(res.token)
    await refresh()
  }, [refresh])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setAccessToken(res.token)
    await refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await api<{ ok: boolean }>('/auth/logout', { method: 'POST' })
    } finally {
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