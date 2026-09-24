import { useMemo } from 'react'
import * as THREE from 'three'
import { M } from '../scene/materials'
import { GROUND_Y } from '../scene/constants'
import { walkieFacade } from '../textures/outside'

/**
 * 20 Fenchurch Street — the Walkie-Talkie — the nearest tower, straight out
 * the glass.
 *
 * Top-heavy on purpose: the two long faces lean out as they climb, so the
 * building is wider at the Sky Garden than at the street. `w` is the width at
 * the base; the crown flares to `top`. The real one is taller than this; it
 * is pulled in so the flare and the lit garden sit where a desk can see them.
 */
export const WALKIE_TALKIE = { x: -10, z: -215, w: 84, top: 136, d: 64, h: 340 } as const

/** Height of the glass Sky Garden at the crown. */
const GARDEN = 34

/** Half-width of the long faces at height `y`: slow at first, then flaring. */
function halfWidth(y: number) {
  const { w, top, h } = WALKIE_TALKIE
  const t = Math.min(1, Math.max(0, y / h))
  return w / 2 + ((top - w) / 2) * Math.pow(t, 1.7)
}

/** The front elevation from `y0` to `y1`, as a shape to extrude through the depth. */
function elevation(y0: number, y1: number) {
  const s = new THREE.Shape()
  const steps = 24
  s.moveTo(-halfWidth(y0), y0)
  for (let i = 1; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps
    s.lineTo(-halfWidth(y), y)
  }
  for (let i = steps; i >= 0; i--) {
    const y = y0 + ((y1 - y0) * i) / steps
    s.lineTo(halfWidth(y), y)
  }
  s.closePath()
  return s
}

// three 0.175 drops the caps when bevelEnabled is false; a zero-size bevel keeps them.
const EXTRUDE = { bevelEnabled: true, bevelThickness: 0, bevelSize: 0, bevelOffset: 0, bevelSegments: 1 }

export function WalkieTalkie() {
  const { x: TX, z: TZ, d: TD, h: TH } = WALKIE_TALKIE

  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(elevation(0, TH - GARDEN), { depth: TD, ...EXTRUDE })
    g.translate(0, 0, -TD / 2)
    return g
  }, [TD, TH])

  const garden = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(elevation(TH - GARDEN, TH), { depth: TD, ...EXTRUDE })
    g.translate(0, 0, -TD / 2)
    return g
  }, [TD, TH])

  /** The glass roof over the garden: low at the front, high at the back. */
  const roof = useMemo(() => {
    const rise = 26
    const s = new THREE.Shape()
    s.moveTo(-TD / 2, 0)
    s.lineTo(TD / 2, 0)
    s.lineTo(-TD / 2, rise)
    s.closePath()
    const span = halfWidth(TH) * 2
    const g = new THREE.ExtrudeGeometry(s, { depth: span, ...EXTRUDE })
    // shape is drawn in z-y; turn it so the extrusion runs along x
    g.rotateY(Math.PI / 2)
    g.translate(-span / 2, TH, 0)
    return g
  }, [TD, TH])

  const facade = useMemo(() => {
    const fac = walkieFacade()
    fac.wrapS = fac.wrapT = THREE.RepeatWrapping
    // extrusion UVs are in feet, so one tile every 16 ft
    fac.repeat.set(1 / 16, 1 / 16)
    return new THREE.MeshStandardMaterial({
      map: fac,
      color: 0xdfe6ee,
      roughness: 0.22,
      metalness: 0.55,
    })
  }, [])

  const gardenGlass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xbfd6c8,
        emissive: 0xffd9a0,
        emissiveIntensity: 0.55,
        roughness: 0.15,
        metalness: 0.3,
      }),
    [],
  )
  const roofGlass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x9fb7c9,
        emissive: 0x7fa6c4,
        emissiveIntensity: 0.25,
        roughness: 0.1,
        metalness: 0.6,
      }),
    [],
  )
  const podium = useMemo(() => M(0xb9b4a8, { roughness: 0.8 }), [])

  return (
    <group position={[TX, GROUND_Y, TZ]}>
      <mesh geometry={body} material={facade} />
      <mesh geometry={garden} material={gardenGlass} />
      <mesh geometry={roof} material={roofGlass} />

      {/* the street-level podium, narrower than everything above it */}
      <mesh position={[0, 12, 0]} material={podium}>
        <boxGeometry args={[WALKIE_TALKIE.w + 10, 24, TD + 12]} />
      </mesh>

      {/* aviation light on the high corner of the roof */}
      <mesh position={[halfWidth(TH) - 4, TH + 24, -TD / 2 + 4]}>
        <sphereGeometry args={[1.4, 8, 6]} />
        <meshStandardMaterial color={0} emissive={0xff2020} emissiveIntensity={3} />
      </mesh>
    </group>
  )
}
