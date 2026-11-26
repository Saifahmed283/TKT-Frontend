import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { PublicBus, PublicSeat } from '../../lib/public'
import { cabinProjection, resolveBusLayout, type BusSeatDef, type ResolvedBusLayout } from '../../lib/domain/busLayouts'

type SeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED' | 'UNAVAILABLE' | 'SELECTED'
type Position3D = [number, number, number]
type Preset = 'iso' | 'top' | 'front' | 'side'

const STATUS_COLOR: Record<SeatStatus, string> = {
  SELECTED: '#ffb020',
  AVAILABLE: '#35a878',
  HELD: '#d9901f',
  RESERVED: '#d9505c',
  UNAVAILABLE: '#4b4e55',
}

const PRESET_POSITIONS: Record<Preset, Position3D> = {
  iso: [7.6, 6.8, 9.2],
  top: [0.02, 14.5, 0.18],
  front: [0, 3.4, -11.6],
  side: [11.8, 4.1, 0],
}

function makeSeatTexture(label: string, status: SeatStatus) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 80
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Texture()
  const dark = status === 'SELECTED' ? '#17181c' : '#f7f4ec'
  const light = status === 'SELECTED' ? '#ffb020' : '#1b1d22'
  ctx.fillStyle = light
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(12, 8, 104, 64, 22)
    ctx.fill()
  } else {
    ctx.fillRect(12, 8, 104, 64)
  }
  ctx.fillStyle = dark
  ctx.font = 'bold 42px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 64, 42)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function CameraRig({ preset, scale, target, controls }: {
  preset: Preset
  scale: number
  target: Position3D
  controls: React.RefObject<any>
}) {
  const { camera, invalidate } = useThree()
  useEffect(() => {
    const base = PRESET_POSITIONS[preset]
    camera.position.set(base[0] * scale, base[1] * scale, base[2] * scale)
    camera.lookAt(target[0], target[1], target[2])
    if (controls.current) {
      controls.current.target.set(target[0], target[1], target[2])
      controls.current.update()
    }
    invalidate()
  }, [preset, scale, target, camera, invalidate, controls])
  return null
}

function CabinShell({ model, roof }: { model: ResolvedBusLayout; roof: boolean }) {
  const { width, length, height } = model.cabin
  const pillars = Math.max(5, Math.round((length - 1) / 1.05))
  const dashes = Math.max(6, Math.round((length - 1) / 0.72))

  return (
    <group>
      <RoundedBox args={[width, 0.12, length]} radius={0.1} smoothness={3} position={[0, -0.06, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#1c1e23" roughness={0.85} metalness={0.12} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[0.52, length - 0.8]} />
        <meshStandardMaterial color="#d9d0bd" transparent opacity={0.3} roughness={0.9} />
      </mesh>
      {Array.from({ length: dashes }, (_, index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, -(length - 1) / 2 + index * 0.72]}>
          <planeGeometry args={[0.018, 0.28]} />
          <meshBasicMaterial color="#f2ead7" transparent opacity={0.3} />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <group key={side}>
          <RoundedBox args={[0.1, 0.66, length - 0.14]} radius={0.04} smoothness={2} position={[side * width / 2, 0.34, 0]} castShadow>
            <meshStandardMaterial color="#d8d4cc" roughness={0.68} metalness={0.08} />
          </RoundedBox>
          <mesh position={[side * (width / 2 - 0.055), 0.7, 0]}>
            <boxGeometry args={[0.016, 0.038, length - 0.3]} />
            <meshStandardMaterial color="#c8a25c" emissive="#c8a25c" emissiveIntensity={0.22} metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[side * (width / 2 - 0.01), 1.2, 0]}>
            <boxGeometry args={[0.022, 0.76, length - 1]} />
            <meshPhysicalMaterial color="#a8c6d4" transparent opacity={0.3} roughness={0.08} metalness={0.1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {Array.from({ length: pillars }, (_, index) => (
            <RoundedBox
              key={index}
              args={[0.085, 1.68, 0.085]}
              radius={0.03}
              smoothness={2}
              position={[side * (width / 2 - 0.055), 1.02, -(length - 1) / 2 + index * ((length - 1) / (pillars - 1))]}
            >
              <meshStandardMaterial color="#2a2c31" metalness={0.35} roughness={0.45} />
            </RoundedBox>
          ))}
          <RoundedBox args={[0.26, 0.055, length - 0.95]} radius={0.02} smoothness={2} position={[side * (width / 2 - 0.17), 1.82, 0]}>
            <meshStandardMaterial color="#c8c3b7" metalness={0.22} roughness={0.62} />
          </RoundedBox>
          <mesh position={[side * (width / 2 - 0.3), 2.06, 0]}>
            <boxGeometry args={[0.045, 0.018, length - 1.25]} />
            <meshBasicMaterial color="#ffe6a8" />
          </mesh>
        </group>
      ))}

      <RoundedBox args={[width - 0.14, height - 0.4, 0.1]} radius={0.05} smoothness={2} position={[0, (height - 0.4) / 2, -length / 2]} castShadow>
        <meshStandardMaterial color="#25272c" roughness={0.6} metalness={0.16} />
      </RoundedBox>
      <RoundedBox args={[width - 0.14, height - 0.5, 0.1]} radius={0.05} smoothness={2} position={[0, (height - 0.5) / 2, length / 2]} castShadow>
        <meshStandardMaterial color="#25272c" roughness={0.6} metalness={0.16} />
      </RoundedBox>
      <mesh position={[0, 1.42, -length / 2 - 0.06]}>
        <planeGeometry args={[width - 0.42, 0.82]} />
        <meshPhysicalMaterial color="#9fbecd" transparent opacity={0.36} roughness={0.06} metalness={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <RoundedBox args={[width, 0.34, 0.16]} radius={0.06} smoothness={2} position={[0, 0.3, -length / 2 - 0.06]} castShadow>
        <meshStandardMaterial color="#17191d" metalness={0.3} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.32, -length / 2 - 0.15]}>
        <boxGeometry args={[width * 0.46, 0.1, 0.02]} />
        <meshStandardMaterial color="#44474f" metalness={0.65} roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.24, 0.1, 0.03]} radius={0.03} smoothness={2} position={[side * (width / 2 - 0.26), 0.36, -length / 2 - 0.15]}>
          <meshBasicMaterial color="#fff0bd" />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.18, 0.09, 0.03]} radius={0.03} smoothness={2} position={[side * (width / 2 - 0.24), 0.42, length / 2 + 0.07]}>
          <meshBasicMaterial color="#ff6a6a" />
        </RoundedBox>
      ))}

      {[-length / 2 + 0.95, length / 2 - 0.95].map((z) => [-1, 1].map((side) => (
        <group key={`${z}-${side}`} position={[side * (width / 2 + 0.01), 0.38, z]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.19, 22]} />
            <meshStandardMaterial color="#15161a" roughness={0.85} />
          </mesh>
          <mesh position={[0, side * 0.1, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.2, 18]} />
            <meshStandardMaterial color="#9a9da5" metalness={0.7} roughness={0.28} />
          </mesh>
        </group>
      )))}

      {roof && (
        <group>
          <RoundedBox args={[width - 0.16, 0.06, length - 0.12]} radius={0.04} smoothness={2} position={[0, height - 0.06, 0]}>
            <meshPhysicalMaterial color="#b9c8d3" transparent opacity={0.28} roughness={0.08} metalness={0.1} depthWrite={false} />
          </RoundedBox>
          {[-1, 1].map((side) => (
            <RoundedBox key={side} args={[0.09, 0.12, length - 0.05]} radius={0.03} smoothness={2} position={[side * (width / 2 - 0.07), height - 0.13, 0]}>
              <meshStandardMaterial color="#34363c" metalness={0.5} roughness={0.35} />
            </RoundedBox>
          ))}
          {Array.from({ length: pillars }, (_, index) => (
            <mesh key={index} position={[0, height - 0.13, -(length - 1) / 2 + index * ((length - 1) / (pillars - 1))]}>
              <boxGeometry args={[width - 0.2, 0.045, 0.045]} />
              <meshStandardMaterial color="#34363c" metalness={0.5} roughness={0.35} />
            </mesh>
          ))}
        </group>
      )}

      {Array.from({ length: Math.max(4, Math.round(length / 1.9)) }, (_, index) => (
        <RoundedBox key={index} args={[0.42, 0.024, 0.08]} radius={0.01} smoothness={2} position={[0, height - 0.2, -(length - 1.8) / 2 + index * 1.9]}>
          <meshBasicMaterial color="#fff1cb" />
        </RoundedBox>
      ))}
    </group>
  )
}

function Fixtures({ model, project }: { model: ResolvedBusLayout; project: ReturnType<typeof cabinProjection> }) {
  const features = model.features
  const driver = features.find((feature) => feature.kind === 'driver')
  const exits = features.filter((feature) => feature.kind === 'exit')
  const aux = features.filter((feature) => feature.kind === 'aux')

  return (
    <group>
      {driver && (() => {
        const x = project.toMx(driver.x + driver.w / 2)
        const z = project.toZ(driver.y + driver.h / 2)
        return (
          <group>
            <RoundedBox args={[0.54, 0.32, 0.52]} radius={0.06} smoothness={2} position={[x, 0.72, z + 0.16]} castShadow>
              <meshStandardMaterial color="#202229" metalness={0.28} roughness={0.5} />
            </RoundedBox>
            <mesh position={[x + 0.13, 0.92, z - 0.1]}>
              <planeGeometry args={[0.28, 0.12]} />
              <meshBasicMaterial color="#25425f" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[x, 1.02, z + 0.46]}>
              <torusGeometry args={[0.15, 0.022, 10, 26]} />
              <meshStandardMaterial color="#2a2c31" metalness={0.55} roughness={0.35} />
            </mesh>
            <RoundedBox args={[0.42, 0.52, 0.44]} radius={0.06} smoothness={2} position={[x, 0.36, z - 0.45]} castShadow>
              <meshStandardMaterial color="#3b3d44" roughness={0.8} />
            </RoundedBox>
          </group>
        )
      })()}

      {aux.map((feature) => {
        const x = project.toMx(feature.x + feature.w / 2)
        const z = project.toZ(feature.y + feature.h / 2)
        return (
          <group key={feature.id} position={[x, 0, z]}>
            <RoundedBox args={[0.38, 0.46, 0.4]} radius={0.05} smoothness={2} position={[0, 0.32, 0]} castShadow>
              <meshStandardMaterial color="#a39e94" roughness={0.85} />
            </RoundedBox>
            <Html center position={[0, 0.62, 0]} style={{ pointerEvents: 'none' }}>
              <span className="rounded bg-[#f6f2e8] px-1.5 py-0.5 text-[9px] font-bold text-[#17181c] shadow">{feature.label}</span>
            </Html>
          </group>
        )
      })}

      {features.filter((feature) => feature.kind === 'tv').map((feature) => {
        const x = project.toMx(feature.x + feature.w / 2)
        const z = project.toZ(feature.y + feature.h / 2)
        const facing = z < -1 ? 0 : Math.PI
        return (
          <group key={feature.id} position={[x, 1.62, z]} rotation={[0, facing, 0]}>
            <RoundedBox args={[1.02, 0.52, 0.06]} radius={0.035} smoothness={2} castShadow>
              <meshStandardMaterial color="#1a1c20" metalness={0.3} roughness={0.4} />
            </RoundedBox>
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[0.86, 0.38]} />
              <meshBasicMaterial color="#2d4b6b" side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}

      {features.filter((feature) => feature.kind === 'wc').map((feature) => {
        const x = project.toMx(feature.x + feature.w / 2)
        const z = project.toZ(feature.y + feature.h / 2)
        return (
          <group key={feature.id} position={[x, 0, z]}>
            <RoundedBox args={[0.66, 1.78, 0.76]} radius={0.08} smoothness={3} position={[0, 0.9, 0]} castShadow>
              <meshStandardMaterial color="#cec8be" roughness={0.78} />
            </RoundedBox>
            <RoundedBox args={[0.035, 1.45, 0.58]} radius={0.014} smoothness={2} position={[-0.34, 0.92, 0]}>
              <meshStandardMaterial color="#b5aea3" roughness={0.7} />
            </RoundedBox>
            <mesh position={[-0.37, 1.0, 0.18]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color="#c8a25c" metalness={0.65} roughness={0.3} />
            </mesh>
            <Html center position={[0, 2.03, 0]} style={{ pointerEvents: 'none' }}>
              <span className="rounded bg-[#f6f2e8] px-1.5 py-0.5 text-[9px] font-bold text-[#17181c] shadow">{feature.label}</span>
            </Html>
          </group>
        )
      })}

      {exits.map((feature) => {
        const x = project.toMx(feature.x + feature.w / 2)
        const z = project.toZ(feature.y + feature.h / 2)
        const inward = x > 0 ? -1 : 1
        return (
          <group key={feature.id} position={[x, 0, z]}>
            <RoundedBox args={[0.1, 1.62, 0.86]} radius={0.035} smoothness={2} position={[0, 0.86, 0]}>
              <meshStandardMaterial color="#d9901f" emissive="#d9901f" emissiveIntensity={0.28} metalness={0.35} roughness={0.4} />
            </RoundedBox>
            <mesh position={[inward * 0.055, 0.86, 0]}>
              <boxGeometry args={[0.012, 1.44, 0.7]} />
              <meshStandardMaterial color="#f4e5c4" metalness={0.2} roughness={0.55} />
            </mesh>
            <Html center position={[inward * 0.2, 1.86, 0]} style={{ pointerEvents: 'none' }}>
              <span className="rounded bg-[#ffb020] px-1.5 py-0.5 text-[9px] font-bold text-[#17181c] shadow">EXIT</span>
            </Html>
          </group>
        )
      })}

      {exits.length > 1 && (
        <group position={[project.toMx(exits[1].x + exits[1].w / 2) - 0.28, 0, project.toZ(exits[1].y + exits[1].h / 2) + 0.5]}>
          <RoundedBox args={[0.34, 0.07, 0.3]} radius={0.02} smoothness={2} position={[0, 0.06, 0]}>
            <meshStandardMaterial color="#8d8a83" metalness={0.3} roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[0.34, 0.07, 0.24]} radius={0.02} smoothness={2} position={[0, 0.17, 0.25]}>
            <meshStandardMaterial color="#8d8a83" metalness={0.3} roughness={0.5} />
          </RoundedBox>
        </group>
      )}
    </group>
  )
}

function Seat({ placement, status, interactive, onClick }: {
  placement: BusSeatDef
  status: SeatStatus
  interactive: boolean
  onClick: () => void
}) {
  const { gl } = useThree()
  const [hovered, setHovered] = useState(false)
  const color = STATUS_COLOR[status]
  const width = placement.width ?? 0.4
  const texture = useMemo(() => makeSeatTexture(placement.label, status), [placement.label, status])

  useEffect(() => () => {
    texture.dispose()
    gl.domElement.style.cursor = ''
  }, [texture, gl])

  return (
    <group
      position={[placement.mx ?? 0, hovered && interactive ? 0.07 : 0, placement.z ?? 0]}
      onClick={(event) => { event.stopPropagation(); if (interactive) onClick() }}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (!interactive) return
        setHovered(true)
        gl.domElement.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        gl.domElement.style.cursor = ''
      }}
    >
      <mesh position={[0, 0.16, 0.01]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.22, 10]} />
        <meshStandardMaterial color="#3b3d44" metalness={0.6} roughness={0.35} />
      </mesh>
      <RoundedBox args={[width * 0.92, 0.09, 0.38]} radius={0.03} smoothness={2} position={[0, 0.07, 0]} castShadow>
        <meshStandardMaterial color="#2b2d33" metalness={0.25} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[width, 0.14, 0.44]} radius={0.05} smoothness={3} position={[0, 0.3, -0.02]} castShadow receiveShadow>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={status === 'SELECTED' ? 0.34 : hovered && interactive ? 0.26 : 0.07} roughness={0.72} metalness={0.04} />
      </RoundedBox>
      <RoundedBox args={[width * 1.02, 0.58, 0.14]} radius={0.05} smoothness={3} position={[0, 0.66, 0.2]} rotation={[-0.08, 0, 0]} castShadow>
        <meshStandardMaterial color="#24262b" metalness={0.2} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[width * 0.86, 0.46, 0.07]} radius={0.04} smoothness={3} position={[0, 0.67, 0.12]} rotation={[-0.08, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={status === 'SELECTED' ? 0.26 : 0.05} roughness={0.75} />
      </RoundedBox>
      <RoundedBox args={[width * 0.64, 0.16, 0.13]} radius={0.045} smoothness={3} position={[0, 1.02, 0.21]} castShadow>
        <meshStandardMaterial color="#2b2d33" metalness={0.22} roughness={0.5} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.045, 0.05, 0.3]} radius={0.018} smoothness={2} position={[side * width * 0.56, 0.43, -0.04]}>
          <meshStandardMaterial color="#26282d" metalness={0.35} roughness={0.45} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.374, -0.07]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.17, 0.11]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

function Scene({ model, seats, statuses, onSeatClick, preset, roof, controls, disabled, canInteract }: {
  model: ResolvedBusLayout
  seats: PublicSeat[]
  statuses: Map<string, SeatStatus>
  onSeatClick: (seat: PublicSeat) => void
  preset: Preset
  roof: boolean
  controls: React.RefObject<any>
  disabled: boolean
  canInteract?: (seat: PublicSeat) => boolean
}) {
  const project = useMemo(() => cabinProjection(model), [model])
  const placements = useMemo(() => new Map(model.seats.map((placement) => [placement.label, placement])), [model])
  const scale = model.cabin.length / 11.9
  const target = useMemo<Position3D>(() => [0, 0.85 * scale, 0], [scale])

  return (
    <>
      <color attach="background" args={['#0f1115']} />
      <fog attach="fog" args={['#0f1115', 13 * scale, 36 * scale]} />
      <hemisphereLight args={['#eaf2ff', '#2c2b2f', 1.35]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[6 * scale, 11 * scale, 7 * scale]} intensity={1.55} color="#fff5e2" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.00015} />
      <directionalLight position={[-7 * scale, 6 * scale, -6 * scale]} intensity={0.55} color="#9ec4ff" />
      <pointLight position={[0, 3.2 * scale, 0]} intensity={0.6} color="#ffdca6" distance={18 * scale} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.17, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>

      <CabinShell model={model} roof={roof} />
      <Fixtures model={model} project={project} />
      {seats.map((seat) => {
        const placement = placements.get(seat.label)
        if (!placement) return null
        const status = statuses.get(seat.id) ?? seat.state
        return (
          <Seat
            key={seat.id}
            placement={placement}
            status={status}
            interactive={!disabled && (status === 'AVAILABLE' || status === 'SELECTED') && canInteract?.(seat) !== false}
            onClick={() => onSeatClick(seat)}
          />
        )
      })}

      <CameraRig preset={preset} scale={scale} target={target} controls={controls} />
      <OrbitControls
        ref={controls}
        target={target}
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        minDistance={3.2 * scale}
        maxDistance={26 * scale}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.05}
      />
    </>
  )
}

export default function BusSeatMap3D({
  bus, selectedSeats, onSeatClick, className, disabled = false, maxSelectable = 1, canInteract,
}: {
  bus: PublicBus
  selectedSeats: string[]
  onSeatClick: (seat: PublicSeat) => void
  className?: string
  disabled?: boolean
  maxSelectable?: number
  canInteract?: (seat: PublicSeat) => boolean
}) {
  const model = useMemo(() => resolveBusLayout(bus.layout), [bus.layout])
  const statuses = useMemo(() => {
    const map = new Map<string, SeatStatus>()
    const selected = new Set(selectedSeats)
    for (const seat of bus.seats) map.set(seat.id, selected.has(seat.id) ? 'SELECTED' : seat.state)
    return map
  }, [bus.seats, selectedSeats])

  const [preset, setPreset] = useState<Preset>('iso')
  const [roof, setRoof] = useState(false)
  const controls = useRef<any>(null)
  const scale = model.cabin.length / 11.9
  const cameraPosition = useMemo<Position3D>(() => [
    PRESET_POSITIONS.iso[0] * scale, PRESET_POSITIONS.iso[1] * scale, PRESET_POSITIONS.iso[2] * scale,
  ], [scale])

  const handleSeatClick = (seat: PublicSeat) => {
    if (disabled) return
    const isSelected = selectedSeats.includes(seat.id)
    if (!isSelected && selectedSeats.length >= maxSelectable) return
    onSeatClick(seat)
  }

  return (
    <div className={`tkt3d ${className ?? ''}`}>
      <div className="relative h-[430px] w-full overflow-hidden rounded-lg border border-line-soft bg-[#0f1115] sm:h-[480px]" role="img" aria-label="Interactive 3D coach cabin. Use the 2D map for keyboard seat selection.">
        <Canvas
          shadows
          dpr={[1, 1.4]}
          frameloop="demand"
          camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 120 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Scene
              model={model}
              seats={bus.seats}
              statuses={statuses}
              onSeatClick={handleSeatClick}
              preset={preset}
              roof={roof}
              controls={controls}
              disabled={disabled}
              canInteract={canInteract}
            />
          </Suspense>
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="pointer-events-auto rounded-lg border border-[#ffb020]/40 bg-[#111317]/85 px-3 py-2 backdrop-blur">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#ffb020]">{model.modelCode} · 3D CABIN</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#f6f2e8]">{model.name}</p>
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-end gap-1">
            {(['iso', 'top', 'front', 'side'] as Preset[]).map((item) => (
              <button key={item} type="button" aria-pressed={preset === item} onClick={() => setPreset(item)}
                className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${preset === item ? 'border-[#ffb020] bg-[#ffb020] text-[#111317]' : 'border-[#ffffff25] bg-[#111317]/80 text-[#d8d4cc] hover:border-[#ffb020]/60'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
          <div className="pointer-events-auto flex gap-1">
            <button type="button" aria-pressed={roof} onClick={() => setRoof((value) => !value)}
              className={`rounded border px-2 py-1 text-[10px] font-semibold ${roof ? 'border-[#ffb020] bg-[#ffb020] text-[#111317]' : 'border-[#ffffff25] bg-[#111317]/80 text-[#d8d4cc]'}`}>
              Roof: {roof ? 'on' : 'off'}
            </button>
            <button type="button" onClick={() => { setPreset('iso'); setRoof(false) }}
              className="rounded border border-[#ffffff25] bg-[#111317]/80 px-2 py-1 text-[10px] font-semibold text-[#d8d4cc]">
              Reset view
            </button>
          </div>
          <p className="rounded bg-[#111317]/70 px-2 py-1 text-[10px] text-[#cfcbc2]">Drag to orbit · Scroll to zoom · Click a seat to select</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-ink-3">
        {(['SELECTED', 'AVAILABLE', 'HELD', 'RESERVED', 'UNAVAILABLE'] as SeatStatus[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm border" style={{ background: `${STATUS_COLOR[status]}33`, borderColor: STATUS_COLOR[status] }} />
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        ))}
        <span className="ml-auto font-mono text-[10px]">{model.seats.length} seats · 2D map supports keyboard selection</span>
      </div>
    </div>
  )
}
