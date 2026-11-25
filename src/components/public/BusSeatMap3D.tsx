import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, RoundedBox } from '@react-three/drei'
import type * as THREE from 'three'
import type { PublicBus, PublicSeat } from '../../lib/public'
import { MECT49_SEAT_PLACEMENTS, normalizeBusLayout } from '../../lib/domain/busLayouts'

type SeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED' | 'UNAVAILABLE' | 'SELECTED'
type Position3D = [number, number, number]

function colorFor(status: SeatStatus, look?: string) {
  const premium = look === 'luxury' || look === 'coach'
  switch (status) {
    case 'SELECTED': return '#E8D08B'
    case 'AVAILABLE': return premium ? '#3aa87a' : '#2f9e6f'
    case 'HELD': return '#d97706'
    case 'RESERVED': return '#dc4c4c'
    case 'UNAVAILABLE': return '#55585f'
  }
}

function SeatMesh({ seat, status, look, position, onClick }: {
  seat: PublicSeat
  status: SeatStatus
  look?: string
  position: Position3D
  onClick: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const base = colorFor(status, look)
  const interactive = status === 'AVAILABLE' || status === 'SELECTED'

  useFrame((_, delta) => {
    if (!ref.current) return
    const targetY = hovered && interactive ? 0.12 : 0
    ref.current.position.y += (targetY - ref.current.position.y) * Math.min(1, delta * 10)
  })

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => { e.stopPropagation(); if (interactive) onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); if (interactive) { setHovered(true); document.body.style.cursor = 'pointer' } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
    >
      <RoundedBox args={[0.72, 0.18, 0.72]} radius={0.06} smoothness={2} position={[0, 0.09, 0]}>
        <meshStandardMaterial color={base} emissive={status === 'SELECTED' ? '#E8D08B' : base} emissiveIntensity={status === 'SELECTED' ? 0.35 : hovered && interactive ? 0.25 : 0.08} roughness={0.45} metalness={0.15} />
      </RoundedBox>
      <RoundedBox args={[0.64, 0.55, 0.12]} radius={0.04} smoothness={2} position={[0, 0.42, -0.28]}>
        <meshStandardMaterial color={base} emissive={status === 'SELECTED' ? '#E8D08B' : base} emissiveIntensity={status === 'SELECTED' ? 0.25 : 0.05} roughness={0.5} metalness={0.1} />
      </RoundedBox>
      <Html center distanceFactor={8} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: status === 'SELECTED' ? '#111' : '#f5f5f5', textShadow: '0 1px 2px rgba(0,0,0,.7)', fontFamily: 'monospace' }}>{seat.label}</div>
      </Html>
    </group>
  )
}

function BusFloor({ rows, cols, aisleAfter, look, mect49 }: {
  rows: number
  cols: number
  aisleAfter: number
  look?: string
  mect49: boolean
}) {
  const width = mect49 ? 5.4 : cols + (aisleAfter > 0 && aisleAfter < cols ? 0.6 : 0) + 0.8
  const depth = mect49 ? 14.6 : rows + 0.8
  const center: Position3D = mect49 ? [0, -0.02, 6.65] : [(cols - 1) / 2, -0.02, (rows - 1) / 2]

  return (
    <group position={center}>
      <RoundedBox args={[width, 0.06, depth]} radius={0.08} smoothness={2} position={[0, -0.03, 0]}>
        <meshStandardMaterial color={look === 'luxury' || look === 'coach' ? '#17181c' : '#1a1b1e'} roughness={0.9} metalness={look === 'luxury' || look === 'coach' ? 0.12 : 0.05} />
      </RoundedBox>
      <mesh position={[0, 0.001, -depth / 2 + 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 0.3, 0.35]} />
        <meshStandardMaterial color="#E8D08B" emissive="#E8D08B" emissiveIntensity={0.15} transparent opacity={0.35} />
      </mesh>
      {mect49 && (
        <>
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.58, 12.7]} />
            <meshStandardMaterial color="#ddd5c4" transparent opacity={0.28} />
          </mesh>
          {[-width / 2 + 0.08, width / 2 - 0.08].map((x) => (
            <RoundedBox key={x} args={[0.08, 0.26, depth - 0.15]} radius={0.035} position={[x, 0.12, 0]}>
              <meshStandardMaterial color="#C8A25C" metalness={0.35} roughness={0.45} />
            </RoundedBox>
          ))}
        </>
      )}
    </group>
  )
}

function MECTServiceFixtures() {
  return (
    <group>
      <RoundedBox args={[1.1, 0.25, 0.34]} radius={0.06} position={[0.1, 0.18, -0.78]}>
        <meshStandardMaterial color="#C8A25C" metalness={0.45} roughness={0.35} />
      </RoundedBox>
      <Html position={[0.1, 0.38, -0.78]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#f8f4e9', fontSize: 10, fontWeight: 700 }}>FRONT TV</span>
      </Html>
      <RoundedBox args={[0.62, 0.3, 0.72]} radius={0.08} position={[-1.78, 0.15, 0.35]}>
        <meshStandardMaterial color="#46464a" roughness={0.8} />
      </RoundedBox>
      <Html position={[-1.78, 0.43, 0.35]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#eee5d4', fontSize: 9 }}>DRIVER</span>
      </Html>
      <RoundedBox args={[0.55, 0.42, 1.4]} radius={0.06} position={[2.05, 0.22, 6.2]}>
        <meshStandardMaterial color="#c8c2b7" roughness={0.75} />
      </RoundedBox>
      <Html position={[2.05, 0.48, 6.2]} center style={{ pointerEvents: 'none' }}>
        <span style={{ color: '#17181c', fontSize: 9, fontWeight: 700 }}>TV · WC · EXIT</span>
      </Html>
    </group>
  )
}

export default function BusSeatMap3D({
  bus,
  selectedSeats,
  onSeatClick,
  className,
}: {
  bus: PublicBus
  selectedSeats: string[]
  onSeatClick: (seat: PublicSeat) => void
  className?: string
}) {
  const layout = normalizeBusLayout(bus.layout)
  const { rows, cols, aisleAfterCol: aisleAfter, look } = layout
  const mect49 = layout.template === 'mect49'
  const center = useMemo(
    () => (mect49 ? [0, 0.3, 6.4] as Position3D : [(cols - 1) / 2, 0.3, (rows - 1) / 2] as Position3D),
    [mect49, cols, rows],
  )

  const positionByLabel = useMemo(() => new Map(
    MECT49_SEAT_PLACEMENTS.map((seat) => [
      seat.label,
      [(seat.x - 420) / 100, 0, (seat.y - 260) / 75] as Position3D,
    ]),
  ), [])

  const seatStatuses = useMemo(() => {
    const map = new Map<string, SeatStatus>()
    for (const seat of bus.seats) {
      if (selectedSeats.includes(seat.id)) map.set(seat.id, 'SELECTED')
      else map.set(seat.id, seat.state)
    }
    return map
  }, [bus.seats, selectedSeats])

  return (
    <div className={className}>
      <div className="h-[420px] w-full border border-line-soft bg-[#111214]" role="img" aria-label="3D bus seat map. Use 2D map for keyboard seat selection.">
        <Canvas
          camera={{ position: [center[0], Math.max(rows, cols) * (mect49 ? 1.08 : 0.9), center[2] + (mect49 ? 7 : 2.5)], fov: 45 }}
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          frameloop="demand"
        >
          <color attach="background" args={['#111214']} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[4, 8, 6]} intensity={1.1} color="#fff6dd" />
          <directionalLight position={[-4, 5, -2]} intensity={0.35} color="#88aaff" />
          <Suspense fallback={null}>
            <BusFloor rows={rows} cols={cols} aisleAfter={aisleAfter} look={look} mect49={mect49} />
            {mect49 && <MECTServiceFixtures />}
            {bus.seats.map((seat) => {
              const position = mect49
                ? positionByLabel.get(seat.label) ?? [0, 0, 0]
                : [seat.col - 1, 0, seat.row - 1] as Position3D
              return (
                <SeatMesh
                  key={seat.id}
                  seat={seat}
                  status={seatStatuses.get(seat.id) ?? seat.state}
                  look={look}
                  position={position}
                  onClick={() => onSeatClick(seat)}
                />
              )
            })}
          </Suspense>
          <OrbitControls
            target={center}
            enablePan={false}
            minDistance={Math.max(rows, cols) * (mect49 ? 0.55 : 0.7)}
            maxDistance={Math.max(rows, cols) * (mect49 ? 1.55 : 2.2)}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={Math.PI / 6}
          />
        </Canvas>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-3">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-signal bg-signal/20" /> Selected</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-ok/50 bg-ok/20" /> Available</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-amber/50 bg-amber/20" /> Held</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-danger/50 bg-danger/20" /> Reserved</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 border border-line bg-ink-3/20" /> Unavailable</span>
        <span className="ml-auto font-mono text-[10px]">Drag to rotate · Scroll to zoom · 2D map for keyboard selection</span>
      </div>
    </div>
  )
}
