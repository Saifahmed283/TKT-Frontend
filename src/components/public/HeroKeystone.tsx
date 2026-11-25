import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function StaticEmblem() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 240 240" className="h-[min(430px,38vw)] w-[min(430px,38vw)] overflow-visible opacity-90">
        <defs>
          <linearGradient id="tktHeroStaticGold" gradientUnits="userSpaceOnUse" x1="36" y1="36" x2="204" y2="204">
            <stop offset="0%" stopColor="#C8A25C" /><stop offset="50%" stopColor="#E8D08B" /><stop offset="100%" stopColor="#C8A25C" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r="94" fill="none" stroke="url(#tktHeroStaticGold)" strokeWidth="2.6" />
        <circle cx="120" cy="120" r="84" fill="none" stroke="url(#tktHeroStaticGold)" strokeWidth="1.2" />
        <g stroke="url(#tktHeroStaticGold)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1="120" y1="67" x2="120" y2="173" /><line x1="82" y1="67" x2="158" y2="67" /><line x1="82" y1="173" x2="158" y2="173" /><line x1="82" y1="90" x2="158" y2="150" /><line x1="82" y1="150" x2="158" y2="90" />
        </g>
      </svg>
    </div>
  )
}

export default function HeroKeystone() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 9.2)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      })
    } catch {
      setReduced(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.7
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    container.appendChild(renderer.domElement)
    const onContextLost = (event: Event) => {
      event.preventDefault()
      setReduced(true)
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    scene.add(new THREE.AmbientLight(0xfff8e1, 1.0))
    const keyLight = new THREE.PointLight(0xfff6d5, 3.8, 30)
    keyLight.position.set(5, 5, 6)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0xffffff, 2.4, 30)
    rimLight.position.set(-6, -3, 5)
    scene.add(rimLight)
    const backLight = new THREE.PointLight(0xf0dca0, 2.8, 26)
    backLight.position.set(0, 4, -6)
    scene.add(backLight)
    const fillLight = new THREE.PointLight(0xf5e4b0, 1.8, 24)
    fillLight.position.set(2, -2, 5)
    scene.add(fillLight)

    const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xe8d08b, emissive: 0xb8954a, emissiveIntensity: 0.18, metalness: 0.72, roughness: 0.32 })
    const paleGoldMaterial = new THREE.MeshStandardMaterial({ color: 0xf0dcaa, emissive: 0xc4a458, emissiveIntensity: 0.16, metalness: 0.76, roughness: 0.28 })
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.18 })
    const geometries = new Set<THREE.BufferGeometry>()
    const trackGeometry = <T extends THREE.BufferGeometry>(geometry: T): T => {
      geometries.add(geometry)
      return geometry
    }

    const sealGroup = new THREE.Group()
    scene.add(sealGroup)

    function createPillBar(length: number, radius: number, zDepth: number) {
      const group = new THREE.Group()
      const cylMesh = new THREE.Mesh(trackGeometry(new THREE.CylinderGeometry(radius, radius, length, 24)), paleGoldMaterial)
      const capGeo = trackGeometry(new THREE.SphereGeometry(radius, 20, 20))
      const topCap = new THREE.Mesh(capGeo, paleGoldMaterial)
      topCap.position.y = length / 2
      const botCap = new THREE.Mesh(capGeo, paleGoldMaterial)
      botCap.position.y = -length / 2
      group.add(cylMesh, topCap, botCap)

      const edgeGeo = trackGeometry(new THREE.CylinderGeometry(radius * 1.005, radius * 1.005, length, 20, 1, true))
      const edge = new THREE.LineSegments(trackGeometry(new THREE.EdgesGeometry(edgeGeo, 24)), edgeMat)
      group.add(edge)

      group.scale.z = zDepth
      return group
    }

    sealGroup.add(createPillBar(2.12, 0.095, 1.1))
    const topBar = createPillBar(1.52, 0.095, 1.1)
    topBar.rotation.z = Math.PI / 2
    topBar.position.y = 1.06
    sealGroup.add(topBar)
    const botBar = createPillBar(1.52, 0.095, 1.1)
    botBar.rotation.z = Math.PI / 2
    botBar.position.y = -1.06
    sealGroup.add(botBar)

    const kAngle = Math.atan2(76, 60)
    const kLen = Math.hypot(1.52, 1.2)
    const diag1 = createPillBar(kLen, 0.095, 1.1)
    diag1.rotation.z = kAngle
    const diag2 = createPillBar(kLen, 0.095, 1.1)
    diag2.rotation.z = -kAngle
    sealGroup.add(diag1, diag2)

    const innerRingGeo = trackGeometry(new THREE.TorusGeometry(1.74, 0.016, 16, 120))
    const outerRingGeo = trackGeometry(new THREE.TorusGeometry(1.94, 0.036, 16, 120))
    const innerRing = new THREE.Mesh(innerRingGeo, goldMaterial)
    const outerRing = new THREE.Mesh(outerRingGeo, paleGoldMaterial)
    sealGroup.add(innerRing, outerRing)
    sealGroup.add(new THREE.LineSegments(trackGeometry(new THREE.EdgesGeometry(innerRingGeo, 20)), edgeMat))
    sealGroup.add(new THREE.LineSegments(trackGeometry(new THREE.EdgesGeometry(outerRingGeo, 20)), edgeMat))

    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = 256
    shadowCanvas.height = 256
    const sctx = shadowCanvas.getContext('2d')
    if (sctx) {
      const g = sctx.createRadialGradient(128, 128, 20, 128, 128, 118)
      g.addColorStop(0, 'rgba(0,0,0,0.28)')
      g.addColorStop(0.5, 'rgba(0,0,0,0.12)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      sctx.fillStyle = g
      sctx.fillRect(0, 0, 256, 256)
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas)
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.75, depthWrite: false })
    const shadowPlane = new THREE.Mesh(trackGeometry(new THREE.PlaneGeometry(5.8, 2.4)), shadowMat)
    shadowPlane.position.set(0.18, -2.55, -1)
    shadowPlane.rotation.x = -0.1
    scene.add(shadowPlane)

    const haloOrbitGroup = new THREE.Group()
    const dotGeo = trackGeometry(new THREE.SphereGeometry(0.038, 16, 16))
    for (let i = 0; i < 36; i++) {
      const theta = ((i * 10 - 90) * Math.PI) / 180
      const sphere = new THREE.Mesh(dotGeo, paleGoldMaterial)
      sphere.position.set(Math.cos(theta) * 2.14, Math.sin(theta) * 2.14, 0)
      haloOrbitGroup.add(sphere)
    }
    sealGroup.add(haloOrbitGroup)

    let isDragging = false
    let prevX = 0
    let prevY = 0
    let targetRotY = -0.24
    let targetRotX = 0.08
    let raf = 0

    const size = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
      sealGroup.position.x = w > 900 ? 1.4 : w > 700 ? 0.8 : 0
      sealGroup.position.y = 0
      sealGroup.scale.setScalar(w < 900 ? 0.88 : 1)
      draw()
    }

    const onDown = (clientX: number, clientY: number) => { isDragging = true; prevX = clientX; prevY = clientY }
    const draw = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        sealGroup.rotation.y = targetRotY
        sealGroup.rotation.x = targetRotX
        renderer.render(scene, camera)
      })
    }

    const onMove = (clientX: number, clientY: number) => {
      if (!isDragging) return
      targetRotY += (clientX - prevX) * 0.007
      targetRotX += (clientY - prevY) * 0.007
      prevX = clientX
      prevY = clientY
      draw()
    }
    const onUp = () => { isDragging = false }

    const onMouseDown = (e: MouseEvent) => onDown(e.clientX, e.clientY)
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchStart = (e: TouchEvent) => { if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY) }
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY) }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMouseMove)
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    const ro = new ResizeObserver(size)
    ro.observe(container)
    size()

    draw()

    return () => {
      window.cancelAnimationFrame(raf)
      ro.disconnect()
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.dispose()
      renderer.forceContextLoss()
      geometries.forEach((geometry) => geometry.dispose())
      shadowTex.dispose()
      shadowMat.dispose()
      edgeMat.dispose()
      goldMaterial.dispose()
      paleGoldMaterial.dispose()
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={containerRef} className="pointer-events-auto absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing" aria-label="Interactive 3D TKT Keystone Sculpture">
      {reduced ? <StaticEmblem /> : null}
    </div>
  )
}