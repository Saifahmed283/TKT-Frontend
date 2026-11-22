import { useEffect, useRef, useState } from 'react'
import { getAccessToken } from './api'

/**
 * Realtime helpers backed by the backend SSE hub.
 * The backend `/realtime` endpoint requires bearer auth, which EventSource
 * cannot send — so we stream with `fetch` + ReadableStream instead and keep
 * the same hook API.
 * - useSse(): returns a tick counter that increments on any SSE event for a channel.
 *   Pass it into react-query queryKey to auto-refetch live data.
 * - useOnline(): navigator online/offline tracker for the offline scanner.
 * - useSseChannel(channel): opens a stream and invokes onEvent for each message.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const RETRY_MS = 3_000

type SseKind = 'access' | 'incident' | 'task' | 'announcement' | 'activity' | 'reservation'

function openSseStream(
  channel: string,
  onEvent: (event: string, data: unknown) => void,
  onClose: () => void,
): () => void {
  const ctrl = new AbortController()
  const headers: Record<string, string> = { Accept: 'text/event-stream' }
  const token = getAccessToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  void (async () => {
    let buf = ''
    try {
      const res = await fetch(`${API_BASE}/realtime?channel=${encodeURIComponent(channel)}`, {
        headers,
        credentials: 'include',
        signal: ctrl.signal,
      })
      if (!res.ok || !res.body) throw new Error(`SSE connection failed (${res.status})`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
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
      }
    } catch {
      /* aborted or network failure — the effect schedules a reconnect */
    }
    onClose()
  })()

  return () => ctrl.abort()
}

export function useSse(eventId?: string, kind: SseKind = 'access') {
  const [tick, setTick] = useState(0)
  const eventIdRef = useRef<string | undefined>(eventId)

  useEffect(() => {
    if (!eventId) return
    eventIdRef.current = eventId
    const channel = `event:${eventId}:${kind}`
    let alive = true
    let retry: number | undefined

    const connect = () => {
      if (!alive) return
      const close = openSseStream(channel, () => setTick((t) => t + 1), () => {
        if (alive) retry = window.setTimeout(connect, RETRY_MS)
      })
      return close
    }

    const close = connect()
    return () => {
      alive = false
      if (retry) window.clearTimeout(retry)
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
    if (!eventId) return
    const channel = `event:${eventId}:${kind}`
    let alive = true
    let retry: number | undefined

    const connect = () => {
      if (!alive) return
      const close = openSseStream(channel, (e, d) => onEventRef.current(e, d), () => {
        if (alive) retry = window.setTimeout(connect, RETRY_MS)
      })
      return close
    }

    const close = connect()
    return () => {
      alive = false
      if (retry) window.clearTimeout(retry)
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