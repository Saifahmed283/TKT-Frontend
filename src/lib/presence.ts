import { useEffect, useRef } from 'react'
import { api } from './api'

/**
 * Worker presence heartbeat. Sends the viewer's own presence for the given
 * event every HEARTBEAT_MS and on visibility/focus/connectivity changes.
 * `status` degrades to 'away' when the tab is hidden and 'disconnected'
 * on pagehide (keepalive fetch so the last signal survives navigation).
 */
const HEARTBEAT_MS = 15_000

function currentStatus(): 'active' | 'away' | 'disconnected' {
  if (!navigator.onLine) return 'disconnected'
  if (document.visibilityState === 'hidden') return 'away'
  return 'active'
}

export function useHeartbeat(eventId?: string) {
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (!eventId) return

    const send = async (status?: 'active' | 'away' | 'disconnected') => {
      if (inFlightRef.current) return
      inFlightRef.current = true
      try {
        await api.post(`/events/${eventId}/presence`, { status: status ?? currentStatus() })
      } catch {
        /* heartbeat is best-effort */
      } finally {
        inFlightRef.current = false
      }
    }

    void send()

    const timer = window.setInterval(() => void send(), HEARTBEAT_MS)
    const onVisibility = () => void send()
    const onFocus = () => void send()
    const onConnectivity = () => void send()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onConnectivity)
    window.addEventListener('offline', onConnectivity)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onConnectivity)
      window.removeEventListener('offline', onConnectivity)
    }
  }, [eventId])
}