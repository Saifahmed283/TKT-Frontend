import { Clock3, Grid3X3, Box } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import type { ReservationWizard } from './useReservationWizard'
import BusSeatMap2D from '../BusSeatMap2D'
import { resolveBusLayout } from '../../../lib/domain/busLayouts'

const BusSeatMap3D = lazy(() => import('../BusSeatMap3D'))

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const onChange = () => setMobile(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return mobile
}

export function SeatsStep({ w }: { w: ReservationWizard }) {
  const {
    t, buses, busId, setBusId, selectedSeatIds, setSelectedSeatIds,
    holding, holdExpiresAt, holdError, setHoldAttempt,
    seatView3d, setSeatView3d, seatScrollRef, seatScroll,
  } = w
  const isMobile = useIsMobile()

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((current) => current.includes(seatId) ? [] : [seatId])
  }

  return (
    <div data-testid="wizard-step-seats" className="space-y-3 border border-line-soft bg-elevated/20 p-3 sm:space-y-4 sm:p-4">
      {buses.length === 0 ? (
        <p className="border border-danger/30 bg-danger/5 px-3 py-3 text-sm text-danger">{t('noBusAvailable')}</p>
      ) : (
        <>
          {buses.length > 1 && (
            <select className="input" value={busId} onChange={(e) => { setBusId(e.target.value); setSelectedSeatIds([]) }}>
              {buses.map(b => <option key={b.id} value={b.id}>{b.name} ({b.availableSeats} {t('left')})</option>)}
            </select>
          )}
          {(() => {
            const bus = buses.find(b => b.id === busId) ?? buses[0]
            if (!bus) return null
            const model = resolveBusLayout(bus.layout)
            return (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-line-soft bg-panel/60 px-3 py-2 sm:py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-0">{bus.name}</p>
                    <p className="mt-1 hidden text-[11px] text-ink-3 sm:block">{w.lang === 'ar' ? model.nameAr : model.name}</p>
                    <p className="mt-0.5 hidden text-[10px] text-ink-3 sm:block">
                      {w.lang === 'ar'
                        ? String(model.rows) + ' صفوف · ' + String(model.cols) + ' مقاعد في الصف'
                        : String(model.rows) + ' rows · ' + String(model.cols) + ' seats per row'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-baseline justify-end gap-1 font-mono text-sm font-semibold tabular-nums text-ink-0">{bus.availableSeats}<span className="text-[10px] font-normal text-ink-3">{w.lang === 'ar' ? 'متاح' : 'available'}</span></p>
                    <p className="mt-0.5 hidden text-[10px] text-ink-3 sm:block">{bus.totalSeats} {w.lang === 'ar' ? 'مقعد إجمالي' : 'seats total'}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 border border-line-soft bg-panel/50 p-1">
                    <button type="button" aria-pressed={!seatView3d} onClick={() => setSeatView3d(false)} className={`inline-flex min-h-9 items-center gap-1 px-2 py-1 text-[10px] ${!seatView3d ? 'bg-signal/10 text-signal' : 'text-ink-3 hover:text-ink'}`}><Grid3X3 size={12} /> 2D</button>
                    <button type="button" aria-pressed={seatView3d} onClick={() => setSeatView3d(true)} className={`inline-flex min-h-9 items-center gap-1 px-2 py-1 text-[10px] ${seatView3d ? 'bg-signal/10 text-signal' : 'text-ink-3 hover:text-ink'}`}><Box size={12} /> 3D</button>
                  </div>
                </div>
                {seatView3d ? (
                  <Suspense fallback={<div className="grid h-[320px] place-items-center text-xs text-ink-3">{w.lang === 'ar' ? 'جارٍ تحميل العرض ثلاثي الأبعاد…' : 'Loading 3D view…'}</div>}>
                    <BusSeatMap3D
                      bus={bus}
                      selectedSeats={selectedSeatIds}
                      onSeatClick={(seat) => toggleSeat(seat.id)}
                      disabled={holding}
                      maxSelectable={1}
                    />
                  </Suspense>
                ) : (
                  <>
                    <div ref={seatScrollRef} className="overflow-x-auto">
                      <BusSeatMap2D
                        layout={bus.layout}
                        seats={bus.seats}
                        selectedSeatIds={selectedSeatIds}
                        onSeatClick={(seat) => toggleSeat(seat.id)}
                        language={w.lang}
                        maxSelectable={1}
                        disabled={holding}
                        compact={isMobile}
                      />
                    </div>
                    {seatScroll.overflow && !seatScroll.atEnd && (
                      <p className="mt-2 text-center text-[10px] uppercase tracking-[0.12em] text-ink-3">
                        {w.lang === 'ar' ? '← اسحب لعرض بقية المقاعد' : 'Swipe to see more seats →'}
                      </p>
                    )}
                  </>
                )}
                <div className="mt-2 space-y-2 border-t border-line-soft pt-2 text-[11px] text-ink-2 sm:mt-4 sm:pt-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{t('selectedSeats')}: <bdi className="font-mono text-ink-0">{bus.seats.filter(s => selectedSeatIds.includes(s.id)).map(s => s.label).join(', ') || '—'}</bdi></span>
                    {holding && <span className="inline-flex items-center gap-1 text-signal"><Clock3 size={12} /> {t('holding')}</span>}
                    {holdExpiresAt && !holding && <span className="inline-flex items-center gap-1 text-ok"><Clock3 size={12} /> {t('heldUntil')} {new Date(holdExpiresAt).toLocaleTimeString(w.lang === 'ar' ? 'ar' : undefined)}</span>}
                    {selectedSeatIds.length !== 1 && <span className="text-danger">{t('seatRequired')}</span>}
                  </div>
                  {holdError && (
                    <div className="flex flex-wrap items-center gap-2 text-danger">
                      <span>{holdError}</span>
                      <button type="button" data-testid="retry-hold" className="btn-ghost !px-2 !py-1 text-[11px]" onClick={() => setHoldAttempt((n) => n + 1)}>
                        {t('retryHold')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
