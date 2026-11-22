import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScanLine, Radio, WifiOff, Trash2, CheckCircle2, XCircle, Loader2, RotateCcw, VideoOff } from 'lucide-react'
import jsQR from 'jsqr'
import { api } from '../../lib/api'
import type { AccessDecision, Area } from '../../lib/types'
import { ErrorBanner, PageHeader } from '../../components/ui'
import { useAuth } from '../../lib/auth'

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike
type NavigatorWithBarcodeDetector = Navigator & { BarcodeDetector?: BarcodeDetectorCtor }

interface Device {
  deviceId: string
  serverPublicKey: string
}

interface QueueItem {
  localId: string
  code: string
  areaId: string
  decision: 'GRANTED' | 'DENIED'
  reason: string
  timestamp: string
  signature: string
  at: string
}

const KEY_STORAGE = 'tkt_device_keys'
const QUEUE_STORAGE = 'tkt_offline_queue'

async function signPayload(privateKey: CryptoKey, payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data)
  const bytes = new Uint8Array(sig)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function ScannerPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [device, setDevice] = useState<Device | null>(null)
  const [regError, setRegError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [eventId, setEventId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [code, setCode] = useState('')
  const [decision, setDecision] = useState<AccessDecision | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [online, setOnline] = useState(navigator.onLine)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const memberships = useMemo(() => user?.eventMemberships ?? [], [user])
  const events = memberships.filter((m) => ['event_manager', 'access_scanner', 'team_lead', 'support_staff'].includes(m.role.code))

  const activeMembership = memberships.find((m) => m.event.id === eventId)

  const areasQ = useQuery({
    queryKey: ['areas', eventId],
    queryFn: () => api<Area[]>(`/events/${eventId}/areas`),
    enabled: !!eventId,
  })

  const scanAreas = useMemo(() => {
    const all = areasQ.data ?? []
    const isAreaScoped = activeMembership?.role.scope === 'AREA'
    if (!isAreaScoped) return all
    const assigned = new Set(activeMembership?.areas.map((a) => a.area.id) ?? [])
    return all.filter((a) => assigned.has(a.id))
  }, [areasQ.data, activeMembership])

  useEffect(() => {
    const stored = localStorage.getItem(KEY_STORAGE)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Device
        setDevice(parsed)
      } catch {
        localStorage.removeItem(KEY_STORAGE)
      }
    }
    const queued = localStorage.getItem(QUEUE_STORAGE)
    if (queued) {
      try {
        setQueue(JSON.parse(queued))
      } catch {
        localStorage.removeItem(QUEUE_STORAGE)
      }
    }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE, JSON.stringify(queue))
  }, [queue])

  useEffect(() => {
    if (memberships[0]) {
      const em = memberships.find((m) => ['event_manager', 'access_scanner', 'team_lead'].includes(m.role.code)) ?? memberships[0]
      setEventId(em.event.id)
    }
  }, [memberships])

  const registerDevice = useCallback(async () => {
    setRegistering(true)
    setRegError(null)
    try {
      const kp = await crypto.subtle.generateKey(
        { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['sign', 'verify'],
      )
      const spki = await crypto.subtle.exportKey('spki', kp.publicKey)
      let bin = ''
      new Uint8Array(spki).forEach((b) => (bin += String.fromCharCode(b)))
      const b64 = btoa(bin)
      const pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`

      const res = await api<Device>(`/events/${eventId}/access/device/register`, {
        method: 'POST',
        body: JSON.stringify({
          deviceName: `Gate Scanner ${new Date().toLocaleDateString()}`,
          publicKey: pem,
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'MOBILE' : /iPad|Tablet/i.test(navigator.userAgent) ? 'TABLET' : 'DESKTOP',
          fingerprint: navigator.userAgent.slice(0, 120),
          appVersion: 'web-0.1.0',
        }),
      })
      localStorage.setItem(KEY_STORAGE, JSON.stringify(res))
      const storedKey = await crypto.subtle.exportKey('jwk', kp.privateKey)
      localStorage.setItem('tkt_device_private_jwk', JSON.stringify(storedKey))
      setDevice(res)
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Device registration failed')
    } finally {
      setRegistering(false)
    }
  }, [eventId])

  const validate = useMutation({
    mutationFn: async (c: string) => {
      const res = await api<AccessDecision>(`/events/${eventId}/access/validate`, {
        method: 'POST',
        body: JSON.stringify({ code: c, areaId, ...(device ? { deviceId: device.deviceId } : {}) }),
      })
      return res
    },
    onSuccess: (d) => {
      setDecision(d)
      setCode('')
    },
    onError: async (err, c) => {
      if (!online || !device) {
        const privateJwk = localStorage.getItem('tkt_device_private_jwk')
        if (!privateJwk) {
          setDecision({
            result: 'DENIED',
            reason: 'Offline, but this device is not registered for signing.',
            credentialId: null,
            ticketType: null,
            area: null,
            attendee: null,
            at: new Date().toISOString(),
          })
          return
        }
        try {
          const privateKey = await crypto.subtle.importKey(
            'jwk',
            JSON.parse(privateJwk),
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            true,
            ['sign'],
          )
          const payload = JSON.stringify({ code: c, areaId, at: new Date().toISOString() })
          const sig = await signPayload(privateKey, payload)
          const item: QueueItem = {
            localId: crypto.randomUUID(),
            code: c,
            areaId,
            decision: 'DENIED',
            reason: err instanceof Error ? err.message : 'Offline',
            timestamp: new Date().toISOString(),
            signature: sig,
            at: new Date().toISOString(),
          }
          setQueue((q) => [...q, item])
          setDecision({
            result: 'DENIED',
            reason: 'Queued offline — will sync when connection returns.',
            credentialId: null,
            ticketType: null,
            area: null,
            attendee: null,
            at: new Date().toISOString(),
          })
          setCode('')
        } catch {
          setDecision({
            result: 'DENIED',
            reason: 'Could not sign offline entry.',
            credentialId: null,
            ticketType: null,
            area: null,
            attendee: null,
            at: new Date().toISOString(),
          })
        }
        return
      }
      setDecision({
        result: 'DENIED',
        reason: err instanceof Error ? err.message : 'Scan failed',
        credentialId: null,
        ticketType: null,
        area: null,
        attendee: null,
        at: new Date().toISOString(),
      })
    },
  })

  const syncQueue = useMutation({
    mutationFn: async () => {
      if (!device) throw new Error('Device not registered')
      const items = [...queue]
      await api(`/events/${eventId}/access/sync`, {
        method: 'POST',
        body: JSON.stringify({ deviceId: device.deviceId, items }),
      })
      return items
    },
    onSuccess: (items) => {
      setQueue((q) => q.filter((i) => !items.some((s) => s.localId === i.localId)))
      qc.invalidateQueries({ queryKey: ['access-logs', eventId] })
    },
  })

  useEffect(() => {
    if (online && queue.length > 0 && device) syncQueue.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, queue.length, device])

  useEffect(() => {
    if (!eventId || !device) return
    let stopped = false
    const send = async () => {
      if (stopped) return
      try {
        await api(`/events/${eventId}/access/device/heartbeat`, {
          method: 'POST',
          body: JSON.stringify({ deviceId: device.deviceId, networkStatus: navigator.onLine ? 'ONLINE' : 'OFFLINE', appVersion: 'web-0.1.0' }),
        })
      } catch {
        /* best effort */
      }
    }
    send()
    const t = window.setInterval(send, 30000)
    return () => { stopped = true; window.clearInterval(t) }
  }, [eventId, device])

  useEffect(() => {
    let stream: MediaStream | null = null
    let raf: number | null = null
    let detector: BarcodeDetectorLike | null = null
    const nav = navigator as NavigatorWithBarcodeDetector
    if (nav.BarcodeDetector) {
      try {
        detector = new nav.BarcodeDetector({ formats: ['qr_code'] })
      } catch {
        detector = null
      }
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
    if (cameraOn) {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraOn(false)
        setCameraError('This browser has no camera access. Paste the code manually instead.')
        return
      }
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      let frame = 0
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = s
            videoRef.current.play()
          }
          const loop = async () => {
            const video = videoRef.current
            if (video && video.readyState >= 2 && !validate.isPending) {
              frame += 1
              let raw = ''
              if (detector) {
                try {
                  const codes = await detector.detect(video)
                  raw = String(codes[0]?.rawValue ?? '').trim()
                } catch {
                  /* frame skipped */
                }
              }
              if (!raw && ctx && video.videoWidth && video.videoHeight) {
                if (frame % 3 === 0) {
                  const size = Math.min(video.videoWidth, video.videoHeight)
                  const target = Math.min(size, 900)
                  canvas.width = target
                  canvas.height = target
                  ctx.drawImage(
                    video,
                    Math.floor((video.videoWidth - size) / 2),
                    Math.floor((video.videoHeight - size) / 2),
                    size,
                    size,
                    0,
                    0,
                    target,
                    target,
                  )
                  try {
                    const qr = jsQR(ctx.getImageData(0, 0, target, target).data, target, target, {
                      inversionAttempts: 'attemptBoth',
                    })
                    raw = String(qr?.data ?? '').trim()
                  } catch {
                    /* frame skipped */
                  }
                }
              }
              if (raw) {
                setCode(raw)
                validate.mutate(raw)
                stop()
                setCameraOn(false)
                return
              }
            }
            raf = requestAnimationFrame(loop)
          }
          raf = requestAnimationFrame(loop)
        })
        .catch((err: unknown) => {
          setCameraOn(false)
          setCameraError(
            err instanceof DOMException && err.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access or paste the code manually.'
              : 'Could not start the camera. Paste the code manually instead.',
          )
        })
    }
    return stop
  }, [cameraOn, validate])

  const big = decision?.result === 'GRANTED'
  const manualCode = code.trim()

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <PageHeader title="Gate Scanner" subtitle="Validate credentials at the gate." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input w-72" value={eventId} onChange={(e) => { setEventId(e.target.value); setAreaId('') }}>
          {events.map((em) => (
            <option key={em.event.id} value={em.event.id}>
              {em.event.name} · {em.role.name}
            </option>
          ))}
        </select>
        <select className="input w-56" value={areaId} onChange={(e) => setAreaId(e.target.value)} disabled={!eventId}>
          <option value="">Select gate area…</option>
          {scanAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}{!a.active ? ' (inactive)' : ''}
            </option>
          ))}
        </select>
        <span className={`badge ${online ? 'badge-ok' : 'badge-err'}`}>
          {online ? <Radio size={12} /> : <WifiOff size={12} />}
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      {!device && (
        <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold text-ink-50">Register this device</p>
            <p className="text-sm text-ink-400">Enables signed offline scans that sync when the network returns.</p>
          </div>
          <button className="btn-primary" onClick={registerDevice} disabled={registering || !eventId}>
            {registering ? <Loader2 size={14} className="animate-spin" /> : null}
            Register device
          </button>
        </div>
      )}
      {regError && <div className="mb-4"><ErrorBanner error={new Error(regError)} /></div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-4 p-5">
          <h2 className="label">Scan credential</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (manualCode && areaId) validate.mutate(manualCode)
            }}
            className="space-y-3"
          >
            <textarea
              className="input min-h-24 font-mono text-xs"
              placeholder="Paste or type the credential code…"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="submit" className="btn-primary w-full py-2.5" disabled={!manualCode || !areaId || validate.isPending}>
              {validate.isPending ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              {validate.isPending ? 'Validating…' : 'Validate'}
            </button>
          </form>
          {cameraOn ? (
            <div>
              <div className="relative overflow-hidden rounded-xl border border-line bg-black">
                <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
                    <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-signal" />
                    <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-signal" />
                    <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-signal" />
                    <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-signal" />
                  </div>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-medium uppercase tracking-[0.18em] text-signal">
                    {validate.isPending ? 'Validating…' : 'Scanning for QR'}
                  </span>
                </div>
              </div>
              <button
                className="btn-ghost mt-2 w-full"
                onClick={() => {
                  setCameraOn(false)
                  setCameraError(null)
                }}
              >
                <VideoOff size={14} /> Stop camera
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost w-full"
              disabled={!areaId}
              onClick={() => {
                setCameraError(null)
                setCameraOn(true)
              }}
            >
              <ScanLine size={14} /> Use camera
            </button>
          )}
          {cameraError && (
            <p className="flex items-center gap-2 rounded-lg border border-err-400/25 bg-err-400/10 px-3 py-2 text-xs text-err-400">
              <VideoOff size={12} /> {cameraError}
            </p>
          )}

          {decision && (
            <div
              className={`rounded-2xl border p-6 text-center ${
                big ? 'border-ok-400/30 bg-ok-400/10' : 'border-err-400/30 bg-err-400/10'
              }`}
            >
              {big ? <CheckCircle2 size={44} className="mx-auto text-ok-400" /> : <XCircle size={44} className="mx-auto text-err-400" />}
              <p className={`mt-3 font-mono text-2xl font-bold ${big ? 'text-ok-400' : 'text-err-400'}`}>{decision.result}</p>
              {decision.attendee && <p className="mt-1 text-sm text-ink-200">{decision.attendee.name}</p>}
              {decision.reason && <p className="mt-1 text-sm text-ink-400">{decision.reason}</p>}
              <button className="btn-ghost mt-4 py-1.5 text-xs" onClick={() => setDecision(null)}>
                <RotateCcw size={12} /> Clear
              </button>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="label">Offline queue</h2>
            {queue.length > 0 && (
              <div className="flex gap-2">
                <button className="btn-ghost py-1 text-xs" onClick={() => syncQueue.mutate()} disabled={!online || !device || syncQueue.isPending}>
                  <Radio size={12} /> Sync now
                </button>
                <button
                  className="btn-danger px-2 py-1"
                  onClick={() => {
                    if (confirm('Clear all queued offline entries?')) setQueue([])
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-400">
            When offline, denied scans are signed locally and queued. {queue.length} pending.
          </p>
          <div className="mt-4 space-y-2">
            {queue.length === 0 && <p className="py-8 text-center text-sm text-ink-400">Queue empty — all decisions synced.</p>}
            {[...queue].reverse().map((item) => (
              <div key={item.localId} className="flex items-center justify-between rounded-xl border border-line bg-ink-850 px-3.5 py-2.5 text-sm">
                <span className="font-mono text-xs text-ink-300">{item.code.slice(0, 20)}…</span>
                <span className={`text-xs ${item.decision === 'GRANTED' ? 'text-ok-400' : 'text-err-400'}`}>{item.decision}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}