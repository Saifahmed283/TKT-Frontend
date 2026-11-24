import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { ArrowLeft, ArrowRight, Bus, CheckCircle2, ClipboardList, Clock3, Copy, CreditCard, Lock, QrCode, ShieldCheck, Ticket, UserRound } from 'lucide-react'
import { Modal, ErrorBanner } from '../ui'
import { api, ApiError } from '../../lib/api'
import { useLanguage } from '../../lib/i18n'
import { useReservationStatus, type PublicEvent, type ReservationResult } from '../../lib/public'
import { FileUploadField } from '../ui/file-upload'
import { ExternalLink } from 'lucide-react'

function money(price: string, lang: string, currency = 'EGP') {
  const n = Number(price)
  if (!Number.isFinite(n)) return price
  if (n === 0) return lang === 'ar' ? 'مجاني' : 'Free'
  return `${currency} ${n.toLocaleString()}`
}

function useQrDataUrl(code: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!code) { setUrl(null); return }
    let alive = true
    QRCode.toDataURL(code, { errorCorrectionLevel: 'M', margin: 1, width: 320, color: { dark: '#0B0B0C', light: '#FFFFFF' } })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null))
    return () => { alive = false }
  }, [code])
  return url
}

function QrDataImg({ code }: { code: string }) {
  const url = useQrDataUrl(code)
  if (!url) return null
  return <img src={url} alt="Ticket QR" className="h-32 w-32 border border-line-soft bg-white p-2" />
}

export default function ReservationModal({ event, onClose }: { event: PublicEvent; onClose: () => void }) {
  const qc = useQueryClient()
  const { t, lang } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const availableTypes = event.ticketTypes.filter((x) => x.isPublic !== false)
  const [ticketTypeId, setTicketTypeId] = useState(availableTypes.find((x) => !x.soldOut)?.id ?? availableTypes[0]?.id ?? '')
  const [paymentProviderId, setPaymentProviderId] = useState(event.paymentProviders?.[0]?.id ?? '')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const [done, setDone] = useState<ReservationResult | null>(null)
  const [checkingCode, setCheckingCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [existingReservation, setExistingReservation] = useState<{ reservationCode: string; approval?: string; qr?: string | null } | null>(null)
  const buses = (event.buses ?? []).filter(b => (b.seats?.length ?? 0) > 0)
  const [busId, setBusId] = useState(buses[0]?.id ?? '')
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [holdToken] = useState(() => `hold_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`)
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null)
  const [holdError, setHoldError] = useState<string | null>(null)
  const [holding, setHolding] = useState(false)
  const [seatPassengers, setSeatPassengers] = useState<Record<string, { name: string; email: string; phone: string }>>({})
  const [stepIndex, setStepIndex] = useState(0)

  const selected = availableTypes.find((x) => x.id === ticketTypeId)
  const selectedBus = buses.find(b => b.id === busId) ?? buses[0]
  const seatUnitPrice = Number(selectedBus?.seatPrice ?? 0)
  const seatTotal = selected?.transportIncluded ? selectedSeatIds.length * (Number.isFinite(seatUnitPrice) ? seatUnitPrice : 0) : 0
  const ticketPrice = Number(selected?.price ?? 0)
  const totalPrice = (Number.isFinite(ticketPrice) ? ticketPrice : 0) + seatTotal
  const isPaid = totalPrice > 0
  const steps = [
    { id: 'ticket', label: t('stepTicket'), icon: Ticket },
    { id: 'details', label: t('stepDetails'), icon: UserRound },
    ...(selected?.transportIncluded ? [{ id: 'seats', label: t('stepSeats'), icon: Bus }] : []),
    ...(isPaid ? [{ id: 'payment', label: t('stepPayment'), icon: CreditCard }] : []),
    { id: 'review', label: t('stepReview'), icon: ClipboardList },
  ]
  const activeStep = Math.min(stepIndex, steps.length - 1)
  const stepId = steps[activeStep]?.id
  const canGoBack = activeStep > 0
  const phoneValid = phone.trim().length >= 6
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canContinue = (() => {
    if (stepId === 'ticket') return !!ticketTypeId && !selected?.soldOut
    if (stepId === 'details') return name.trim().length >= 2 && emailValid && phoneValid
    if (stepId === 'seats') return selectedSeatIds.length === 1 && !holding && !!holdExpiresAt && !holdError
    if (stepId === 'payment') return !!(paymentProviderId || paymentReference.trim() || paymentProofUrl)
    return true
  })()
  const qrUrl = useQrDataUrl(done?.approval === 'APPROVED' && done.qr ? done.qr : null)
  const pending = done?.approval === 'PENDING'
  const status = useReservationStatus(event.id, pending && checkingCode ? checkingCode : null)

  useEffect(() => {
    if (!done || done.approval === 'APPROVED') return
    if (status.data?.approval === 'APPROVED' && status.data.qr) {
      setDone((prev) =>
        prev
          ? {
              ...prev,
              approval: 'APPROVED',
              qr: status.data?.qr ?? prev.qr,
              paymentStatus: status.data?.paymentStatus ?? prev.paymentStatus,
            }
          : prev,
      )
    }
  }, [done, status.data])

  useEffect(() => {
    if (!selected?.transportIncluded) {
      setSelectedSeatIds([])
      setHoldExpiresAt(null)
      setHoldError(null)
    }
  }, [selected?.transportIncluded])

  useEffect(() => {
    if (!selected?.transportIncluded || !busId || selectedSeatIds.length !== 1) { setHoldExpiresAt(null); setHoldError(null); return }
    let alive = true
    setHolding(true)
    setHoldError(null)
    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ holdToken: string; holdExpiresAt: string }>(`/public/events/${event.id}/buses/${busId}/hold`, { seatIds: selectedSeatIds, sessionId: holdToken, holdMinutes: 10 })
        if (alive) setHoldExpiresAt(res.holdExpiresAt)
      } catch (e: any) {
        if (alive) { setHoldError(e?.message ?? 'Could not hold selected seats. Please reselect.'); setHoldExpiresAt(null) }
      } finally {
        if (alive) setHolding(false)
      }
    }, 350)
    return () => { alive = false; clearTimeout(timer) }
  }, [selected?.transportIncluded, busId, selectedSeatIds, holdToken, event.id])

  const reserve = useMutation({
    mutationFn: () =>
      api.post<ReservationResult>(`/public/events/${event.id}/reservations`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        ticketTypeId,
        paymentProviderId: isPaid && paymentProviderId ? paymentProviderId : undefined,
        paymentReference: isPaid && paymentReference.trim() ? paymentReference.trim() : undefined,
        paymentProofUrl: isPaid && paymentProofUrl ? paymentProofUrl : undefined,
        paymentAmount: isPaid ? totalPrice : undefined,
        busId: selected?.transportIncluded ? busId || undefined : undefined,
        seatIds: selected?.transportIncluded ? selectedSeatIds : undefined,
        holdToken: selected?.transportIncluded ? holdToken : undefined,
        seatPassengers: selected?.transportIncluded ? selectedSeatIds.map(id => ({ seatId: id, name: seatPassengers[id]?.name?.trim() || name.trim(), email: seatPassengers[id]?.email?.trim() || email.trim(), phone: seatPassengers[id]?.phone?.trim() || phone.trim() })) : undefined,
      }),
    onSuccess: (data) => {
      setDone(data)
      setExistingReservation(null)
      void qc.invalidateQueries({ queryKey: ['public-events'] })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'RESERVATION_EXISTS') {
        const d = (error.data ?? {}) as { reservationCode?: string; approval?: string; qr?: string | null }
        if (d.reservationCode) {
          setExistingReservation({
            reservationCode: d.reservationCode,
            approval: d.approval,
            qr: d.qr ?? null,
          })
          setCheckingCode(d.reservationCode)
        }
      }
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (stepId !== 'review' || !canContinue) return
    reserve.mutate()
  }

  const goNext = () => {
    if (!canContinue) return
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return (
    <Modal open onClose={onClose} title={done ? (done.approval === 'APPROVED' ? t('reservationConfirmed') : t('reservationPending')) : `${t('reserveFor')} ${event.name}`} wide={!!done || stepId === 'seats' || stepId === 'review'}>
      {done ? (
        <div className="space-y-5">
          <div className={`flex items-start gap-3 rounded-none border px-4 py-4 ${done.approval === 'APPROVED' ? 'border-ok/25 bg-ok/8' : 'border-signal/25 bg-signal/8'}`}>
            <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${done.approval === 'APPROVED' ? 'text-ok' : 'text-signal'}`} />
            <div>
              <p className="font-display text-xl font-semibold tracking-tight text-ink-0">
                {done.approval === 'APPROVED' ? t('ticketReady') : t('reservationPending')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                {done.approval === 'APPROVED' ? t('ticketReadyBody') : t('pendingBody')}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center border border-line-soft bg-elevated/40 p-4">
              {done.approval === 'APPROVED' ? (
                qrUrl ? <img src={qrUrl} alt="Ticket QR" className="h-44 w-44 border border-line-soft bg-white p-2" /> : <div className="grid h-44 w-44 place-items-center border border-line-soft"><QrCode className="size-8 text-ink-3" /></div>
              ) : (
                <div className="grid h-44 w-44 place-items-center border border-dashed border-signal/30 bg-signal/5 text-center">
                  <div>
                    <Lock className="mx-auto size-7 text-signal" />
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('pending')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="border border-line-soft bg-elevated/30 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">{t('reservationCode')}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-lg font-bold tracking-[0.18em] text-signal sm:text-xl">{done.reservationCode}</p>
                  <button type="button" onClick={() => copyCode(done.reservationCode)} className="btn-ghost !px-3 !py-1.5 text-[11px]">
                    <Copy size={13} /> {copied ? t('copied') : t('copyCode')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-line-soft bg-elevated/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('ticketType')}</p>
                  <p className="mt-1 text-sm text-ink-0">{selected?.name ?? t('ticket')}</p>
                </div>
                <div className="border border-line-soft bg-elevated/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('price')}</p>
                  <p className="mt-1 text-sm text-ink-0">{money(done.price, lang)}</p>
                </div>
              </div>
              {done.seats && done.seats.length > 0 && (
                <div className="border border-line-soft bg-elevated/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{t('seats')}</p>
                  <p className="mt-1 text-sm text-ink-0">{done.seats.map(s => s.label).join(', ')}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">
                <ShieldCheck size={13} className="text-signal" /> {t('secureBooking')}
              </div>
            </div>
          </div>

          {pending && (
            <div className="border border-line-soft bg-elevated/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-2"><span className="text-ink-3">{t('status')}:</span> {status.data?.approval ? t(status.data.approval.toLowerCase()) : t('pending')}</p>
                <button type="button" onClick={() => setCheckingCode(done.reservationCode)} className="btn-ghost !px-3 !py-2 text-[11px]" disabled={status.isFetching}>
                  {status.isFetching ? t('checkingStatus') : t('checkStatus')}
                </button>
              </div>
              {status.data?.approval === 'APPROVED' && status.data.qr && (
                <div className="mt-4 flex items-center gap-4">
                  <QrDataImg code={status.data.qr} />
                  <div>
                    <p className="text-sm text-ok">{t('ticketReady')}</p>
                    <p className="text-[11px] text-ink-3">{status.data.deliveryStatus ? `${t('status')}: ${status.data.deliveryStatus}` : ''}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="btn-primary !px-5">{t('done')}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-line-soft pb-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={i > activeStep}
                  onClick={() => setStepIndex(i)}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${i === activeStep ? 'border-signal/40 bg-signal/10 text-signal' : i < activeStep ? 'border-ok/30 text-ok' : 'border-line-soft text-ink-3'}`}
                >
                  <Icon size={12} /> {i + 1}. {s.label}
                </button>
              )
            })}
          </div>

          {reserve.error && <ErrorBanner error={reserve.error} />}
          {existingReservation && (
            <div className="rounded-none border border-signal/25 bg-signal/8 px-4 py-3 text-sm text-ink-1">
              <p className="font-medium text-ink-0">{t('reservationExists')}</p>
              <p className="mt-1 font-mono text-[12px] text-signal">{existingReservation.reservationCode}</p>
              <button
                type="button"
                className="btn-ghost mt-3 !px-3 !py-1.5 text-[11px]"
                onClick={() => {
                  setDone({
                    attendeeId: '',
                    ticketId: '',
                    reservationCode: existingReservation.reservationCode,
                    price: `${totalPrice}`,
                    approval: (existingReservation.approval as ReservationResult['approval']) ?? 'PENDING',
                    qr: existingReservation.qr ?? null,
                  })
                }}
              >
                {t('viewReservation')}
              </button>
            </div>
          )}

          {stepId === 'ticket' && (
            <div data-testid="wizard-step-ticket" className="space-y-3">
              <p className="label">{t('ticketType')}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableTypes.map((tt) => {
                  const now = Date.now()
                  const notStarted = tt.salesStartAt ? now < new Date(tt.salesStartAt).getTime() : false
                  const ended = tt.salesEndAt ? now > new Date(tt.salesEndAt).getTime() : false
                  const disabled = tt.soldOut || notStarted || ended
                  const active = tt.id === ticketTypeId
                  const suffix = tt.soldOut ? ` (${t('soldOut')})` : notStarted ? ` (${t('openingSoon')})` : ended ? ` (${t('reservationsClosed')})` : tt.remaining != null ? ` (${tt.remaining} ${t('left')})` : ''
                  return (
                    <button
                      key={tt.id}
                      type="button"
                      data-testid="ticket-option"
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => { setTicketTypeId(tt.id); setSelectedSeatIds([]); setHoldExpiresAt(null) }}
                      className={`border p-3 text-start transition-colors ${active ? 'border-signal/50 bg-signal/10' : 'border-line-soft bg-elevated/20 hover:border-signal/30'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-0">
                        <span className="truncate">{tt.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-signal">{money(tt.price, lang, tt.currency ?? 'EGP')}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-ink-3">
                        {tt.category ? <span>{tt.category}</span> : null}
                        {tt.transportIncluded ? <span className="text-signal">{t('transportIncluded')}</span> : null}
                        {suffix ? <span>{suffix}</span> : null}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selected?.transportIncluded && <p className="border border-signal/20 bg-signal/5 px-3 py-2 text-[12px] text-signal">{t('transportTicketHint')}</p>}
            </div>
          )}

          {stepId === 'details' && (
            <div data-testid="wizard-step-details" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label mb-1.5 block" htmlFor="res-name">{t('fullName')}</label>
                  <input id="res-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
                <div>
                  <label className="label mb-1.5 block" htmlFor="res-email">{t('email')}</label>
                  <input id="res-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div>
                  <label className="label mb-1.5 block" htmlFor="res-phone">{t('phone')}</label>
                  <input id="res-phone" data-testid="reservation-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
                  {phone && !phoneValid && <p className="mt-1 text-[11px] text-danger">{t('phoneRequired')}</p>}
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block" htmlFor="res-notes">{t('customization')}</label>
                <textarea id="res-notes" data-testid="reservation-notes" className="input min-h-20" maxLength={1000} placeholder={t('customizationPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {stepId === 'seats' && (
            <div data-testid="wizard-step-seats" className="space-y-3 border border-line-soft bg-elevated/20 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-signal">{t('chooseOneSeat')}</p>
              {buses.length === 0 ? (
                <p className="border border-danger/30 bg-danger/5 px-3 py-3 text-sm text-danger">{t('noBusAvailable')}</p>
              ) : (
                <>
                  {buses.length > 1 && (
                    <select className="input" value={busId} onChange={(e) => { setBusId(e.target.value); setSelectedSeatIds([]); setSeatPassengers({}) }}>
                      {buses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.availableSeats} {t('left')})</option>)}
                    </select>
                  )}
                  {(() => {
                    const bus = buses.find(b => b.id === busId) ?? buses[0]
                    if (!bus) return null
                    const layout = bus.layout ?? { rows: 0, cols: 0, aisleAfterCol: 0 }
                    const cols = layout.cols
                    const aisleAfter = layout.aisleAfterCol ?? 0
                    return (
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-ink-3"><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-ok/40" />{t('available')}</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-amber/40" />{t('held')}</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-danger/40" />{t('reservedSeat')}</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-ink-3/40" />{t('unavailable')}</span></div>
                        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{layout.template === 'mect49' ? 'MECT 49-seat coach' : layout.template === 'coaster21' ? 'Coaster 21-seat' : t('customBusLayout')}</div>
                        <div className="overflow-x-auto"><div className="grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${cols + (aisleAfter > 0 && aisleAfter < cols ? 1 : 0)}, minmax(0,1fr))` }}>
                          {Array.from({ length: layout.rows }).flatMap((_, r) => {
                            const row = r + 1
                            const cells: any[] = []
                            for (let c = 1; c <= cols; c++) {
                              const seat = bus.seats.find(s => s.row === row && s.col === c)
                              if (!seat) { cells.push(<div key={`${row}-${c}`} />) }
                              else {
                                const selectedSeat = selectedSeatIds.includes(seat.id)
                                const cls = selectedSeat ? 'border-signal bg-signal text-black' : seat.state === 'AVAILABLE' ? 'border-ok/40 bg-ok/15 text-ok hover:bg-ok/25' : seat.state === 'HELD' ? 'border-amber/40 bg-amber/15 text-amber cursor-not-allowed' : seat.state === 'RESERVED' ? 'border-danger/40 bg-danger/15 text-danger cursor-not-allowed' : 'border-line bg-ink-3/20 text-ink-3 cursor-not-allowed'
                                cells.push(<button key={seat.id} type="button" data-testid="seat-option" aria-pressed={selectedSeat} disabled={!(seat.state === 'AVAILABLE' || selectedSeat)} onClick={() => setSelectedSeatIds(selectedSeat ? [] : [seat.id])} className={`grid h-8 w-8 place-items-center rounded-none border text-[10px] font-semibold transition-colors ${cls}`} title={seat.holderName ? `${seat.label} · ${seat.holderName}` : seat.label}>{seat.label}</button>)
                              }
                              if (aisleAfter === c && c < cols) cells.push(<div key={`a-${row}-${c}`} className="w-3" />)
                            }
                            return cells
                          })}
                        </div></div>
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-2">
                            <span>{t('selectedSeats')}: {bus.seats.filter(s => selectedSeatIds.includes(s.id)).map(s => s.label).join(', ') || '—'}</span>
                            {holding && <span className="inline-flex items-center gap-1 text-signal"><Clock3 size={12} /> {t('holding')}</span>}
                            {holdExpiresAt && !holding && <span className="inline-flex items-center gap-1 text-ok"><Clock3 size={12} /> {t('heldUntil')} {new Date(holdExpiresAt).toLocaleTimeString()}</span>}
                            {holdError && <span className="text-danger">{holdError}</span>}
                            {selectedSeatIds.length !== 1 && <span className="text-danger">{t('seatRequired')}</span>}
                          </div>
                          {bus.seats.filter(s => selectedSeatIds.includes(s.id)).map(s => (
                            <div key={s.id} className="grid gap-2 rounded-none border border-line-soft bg-panel/40 p-2 sm:grid-cols-3">
                              <div className="text-[11px] font-semibold text-signal sm:col-span-3">{t('seatPassenger')} {s.label}</div>
                              <input className="input !py-1.5 text-[12px]" placeholder={t('fullName')} value={seatPassengers[s.id]?.name ?? name} onChange={e => setSeatPassengers(prev => ({ ...prev, [s.id]: { name: e.target.value, email: prev[s.id]?.email ?? email, phone: prev[s.id]?.phone ?? phone } }))} />
                              <input className="input !py-1.5 text-[12px]" placeholder={t('email')} value={seatPassengers[s.id]?.email ?? email} onChange={e => setSeatPassengers(prev => ({ ...prev, [s.id]: { name: prev[s.id]?.name ?? name, email: e.target.value, phone: prev[s.id]?.phone ?? phone } }))} />
                              <input className="input !py-1.5 text-[12px]" placeholder={t('phone')} value={seatPassengers[s.id]?.phone ?? phone} onChange={e => setSeatPassengers(prev => ({ ...prev, [s.id]: { name: prev[s.id]?.name ?? name, email: prev[s.id]?.email ?? email, phone: e.target.value } }))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}

          {stepId === 'payment' && (
            <div data-testid="wizard-step-payment" className="space-y-3 border border-line-soft bg-elevated/20 p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-signal">{t('paymentDetails')}</p>
              {(event.paymentProviders?.length ?? 0) > 0 ? (
                <select className="input" value={paymentProviderId} onChange={(e) => setPaymentProviderId(e.target.value)}>
                  <option value="">{t('selectPaymentMethod')}</option>
                  {event.paymentProviders!.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              ) : (
                <p className="text-[12px] text-ink-3">{t('noPaymentMethods')}</p>
              )}
              {(() => { const p = event.paymentProviders?.find((x) => x.id === paymentProviderId); return p ? (
                <div className="space-y-1 border border-line-soft bg-panel/40 p-3 text-[12px] text-ink-2">
                  {p.accountName && <div><span className="text-ink-3">{t('account')}:</span> {p.accountName}</div>}
                  {p.accountNumber && <div><span className="text-ink-3">{t('number')}:</span> {p.accountNumber}</div>}
                  {p.paymentPhone && <div><span className="text-ink-3">{t('phone')}:</span> {p.paymentPhone}</div>}
                  {p.instructions && <p className="whitespace-pre-line">{p.instructions}</p>}
                  {p.paymentLink && <a href={p.paymentLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-signal hover:underline"><ExternalLink size={12} /> {t('openPaymentLink')}</a>}
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="mt-2 max-h-36 border border-line-soft object-contain" />}
                </div>
              ) : null })()}
              <input data-testid="payment-reference" className="input" placeholder={t('paymentReference')} value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
              <FileUploadField label={t('paymentProof')} value={paymentProofUrl ?? ''} onChange={(v) => setPaymentProofUrl(v || null)} accept="image/*,application/pdf" hint={t('optional')} />
              {!canContinue && <p className="text-[11px] text-danger">{t('paymentDetailsRequired')}</p>}
            </div>
          )}

          {stepId === 'review' && (
            <div data-testid="wizard-review" className="space-y-3 border border-line-soft bg-elevated/20 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('fullName')}</span><span className="text-ink-0">{name.trim()}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('email')}</span><span className="text-ink-0" dir="ltr">{email.trim()}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('phone')}</span><span className="text-ink-0" dir="ltr">{phone.trim()}</span></div>
              {notes.trim() && <div className="flex items-start justify-between gap-3"><span className="shrink-0 text-ink-3">{t('customization')}</span><span className="text-end text-ink-0">{notes.trim()}</span></div>}
              <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3"><span className="flex items-center gap-2 text-ink-3"><Ticket size={14} className="text-signal" /> {t('ticketType')}</span><span className="text-ink-0">{selected?.name ?? '—'}</span></div>
              {selected?.transportIncluded && <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('seats')}</span><span className="text-ink-0">{selectedBus?.seats.find(s => selectedSeatIds.includes(s.id))?.label ?? '—'}</span></div>}
              {isPaid && <div className="flex items-center justify-between gap-3"><span className="text-ink-3">{t('paymentDetails')}</span><span className="text-ink-0">{event.paymentProviders?.find(p => p.id === paymentProviderId)?.name ?? paymentReference.trim() ?? t('paymentProof')}</span></div>}
              <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3 font-medium text-ink-0"><span>{t('total')}</span><span className="font-mono text-signal">{selectedBus?.currency ?? selected?.currency ?? 'EGP'} {totalPrice.toLocaleString()}</span></div>
              <p className="text-[11px] text-ink-3">{t('reviewBody')}</p>
            </div>
          )}

          {stepId !== 'review' ? (
            <div className="flex items-center justify-between gap-3">
              <button type="button" data-testid="wizard-back" onClick={goBack} disabled={!canGoBack} className="btn-ghost !px-4 disabled:opacity-40">
                <ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('back')}
              </button>
              <button type="button" data-testid="wizard-next" onClick={goNext} disabled={!canContinue} className="btn-primary !px-5">
                {t('next')} <ArrowRight size={14} className="rtl:-scale-x-100" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button type="button" data-testid="wizard-back" onClick={goBack} className="btn-ghost !px-4">
                <ArrowLeft size={14} className="rtl:-scale-x-100" /> {t('back')}
              </button>
              <button type="submit" data-testid="wizard-submit" disabled={reserve.isPending || !canContinue} className="btn-primary !px-5 !py-3">
                {reserve.isPending ? t('submitting') : t('confirmReservation')}
              </button>
            </div>
          )}
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">{t('secureBookingBody')}</p>
        </form>
      )}
    </Modal>
  )
}
