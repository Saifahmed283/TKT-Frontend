import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bus, ClipboardList, CreditCard, Ticket, UserRound } from 'lucide-react'
import { api, ApiError } from '../../../lib/api'
import { useLanguage } from '../../../lib/i18n'
import { DEFAULT_TICKET_DESIGN, fetchReservationStatus, normalizeTicketDesign, rememberReservationAccessToken, resendReservationTicket, useReservationStatus, type PublicEvent, type ReservationResult, type TicketDesignSelection } from '../../../lib/public'
import { useQrDataUrl } from './shared'

/**
 * All reservation-wizard state and side effects live here so each step file
 * only renders. Kept as one hook to preserve the original effect ordering.
 */
export function useReservationWizard(event: PublicEvent, onClose: () => void) {
  const qc = useQueryClient()
  const { t, lang } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const availableTypes = event.ticketTypes.filter((x) => x.isPublic !== false)
  const [ticketTypeId, setTicketTypeId] = useState(availableTypes.find((x) => !x.soldOut)?.id ?? availableTypes[0]?.id ?? '')
  const [ticketDesign, setTicketDesign] = useState<TicketDesignSelection>(DEFAULT_TICKET_DESIGN)
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
  const [holdToken] = useState(() => {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    return `hold_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  })
  const activeSeatHoldRef = useRef<{ busId: string; seatIds: string[]; sessionId: string } | null>(null)
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null)
  const [holdError, setHoldError] = useState<string | null>(null)
  const [holding, setHolding] = useState(false)
  const [seatPassengers, setSeatPassengers] = useState<Record<string, { name: string; email: string; phone: string }>>({})
  const [seatView3d, setSeatView3d] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [holdAttempt, setHoldAttempt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [pollUntil] = useState(() => Date.now() + 10 * 60_000)
  const [pollActive, setPollActive] = useState(true)
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const seatScrollRef = useRef<HTMLDivElement>(null)
  const [seatScroll, setSeatScroll] = useState({ overflow: false, atEnd: false })

  const selected = availableTypes.find((x) => x.id === ticketTypeId)
  const selectedProvider = event.paymentProviders?.find((p) => p.id === paymentProviderId) ?? null
  const selectedBus = buses.find(b => b.id === busId) ?? buses[0]
  const seatUnitPrice = Number(selectedBus?.seatPrice ?? 0)
  // The bus seat is included in transport-inclusive ticket types, not an extra line item.
  const seatTotal = 0
  const ticketPrice = Number(selected?.price ?? 0)
  const totalPrice = (Number.isFinite(ticketPrice) ? ticketPrice : 0) + seatTotal
  const isPaid = totalPrice > 0
  const steps = [
    { id: 'ticket', label: t('stepTicket'), icon: Ticket },
    ...(selected?.transportIncluded ? [{ id: 'seats', label: t('stepSeats'), icon: Bus }] : []),
    { id: 'details', label: t('stepDetails'), icon: UserRound },
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
  // Free tickets are approved immediately, but the QR is minted after the
  // response. Keep polling until the credential is actually available.
  const awaitingQr = done?.approval === 'APPROVED' && !done.qr
  const needsPolling = pending || awaitingQr
  const status = useReservationStatus(event.id, needsPolling && checkingCode ? checkingCode : null, {
    enabled: needsPolling && pollActive,
    pollMs: 5_000,
    until: pollUntil,
    email: email.trim(),
  })
  const secondsLeft = holdExpiresAt ? Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - now) / 1000)) : null
  const holdExpiring = secondsLeft != null && secondsLeft < 120
  const holdCountdown = secondsLeft == null ? '' : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!pollActive) return
    const timer = window.setTimeout(() => setPollActive(false), Math.max(0, pollUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [pollActive, pollUntil])

  useEffect(() => {
    if (!done || (done.approval === 'APPROVED' && done.qr)) return
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
    if (!holdExpiresAt) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [holdExpiresAt])

  useEffect(() => {
    if (holdExpiresAt && secondsLeft === 0) {
      setHoldExpiresAt(null)
      setHoldError(t('holdExpired'))
    }
  }, [holdExpiresAt, secondsLeft, t])

  useEffect(() => {
    if (stepId !== 'seats' || !seatScrollRef.current) {
      setSeatScroll({ overflow: false, atEnd: false })
      return
    }
    const el = seatScrollRef.current
    const measure = () => setSeatScroll({
      overflow: el.scrollWidth > el.clientWidth + 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    })
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    return () => el.removeEventListener('scroll', measure)
  }, [stepId, busId, selected?.transportIncluded])

  useEffect(() => {
    const providers = event.paymentProviders ?? []
    if (!providers.length) return
    if (!providers.some((p) => p.id === paymentProviderId)) setPaymentProviderId(providers[0].id)
  }, [event.paymentProviders, paymentProviderId])

  useEffect(() => {
    if (!selected?.transportIncluded) {
      setSelectedSeatIds([])
      setHoldExpiresAt(null)
      setHoldError(null)
    }
  }, [selected?.transportIncluded])

  useEffect(() => {
    if (!selected?.transportIncluded || !busId || selectedSeatIds.length !== 1) {
      setHoldExpiresAt(null)
      setHoldError(null)
      return
    }

    let alive = true
    setHolding(true)
    setHoldError(null)
    const heldSeatIds = [...selectedSeatIds]
    const releaseHold = (hold: { busId: string; seatIds: string[]; sessionId: string }) => {
      void api.post(`/public/events/${event.id}/buses/${hold.busId}/release-hold`, {
        seatIds: hold.seatIds,
        sessionId: hold.sessionId,
      }).catch(() => {
        // The server-side expiry remains the final safety net if release fails.
      })
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ holdToken: string; holdExpiresAt: string }>(
          `/public/events/${event.id}/buses/${busId}/hold`,
          { seatIds: heldSeatIds, sessionId: holdToken, holdMinutes: 10 },
        )
        if (alive) {
          activeSeatHoldRef.current = { busId, seatIds: heldSeatIds, sessionId: holdToken }
          setHoldExpiresAt(res.holdExpiresAt)
        } else {
          // A late response must not leave an orphaned hold after the selection
          // or wizard has already changed.
          releaseHold({ busId, seatIds: heldSeatIds, sessionId: holdToken })
        }
      } catch (e: unknown) {
        if (alive) {
          setHoldError(e instanceof Error ? e.message : 'Could not hold selected seats. Please reselect.')
          setHoldExpiresAt(null)
        }
      } finally {
        if (alive) setHolding(false)
      }
    }, 350)

    return () => {
      alive = false
      clearTimeout(timer)
      const activeHold = activeSeatHoldRef.current
      if (
        activeHold
        && activeHold.busId === busId
        && activeHold.sessionId === holdToken
        && activeHold.seatIds.length === heldSeatIds.length
        && activeHold.seatIds.every((id, index) => id === heldSeatIds[index])
      ) {
        activeSeatHoldRef.current = null
        releaseHold(activeHold)
      }
    }
  }, [selected?.transportIncluded, busId, selectedSeatIds, holdToken, event.id, holdAttempt])

  const reserve = useMutation({
    mutationFn: () =>
      api.post<ReservationResult>(`/public/events/${event.id}/reservations`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
        ticketTypeId,
        ticketDesign: normalizeTicketDesign(ticketDesign),
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
      // The seat is now ticket-linked and no longer held. Do not release it
      // when the wizard later unmounts.
      activeSeatHoldRef.current = null
      rememberReservationAccessToken(data.reservationCode, data.accessToken)
      setDone(data)
      setExistingReservation(null)
      void qc.invalidateQueries({ queryKey: ['public-events'] })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'RESERVATION_EXISTS') {
        const d = (error.data ?? {}) as { reservationCode?: string; approval?: string; qr?: string | null }
        // New responses omit the code and credential; older ones may still
        // carry them. Never invent a code the server did not disclose.
        setExistingReservation({
          reservationCode: d.reservationCode ?? '',
          approval: d.approval,
          qr: d.qr ?? null,
        })
        if (d.reservationCode) setCheckingCode(d.reservationCode)
        else setResendMessage(t('reservationExists'))
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

  const hasEnteredDetails = [name, email, phone, notes, paymentReference].some((value) => value.trim())
    || !!paymentProofUrl || selectedSeatIds.length > 0
  const requestClose = () => {
    if (!done && activeStep > 0 && hasEnteredDetails) setConfirmDiscard(true)
    else onClose()
  }

  const openExisting = async () => {
    if (!existingReservation?.reservationCode) return
    setDuplicateLoading(true)
    try {
      const data = await fetchReservationStatus(event.id, {
        code: existingReservation.reservationCode,
        email: email.trim(),
      })
      setDone({
        attendeeId: data.attendeeId,
        ticketId: data.ticketId,
        reservationCode: data.reservationCode,
        price: data.price,
        approval: data.approval,
        paymentStatus: data.paymentStatus,
        qr: data.qr,
        seats: data.seats,
      })
      setCheckingCode(data.reservationCode)
      setExistingReservation(null)
    } catch {
      setResendMessage(t('reservationLoadFailed'))
    } finally {
      setDuplicateLoading(false)
    }
  }

  const resendTicket = async () => {
    if (resending) return
    setResending(true)
    setResendMessage(null)
    try {
      await resendReservationTicket(event.id, {
        email: email.trim(),
        reservationCode: existingReservation?.reservationCode || undefined,
      })
      setResendMessage(t('ticketResent'))
    } catch {
      setResendMessage(t('resendFailed'))
    } finally {
      setResending(false)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  return {
    event, t, lang, qc,
    name, setName, email, setEmail, phone, setPhone, notes, setNotes,
    availableTypes, ticketTypeId, setTicketTypeId, ticketDesign, setTicketDesign,
    paymentProviderId, setPaymentProviderId, paymentReference, setPaymentReference,
    paymentProofUrl, setPaymentProofUrl,
    done, checkingCode, setCheckingCode, copied, existingReservation,
    buses, busId, setBusId, selectedSeatIds, setSelectedSeatIds,
    holdToken, holdExpiresAt, setHoldExpiresAt, holdError, holding, seatPassengers, setSeatPassengers, seatView3d, setSeatView3d,
    stepIndex, setStepIndex, confirmDiscard, setConfirmDiscard, holdAttempt, setHoldAttempt,
    duplicateLoading, resending, resendMessage,
    seatScrollRef, seatScroll, setSeatScroll,
    selected, selectedProvider, selectedBus, seatUnitPrice, seatTotal, ticketPrice, totalPrice, isPaid,
    steps, activeStep, stepId, canGoBack, phoneValid, emailValid, canContinue,
    qrUrl, pending, awaitingQr, status, holdCountdown, holdExpiring,
    reserve, onSubmit, goNext, goBack, requestClose, openExisting, resendTicket, copyCode,
  }
}

export type ReservationWizard = ReturnType<typeof useReservationWizard>
