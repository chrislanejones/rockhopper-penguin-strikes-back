import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { B2, BOOTH_TONGUE } from '../../scene/b2'
import { boothButtonTex, lightboardTex, soundboardTex } from '../../textures/b2'
import { corridorSignTex } from '../../textures/signage'
import { live, useOffice } from '../../state/store'
import { useClickable } from '../../lib/registry'
import { Box, Collider, Panel } from '../props/primitives'

const { balcony } = B2
/** The booth floor is the balcony. */
const Y = balcony.y
/**
 * The footprint: the balcony's middle prong, out over the floor, east of
 * the bridge landing (x 6..20) so the way in from the lift and the stairs
 * stays clear. The counter is at the tip, hanging over the hall; the west
 * side is left open at the back, and that is the cut you walk in through.
 */
const BOOTH = {
  x0: BOOTH_TONGUE.x0,
  x1: BOOTH_TONGUE.x1,
  z0: BOOTH_TONGUE.z0,
  /** Just past the back arm's edge: the booth is the tongue, not the whole arm. */
  z1: B2.hall.z1 - balcony.back + 0.4,
}
/** Counter height at the front. The sides are the tongue's own parapets. */
const RAIL_H = 3.5
/** Colliders up here only count up here. */
const UP = Y - 2

/** One of the two big pucks. Pressing it is the whole job. */
function CurtainButton({
  x,
  z,
  label,
  colour,
  target,
}: {
  x: number
  z: number
  label: string
  colour: string
  target: 0 | 1
}) {
  const ref = useRef<THREE.Mesh>(null)
  const body = useMemo(
    () => M(target ? 0x2c7a3a : 0x8f2626, { roughness: 0.4, metalness: 0.2 }),
    [target],
  )
  const cap = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: boothButtonTex(label, colour),
        transparent: true,
        roughness: 0.45,
      }),
    [label, colour],
  )
  const showHint = useOffice((s) => s.showHint)

  useClickable(ref, () => {
    if (live.curtainTarget === target && Math.abs(live.curtain - target) < 0.01) {
      return showHint(target ? 'The traveler is open.' : 'The traveler is closed.', 2000)
    }
    live.curtainTarget = target
    showHint(target ? 'The traveler draws open.' : 'The traveler closes across the stage.', 2600)
  })

  return (
    <group position={[x, Y + 3.5, z]}>
      <mesh ref={ref} material={body}>
        <cylinderGeometry args={[0.6, 0.65, 0.3, 20]} />
      </mesh>
      <Panel size={[1.1, 1.1]} material={cap} position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  )
}

/**
 * The A/V booth, let into the balcony's back arm.
 *
 * Twelve feet wide, counter to the front, half walls to the sides, and the
 * walk-in cut at the back of the west side. Three stations, left to right
 * as the operators face the stage: the soundboard, the light board, and the
 * curtain desk — two pucks the size of coasters, because the curtain desk
 * is the only one whose job is real. Sound and lights are set the way they
 * should be; the boards are not taking notes.
 */
export function Booth() {
  const plaster = useMemo(() => M(0xd6cbb0, { roughness: 0.9 }), [])
  const gilt = useMemo(() => M(0xb8912e, { roughness: 0.35, metalness: 0.75 }), [])
  const desk = useMemo(() => M(0x2b2d31, { roughness: 0.6 }), [])
  const sound = useMemo(
    () => new THREE.MeshStandardMaterial({ map: soundboardTex(), roughness: 0.6 }),
    [],
  )
  const lights = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: lightboardTex(),
        emissive: 0xffffff,
        emissiveMap: lightboardTex(),
        emissiveIntensity: 0.35,
        roughness: 0.6,
      }),
    [],
  )
  const signFor = (label: string) =>
    new THREE.MeshStandardMaterial({ map: corridorSignTex(label), roughness: 0.6 })
  const signs = useMemo(
    () => [signFor('SOUND'), signFor('LIGHTS'), signFor('CURTAIN')],
    [],
  )

  const cx = (BOOTH.x0 + BOOTH.x1) / 2

  return (
    <>
      {/* the counter across the front, gilt-capped like every other edge up here */}
      <Box size={[BOOTH.x1 - BOOTH.x0, RAIL_H, 0.4]} material={plaster} position={[cx, Y + RAIL_H / 2, BOOTH.z0 + 0.2]} cast={false} />
      <Box size={[BOOTH.x1 - BOOTH.x0 + 0.2, 0.14, 0.5]} material={gilt} position={[cx, Y + RAIL_H + 0.07, BOOTH.z0 + 0.2]} cast={false} />
      <Collider minX={BOOTH.x0} maxX={BOOTH.x1} minZ={BOOTH.z0} maxZ={BOOTH.z0 + 0.4} above={UP} />


      {/* the three stations, left to right as the operators stand: sound, lights, curtain */}
      {(
        [
          { x: 28.2, panel: sound },
          { x: 32, panel: lights },
        ] as const
      ).map(({ x, panel }, i) => (
        <group key={x}>
          <Box size={[3.6, 2.4, 1.6]} material={desk} position={[x, Y + 1.2, BOOTH.z0 + 1.6]} cast={false} />
          <Panel size={[3.4, 1.7]} material={panel} position={[x, Y + 2.75, BOOTH.z0 + 1.75]} rotation={[-1.15, 0, 0]} />
          <Panel size={[1.5, 0.42]} material={signs[i]} position={[x, Y + 1.9, BOOTH.z0 + 2.42]} />
          <Collider minX={x - 1.8} maxX={x + 1.8} minZ={BOOTH.z0 + 0.8} maxZ={BOOTH.z0 + 2.4} above={UP} />
        </group>
      ))}

      {/* the curtain desk: a pedestal and two pucks you could not miss with a tray in each hand */}
      <Box size={[3.2, 3.2, 1.8]} material={desk} position={[35.8, Y + 1.6, BOOTH.z0 + 1.7]} cast={false} />
      <Box size={[3.4, 0.15, 2.0]} material={desk} position={[35.8, Y + 3.28, BOOTH.z0 + 1.7]} cast={false} />
      <Panel size={[1.5, 0.42]} material={signs[2]} position={[35.8, Y + 2.2, BOOTH.z0 + 2.62]} />
      <CurtainButton x={35.0} z={BOOTH.z0 + 1.7} label="OPEN" colour="#2c7a3a" target={1} />
      <CurtainButton x={36.6} z={BOOTH.z0 + 1.7} label="CLOSE" colour="#8f2626" target={0} />
      <Collider minX={34.1} maxX={37.5} minZ={BOOTH.z0 + 0.8} maxZ={BOOTH.z0 + 2.6} above={UP} />
    </>
  )
}
