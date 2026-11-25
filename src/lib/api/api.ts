export interface ApiErrorBody {
  code: string
  message: string
  details?: { path: string; message: string }[]
  correlationId?: string
}

export class ApiError extends Error {
  status: number
  code: string
  details?: { path: string; message: string }[]
  data?: unknown
  correlationId?: string

  constructor(status: number, body: { error: ApiErrorBody; data?: unknown }) {
    super(body.error.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.error.code
    this.details = body.error.details
    this.correlationId = body.error.correlationId
    this.data = body.data
  }
}

export interface ApiSuccess<T> {
  data: T
}

export interface RefreshResult<TUser = unknown> {
  token: string
  user: TUser
}

export interface RequestOptions {
  retry?: boolean
  signal?: AbortSignal
  timeoutMs?: number
}

let accessToken: string | null = null
let accessTokenExpiresAt = 0
let refreshPromise: Promise<RefreshResult | null> | null = null

export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const DEFAULT_TIMEOUT_MS = 10_000
const REFRESH_TIMEOUT_MS = 8_000
const REFRESH_SKEW_MS = 30_000
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh']

function decodeTokenExpiry(token: string): number {
  try {
    const payload = token.split('.')[1]
    if (!payload) return 0
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
    return typeof json.exp === 'number' ? json.exp * 1000 : 0
  } catch {
    return 0
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token
  accessTokenExpiresAt = token ? decodeTokenExpiry(token) : 0
}

export function getAccessToken() {
  return accessToken
}

function shouldProactivelyRefresh() {
  return Boolean(accessToken && accessTokenExpiresAt && Date.now() >= accessTokenExpiresAt - REFRESH_SKEW_MS)
}

/** Fetch with a hard timeout and caller cancellation without leaking timers. */
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false

  const forwardAbort = () => controller.abort(init.signal?.reason)
  if (init.signal) {
    if (init.signal.aborted) forwardAbort()
    else init.signal.addEventListener('abort', forwardAbort, { once: true })
  }

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (timedOut) {
      throw new ApiError(0, {
        error: { code: 'TIMEOUT', message: `Request timed out after ${timeoutMs}ms` },
      })
    }
    throw error
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', forwardAbort)
  }
}

async function tryRefresh(): Promise<RefreshResult | null> {
  const res = await fetchWithTimeout(
    `${API_BASE}/auth/refresh`,
    { method: 'POST', credentials: 'include' },
    REFRESH_TIMEOUT_MS,
  )
  if (!res.ok) return null

  const body = (await res.json()) as ApiSuccess<RefreshResult>
  if (!body.data?.token) return null

  setAccessToken(body.data.token)
  return body.data
}

/** Single-flight refresh shared by API calls, auth boot and SSE reconnects. */
export function refreshSession(): Promise<RefreshResult | null> {
  refreshPromise ??= tryRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: RequestOptions = { retry: true },
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const canRefresh = opts.retry !== false && !NO_REFRESH_PATHS.includes(path)
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let refreshed = false
  if (canRefresh && shouldProactivelyRefresh()) {
    const session = await refreshSession()
    refreshed = Boolean(session)
    if (session) headers.set('Authorization', `Bearer ${session.token}`)
  }

  const fetchArgs: RequestInit = { ...init, headers, credentials: 'include' }
  let res = await fetchWithTimeout(`${API_BASE}${path}`, fetchArgs, timeoutMs)

  if (res.status === 401 && canRefresh && !refreshed && !init.signal?.aborted) {
    const session = await refreshSession()
    if (session) {
      headers.set('Authorization', `Bearer ${session.token}`)
      res = await fetchWithTimeout(`${API_BASE}${path}`, fetchArgs, timeoutMs)
    }
  }

  if (!res.ok) {
    let body: { error: ApiErrorBody; data?: unknown }
    try {
      body = (await res.json()) as { error: ApiErrorBody; data?: unknown }
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
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: 'GET', signal: opts?.signal }, opts),
  post: <T>(path: string, body?: JsonBody, opts?: RequestOptions) =>
    request<T>(
      path,
      { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body), signal: opts?.signal },
      opts,
    ),
  patch: <T>(path: string, body?: JsonBody, opts?: RequestOptions) =>
    request<T>(
      path,
      { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body), signal: opts?.signal },
      opts,
    ),
  put: <T>(path: string, body?: JsonBody, opts?: RequestOptions) =>
    request<T>(
      path,
      { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body), signal: opts?.signal },
      opts,
    ),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', signal: opts?.signal }, opts),
})

export function queryString(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}
