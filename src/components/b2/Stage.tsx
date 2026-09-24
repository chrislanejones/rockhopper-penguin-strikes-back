import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M, mat } from '../../scene/materials'
import { candela } from '../../scene/constants'
import { B2, B2_CX } from '../../scene/b2'
import { lowerThirdTex, podiumPlateTex, stageFloorTex, velvetTex } from '../../textures/b2'
import { parliamentFlagTex } from '../../textures/island'
import { live, stirShadows } from '../../state/store'
import { Box, Collider, Panel } from '../props/primitives'
import { Flag } from '../Flag'
import { Truss } from './Truss'
import { Broadcast, FEED, onBroadcast } from './Broadcast'

const { stage, hall } = B2
const SW = stage.x1 - stage.x0
const SD = stage.z1 - stage.z0
const SH = stage.h
const CX = B2_CX
const SZ = (stage.z0 + stage.z1) / 2
/** Where the proscenium stands: the front edge of the platform. */
const FRONT = stage.z1
/** The screen: 16:9, most of the width of the stage, its bottom clear of a speaker's head. */
const SCREEN_W = Math.round(SW * 0.72)
const SCREEN_H = SCREEN_W * (9 / 16)
const SCREEN_Y = SH + 2.5 + SCREEN_H / 2
/** The podium stands here, down front. */
const PODIUM_Z = FRONT - 2.4
/**
 * The backdrop, in plan:  __ ----------- __
 * A short leg of curtain at each side, and the long traveler six feet
 * behind the podium. The screen stays on the back wall behind it all,
 * out of sight until someone opens the traveler.
 */
const DRAPE_Z = PODIUM_Z - 6
const LEG_Z = PODIUM_Z - 3
const DRAPE_H = hall.h - 2 - SH

/**
 * The stage, and everything on it.
 *
 * A platform across the north end with a proscenium in front of it —
 * columns, a header, the curtains drawn back to the sides and a valance
 * over — then a velvet backdrop across the stage, legs at each side, and
 * behind it all, on the back wall, the screen: closed off until the
 * traveler opens. A podium down front, house left, with a microphone.
 * Steps at each front corner, which she looks at and does not use — the
 * way up is through the wings, which the Theatre builds.
 */
export function Stage() {
  const boards = useMemo(
    () => new THREE.MeshStandardMaterial({ map: stageFloorTex(), roughness: 0.75 }),
    [],
  )
  const skirt = useMemo(() => M(0x1f1714, { roughness: 0.95 }), [])
  const velvet = useMemo(
    () => new THREE.MeshStandardMaterial({ map: velvetTex(), roughness: 0.95 }),
    [],
  )
  const fringe = useMemo(() => M(0xc9a24a, { roughness: 0.5, metalness: 0.4 }), [])
  const proscenium = useMemo(() => M(0x3a1216, { roughness: 0.85 }), [])
  const gilt = useMemo(() => M(0xb8912e, { roughness: 0.35, metalness: 0.75 }), [])
  const wood = useMemo(() => M(0x3b2a20, { roughness: 0.55 }), [])
  const frame = useMemo(() => M(0x0b0c0e, { roughness: 0.6 }), [])
  // the programme feed, lit by itself
  const screen = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: FEED.texture,
        emissive: 0xffffff,
        emissiveMap: FEED.texture,
        emissiveIntensity: 1.25,
        roughness: 0.7,
      }),
    [],
  )
  const strap = useMemo(
    () => new THREE.MeshBasicMaterial({ map: lowerThirdTex(), transparent: true, depthWrite: false }),
    [],
  )
  const plate = useMemo(
    () => new THREE.MeshStandardMaterial({ map: podiumPlateTex(), roughness: 0.5 }),
    [],
  )
  const grille = useMemo(() => M(0x2b2b2e, { roughness: 0.8 }), [])

  /*
    The traveler answers the booth. `live.curtain` eases toward whatever the
    pucks last asked for — about four seconds across — and each pleat slides
    from its closed spot toward its side's bunch, thinning as it goes, the
    way drawn fabric stacks against the legs.
  */
  const pleats = useRef<Array<THREE.Mesh | null>>([])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const d = live.curtainTarget - live.curtain
    if (d !== 0) {
      live.curtain += Math.sign(d) * Math.min(Math.abs(d), dt / 4)
      stirShadows()
    }
    const t = live.curtain
    pleats.current.forEach((m, k) => {
      if (!m) return
      const closed = stage.x0 + 4 + k * 4
      const open = k < 5 ? stage.x0 + 0.9 + k * 0.75 : stage.x1 - 0.9 - (9 - k) * 0.75
      m.position.x = closed + (open - closed) * t
      m.scale.x = 1 - 0.72 * t
    })
  })

  return (
    <>
      {/* the platform and its boards; the lip blocks the hall floor but lets her step off the front */}
      <group ref={onBroadcast}>
        <Box size={[SW, SH, SD]} material={skirt} position={[CX, SH / 2, SZ]} cast={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, SH + 0.005, SZ]} material={boards}>
          <planeGeometry args={[SW, SD]} />
        </mesh>
      </group>
      <Collider minX={stage.x0} maxX={stage.x1} minZ={FRONT - 0.5} maxZ={FRONT} below={SH - 1.2} />
      {/*
        Flags at the front corners, on the hall floor before each column: the
        Parliament's on the speaker's right, the island's on the left. Three stub steps stood here that climbed toward a column and
        met nothing; the way up is through the wings.
      */}
      <Flag x={stage.x0 - 1.4} z={FRONT + 1.6} tex={parliamentFlagTex()} ry={Math.PI} />
      <Flag x={stage.x1 + 1.4} z={FRONT + 1.6} ry={Math.PI} />

      {/* proscenium: two columns, a header, gilt where the eye lands */}
      {[stage.x0 - 1.3, stage.x1 + 1.3].map((x) => (
        <group key={x}>
          <Box size={[2.6, hall.h - 2, 1.6]} material={proscenium} position={[x, (hall.h - 2) / 2, FRONT - 0.2]} cast={false} collide />
          <Box size={[2.9, 0.6, 1.9]} material={gilt} position={[x, 0.3, FRONT - 0.2]} cast={false} />
          <Box size={[2.9, 0.6, 1.9]} material={gilt} position={[x, hall.h - 2.3, FRONT - 0.2]} cast={false} />
        </group>
      ))}
      <Box size={[SW + 5.2, 2.6, 1.6]} material={proscenium} position={[CX, hall.h - 1.3, FRONT - 0.2]} cast={false} />
      <Box size={[SW + 5.2, 0.35, 1.9]} material={gilt} position={[CX, hall.h - 2.75, FRONT - 0.2]} cast={false} />

      {/* curtains drawn to the sides, gathered in three folds, and the valance over */}
      {[stage.x0 + 2.4, stage.x1 - 2.4].map((x) => (
        <group key={x}>
          {[-1.4, 0, 1.4].map((ox, i) => (
            <Box
              key={ox}
              size={[1.6, hall.h - 5.5, 0.9 + (i % 2) * 0.4]}
              material={velvet}
              position={[x + ox, SH + (hall.h - 5.5) / 2, FRONT - 1.4]}
              cast={false}
            />
          ))}
        </group>
      ))}
      <Box size={[SW, 2.4, 0.9]} material={velvet} position={[CX, hall.h - 4.2, FRONT - 1.4]} cast={false} />
      <Box size={[SW, 0.3, 0.95]} material={fringe} position={[CX, hall.h - 5.5, FRONT - 1.4]} cast={false} />

      {/* the backdrop traveler: broad pleats the booth can draw — they slide to the sides and bunch */}
      {Array.from({ length: 10 }, (_, k) => (
        <mesh
          key={k}
          ref={(m) => {
            pleats.current[k] = m
            onBroadcast(m)
          }}
          position={[stage.x0 + 4 + k * 4, SH + DRAPE_H / 2, DRAPE_Z]}
          material={velvet}
        >
          <boxGeometry args={[4, DRAPE_H, 0.9 + (k % 2) * 0.5]} />
        </mesh>
      ))}
      <group ref={onBroadcast}>
        {[stage.x0, stage.x1].map((edge, side) =>
          [1, 3, 5].map((d, i) => (
            <Box
              key={`${side}:${d}`}
              size={[2, DRAPE_H, 0.9 + (i % 2) * 0.5]}
              material={velvet}
              position={[side === 0 ? edge + d : edge - d, SH + DRAPE_H / 2, LEG_Z]}
              cast={false}
            />
          )),
        )}
      </group>

      {/* the screen, on the back wall of the stage, behind the traveler: the feed, with the strap over it */}
      <Box size={[SCREEN_W + 1.2, SCREEN_H + 1.2, 0.4]} material={frame} position={[CX, SCREEN_Y, stage.z0 + 0.5]} cast={false} />
      <Panel size={[SCREEN_W, SCREEN_H]} material={screen} position={[CX, SCREEN_Y, stage.z0 + 0.75]} />
      <Panel size={[SCREEN_W, SCREEN_H]} material={strap} position={[CX, SCREEN_Y, stage.z0 + 0.77]} />

      {/* the cameras on the floor, and the feed they make */}
      <Broadcast />

      {/* the podium, house left, with the mic on it */}
      <group ref={onBroadcast} position={[stage.x0 + 7.5, SH, PODIUM_Z]}>
        <Box size={[2.2, 3.7, 1.5]} material={wood} position={[0, 1.85, 0]} cast={false} />
        <Box size={[2.4, 0.16, 1.7]} material={wood} position={[0, 3.78, 0]} rotation={[-0.22, 0, 0]} cast={false} />
        <Panel size={[1.6, 0.66]} material={plate} position={[0, 2.2, 0.77]} />
        <mesh position={[0.35, 3.9, 0.25]} material={mat.black}>
          <cylinderGeometry args={[0.12, 0.14, 0.06, 12]} />
        </mesh>
        <mesh position={[0.35, 4.6, 0.02]} rotation={[0.45, 0, 0]} material={mat.steel}>
          <cylinderGeometry args={[0.025, 0.025, 1.5, 8]} />
        </mesh>
        <mesh position={[0.35, 5.28, -0.31]} rotation={[0.45, 0, 0]} material={mat.black}>
          <capsuleGeometry args={[0.1, 0.22, 4, 10]} />
        </mesh>
      </group>

      {/* two floor monitors along the front lip */}
      {[stage.x0 + 11, stage.x1 - 8].map((x) => (
        <Box key={x} size={[1.7, 0.95, 1.2]} material={grille} position={[x, SH + 0.47, FRONT - 0.9]} rotation={[-0.35, 0, 0]} cast={false} />
      ))}

      {/* the rig over the front of the house */}
      <Truss />

      {/* stage wash: warm lights inside the proscenium, above the valance — the brightest thing in a darkened house */}
      {[CX - 13, CX, CX + 13].map((x) => (
        <pointLight
          key={x}
          ref={onBroadcast}
          position={[x, hall.h - 3.2, FRONT - 3.5]}
          color={0xffe0b8}
          intensity={candela(1.9, 10)}
          distance={40}
          decay={2}
        />
      ))}
    </>
  )
}
