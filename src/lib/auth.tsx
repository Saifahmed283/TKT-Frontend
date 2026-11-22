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
        await refresh()
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

/** UI-level permission gate. The server remains the source of truth;
 *  this only hides actions for users without any event role or platform admin. */
export function usePermissions() {
  const { user } = useAuth()
  return useCallback(
    (_permission: string) => {
      if (user?.platformRole === 'super_admin') return true
      return (user?.eventMemberships?.length ?? 0) > 0 || (user?.orgMemberships?.length ?? 0) > 0
    },
    [user],
  )
}