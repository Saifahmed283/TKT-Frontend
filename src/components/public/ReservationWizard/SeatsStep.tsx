import { ArrowRight, Clock3 } from 'lucide-react'
import type { ReservationWizard } from './useReservationWizard'

export function SeatsStep({ w }: { w: ReservationWizard }) {
  const {
    t, buses, busId, setBusId, selectedSeatIds, setSelectedSeatIds,
    seatScrollRef, seatScroll, setSeatScroll, holding, holdExpiresAt, holdError,
    setHoldAttempt, name, email, phone, seatPassengers, setSeatPassengers,
  } = w
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
            const layout = bus.layout ?? { rows: 0, cols: 0, aisleAfterCol: 0 }
            const cols = layout.cols
            const aisleAfter = layout.aisleAfterCol ?? 0
            return (
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-ink-3"><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-ok/40" />{t('available')}</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-amber/40" />{t('held')}</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-danger/40" />{t('reservedSeat')}</span><span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-none bg-ink-3/40" />{t('unavailable')}</span></div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{layout.template === 'mect49' ? 'MECT 49-seat coach' : layout.template === 'coaster21' ? 'Coaster 21-seat' : t('customBusLayout')}</div>
                <div
                  ref={seatScrollRef}
                  onScroll={(e) => setSeatScroll((prev) => ({ ...prev, atEnd: e.currentTarget.scrollLeft + e.currentTarget.clientWidth >= e.currentTarget.scrollWidth - 4 }))}
                  className="relative overflow-x-auto"
                ><div className="grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${cols + (aisleAfter > 0 && aisleAfter < cols ? 1 : 0)}, minmax(0,1fr))` }}>
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
                {seatScroll.overflow && !seatScroll.atEnd && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-signal">
                    {t('swipeSeats')} <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </p>
                )}
                <div className="mt-3 space-y-2">
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
  )
}
