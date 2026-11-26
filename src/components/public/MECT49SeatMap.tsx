import { memo } from 'react'
import BusSeatMap2D, { type CoachSeat } from './BusSeatMap2D'
import { createBusLayout } from '../../lib/domain/busLayouts'

type Props = {
  seats: CoachSeat[]
  selectedSeatIds: string[]
  onSeatClick: (seat: CoachSeat) => void
  language?: 'ar' | 'en'
  maxSelectable?: number
  disabled?: boolean
  allowStatusSelection?: boolean
  onSeatContextMenu?: (seat: CoachSeat) => void
  canInteract?: (seat: CoachSeat) => boolean
  className?: string
}

/**
 * Backwards-compatible MECT entry point. The geometry now lives in the shared
 * canonical layout model and is rendered by the same 2D component as every
 * other coach, so both views can never drift apart.
 */
const layout = createBusLayout('mect49')

function MECT49SeatMap(props: Props) {
  return <BusSeatMap2D {...props} layout={layout} />
}

export default memo(MECT49SeatMap)
