import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { useOpenable } from '../lib/registry'
import { useOffice } from '../state/store'
import {
  DOOR_W, H, HALF, LIFT_BAY, LIFT_CX, LOBBY, LOBBY_CX, LOBBY_DOOR, LOBBY_WIN, RESTROOMS,
  candela,
} from '../scene/constants'
import {
  secureSignTex, terrazzoTex, wagonCanvasTex, wagonPlateTex, wayfindingTex,
} from '../textures/lobby'
import { Box, Collider, Panel } from './props/primitives'
import { Elevator } from './Elevator'
import { BuildingPlaque, GatekeeperPortrait } from './WallArt'

const { x0, x1, z1 } = LOBBY
const DEPTH = z1 - HALF
const WIDTH = x1 - x0
const BAY_D = LIFT_BAY.z1 - z1
const BAY_W = LIFT_BAY.x1 - LIFT_BAY.x0

/** Wainscot cap height, which is also the window sill height. */
const WAIN = 2.4

/**
 * A door in a wall that does not open.
 *
 * The restrooms and the two badge-only rooms are all dressed the same way —
 * frame, leaf, hardware, sign — because from this side that is all they are.
 * Press space at one and she says why not, taking the lines in turn.
 *
 * Built facing +Z and turned by `ry`, so the same door serves the south wall
 * and both returns of the lift bay. `signSide` puts the sign on the other
 * hand where the wall runs out on that side.
 */
function ClosedDoor({
  x,
  z,
  ry,
  sign,
  signSize,
  reader,
  push,
  signSide = 1,
  lines = [],
}: {
  x: number
  z: number
  ry: number
  sign: THREE.Texture
  signSize: [number, number]
  /** Card reader beside the handle. */
  reader?: boolean
  /** Push plate rather than a lever, as restrooms have. */
  push?: boolean
  /** Which side of the frame the sign hangs on. */
  signSide?: 1 | -1
  /** What she says when you try it. */
  lines?: string[]
}) {
  const hit = useRef<THREE.Mesh>(null)
  const said = useRef(0)
  const showHint = useOffice((s) => s.showHint)
  useOpenable(hit, () => {
    if (!lines.length) return
    showHint(lines[said.current++ % lines.length], 2600)
  })

  const leafMat = useMemo(() => M(0x6b5a45, { roughness: 0.55 }), [])
  const frameMat = useMemo(() => M(0x4c4f55, { roughness: 0.5, metalness: 0.4 }), [])
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: sign, roughness: 0.4 }),
    [sign],
  )
  const readerBody = useMemo(() => M(0x1e2126, { roughness: 0.4 }), [])
  const readerLed = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff3b30, emissiveIntensity: 2.4 }),
    [],
  )

  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* frame */}
      <Box size={[3.9, 7.4, 0.14]} material={frameMat} position={[0, 3.7, 0]} cast={false} />
      {/* leaf */}
      <Box size={[3.4, 7.0, 0.1]} material={leafMat} position={[0, 3.5, 0.08]} cast={false} />
      {/* hardware */}
      {push ? (
        <Box size={[0.5, 3.0, 0.06]} material={mat.steel} position={[1.2, 3.6, 0.15]} cast={false} />
      ) : (
        <mesh position={[1.2, 3.4, 0.16]} rotation={[0, 0, Math.PI / 2]} material={mat.steel}>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 10]} />
        </mesh>
      )}
      {/* kick plate */}
      <Box size={[3.3, 1.0, 0.06]} material={mat.steel} position={[0, 0.6, 0.14]} cast={false} />
      {/* what space aims at: the leaf, a little proud of it */}
      <mesh ref={hit} position={[0, 3.5, 0.1]} visible={false}>
        <boxGeometry args={[3.4, 7.0, 0.3]} />
      </mesh>

      <Panel size={signSize} material={signMat} position={[signSide * 2.4, 5.0, 0.2]} />

      {reader && (
        <group position={[signSide * 2.5, 3.9, 0.2]}>
          <mesh material={readerBody}>
            <boxGeometry args={[0.45, 0.7, 0.12]} />
          </mesh>
          <mesh position={[0, 0.18, 0.07]} material={readerLed}>
            <circleGeometry args={[0.05, 12]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/**
 * Wall-hung stainless drinking fountain, in the west return of the lift bay.
 *
 * Bottle filler above, bubbler below, and the little green counter that claims
 * it has saved eleven thousand plastic bottles. Built against a wall on its
 * local +X and turned into place; the collider is stated in world terms
 * because it is registered outside the scene graph.
 */
export function WaterFountain({
  x,
  z,
  ry,
  collide,
}: {
  x: number
  z: number
  ry: number
  collide: [number, number, number, number]
}) {
  const steel = useMemo(() => M(0xb6bac0, { roughness: 0.28, metalness: 0.85 }), [])
  const darkSteel = useMemo(() => M(0x70757c, { roughness: 0.4, metalness: 0.7 }), [])
  const chrome = useMemo(() => M(0xd2d6dc, { roughness: 0.16, metalness: 0.95 }), [])
  /* The well is seen from inside as well as out, so both faces are drawn. */
  const basinMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xc0c4ca,
        roughness: 0.22,
        metalness: 0.9,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const drainMat = useMemo(() => M(0x2a2d31, { roughness: 0.6, metalness: 0.4 }), [])
  const counterMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0a1a10,
        emissive: 0x2ad17a,
        emissiveIntensity: 1.6,
      }),
    [],
  )

  /*
    The deck, with the basin let into it.

    This is the whole difference between a drinking fountain and a grey box:
    the top has a hole in it. A rectangle with an elliptical hole triangulates
    flat, the well hangs under the hole, and you look down into a basin rather
    than at a ring sat on a lid.
  */
  const deckGeo = useMemo(() => {
    const deck = new THREE.Shape()
    deck.moveTo(-0.56, -1.0)
    deck.lineTo(0.56, -1.0)
    deck.lineTo(0.56, 1.0)
    deck.lineTo(-0.56, 1.0)
    deck.closePath()
    const well = new THREE.Path()
    well.absellipse(-0.05, 0, 0.36, 0.66, 0, Math.PI * 2, false, 0)
    deck.holes.push(well)
    return new THREE.ShapeGeometry(deck, 20)
  }, [])

  return (
    <>
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        {/* bottle filler cabinet, and the bay you stand the bottle in */}
        <Box size={[0.85, 2.0, 1.5] } material={steel} position={[-0.42, 4.45, 0]} />
        <Box size={[0.44, 0.85, 1.0]} material={darkSteel} position={[-0.96, 4.15, 0]} cast={false} />
        <mesh position={[-0.72, 4.46, 0]} material={chrome}>
          <cylinderGeometry args={[0.045, 0.045, 0.22, 10]} />
        </mesh>
        {/* the sensor eye, and the counter that claims eleven thousand bottles */}
        <mesh position={[-0.85, 4.62, 0]} rotation={[0, -Math.PI / 2, 0]} material={drainMat}>
          <circleGeometry args={[0.05, 12]} />
        </mesh>
        <mesh position={[-0.86, 5.05, 0]} rotation={[0, -Math.PI / 2, 0]} material={counterMat}>
          <planeGeometry args={[0.7, 0.22]} />
        </mesh>

        {/* the cabinet under the deck, and the trap shroud hanging off it */}
        <Box size={[1.05, 1.1, 1.9]} material={steel} position={[-0.55, 2.52, 0]} />
        <Box size={[0.7, 0.5, 1.2]} material={steel} position={[-0.44, 1.72, 0]} cast={false} />

        {/* the deck, its rolled edge, and the well under the hole */}
        <mesh
          position={[-0.55, 3.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={steel}
          geometry={deckGeo}
        />
        <Box size={[0.07, 0.11, 2.0]} material={steel} position={[-1.075, 3.05, 0]} cast={false} />
        {[-1, 1].map((s) => (
          <Box
            key={s}
            size={[1.12, 0.11, 0.07]}
            material={steel}
            position={[-0.55, 3.05, s * 0.965]}
            cast={false}
          />
        ))}
        <mesh position={[-0.6, 2.89, 0]} scale={[0.36, 1, 0.66]} material={basinMat}>
          <cylinderGeometry args={[1, 0.82, 0.42, 26, 1, true]} />
        </mesh>
        <mesh
          position={[-0.6, 2.68, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.295, 0.54, 1]}
          material={basinMat}
        >
          <circleGeometry args={[1, 26]} />
        </mesh>
        <mesh position={[-0.6, 2.687, 0]} rotation={[-Math.PI / 2, 0, 0]} material={drainMat}>
          <circleGeometry args={[0.1, 14]} />
        </mesh>

        {/* bubbler at the back of the basin: stem, angled nozzle, guard */}
        <mesh position={[-0.28, 3.22, 0]} material={chrome}>
          <cylinderGeometry args={[0.05, 0.06, 0.26, 12]} />
        </mesh>
        <mesh position={[-0.36, 3.33, 0]} rotation={[0, 0, -0.7]} material={chrome}>
          <cylinderGeometry args={[0.035, 0.035, 0.24, 10]} />
        </mesh>
        <mesh position={[-0.36, 3.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={chrome}>
          <torusGeometry args={[0.09, 0.018, 6, 14, Math.PI]} />
        </mesh>

        {/* push bar, standing off the front on two pegs */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[-1.13, 3.02, s * 0.42]} rotation={[0, 0, Math.PI / 2]} material={darkSteel}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          </mesh>
        ))}
        <Box size={[0.08, 0.1, 1.06]} material={darkSteel} position={[-1.19, 3.02, 0]} cast={false} />
      </group>
      <Collider minX={collide[0]} maxX={collide[1]} minZ={collide[2]} maxZ={collide[3]} />
    </>
  )
}

/**
 * The window on the end wall of the west arm.
 *
 * Knee wall, sill, mullions on about three-and-a-half-foot centres, transom
 * bar, head — the same recipe as the suite's north wall, laid out along Z on
 * the x = RX0 plane. The wainscot carries across the face of the knee wall
 * and dies into the sill, so the band round the lobby is unbroken.
 */
function EndWindow() {
  const wallMat = useMemo(() => M(0xdedbd2, { roughness: 0.9 }), [])
  const wainscotMat = useMemo(() => M(0x5c5348, { roughness: 0.7 }), [])
  const frameMat = useMemo(() => M(0x4c4f55, { roughness: 0.45, metalness: 0.5 }), [])

  const a = LOBBY_WIN.z0
  const b = LOBBY_WIN.z1
  const len = b - a
  const cz = (a + b) / 2
  const bays = Math.max(2, Math.round(len / 3.5))
  const glassH = H - WAIN - 0.9

  return (
    <>
      <Box size={[0.5, WAIN, len]} material={wallMat} position={[x0 + 0.25, WAIN / 2, cz]} />
      <Box
        size={[0.2, WAIN, DEPTH]}
        material={wainscotMat}
        position={[x0 + 0.6, WAIN / 2, (HALF + z1) / 2]}
        cast={false}
      />
      <Box size={[0.9, 0.15, len]} material={mat.laminate} position={[x0 + 0.45, WAIN + 0.07, cz]} cast={false} />
      <Box size={[0.5, 0.9, len]} material={wallMat} position={[x0 + 0.25, H - 0.45, cz]} />

      {Array.from({ length: bays + 1 }, (_, i) => (
        <Box
          key={i}
          size={[0.32, glassH, 0.32]}
          material={frameMat}
          position={[x0 + 0.2, WAIN + glassH / 2, a + (i * len) / bays]}
        />
      ))}
      <Box
        size={[0.3, 0.18, len]}
        material={frameMat}
        position={[x0 + 0.2, WAIN + glassH * 0.6, cz]}
        cast={false}
      />

      <mesh
        position={[x0 + 0.2, WAIN + glassH / 2, cz]}
        rotation={[0, Math.PI / 2, 0]}
        material={mat.glass}
      >
        <planeGeometry args={[len, glassH]} />
      </mesh>
    </>
  )
}

/**
 * The British food cart, parked against the window at the end of the hall.
 *
 * A full Conestoga — twelve feet of box, iron-tyred wheels taller than the
 * knee wall, and a canvas bonnet on six bows. The plate says fish and chips
 * since 1938, and it has stood there long enough that nobody in the building
 * has thought to ask how it got up twenty-three floors, or onto an island
 * with no roads.
 */
function BritishFoodCart({ x, z, ry }: { x: number; z: number; ry: number }) {
  const boxWood = useMemo(() => M(0x7c5a34, { roughness: 0.85 }), [])
  const trimWood = useMemo(() => M(0x5d4225, { roughness: 0.85 }), [])
  const spokeWood = useMemo(() => M(0xc0a274, { roughness: 0.8 }), [])
  const iron = useMemo(() => M(0x33363b, { roughness: 0.55, metalness: 0.45 }), [])
  const canvasMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: wagonCanvasTex(),
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const shade = useMemo(() => M(0x6f6552, { roughness: 1, side: THREE.DoubleSide }), [])
  const cord = useMemo(() => M(0xbfae8a, { roughness: 0.9 }), [])
  const plate = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wagonPlateTex(), roughness: 0.4, metalness: 0.5 }),
    [],
  )

  /*
    Nine feet of box on a four-and-a-half foot track, which is a small
    Conestoga and the biggest thing that fits a twelve-foot corridor with
    room to walk past it. It parks along the hall, not across it.
  */
  const L = 9
  const W = 3.4
  const BED = 2.5
  const SIDE = 1.2
  const RW_ = 1.9
  const FW = 1.35
  const BOWS = 6
  const HOOP = W / 2 + 0.15
  const TRACK = W + 1.1

  /**
   * One wheel: felloe, hub and twelve spokes.
   *
   * Built lying in its own XY plane — where a torus already lies and where a
   * spoke rotated about Z stays in the rim — then stood up on the axle by the
   * group. Spinning the finished wheel about Z instead left the rim upright
   * and fanned the spokes out flat, like a star on the floor.
   */
  const Wheel = ({ r, wx, wz }: { r: number; wx: number; wz: number }) => (
    <group position={[wx, r, wz]} rotation={[0, Math.PI / 2, 0]}>
      <mesh material={iron}>
        <torusGeometry args={[r, 0.075, 8, 26]} />
      </mesh>
      <mesh material={trimWood}>
        <torusGeometry args={[r - 0.12, 0.085, 8, 26]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={trimWood}>
        <cylinderGeometry args={[0.19, 0.19, 0.42, 12]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 6]} material={spokeWood}>
          <boxGeometry args={[0.075, (r - 0.16) * 2, 0.13]} />
        </mesh>
      ))}
    </group>
  )

  return (
    <>
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        {/* the box: floor, two sides raked out, and the end gates */}
        <Box size={[W, 0.16, L]} material={boxWood} position={[0, BED, 0]} />
        {[-1, 1].map((sx) => (
          <group key={sx} position={[(sx * W) / 2, BED + SIDE / 2, 0]} rotation={[0, 0, sx * -0.13]}>
            <Box size={[0.16, SIDE, L]} material={boxWood} position={[0, 0, 0]} />
            <Box size={[0.2, 0.16, L]} material={trimWood} position={[0, SIDE / 2, 0]} cast={false} />
            <Box size={[0.2, 0.14, L]} material={trimWood} position={[0, -SIDE / 4, 0]} cast={false} />
          </group>
        ))}
        {[-1, 1].map((sz) => (
          <Box
            key={sz}
            size={[W - 0.1, SIDE, 0.16]}
            material={boxWood}
            position={[0, BED + SIDE / 2, (sz * L) / 2]}
          />
        ))}
        {/* iron strapping down the sides */}
        {Array.from({ length: 5 }, (_, i) => (
          <Box
            key={i}
            size={[W + 0.3, 0.09, 0.09]}
            material={iron}
            position={[0, BED + 0.35, -L / 2 + 1.1 + i * 1.7]}
            cast={false}
          />
        ))}

        {/*
          The bonnet.

          Skin over the bows, the bows showing through it as ribs, and each end
          closed by a half-disc gathered onto a drawstring — which is what a
          bonnet is. The first pass left the half cylinder open at both ends
          and capped it with hemispheres, so from the end it read as a sail.
        */}
        <mesh
          position={[0, BED + SIDE - 0.1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={canvasMat}
        >
          <cylinderGeometry args={[HOOP, HOOP, L - 0.5, 26, 1, true, 0, Math.PI]} />
        </mesh>
        {Array.from({ length: BOWS }, (_, i) => {
          const bz = -L / 2 + 0.5 + (i * (L - 1.0)) / (BOWS - 1)
          return (
            <mesh
              key={i}
              position={[0, BED + SIDE - 0.1, bz]}
              rotation={[Math.PI / 2, 0, 0]}
              material={canvasMat}
            >
              <torusGeometry args={[HOOP + 0.02, 0.05, 6, 24, Math.PI]} />
            </mesh>
          )
        })}
        {[-1, 1].map((sz) => (
          <group key={sz} position={[0, BED + SIDE - 0.1, (sz * (L - 0.5)) / 2]}>
            {/* the end panel, then the mouth it is drawn in to */}
            <mesh rotation={[0, sz < 0 ? Math.PI : 0, 0]} material={canvasMat}>
              <circleGeometry args={[HOOP, 26, 0, Math.PI]} />
            </mesh>
            <mesh position={[0, 0.42, sz * 0.02]} material={shade}>
              <circleGeometry args={[0.42, 18]} />
            </mesh>
            <mesh position={[0, 0.42, sz * 0.03]} rotation={[0, 0, 0]} material={cord}>
              <torusGeometry args={[0.44, 0.035, 6, 20]} />
            </mesh>
            {/* the gathers, radiating off the drawstring */}
            {Array.from({ length: 9 }, (_, i) => {
              const a = Math.PI * (0.06 + (i / 8) * 0.88)
              return (
                <mesh
                  key={i}
                  position={[Math.cos(a) * 0.9, 0.42 + Math.sin(a) * 0.9, sz * 0.015]}
                  rotation={[0, 0, a - Math.PI / 2]}
                  material={shade}
                >
                  <boxGeometry args={[0.04, 0.95, 0.01]} />
                </mesh>
              )
            })}
          </group>
        ))}

        {/* running gear: axles, four wheels, and the tongue on the floor */}
        {(
          [
            [RW_, (L - 3.0) / 2],
            [FW, -(L - 3.0) / 2],
          ] as const
        ).map(([r, az]) => (
          <group key={az}>
            <mesh position={[0, r, az]} rotation={[0, 0, Math.PI / 2]} material={iron}>
              <cylinderGeometry args={[0.12, 0.12, TRACK, 10]} />
            </mesh>
            <Wheel r={r} wx={-TRACK / 2} wz={az} />
            <Wheel r={r} wx={TRACK / 2} wz={az} />
          </group>
        ))}
        {/*
          The tongue is unhitched and laid along the side, which is how a
          parked wagon sits and the only way this one fits a twelve foot
          corridor: hitched, it needed another five feet in front of it.
        */}
        <group position={[TRACK / 2 + 0.55, 0, 0.4]} rotation={[0, 0.05, 0.06]}>
          <mesh position={[0, 0.18, 0]} material={trimWood}>
            <boxGeometry args={[0.2, 0.2, 5.0]} />
          </mesh>
          <Box
            size={[2.6, 0.14, 0.14]}
            material={trimWood}
            position={[0, 0.18, -2.4]}
            cast={false}
          />
        </group>
      </group>

      {/*
        The plate, on a stand in front of the wagon rather than on the wall
        behind it — where it was, the wagon was standing in front of its own
        label and you walked past both without reading either.
      */}
      <group position={[x + TRACK / 2 + 3.1, 0, z - 0.4]} rotation={[0, Math.PI / 2, 0]}>
        {[-0.62, 0.62].map((ox) => (
          <mesh key={ox} position={[ox, 1.35, 0]} material={iron}>
            <cylinderGeometry args={[0.05, 0.06, 2.7, 10]} />
          </mesh>
        ))}
        <mesh position={[0, 0.04, 0]} material={iron}>
          <boxGeometry args={[1.7, 0.08, 0.7]} />
        </mesh>
        <group position={[0, 2.75, 0.16]} rotation={[-0.62, 0, 0]}>
          <Box size={[2.1, 0.85, 0.07]} material={iron} position={[0, 0, 0]} />
          <Panel size={[1.9, 0.68]} material={plate} position={[0, 0, 0.045]} />
        </group>
      </group>
      <Collider
        minX={x - TRACK / 2 - 0.4}
        maxX={x + TRACK / 2 + 1.3}
        minZ={z - L / 2 - 0.4}
        maxZ={z + L / 2 + 0.4}
      />
      <Collider
        minX={x + TRACK / 2 + 2.5}
        maxX={x + TRACK / 2 + 3.7}
        minZ={z - 1.4}
        maxZ={z + 0.6}
      />
    </>
  )
}

/**
 * The lift lobby, floor 23.
 *
 * Building common area rather than suite: terrazzo underfoot, its own flat
 * ceiling, and 64 ft of corridor along the south side of the floor. The lift
 * sits in a bay bumped out of the middle, restrooms and the fountain hang off
 * its returns, and everything either side of it is glass.
 */
export function LiftLobby() {
  /*
    The terrazzo is a 2 ft square with brass strips drawn into it, so the
    repeat has to be stated per surface — a plane's UVs are 0..1 whatever its
    size, and the corridor and the lift bay are nothing like the same shape.
  */
  const floorFor = (w: number, d: number) => {
    const t = terrazzoTex().clone()
    t.needsUpdate = true
    t.repeat.set(w / 2, d / 2)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.05 })
  }
  const corridorFloor = useMemo(() => floorFor(WIDTH, DEPTH), [])
  const bayFloor = useMemo(() => floorFor(BAY_W, BAY_D), [])

  /*
    The ceiling casts. Nothing else in the building's ceilings does — the suite
    is meant to read as daylit — but this is a core corridor with one window,
    and with the roof letting the sun through every wainscot and door frame
    threw a long grey rectangle across the terrazzo.
  */
  const ceilMat = useMemo(
    () => M(0xefece4, { roughness: 0.95, shadowSide: THREE.DoubleSide }),
    [],
  )
  const wallMat = useMemo(
    () => M(0xdedbd2, { roughness: 0.9, shadowSide: THREE.DoubleSide }),
    [],
  )
  const wainscot = useMemo(() => M(0x5c5348, { roughness: 0.7 }), [])
  /*
    Draws nothing, casts everything. Stood in the suite opening so the sun
    cannot come through it either — the suite's ceiling lets the sun in, and
    from there it was coming sideways into the corridor under this roof.
  */
  const shadowOnly = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        shadowSide: THREE.DoubleSide,
      }),
    [],
  )
  const lensMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xf2f5ff,
        emissiveIntensity: 1.15,
        roughness: 0.35,
      }),
    [],
  )
  // Facing +Z: read from the lobby, walking back. Facing -Z: read on the way out.
  const wayReturning = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wayfindingTex('returning'), roughness: 0.5 }),
    [],
  )
  const wayLeaving = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wayfindingTex('leaving'), roughness: 0.5 }),
    [],
  )

  const suiteSign = useMemo(() => secureSignTex('SUITE 2310', 'Fiscal Services'), [])
  const mdfSign = useMemo(() => secureSignTex('TELECOM MDF', 'Room 23-A'), [])

  const midZ = (HALF + z1) / 2
  const bayMidZ = (z1 + LIFT_BAY.z1) / 2

  /**
   * Solid stretches of the south wall: everything but the mouth of the bay
   * and the two restroom doorways on the east arm.
   */
  const piers: Array<[number, number]> = [
    [x0, LIFT_BAY.x0],
    [LIFT_BAY.x1, RESTROOMS.women.door - DOOR_W / 2],
    [RESTROOMS.women.door + DOOR_W / 2, RESTROOMS.men.door - DOOR_W / 2],
    [RESTROOMS.men.door + DOOR_W / 2, x1],
  ]

  return (
    <>
      {/* floor and ceiling, corridor and lift bay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LOBBY_CX, 0.005, midZ]} material={corridorFloor} receiveShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[LOBBY_CX, H, midZ]} material={ceilMat} castShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LIFT_CX, 0.005, bayMidZ]} material={bayFloor} receiveShadow>
        <planeGeometry args={[BAY_W, BAY_D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[LIFT_CX, H, bayMidZ]} material={ceilMat} castShadow>
        <planeGeometry args={[BAY_W, BAY_D]} />
      </mesh>

      {/* the suite wall from the lobby side, either side of the opening */}
      {(
        [
          [(x0 + LOBBY_DOOR.x0) / 2, LOBBY_DOOR.x0 - x0],
          [(LOBBY_DOOR.x1 + x1) / 2, x1 - LOBBY_DOOR.x1],
        ] as const
      ).map(([cx, len], i) => (
        <group key={i}>
          <mesh position={[cx, H / 2, HALF]} material={wallMat} receiveShadow castShadow>
            <planeGeometry args={[len, H]} />
          </mesh>
          {/*
            Stood 0.02 off the wall. At HALF + 0.1 the box's back face sat on
            the very plane the suite paints its own side of this wall on, and
            the whole band came out striped from the carpet side.
          */}
          <Box size={[len, WAIN, 0.2]} material={wainscot} position={[cx, WAIN / 2, HALF + 0.12]} cast={false} />
        </group>
      ))}

      <mesh
        position={[(LOBBY_DOOR.x0 + LOBBY_DOOR.x1) / 2, H / 2, HALF]}
        material={shadowOnly}
        castShadow
      >
        <planeGeometry args={[LOBBY_DOOR.x1 - LOBBY_DOOR.x0, H]} />
      </mesh>

      {/* the two ends of the corridor: the east is a wall, the west a window */}
      <mesh position={[x1, H / 2, midZ]} rotation={[0, -Math.PI / 2, 0]} material={wallMat} receiveShadow>
        <planeGeometry args={[DEPTH, H]} />
      </mesh>
      <Box size={[0.2, WAIN, DEPTH]} material={wainscot} position={[x1 - 0.1, WAIN / 2, midZ]} cast={false} />
      {[
        [HALF, LOBBY_WIN.z0],
        [LOBBY_WIN.z1, z1],
      ].map(([a, b]) => (
        <Box
          key={a}
          size={[0.5, H, b - a]}
          material={wallMat}
          position={[x0 + 0.25, H / 2, (a + b) / 2]}
        />
      ))}
      <EndWindow />

      {/* south elevation, solid either side of the lift bay */}
      {piers.map(([a, b], i) => (
        <group key={i}>
          <Box
            size={[b - a, H, 0.3]}
            material={wallMat}
            position={[(a + b) / 2, H / 2, z1 + 0.15]}
            cast={false}
          />
          <Box
            size={[b - a, WAIN, 0.2]}
            material={wainscot}
            position={[(a + b) / 2, WAIN / 2, z1 - 0.12]}
            cast={false}
          />
        </group>
      ))}
      {piers.map(([a, b]) => (
        <Collider key={a} minX={a} maxX={b} minZ={z1 - 0.4} maxZ={z1 + 0.4} />
      ))}

      {/*
        The lift bay, built solid.

        Its three walls were single-sided planes facing into the bay, so from
        the corridor you looked straight through the outside of the bay and
        out the far side of the building. Boxes, plus a slab over and under,
        close it off from every angle you can reach.
      */}
      {(
        [
          [LIFT_BAY.x0, -0.15, 0.1],
          [LIFT_BAY.x1, 0.15, -0.1],
        ] as const
      ).map(([x, out, wn]) => (
        <group key={x}>
          {/*
            The side walls start at the pier's back face, not on its lobby
            face: flush with it, the 0.3 of wall the two shared came out
            striped at each corner of the mouth, and anything short of the
            back face put a strip of the pier's end on the bay's inner face.
            The wainscot butts the pier's wainscot at its back face, so the
            band turns the corner without a seam.
          */}
          <Box
            size={[0.3, H, BAY_D]}
            material={wallMat}
            position={[x + out, H / 2, bayMidZ + 0.3]}
            cast={false}
          />
          <Box
            size={[0.2, WAIN, LIFT_BAY.z1 - (z1 - 0.02)]}
            material={wainscot}
            position={[x + wn, WAIN / 2, (z1 - 0.02 + LIFT_BAY.z1) / 2]}
            cast={false}
          />
          <Collider minX={x - 0.4} maxX={x + 0.4} minZ={z1} maxZ={LIFT_BAY.z1} />
        </group>
      ))}
      {/*
        South wall of the bay: a pier either side of the lift opening, and a
        header over it. The piers run 0.02 past the bay's side walls rather
        than dying on them — flush, the outside corner of the bay flickered.
      */}
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[(BAY_W + 0.64) / 2 - 3.5, H, 0.3]}
          material={wallMat}
          position={[LIFT_CX + s * (3.5 + ((BAY_W + 0.64) / 2 - 3.5) / 2), H / 2, LIFT_BAY.z1 + 0.15]}
          cast={false}
        />
      ))}
      <Box
        size={[7, H - 7.2, 0.3]}
        material={wallMat}
        position={[LIFT_CX, 7.2 + (H - 7.2) / 2, LIFT_BAY.z1 + 0.15]}
        cast={false}
      />
      {/* 0.05 clear of the bay ceiling: on H its underside shared that plane and striped it */}
      <Box
        size={[BAY_W + 0.6, 0.3, BAY_D + 0.3]}
        material={wallMat}
        position={[LIFT_CX, H + 0.2, bayMidZ + 0.15]}
        cast={false}
      />
      <Box
        size={[BAY_W + 0.6, 0.3, BAY_D + 0.3]}
        material={wallMat}
        position={[LIFT_CX, -0.3, bayMidZ + 0.15]}
        cast={false}
      />

      {/*
        Seven recessed fixtures down the corridor, and one over the lift.

        Only four of the seven are lit. A point light is a shader permutation
        for every material in the building, so they alternate and the emissive
        lens carries the rest.
      */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = x0 + 5 + (i * (WIDTH - 10)) / 6
        return (
          <group key={i}>
            <mesh position={[x, H - 0.06, midZ]} material={lensMat}>
              <boxGeometry args={[3.4, 0.12, 1.8]} />
            </mesh>
            {i % 2 === 0 && (
              <pointLight
                position={[x, H - 0.6, midZ]}
                color={0xf6f7ff}
                intensity={candela(0.7)}
                distance={40}
                decay={2}
              />
            )}
          </group>
        )
      })}
      <mesh position={[LIFT_CX, H - 0.06, bayMidZ]} material={lensMat}>
        <boxGeometry args={[3.4, 0.12, 1.8]} />
      </mesh>
      <pointLight
        position={[LIFT_CX, H - 0.6, bayMidZ]}
        color={0xf6f7ff}
        intensity={candela(0.7)}
        distance={40}
        decay={2}
      />

      {/* hung wayfinding sign, just inside the opening */}
      {/* hung clear of the opening's header, which it used to overlap */}
      <Panel
        size={[3.5, 0.92]}
        material={wayReturning}
        position={[(LOBBY_DOOR.x0 + LOBBY_DOOR.x1) / 2, 7.05, HALF + 1.4]}
      />
      <Panel
        size={[3.5, 0.92]}
        material={wayLeaving}
        position={[(LOBBY_DOOR.x0 + LOBBY_DOOR.x1) / 2, 7.05, HALF + 1.45]}
        rotation={[0, Math.PI, 0]}
      />
      {/*
        Rods from the top edge of the sign to the ceiling. At 1.6 ft centred
        on 7.2 they ran from the middle of the sign face up through the slab.
      */}
      {[-1.5, 1.5].map((ox) => (
        <mesh
          key={ox}
          position={[(LOBBY_DOOR.x0 + LOBBY_DOOR.x1) / 2 + ox, (7.51 + H) / 2, HALF + 1.42]}
          material={mat.steel}
        >
          <cylinderGeometry args={[0.02, 0.02, H - 7.51, 6]} />
        </mesh>
      ))}

      {/*
        The two badge-only doors. Fiscal Services is past the restrooms on the
        east arm; the telecom room is on the west arm, beside the wagon, so
        that end of the corridor has something on it besides glass.

        The restrooms are real rooms now and their doors live with them, in
        Restrooms.tsx. They used to be split around the lift bay with the
        restrooms on its returns, which put a urinal against 250 ft of glass.
      */}
      {(
        [
          [x1 - 3.0, suiteSign, [1.1, 0.77], true, [
            'Fiscal Services. Badge only, and not this badge.',
          ]],
          [x0 + 11, mdfSign, [1.1, 0.77], true, [
            'Telecom. Badge only. Something in there is humming.',
          ]],
        ] as Array<[number, THREE.Texture, [number, number], boolean, string[]]>
      ).map(([x, sign, signSize, reader, lines]) => (
        <ClosedDoor
          key={x}
          x={x}
          z={z1 - 0.1}
          ry={Math.PI}
          sign={sign}
          signSize={signSize}
          reader={reader}
          push={!reader}
          lines={lines}
        />
      ))}

      {/* the fountain and the Gatekeeper, one on each return of the bay */}
      <WaterFountain
        x={LIFT_BAY.x0 + 0.18}
        z={z1 + 4.0}
        ry={Math.PI}
        collide={[LIFT_BAY.x0, LIFT_BAY.x0 + 1.6, z1 + 2.8, z1 + 5.2]}
      />
      <GatekeeperPortrait
        position={[LIFT_BAY.x1 - 0.26, 5.0, z1 + 4.0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <BuildingPlaque position={[19.6, 5.4, HALF + 0.22]} rotation={[0, 0, 0]} />

      {/* broadside to the window, tongue unhitched down its east side */}
      <BritishFoodCart x={x0 + 3.6} z={HALF + 6.0} ry={0.04} />

      <Elevator floor="23" />
    </>
  )
}
