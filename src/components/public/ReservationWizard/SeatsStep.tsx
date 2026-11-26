import { Clock3, Grid3X3, Box } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type { ReservationWizard } from './useReservationWizard'
import BusSeatMap2D from '../BusSeatMap2D'

const BusSeatMap3D = lazy(() => import('../BusSeatMap3D'))

export function SeatsStep({ w }: { w: ReservationWizard }) {
  const {
    t, buses, busId, setBusId, selectedSeatIds, setSelectedSeatIds,
    holding, holdExpiresAt, holdError, setHoldAttempt,
    seatView3d, setSeatView3d,
  } = w

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((current) => current.includes(seatId) ? [] : [seatId])
  }

  return (
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
            return (
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink-3">{bus.name}</p>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-line-soft bg-panel/50 p-1">
                    <button type="button" aria-pressed={!seatView3d} onClick={() => setSeatView3d(false)} className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-[10px] ${!seatView3d ? 'bg-signal text-black' : 'text-ink-3'}`}><Grid3X3 size={12} /> 2D</button>
                    <button type="button" aria-pressed={seatView3d} onClick={() => setSeatView3d(true)} className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-[10px] ${seatView3d ? 'bg-signal text-black' : 'text-ink-3'}`}><Box size={12} /> 3D</button>
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
                  <BusSeatMap2D
                    layout={bus.layout}
                    seats={bus.seats}
                    selectedSeatIds={selectedSeatIds}
                    onSeatClick={(seat) => toggleSeat(seat.id)}
                    language={w.lang}
                    maxSelectable={1}
                    disabled={holding}
                  />
                )}
                <div className="mt-4 space-y-3">
                  <section className="space-y-2 sm:hidden" data-testid="mobile-seat-picker" aria-label={w.lang === 'ar' ? 'اختيار المقعد' : 'Seat picker'}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-ink-1">{w.lang === 'ar' ? 'اختر من المقاعد المتاحة' : 'Choose from available seats'}</p>
                      <span className="text-[10px] text-ink-3">{bus.seats.length} {w.lang === 'ar' ? 'مقعد' : 'seats'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 min-[420px]:grid-cols-5">
                      {[...bus.seats].sort((a, b) => a.row - b.row || a.col - b.col).map((seat) => {
                        const active = selectedSeatIds.includes(seat.id)
                        const available = seat.state === 'AVAILABLE' || active
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            data-testid={`mobile-seat-${seat.label}`}
                            aria-label={`${w.lang === 'ar' ? 'مقعد' : 'Seat'} ${seat.label}`}
                            aria-pressed={active}
                            disabled={holding || !available}
                            onClick={() => toggleSeat(seat.id)}
                            className={`min-h-11 rounded-md border px-2 py-2 text-sm font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-signal bg-signal text-black shadow-sm' : available ? 'border-line-soft bg-panel text-ink-1 hover:border-signal/50' : 'border-line-soft bg-elevated/60 text-ink-3'}`}
                          >
                            {seat.label}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-ink-3">{w.lang === 'ar' ? 'يمكنك اختيار المقعد من المخطط أو من القائمة هنا.' : 'Select a seat from the map or this list.'}</p>
                  </section>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-2">
                    <span>{t('selectedSeats')}: {bus.seats.filter(s => selectedSeatIds.includes(s.id)).map(s => s.label).join(', ') || '—'}</span>
                    {holding && <span className="inline-flex items-center gap-1 text-signal"><Clock3 size={12} /> {t('holding')}</span>}
                    {holdExpiresAt && !holding && <span className="inline-flex items-center gap-1 text-ok"><Clock3 size={12} /> {t('heldUntil')} {new Date(holdExpiresAt).toLocaleTimeString()}</span>}
                    {holdError && <span className="text-danger">{holdError}</span>}
                    {holdError && (
                      <button type="button" data-testid="retry-hold" className="btn-ghost !px-2 !py-1 text-[11px]" onClick={() => setHoldAttempt((n) => n + 1)}>
                        {t('retryHold')}
                      </button>
                    )}
                    {selectedSeatIds.length !== 1 && <span className="text-danger">{t('seatRequired')}</span>}
                  </div>

                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
