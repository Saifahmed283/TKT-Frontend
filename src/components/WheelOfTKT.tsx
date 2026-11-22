import { useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Crown } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useWheelStatus, type WheelResult } from '../lib/public'
import { Blink, Corners } from './instruments'
import { Spinner } from './ui'

/**
 * Segment order MUST match the backend WHEEL_SEGMENTS array —
 * the backend returns the winning index to land the animation.
 */
const SEGMENTS: { reward: string; label: string; dark: boolean; jackpot?: boolean }[] = [
  { reward: 'FIFTEEN_OFF', label: '15% OFF', dark: true },
  { reward: 'TWENTY_FIVE_OFF', label: '25% OFF', dark: false },
  { reward: 'GIFT', label: 'GIFT FROM TKT', dark: true },
  { reward: 'RETRY', label: 'ONE MORE CHANCE', dark: false },
  { reward: 'FIFTY_OFF', label: '50% OFF', dark: true },
  { reward: 'FREE_TICKET', label: 'FREE TICKET', dark: false, jackpot: true },
]

const WHEEL_BG = `conic-gradient(
  from 0deg,
  #16161c 0deg 60deg,
  #ffb020 60deg 120deg,
  #16161c 120deg 180deg,
  #ffb020 180deg 240deg,
  #16161c 240deg 300deg,
  #e98a00 300deg 360deg
)`

function ResultPanel({ result }: { result: WheelResult }) {
  const isRetry = result.reward === 'RETRY'
  return (
    <div className="animate-fade-in panel relative mt-6 p-5">
      <Corners />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">
          {isRetry ? 'Result · try again' : 'Result · claim code'}
        </p>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ok">
          <Blink className="bg-ok" /> logged
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-wide text-signal">{result.label}</p>
      {result.code ? (
        <div className="mt-4 border border-signal/25 bg-signal/5 px-4 py-3 font-mono text-lg tracking-[0.2em] text-ink-0">
          {result.code}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          You earned another spin. Hit the button again — right now.
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        {result.code
          ? 'Show this code at checkout when you reserve your ticket. Codes are single-use and tracked.'
          : 'Your extra spin is waiting. The wheel does not wait forever.'}
      </p>
    </div>
  )
}

export default function WheelOfTKT() {
  const qc = useQueryClient()
  const reduce = useReducedMotion()
  const wheelRef = useRef<HTMLDivElement>(null)
  const rotation = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<WheelResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusQ = useWheelStatus()
  const canSpin = statusQ.data?.canSpin ?? true

  const spin = useMutation({
    mutationFn: () => api.post<WheelResult>('/public/wheel/spin'),
    onMutate: () => {
      setError(null)
      setSpinning(true)
    },
    onSuccess: (data) => {
      const base = 330 - data.index * 60
      const turns = 5 + Math.floor(Math.random() * 3)
      const target = rotation.current + (base - (rotation.current % 360) + 360) % 360 + 360 * turns
      const done = () => {
        rotation.current = target
        setSpinning(false)
        setResult(data)
        void qc.invalidateQueries({ queryKey: ['wheel-status'] })
      }
      if (reduce || !wheelRef.current) {
        done()
        return
      }
      animate(wheelRef.current, { rotate: target }, { duration: 4.4, ease: [0.12, 0.72, 0.16, 1], onComplete: done })
    },
    onError: (err) => {
      setSpinning(false)
      if (err instanceof ApiError && err.status === 409) {
        setError('Your free spin is used up. Come back for the next campaign.')
        void qc.invalidateQueries({ queryKey: ['wheel-status'] })
      } else {
        setError(err instanceof Error ? err.message : 'Spin failed — try again')
      }
    },
  })

  const usedUp = !statusQ.isLoading && !canSpin
  const lastUsed = statusQ.data?.lastLabel ? { label: statusQ.data.lastLabel, code: statusQ.data.lastCode } : null

  return (
    <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-6">
        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-signal">
          <span className="text-ink-3">04</span>
          <span className="h-px w-12 bg-signal/40" />
          <span>Spin the wheel</span>
        </div>
        <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl text-ink-0 sm:text-6xl">
          One free spin.
          <br />
          <span className="text-outline">Every visitor.</span>
        </h2>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
          TKT rewards the people who make events happen. Spin once, keep the code, and save on your next
          reservation — or win a free ticket outright.
        </p>

        <div className="mt-8 grid max-w-lg grid-cols-3 gap-px border border-line-soft bg-line-soft">
          {[
            ['15%', 'everyday'],
            ['50%', 'lucky draw'],
            ['100%', 'jackpot'],
          ].map(([v, l]) => (
            <div key={l} className="bg-paper px-4 py-3.5">
              <p className="font-display text-2xl font-bold text-signal tabular-nums">{v}</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-ink-3">{l}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-3">
          <Blink className="bg-signal" />
          {statusQ.isLoading
            ? 'reading your spin ticket…'
            : usedUp
              ? 'spin ticket used — 1 per device'
              : result
                ? `${result.remainingSpins} spin${result.remainingSpins === 1 ? '' : 's'} remaining`
                : 'spin ticket ready — 1 per device'}
        </p>

        {error && (
          <div className="mt-4 flex items-center gap-3 border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
            <span className="h-1.5 w-1.5 shrink-0 animate-blink rounded-full bg-danger" />
            {error}
          </div>
        )}

        {result && !error && <ResultPanel result={result} />}
        {usedUp && !result && lastUsed && (
          <div className="panel relative mt-6 p-5">
            <Corners />
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-3">Last result</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-wide text-signal">{lastUsed.label}</p>
            {lastUsed.code && (
              <div className="mt-3 border border-signal/25 bg-signal/5 px-4 py-3 font-mono text-lg tracking-[0.2em] text-ink-0">
                {lastUsed.code}
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link to="/upcoming" className="btn-ghost px-6 py-3 text-base">
            Browse upcoming events
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="lg:col-span-6">
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <div className="absolute inset-0 rounded-full border border-signal/25" />
          <div className="absolute inset-2 rounded-full border border-dashed border-signal/15" />
          <div className="absolute inset-3 rounded-full border border-line-soft" />

          {/* wheel */}
          <div ref={wheelRef} className="absolute inset-4 overflow-hidden rounded-full" style={{ background: WHEEL_BG, willChange: 'transform' }}>
            {SEGMENTS.map((s, i) => {
              const angle = i * 60 + 30
              return (
                <div key={s.reward} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ marginTop: '-41%' }}
                  >
                    <span
                      className={`block whitespace-nowrap font-display text-[11px] font-semibold tracking-wide sm:text-xs ${
                        s.jackpot ? 'text-white' : s.dark ? 'text-ink-100' : 'text-ink-950'
                      }`}
                    >
                      {s.jackpot && <Crown size={10} className="mr-1 inline -translate-y-px" />}
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* jackpot glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 300deg, rgba(255,176,32,0.22) 0deg 60deg, transparent 60deg 360deg)',
              }}
            />
          </div>

          {/* needle */}
          <div className="absolute -top-1 left-1/2 z-30 -translate-x-1/2">
            <div className="h-4 w-4 rotate-45 border-l-2 border-t-2 border-signal bg-paper" />
            <div className="mx-auto -mt-2 h-0 w-0 border-l-[9px] border-r-[9px] border-t-[15px] border-l-transparent border-r-transparent border-t-signal drop-shadow-[0_2px_6px_rgba(255,176,32,0.5)]" />
          </div>

          {/* hub */}
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
            <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-signal/60 bg-paper shadow-glow">
              <button
                onClick={() => spin.mutate()}
                disabled={!canSpin || spinning}
                className={`grid h-16 w-16 place-items-center rounded-full border transition-all duration-200 ${
                  canSpin && !spinning
                    ? 'border-signal bg-signal font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink-950 hover:scale-105'
                    : 'border-line-soft bg-ink-900 text-ink-3'
                }`}
                aria-label={canSpin && !spinning ? 'Spin the wheel' : 'Spin used'}
              >
                {spinning ? <Blink className="bg-ink-3" /> : canSpin ? 'SPIN' : 'USED'}
              </button>
            </div>
          </div>

          {/* loading veil */}
          {statusQ.isLoading && (
            <div className="absolute inset-4 z-40 grid place-items-center rounded-full bg-paper/70 backdrop-blur-sm">
              <Spinner label="Calibrating" />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-ink-3">
          One free spin per device · prizes logged server-side
        </p>
      </div>
    </div>
  )
}