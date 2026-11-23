import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, RoundedBox } from '@react-three/drei'
import type * as THREE from 'three'
import type { PublicBus, PublicSeat } from '../../lib/public'

type SeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED' | 'UNAVAILABLE' | 'SELECTED'

function colorFor(status: SeatStatus) {
  switch (status) {
    case 'SELECTED': return '#E8D08B'
    case 'AVAILABLE': return '#2f9e6f'
    case 'HELD': return '#d97706'
    case 'RESERVED': return '#dc4c4c'
    case 'UNAVAILABLE': return '#55585f'
  }
}

function SeatMesh({ seat, status, onClick }: { seat: PublicSeat; status: SeatStatus; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const base = colorFor(status)
  const interactive = status === 'AVAILABLE' || status === 'SELECTED'

  useFrame((_, delta) => {
    if (!ref.current) return
    const targetY = hovered && interactive ? 0.12 : 0
    ref.current.position.y += (targetY - ref.current.position.y) * Math.min(1, delta * 10)
  })

  return (
    <group
      ref={ref}
      position={[seat.col - 1, 0, seat.row - 1]}
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

function BusFloor({ rows, cols, aisleAfter }: { rows: number; cols: number; aisleAfter: number }) {
  const width = cols + (aisleAfter > 0 && aisleAfter < cols ? 0.6 : 0) + 0.8
  const depth = rows + 0.8
  return (
    <group position={[(cols - 1) / 2, -0.02, (rows - 1) / 2]}>
      <RoundedBox args={[width, 0.06, depth]} radius={0.08} smoothness={2} position={[0, -0.03, 0]}>
        <meshStandardMaterial color="#1a1b1e" roughness={0.9} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, 0.001, -depth / 2 + 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width - 0.3, 0.35]} />
        <meshStandardMaterial color="#E8D08B" emissive="#E8D08B" emissiveIntensity={0.15} transparent opacity={0.35} />
      </mesh>
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
  const { rows, cols } = bus.layout
  const aisleAfter = bus.layout.aisleAfterCol ?? 0
  const center = useMemo(() => [(cols - 1) / 2, 0.3, (rows - 1) / 2] as [number, number, number], [cols, rows])

  const seatStatuses = useMemo(() => {
    const m = new Map<string, SeatStatus>()
    for (const s of bus.seats) {
      if (selectedSeats.includes(s.id)) m.set(s.id, 'SELECTED')
      else m.set(s.id, s.state)
    }
    return m
  }, [bus.seats, selectedSeats])

  return (
    <div className={className}>
      <div className="h-[420px] w-full border border-line-soft bg-[#111214]" role="img" aria-label="3D bus seat map. Use 2D map for keyboard seat selection.">
        <Canvas
          camera={{ position: [center[0], Math.max(rows, cols) * 0.9, rows + 2.5], fov: 45 }}
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          frameloop="demand"
        >
          <color attach="background" args={['#111214']} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[4, 8, 6]} intensity={1.1} color="#fff6dd" />
          <directionalLight position={[-4, 5, -2]} intensity={0.35} color="#88aaff" />
          <Suspense fallback={null}>
            <BusFloor rows={rows} cols={cols} aisleAfter={aisleAfter} />
            {bus.seats.map((seat) => (
              <SeatMesh
                key={seat.id}
                seat={seat}
                status={seatStatuses.get(seat.id) ?? seat.state}
                onClick={() => onSeatClick(seat)}
              />
            ))}
          </Suspense>
          <OrbitControls
            target={center}
            enablePan={false}
            minDistance={Math.max(rows, cols) * 0.7}
            maxDistance={Math.max(rows, cols) * 2.2}
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
