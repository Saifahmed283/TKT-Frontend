import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bus, Clock, ExternalLink, XCircle, Box, Grid3X3 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import PublicNav from '../../components/public/PublicNav'
import { api } from '../../lib/api'
import { useLanguage } from '../../lib/i18n'
import { rememberReservationAccessToken, usePublicEvents, type PublicBus, type PublicSeat } from '../../lib/public'
import { normalizeBusLayout } from '../../lib/busLayouts'
import SpotlightCard from '../../components/reactbits/SpotlightCard'
import { Button } from '../../components/ui/button'
import { Corners, Blink } from '../../components/instruments'
import { useToast } from '../../components/ui/toast'
import { FileUploadField } from '../../components/ui/file-upload'
import { ApiError } from '../../lib/api'

const BusSeatMap3D = lazy(() => import('../../components/public/BusSeatMap3D'))
const MECT49SeatMap = lazy(() => import('../../components/public/MECT49SeatMap'))

function fmtMoney(value: number | string | null | undefined, currency = 'EGP'): string {
  const n = Number(value ?? 0)
  if (Number.isNaN(n)) return `${currency} 0.00`
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SeatMap2D({ bus, selectedSeats, onSeatClick, heldSeats, reservedSeats, className }: {
  bus: PublicBus
  selectedSeats: string[]
  onSeatClick: (seat: PublicSeat) => void
  heldSeats: Set<string>
  reservedSeats: Set<string>
  className?: string
}) {
  const reduce = useReducedMotion()
  const { lang } = useLanguage()
  const layout = normalizeBusLayout(bus.layout)
  if (layout.template === 'mect49') {
    return (
      <div className={className}>
        <MECT49SeatMap
          seats={bus.seats}
          selectedSeatIds={selectedSeats}
          onSeatClick={onSeatClick}
          language={lang}
          maxSelectable={1}
        />
      </div>
    )
  }
  const cols = layout.cols
  const aisleAfter = layout.aisleAfterCol
  const rows = layout.rows

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <div className="grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${cols + (aisleAfter > 0 && aisleAfter < cols ? 1 : 0)}, minmax(0,1fr))` }}>
          {Array.from({ length: rows }).flatMap((_, r) => {
            const row = r + 1
            const cells: React.ReactNode[] = []
            for (let c = 1; c <= cols; c++) {
              const seat = bus.seats.find(s => s.row === row && s.col === c)
              if (!seat) {
                cells.push(<div key={`${row}-${c}`} />)
              } else {
                const isSelected = selectedSeats.includes(seat.id)
                const isHeld = heldSeats.has(seat.id)
                const isReserved = reservedSeats.has(seat.id)
                const isAvailable = seat.state === 'AVAILABLE' && !isHeld && !isReserved

                let cls = 'grid h-10 w-10 place-items-center rounded-none border text-[11px] font-semibold transition-all duration-150 '
                if (isSelected) cls += 'border-signal bg-signal text-black shadow-glow'
                else if (isAvailable) cls += 'border-ok/40 bg-ok/15 text-ok hover:bg-ok/25 cursor-pointer'
                else if (isHeld) cls += 'border-amber/40 bg-amber/15 text-amber cursor-not-allowed'
                else if (isReserved) cls += 'border-danger/40 bg-danger/15 text-danger cursor-not-allowed'
                else cls += 'border-line bg-ink-3/20 text-ink-3 cursor-not-allowed'

                cells.push(
                  <motion.button
                    key={seat.id}
                    type="button"
                    disabled={!isAvailable && !isSelected}
                    onClick={() => onSeatClick(seat)}
                    className={cls}
                    title={isHeld ? `Held · ${seat.label}` : seat.label}
                    whileTap={reduce ? undefined : { scale: 0.95 }}
                  >
                    {seat.label}
                  </motion.button>
                )
              }
              if (aisleAfter === c && c < cols) cells.push(<div key={`a-${row}-${c}`} className="w-4" />)
            }
            return cells
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-signal bg-signal/15" /> Selected</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-ok/40 bg-ok/15" /> Available</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-amber/40 bg-amber/15" /> Held</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-danger/40 bg-danger/15" /> Reserved</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-line bg-ink-3/20" /> Unavailable</span>
      </div>
    </div>
  )
}

function HoldCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    const end = new Date(expiresAt).getTime()
    const tick = () => {
      const now = Date.now()
      const diff = Math.max(0, Math.ceil((end - now) / 1000))
      setRemaining(diff)
      if (diff <= 0) onExpire()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire])
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return (
    <span className="inline-flex items-center gap-1.5 text-signal font-mono text-[12px]">
      <Clock size={12} className="animate-pulse" />
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

export default function PublicBusTickets() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const isAr = lang === 'ar'
  const toast = useToast()
  const qc = useQueryClient()
  const reduce = useReducedMotion()

  const { data: events } = usePublicEvents('upcoming')
  const event = events?.find(e => e.id === eventId)
  const buses = event?.buses ?? []
  const [activeBus, setActiveBus] = useState<PublicBus | null>(buses[0] ?? null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [seatPassengers, setSeatPassengers] = useState<Record<string, { name: string; email: string; phone: string }>>({})
  const [holdToken, setHoldToken] = useState<string | null>(null)
  const activeSeatHoldRef = useRef<{ busId: string; seatIds: string[]; sessionId: string } | null>(null)
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null)
  const [holding, setHolding] = useState(false)
  const [holdError, setHoldError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [view3d, setView3d] = useState(false)

  // The event arrives asynchronously. Keep a valid active bus selected after
  // the public event query resolves and refresh the object when seat states
  // are revalidated, without resetting the current bus selection.
  useEffect(() => {
    const nextBus = buses.find((bus) => bus.id === activeBus?.id) ?? buses[0] ?? null
    if (nextBus !== activeBus) setActiveBus(nextBus)
  }, [buses, activeBus?.id])

  const heldSeatIds = new Set(activeBus?.seats.filter(s => s.state === 'HELD').map(s => s.id) ?? [])
  const reservedSeatIds = new Set(activeBus?.seats.filter(s => s.state === 'RESERVED').map(s => s.id) ?? [])

  const holdMutation = useMutation({
    mutationFn: ({ busId, seatIds }: { busId: string; seatIds: string[] }) =>
      api.post<{ data: { holdToken: string; holdExpiresAt: string; seats: PublicSeat[] } }>(`/public/events/${eventId}/buses/${busId}/hold`, { seatIds, sessionId: holdToken || crypto.randomUUID(), holdMinutes: 10 }),
    onMutate: () => { setHolding(true); setHoldError(null) },
    onSuccess: (data, variables) => {
      const sessionId = data.data.holdToken
      activeSeatHoldRef.current = {
        busId: variables.busId,
        seatIds: [...variables.seatIds],
        sessionId,
      }
      setHoldToken(sessionId)
      setHoldExpiresAt(data.data.holdExpiresAt)
      setHolding(false)
      void qc.invalidateQueries({ queryKey: ['public-events'] })
    },
    onError: (e: any) => { setHolding(false); setHoldError(e?.message ?? 'Hold failed') }
  })

  const releaseMutation = useMutation({
    mutationFn: ({ busId, seatIds }: { busId: string; seatIds: string[] }) =>
      api.post(`/public/events/${eventId}/buses/${busId}/release-hold`, { seatIds, sessionId: holdToken! }),
    onSuccess: () => {
      activeSeatHoldRef.current = null
      setHoldToken(null)
      setHoldExpiresAt(null)
      setSelectedSeats([])
      setSeatPassengers({})
      void qc.invalidateQueries({ queryKey: ['public-events'] })
    }
  })

  useEffect(() => {
    const hold = activeSeatHoldRef.current
    if (!hold) return

    const stillSelected = activeBus?.id === hold.busId
      && selectedSeats.length === hold.seatIds.length
      && hold.seatIds.every((id, index) => selectedSeats[index] === id)
    if (stillSelected) return

    activeSeatHoldRef.current = null
    setHoldToken(null)
    setHoldExpiresAt(null)
    void api.post(
      `/public/events/${eventId}/buses/${hold.busId}/release-hold`,
      { seatIds: hold.seatIds, sessionId: hold.sessionId },
    ).then(() => {
      void qc.invalidateQueries({ queryKey: ['public-events'] })
    }).catch(() => {
      // The ten-minute server expiry remains the fallback if release fails.
    })
  }, [activeBus?.id, selectedSeats, holdToken, eventId, qc])

  useEffect(() => {
    return () => {
      const hold = activeSeatHoldRef.current
      if (!hold) return
      activeSeatHoldRef.current = null
      void api.post(
        `/public/events/${eventId}/buses/${hold.busId}/release-hold`,
        { seatIds: hold.seatIds, sessionId: hold.sessionId },
      ).catch(() => {
        // The server-side expiration is the final cleanup safety net.
      })
    }
  }, [eventId])

  const ticketTypes = (event?.ticketTypes ?? []).filter(tt => !tt.soldOut)
  const [ticketTypeId, setTicketTypeId] = useState<string>('')
  const selectedTicketType = ticketTypes.find(tt => tt.id === ticketTypeId) ?? ticketTypes[0] ?? null
  useEffect(() => {
    if (!ticketTypeId && ticketTypes[0]) setTicketTypeId(ticketTypes[0].id)
  }, [ticketTypeId, ticketTypes])
  const [paymentProviderId, setPaymentProviderId] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentProofUrl, setPaymentProofUrl] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [existingReservation, setExistingReservation] = useState<{ reservationCode: string; approval?: string; qr?: string | null } | null>(null)
  const paymentProviders = event?.paymentProviders ?? []
  useEffect(() => { if (!paymentProviderId && paymentProviders[0]) setPaymentProviderId(paymentProviders[0].id) }, [paymentProviderId, paymentProviders])
  const selectedPaymentProvider = paymentProviders.find(p => p.id === paymentProviderId) ?? null
  const seatPrice = activeBus ? Number(activeBus.seatPrice ?? 0) : 0
  const ticketPrice = selectedTicketType ? Number(selectedTicketType.price ?? 0) : 0
  const seatTotal = selectedSeats.length * seatPrice
  const total = ticketPrice + seatTotal
  const isPaid = total > 0

  const reservationMutation = useMutation({
    mutationFn: (body: any) => api.post<{ data: any }>(`/public/events/${eventId}/reservations`, body),
    onSuccess: (res) => {
      // The server has converted this hold to a ticket-linked reservation.
      // Never release a successfully reserved seat during the route cleanup.
      activeSeatHoldRef.current = null
      const { reservationCode, approval, accessToken } = res.data
      rememberReservationAccessToken(reservationCode, accessToken)
      setSubmitError(null)
      setExistingReservation(null)
      setSelectedSeats([])
      setSeatPassengers({})
      setHoldToken(null)
      setHoldExpiresAt(null)
      setFormData({ name: '', email: '', phone: '' })
      setPaymentReference('')
      setPaymentProofUrl('')
      toast.success(approval === 'PENDING' ? 'Reservation submitted for review' : 'Reservation confirmed!')
      navigate(`/reservation/${reservationCode}?event=${eventId}`)
    },
    onError: (e: any) => {
      if (e instanceof ApiError && e.code === 'RESERVATION_EXISTS') {
        // The server deliberately omits the existing code and credential.
        const msg = isAr
          ? 'يوجد حجز سابق لهذا البريد. تحقق من رسالة البريد أو استخدم بريدًا آخر.'
          : 'A reservation for this email already exists. Check your email for the ticket; the code is not shown here.'
        setExistingReservation(null)
        setSubmitError(msg)
        toast.error(msg)
        return
      }
      const msg = e?.message ?? 'Reservation failed'
      setSubmitError(msg)
      toast.error(msg)
    }
  })

  const handleSeatClick = (seat: PublicSeat) => {
    if (seat.state === 'RESERVED' || seat.state === 'UNAVAILABLE') return
    if (seat.state === 'HELD' && !selectedSeats.includes(seat.id)) return

    const wasSelected = selectedSeats.includes(seat.id)
    const previousSeatId = selectedSeats[0]
    setSelectedSeats(wasSelected ? [] : [seat.id])
    setSeatPassengers((current) => {
      const next = { ...current }
      if (previousSeatId) delete next[previousSeatId]
      if (!wasSelected) {
        next[seat.id] = { name: formData.name, email: formData.email, phone: formData.phone }
      }
      return next
    })
  }

  const handleHold = () => {
    if (!activeBus || selectedSeats.length === 0) return
    holdMutation.mutate({ busId: activeBus.id, seatIds: selectedSeats })
  }

  const handleRelease = () => {
    if (!activeBus || !holdToken) return
    releaseMutation.mutate({ busId: activeBus.id, seatIds: selectedSeats })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!activeBus || selectedSeats.length !== 1) { setSubmitError(isAr ? 'اختر مقعدًا واحدًا' : 'Select exactly one seat'); return }
    if (!formData.name.trim() || !formData.email.trim()) { setSubmitError(isAr ? 'الاسم والبريد مطلوبان' : 'Name and email are required'); return }
    if (!selectedTicketType?.id) { setSubmitError(isAr ? 'اختر نوع التذكرة' : 'Select a ticket type'); return }
    if (isPaid && !paymentProviderId && !paymentReference.trim() && !paymentProofUrl) {
      setSubmitError(isAr ? 'أضف بيانات الدفع أو إثبات الدفع للمراجعة' : 'Add payment details or proof for review')
      return
    }

    const seatPassengersArray = selectedSeats.map(seatId => ({
      seatId,
      name: seatPassengers[seatId]?.name?.trim() || formData.name.trim(),
      email: seatPassengers[seatId]?.email?.trim() || formData.email.trim(),
      phone: seatPassengers[seatId]?.phone?.trim() || formData.phone.trim() || undefined,
    }))

    const body = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      ticketTypeId: selectedTicketType.id,
      busId: activeBus.id,
      seatIds: selectedSeats,
      seatPassengers: seatPassengersArray,
      holdToken: holdToken ?? undefined,
      paymentProviderId: isPaid && paymentProviderId ? paymentProviderId : undefined,
      paymentReference: isPaid && paymentReference.trim() ? paymentReference.trim() : undefined,
      paymentProofUrl: isPaid && paymentProofUrl ? paymentProofUrl : undefined,
      paymentAmount: total,
    }
    reservationMutation.mutate(body)
  }

  if (!event) return <div className="h-screen flex items-center justify-center text-ink-3">Event not found</div>

  const busOptions = buses.filter(b => (b.seats?.length ?? 0) > 0)

  return (
    <div className="relative min-h-screen bg-paper text-ink" dir={isAr ? 'rtl' : 'ltr'} data-lang={lang}>
      <PublicNav />
      <main className="relative px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <style>{`
          .bus-page-vignette{background:radial-gradient(circle at 68% 45%, rgba(11,11,12,0.08) 0%, rgba(11,11,12,0.68) 48%, rgba(11,11,12,0.92) 78%, var(--color-canvas) 100%);}
          :root[data-theme='light'] .bus-page-vignette{background:radial-gradient(circle at 68% 45%, rgba(247,244,238,0) 0%, rgba(247,244,238,0.22) 42%, rgba(247,244,238,0.56) 70%, var(--color-canvas) 100%);}
        `}</style>
        <div className="pointer-events-none absolute inset-0 z-0 bus-page-vignette" />
        <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-[1] h-px bg-gradient-to-r from-transparent via-signal/25 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <Link to={`/upcoming`} className="inline-flex items-center gap-2 text-ink-3 hover:text-signal transition-colors">
              <ArrowLeft size={16} /> Back to events
            </Link>
          </div>

          <motion.div initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="mb-4 flex items-center gap-3">
              <span className="relative grid h-9 w-9 place-items-center border border-signal/30 bg-signal/10 text-signal">
                <Bus size={20} />
                <Corners className="h-2 w-2" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-ink-0 sm:text-4xl">{event.name}</h1>
                <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">
                  <span className="flex items-center gap-1.5 text-ok"><Blink className="bg-ok" /> Bus tickets available</span>
                </p>
              </div>
            </div>
          </motion.div>

          {busOptions.length === 0 && (
            <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/40 !p-0 !shadow-none" spotlightColor="rgba(232, 208, 139, 0.1)">
              <div className="p-12 text-center">
                <Bus className="mx-auto size-12 text-ink-3" />
                <p className="mt-4 text-ink-2">No buses configured for this event</p>
              </div>
            </SpotlightCard>
          )}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="relative">
              <Corners className="opacity-40" />
              <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/40 !p-0 !shadow-none h-full" spotlightColor="rgba(232, 208, 139, 0.08)">
                <div className="p-4 border-b border-line-soft">
                  <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">Select Bus</h2>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {busOptions.map(bus => (
                    <button
                      key={bus.id}
                      onClick={() => { setActiveBus(bus); setSelectedSeats([]); setSeatPassengers({}) }}
                      className={`w-full text-left p-3 rounded-none border transition-all ${activeBus?.id === bus.id ? 'border-signal/40 bg-signal/5' : 'border-line hover:border-signal/20'}`}
                    >
                      <div className="font-medium text-ink">{bus.name}</div>
                      <div className="text-[11px] text-ink-3">
                        {bus.totalSeats} seats · {bus.availableSeats} available · {fmtMoney(bus.seatPrice ?? 0, bus.currency ?? 'EGP')}/seat
                      </div>
                    </button>
                  ))}
                </div>
              </SpotlightCard>
            </aside>

            <div className="relative">
              <Corners className="opacity-40" />
              <SpotlightCard className="!rounded-none !border !border-line-soft !bg-raised/40 !p-0 !shadow-none" spotlightColor="rgba(232, 208, 139, 0.08)">
                <div className="p-4 border-b border-line-soft">
                  <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-signal">{activeBus?.name ?? 'Seat Map'}</h2>
                </div>
                <div className="p-4">
                  {activeBus && (
                    <>
                      <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-3">Contact</div>
                        <div className="sm:col-span-2 grid gap-2 sm:grid-cols-3">
                          <input className="input !py-2 text-[12px]" placeholder="Full name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                          <input className="input !py-2 text-[12px]" placeholder="Email" type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} />
                          <input className="input !py-2 text-[12px]" placeholder="Phone" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-3">Ticket type</div>
                        <div className="sm:col-span-2">
                          {ticketTypes.length > 1 ? (
                            <select className="input" value={selectedTicketType?.id ?? ''} onChange={e => {
                              const tt = ticketTypes.find(t => t.id === e.target.value)
                              if (tt) {
                                setTicketTypeId(tt.id)
                                setSelectedSeats([])
                                setSeatPassengers({})
                              }
                            }}>
                              {ticketTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}{tt.tier ? ` · ${tt.tier}` : ''} — {fmtMoney(tt.price ?? 0, tt.currency ?? 'EGP')}</option>)}
                            </select>
                          ) : (
                            <div className="input bg-elevated/50">{selectedTicketType?.name ?? '—'} · {fmtMoney(ticketPrice, selectedTicketType?.currency ?? 'EGP')}</div>
                          )}
                        </div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-3">Seat price</div>
                        <div className="sm:col-span-2 font-mono text-signal">{fmtMoney(seatPrice, activeBus.currency ?? 'EGP')}/seat</div>
                      </div>

                      <div className="mb-3 flex items-center justify-end gap-2">
                        <Button size="sm" variant={!view3d ? 'default' : 'ghost'} onClick={() => setView3d(false)}><Grid3X3 size={14} /> 2D</Button>
                        <Button size="sm" variant={view3d ? 'default' : 'ghost'} onClick={() => setView3d(true)}><Box size={14} /> 3D</Button>
                      </div>
                      {view3d ? (
                        <Suspense fallback={<div className="grid h-[420px] place-items-center border border-line-soft bg-[#111214] text-[12px] text-ink-3">Loading 3D map…</div>}>
                          <BusSeatMap3D
                            bus={activeBus}
                            selectedSeats={selectedSeats}
                            onSeatClick={handleSeatClick}
                          />
                        </Suspense>
                      ) : (
                        <SeatMap2D
                          bus={activeBus}
                          selectedSeats={selectedSeats}
                          onSeatClick={handleSeatClick}
                          heldSeats={heldSeatIds}
                          reservedSeats={reservedSeatIds}
                        />
                      )}

                      {selectedSeats.length > 0 && (
                        <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3 border border-line-soft bg-elevated/30 p-3">
                            <div className="flex items-center gap-3 text-[11px] text-ink-2">
                              <span>{t('selectedSeats') ?? 'Selected'}: {selectedSeats.map(id => activeBus.seats.find(s => s.id === id)?.label).join(', ')}</span>
                              {holdToken && holdExpiresAt && <HoldCountdown expiresAt={holdExpiresAt} onExpire={() => { setHoldToken(null); setHoldExpiresAt(null); setSelectedSeats([]); setSeatPassengers({}); void qc.invalidateQueries({ queryKey: ['public-events'] }); toast.error(isAr ? 'انتهى وقت حجز المقاعد' : 'Seat hold expired') }} />}
                              {holdError && <span className="text-danger">{holdError}</span>}
                            </div>
                            <div className="flex gap-2">
                              {!holdToken ? (
                                <Button size="sm" onClick={handleHold} disabled={holding} loading={holding}>
                                  <Clock size={14} /> Hold seats (10 min)
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" onClick={handleRelease} disabled={holding} loading={holding}>
                                  <XCircle size={14} /> Release hold
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {selectedSeats.map(seatId => {
                              const seat = activeBus.seats.find(s => s.id === seatId)
                              const p = seatPassengers[seatId] ?? { name: '', email: '', phone: '' }
                              return (
                                <div key={seatId} className="grid gap-2 rounded-none border border-line-soft bg-panel/40 p-3 sm:grid-cols-3">
                                  <div className="text-[11px] font-semibold text-signal sm:col-span-3">Seat {seat?.label} — Passenger</div>
                                  <input className="input !py-1.5 text-[12px]" placeholder="Full name" value={p.name} onChange={e => setSeatPassengers(prev => ({ ...prev, [seatId]: { ...prev[seatId], name: e.target.value } }))} />
                                  <input className="input !py-1.5 text-[12px]" placeholder="Email" type="email" value={p.email} onChange={e => setSeatPassengers(prev => ({ ...prev, [seatId]: { ...prev[seatId], email: e.target.value } }))} />
                                  <input className="input !py-1.5 text-[12px]" placeholder="Phone" value={p.phone} onChange={e => setSeatPassengers(prev => ({ ...prev, [seatId]: { ...prev[seatId], phone: e.target.value } }))} />
                                </div>
                              )
                            })}
                          </div>

                          {isPaid && (
                            <div className="space-y-3 border border-line-soft bg-elevated/20 p-4">
                              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-signal">{isAr ? 'تفاصيل الدفع' : 'Payment details'}</p>
                              {paymentProviders.length > 0 ? (
                                <select className="input" value={paymentProviderId} onChange={e => setPaymentProviderId(e.target.value)}>
                                  <option value="">{isAr ? 'اختر طريقة الدفع' : 'Select payment method'}</option>
                                  {paymentProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              ) : (
                                <p className="text-[12px] text-ink-3">{isAr ? 'لا توجد طرق دفع مفعلة. يمكنك إرسال مرجع/إثبات للمراجعة.' : 'No payment methods configured. You can still submit reference/proof for review.'}</p>
                              )}
                              {selectedPaymentProvider && (
                                <div className="space-y-1 border border-line-soft bg-panel/40 p-3 text-[12px] text-ink-2">
                                  {selectedPaymentProvider.accountName && <div><span className="text-ink-3">Account:</span> {selectedPaymentProvider.accountName}</div>}
                                  {selectedPaymentProvider.accountNumber && <div><span className="text-ink-3">Number:</span> {selectedPaymentProvider.accountNumber}</div>}
                                  {selectedPaymentProvider.paymentPhone && <div><span className="text-ink-3">Phone:</span> {selectedPaymentProvider.paymentPhone}</div>}
                                  {selectedPaymentProvider.instructions && <p className="whitespace-pre-line text-ink-2">{selectedPaymentProvider.instructions}</p>}
                                  {selectedPaymentProvider.paymentLink && <a href={selectedPaymentProvider.paymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-signal hover:underline"><ExternalLink size={12} /> {isAr ? 'فتح رابط الدفع' : 'Open payment link'}</a>}
                                  {selectedPaymentProvider.imageUrl && <img src={selectedPaymentProvider.imageUrl} alt={selectedPaymentProvider.name} className="mt-2 max-h-36 border border-line-soft object-contain" />}
                                </div>
                              )}
                              <input className="input" placeholder={isAr ? 'مرجع الدفع / رقم العملية' : 'Payment reference / transaction ID'} value={paymentReference} onChange={e => setPaymentReference(e.target.value)} />
                              <FileUploadField uploadEndpoint="/uploads/proof" label={isAr ? 'إثبات الدفع' : 'Payment proof'} value={paymentProofUrl} onChange={setPaymentProofUrl} accept="image/*,application/pdf" hint={isAr ? 'اختياري' : 'Optional'} />
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-line-soft pt-3">
                            <div className="font-mono text-[11px] text-ink-3">
                              <div>Ticket: {fmtMoney(ticketPrice, selectedTicketType?.currency ?? 'EGP')}</div>
                              <div>Seats ({selectedSeats.length} × {fmtMoney(seatPrice, activeBus.currency ?? 'EGP')}): {fmtMoney(seatTotal, activeBus.currency ?? 'EGP')}</div>
                            </div>
                            <div className="font-display text-xl font-bold text-signal">{fmtMoney(total, activeBus.currency ?? 'EGP')}</div>
                          </div>

                          {(submitError || existingReservation) && (
                            <div className="border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                              {submitError}
                              {existingReservation && (
                                <button type="button" className="ml-2 text-signal underline" onClick={() => navigate(`/reservation/${existingReservation.reservationCode}?event=${eventId}`)}>
                                  {isAr ? 'عرض الحجز' : 'View reservation'}
                                </button>
                              )}
                            </div>
                          )}
                          <Button className="w-full !py-3.5" onClick={handleSubmit} disabled={reservationMutation.isPending || !selectedTicketType || !formData.name.trim() || !formData.email.trim() || selectedSeats.length === 0} loading={reservationMutation.isPending}>
                            {reservationMutation.isPending ? (
                              isPaid ? (isAr ? 'جارٍ إرسال الحجز...' : 'Submitting reservation…') : (isAr ? 'جارٍ تأكيد الحجز...' : 'Confirming reservation…')
                            ) : (
                              isPaid ? (isAr ? 'إرسال الحجز للمراجعة' : 'Submit reservation for review') : (isAr ? 'تأكيد الحجز' : 'Confirm reservation')
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              </SpotlightCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}