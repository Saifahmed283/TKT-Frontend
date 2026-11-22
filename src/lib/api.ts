export interface ApiErrorBody {
  code: string
  message: string
  details?: { path: string; message: string }[]
}

export class ApiError extends Error {
  status: number
  code: string
  details?: { path: string; message: string }[]

  constructor(status: number, body: { error: ApiErrorBody }) {
    super(body.error.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.error.code
    this.details = body.error.details
  }
}

export interface ApiSuccess<T> {
  data: T
}

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function tryRefresh(): Promise<string | null> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) return null
  const body = (await res.json()) as ApiSuccess<{ token: string }>
  accessToken = body.data.token
  return accessToken
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { retry?: boolean } = { retry: true },
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })

  if (res.status === 401 && opts.retry && !['/auth/login', '/auth/register', '/auth/logout'].includes(path)) {
    refreshPromise ??= tryRefresh().finally(() => {
      refreshPromise = null
    })
    const token = await refreshPromise
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
      res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })
    }
  }

  if (!res.ok) {
    let body: { error: ApiErrorBody }
    try {
      body = (await res.json()) as { error: ApiErrorBody }
    } catch {
      throw new ApiError(res.status, {
        error: { code: 'NETWORK_ERROR', message: `Request failed (${res.status})` },
      })
    }
    throw new ApiError(res.status, body)
  }

  if (res.status === 204) return undefined as T
  return ((await res.json()) as ApiSuccess<T>).data
}

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null

/**
 * Callable api() keeps the original function signature; the object-style
 * methods (api.get / api.post / ...) are the idiomatic way to call the API.
 */
export const api = Object.assign(request, {
  get: <T>(path: string, opts?: { retry?: boolean }) => request<T>(path, { method: 'GET' }, opts),
  post: <T>(path: string, body?: JsonBody, opts?: { retry?: boolean }) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }, opts),
  patch: <T>(path: string, body?: JsonBody, opts?: { retry?: boolean }) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }, opts),
  put: <T>(path: string, body?: JsonBody, opts?: { retry?: boolean }) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }, opts),
  delete: <T>(path: string, opts?: { retry?: boolean }) => request<T>(path, { method: 'DELETE' }, opts),
})

export function queryString(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}