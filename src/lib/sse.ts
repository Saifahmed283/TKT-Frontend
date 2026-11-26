import { useEffect, useRef, useState } from 'react'
import { getAccessToken, refreshSession } from './api'

/**
 * Realtime helpers backed by the backend SSE hub.
 * The backend `/realtime` endpoint requires bearer auth, which EventSource
 * cannot send — so we stream with `fetch` + ReadableStream instead and keep
 * the same hook API.
 * - useSse(): returns a tick counter that increments on real SSE events only.
 *   Pass it into react-query queryKey to auto-refetch live data.
 * - useOnline(): navigator online/offline tracker for the offline scanner.
 * - useSseChannel(channel): opens a stream and invokes onEvent for each message.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const RETRY_MS = 3_000
const MAX_RETRY_MS = 15_000
const STALL_MS = 45_000
const TICK_DEBOUNCE_MS = 200
// Serverless production uses bounded polling; local development keeps SSE.
const SSE_ENABLED = import.meta.env.DEV

type SseKind = 'access' | 'incident' | 'task' | 'announcement' | 'activity' | 'reservation'

type SseCallbacks = {
  onEvent: (event: string, data: unknown) => void
  onOpen?: () => void
  onClose: () => void
}

async function readStream(
  res: Response,
  signal: AbortSignal,
  onStall: () => void,
  { onEvent, onOpen }: Pick<SseCallbacks, 'onEvent' | 'onOpen'>,
) {
  if (!res.body) throw new Error('SSE stream has no body')
  onOpen?.()

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let stalled = false
  let stallTimer = window.setTimeout(() => {
    stalled = true
    onStall()
  }, STALL_MS)

  const touch = () => {
    clearTimeout(stallTimer)
    stallTimer = window.setTimeout(() => {
      stalled = true
      onStall()
    }, STALL_MS)
  }

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      touch()
      buf += decoder.decode(value, { stream: true })

      let idx: number
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        const dataMatch = /^data:\s*(.*)$/m.exec(frame)
        if (!dataMatch) continue
        const eventMatch = /^event:\s*(.+)$/m.exec(frame)
        const name = eventMatch ? eventMatch[1]!.trim() : 'message'
        try {
          onEvent(name, JSON.parse(dataMatch[1]!))
        } catch {
          /* malformed frame — ignore */
        }
      }
      if (stalled) throw new Error('SSE stream stalled')
      if (signal.aborted) break
    }
  } finally {
    clearTimeout(stallTimer)
    reader.releaseLock()
  }
}

function openSseStream(channel: string, callbacks: SseCallbacks): () => void {
  const ctrl = new AbortController()
  let closed = false

  const request = async () => {
    const headers: Record<string, string> = { Accept: 'text/event-stream' }
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`

    let res = await fetch(`${API_BASE}/realtime?channel=${encodeURIComponent(channel)}`, {
      headers,
      credentials: 'include',
      signal: ctrl.signal,
    })

    // Access tokens expire while streams are idle. Refresh once, then retry
    // this connection instead of looping on 401 every few seconds.
    if (res.status === 401) {
      const session = await refreshSession()
      if (!session || ctrl.signal.aborted) return
      headers['Authorization'] = `Bearer ${session.token}`
      res = await fetch(`${API_BASE}/realtime?channel=${encodeURIComponent(channel)}`, {
        headers,
        credentials: 'include',
        signal: ctrl.signal,
      })
    }

    if (!res.ok) throw new Error(`SSE connection failed (${res.status})`)
    await readStream(res, ctrl.signal, () => ctrl.abort(), callbacks)
  }

  void request()
    .catch(() => {
      /* aborted or network failure — the effect schedules a reconnect */
    })
    .finally(() => {
      if (!closed) callbacks.onClose()
    })

  return () => {
    closed = true
    ctrl.abort()
  }
}

function retryDelay(attempt: number) {
  return Math.min(MAX_RETRY_MS, RETRY_MS * 2 ** Math.min(attempt, 4)) + Math.floor(Math.random() * 500)
}

export function useSse(eventId?: string, kind: SseKind = 'access') {
  const [tick, setTick] = useState(0)
  const tickTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!eventId) return
    if (!SSE_ENABLED) {
      const interval = window.setInterval(() => setTick((current) => current + 1), 30_000)
      return () => window.clearInterval(interval)
    }
    const channel = `event:${eventId}:${kind}`
    let alive = true
    let attempt = 0
    let retry: number | undefined
    let close: (() => void) | undefined

    const scheduleRetry = () => {
      if (!alive) return
      retry = window.setTimeout(connect, retryDelay(attempt++))
    }

    const connect = () => {
      if (!alive) return
      close = openSseStream(channel, {
        // The backend sends `connected` on every successful open. Treating it
        // as data used to refetch every query on mount/reconnect.
        onEvent: (name) => {
          if (name === 'connected') return
          if (tickTimer.current) clearTimeout(tickTimer.current)
          tickTimer.current = window.setTimeout(() => setTick((t) => t + 1), TICK_DEBOUNCE_MS)
        },
        onOpen: () => {
          attempt = 0
        },
        onClose: scheduleRetry,
      })
    }

    connect()
    return () => {
      alive = false
      if (retry) clearTimeout(retry)
      if (tickTimer.current) clearTimeout(tickTimer.current)
      close?.()
    }
  }, [eventId, kind])

  return tick
}

export function useSseChannel(
  eventId: string | undefined,
  kind: SseKind,
  onEvent: (event: string, data: unknown) => void,
) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!eventId || !SSE_ENABLED) return
    const channel = `event:${eventId}:${kind}`
    let alive = true
    let attempt = 0
    let retry: number | undefined
    let close: (() => void) | undefined

    const scheduleRetry = () => {
      if (!alive) return
      retry = window.setTimeout(connect, retryDelay(attempt++))
    }

    const connect = () => {
      if (!alive) return
      close = openSseStream(channel, {
        onEvent: (name, data) => onEventRef.current(name, data),
        onOpen: () => {
          attempt = 0
        },
        onClose: scheduleRetry,
      })
    }

    connect()
    return () => {
      alive = false
      if (retry) clearTimeout(retry)
      close?.()
    }
  }, [eventId, kind])
}

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])
  return online
}
