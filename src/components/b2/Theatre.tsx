import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { L, candela } from '../../scene/constants'
import { ARCH_RISE, B2, B2_CX, BOX_WALLS, GALLERY, WELL, WINGS } from '../../scene/b2'
import { exitTex, lowerThirdTex, theatreCarpetTex } from '../../textures/b2'
import { FEED, onBroadcast } from './Broadcast'
import { useOpenable } from '../../lib/registry'
import { useOffice } from '../../state/store'
import { Box, Collider, Panel } from '../props/primitives'
import { Chandeliers } from './Chandeliers'

const { hall, doors, balcony, boxes, stage, wings } = B2
/** The gallery ceiling, where the plain wall starts again over the well. */
const GALLERY_TOP = balcony.y + Math.max(...ARCH_RISE) + boxes.headroom
const W = hall.x1 - hall.x0
const D = hall.z1 - hall.z0
const CX = (hall.x0 + hall.x1) / 2
const CZ = (hall.z0 + hall.z1) / 2
const HT = hall.h
/**
 * The back wall in three bands. At floor level it is solid but for the two
 * door openings; at balcony level it is solid but for the opening the
 * mezzanine bridge runs through; above that it is just wall.
 */
const BAND = balcony.y
const LOWER_RUNS: Array<[number, number]> = [
  [hall.x0, doors[0].x0],
  [doors[0].x1, doors[1].x0],
  [doors[1].x1, hall.x1],
]
/**
 * At balcony level the wall parts in the same two places as below, for a
 * pair of doors each, straight over the pairs on the floor. It used to be
 * one fourteen-foot opening, and from the tables that was a lit rectangle
 * of lobby in the back wall of a dark hall.
 */
const BRIDGE_DOOR_H = 7.4
/**
 * The north wall parts twice a side: once for the stage house, once for the
 * door into each wing.
 */
const NORTH_RUNS: Array<[number, number]> = [
  [hall.x0 - 0.6, wings.doorways[0].x0],
  [wings.doorways[0].x1, stage.x0],
  [stage.x1, wings.doorways[1].x0],
  [wings.doorways[1].x1, hall.x1 + 0.6],
]
/** Mid-line of the wings and the wall band they share with the hall. */
const WING_CZ = (wings.z0 + hall.z0) / 2
const STAIR_CZ = (wings.stair.z0 + wings.stair.z1) / 2

/** Wainscot cap height. */
const WAIN = 3.0
/** Pilasters flank the stage end of each long wall; the boxes take the rest. */
const PILASTERS = [hall.z0 + 3]
/** The stair doorway in the wall over the well: this tall, `boxes.mouth` wide. */
const DOOR = 7
/** The side screens flank the proscenium on the stage wall, one each side. */
const TV_XS = [-30, 56]
const TV_W = 16
const TV_H = TV_W * (9 / 16)
const TV_Y = 12.5
/** The confidence monitor on the back wall: between the mezzanine door heads and the cornice. */
const MON_W = 9
const MON_H = MON_W * (9 / 16)
const MON_Y = 20

/** What she says at an exit door, in turn. */
const EXIT_LINES = [
  'Emergency exit. The alarm is real, and so is the stairwell.',
  'Alarm will sound. It says so. Twice.',
]

/**
 * A fire exit in the back wall: frame, leaf, panic bar, and the sign over
 * it. Space at it gets you the small print.
 */
function ExitDoor({
  x,
  frame,
  leaf,
  bar,
  sign,
}: {
  x: number
  frame: THREE.Material
  leaf: THREE.Material
  bar: THREE.Material
  sign: THREE.Material
}) {
  const hit = useRef<THREE.Mesh>(null)
  const said = useRef(0)
  const showHint = useOffice((s) => s.showHint)
  useOpenable(hit, () => showHint(EXIT_LINES[said.current++ % EXIT_LINES.length], 2800))
  const z = hall.z1 - 0.3
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
      <Box size={[3.9, 7.4, 0.14]} material={frame} position={[0, 3.7, 0]} cast={false} />
      <Box size={[3.4, 7.0, 0.1]} material={leaf} position={[0, 3.5, 0.08]} cast={false} />
      <Box size={[2.6, 0.14, 0.14]} material={bar} position={[0, 3.3, 0.2]} cast={false} />
      <Box size={[3.3, 1.0, 0.06]} material={frame} position={[0, 0.6, 0.14]} cast={false} />
      <mesh ref={hit} position={[0, 3.5, 0.1]} visible={false}>
        <boxGeometry args={[3.4, 7.0, 0.3]} />
      </mesh>
      {/* under the balcony slab, which starts at 7.2 */}
      <Panel size={[1.6, 0.6]} material={sign} position={[0, 6.7, 0.05]} />
    </group>
  )
}

/**
 * The door from the hall into a wing: wall over, jambs proud of the wall's
 * cut faces, a header, and a leaf on the hinge side that hangs shut until
 * she asks. It stood open into the hall before, and from the tables that
 * read as a hole in the wall with a staircase in it.
 *
 * The leaf is the full width of the opening and runs up into the header —
 * short of either, a shut door is a lit slot. The doorway blocks while it
 * is shut; open, the leaf swings into the hall and the way through is clear.
 */
function WingDoor({
  d,
  dir,
  plaster,
  wainscot,
}: {
  d: { x0: number; x1: number }
  /** Which way the wing lies: the leaf hangs on the stage side and swings from it. */
  dir: 1 | -1
  plaster: THREE.Material
  wainscot: THREE.Material
}) {
  const cx = (d.x0 + d.x1) / 2
  const w = d.x1 - d.x0
  const hinge = dir < 0 ? d.x1 : d.x0
  const [open, setOpen] = useState(false)
  const angle = useRef(0)
  const pivot = useRef<THREE.Group>(null)
  const hit = useRef<THREE.Mesh>(null)
  const showHint = useOffice((s) => s.showHint)

  useOpenable(hit, () => {
    const next = !open
    setOpen(next)
    showHint(next ? 'Backstage. Mind the steps down.' : 'Door shut.', 2000)
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = open ? 1.15 : 0
    angle.current += (target - angle.current) * Math.min(1, dt * 5)
    if (pivot.current) pivot.current.rotation.y = -dir * angle.current
  })

  return (
    <group>
      <Box size={[w + 0.4, HT - wings.doorH, 0.6]} material={plaster} position={[cx, wings.doorH + (HT - wings.doorH) / 2, hall.z0 - 0.3]} cast={false} />
      {[d.x0 - 0.18, d.x1 + 0.18].map((x) => (
        <Box key={x} size={[0.4, wings.doorH, 0.9]} material={wainscot} position={[x, wings.doorH / 2, hall.z0 - 0.3]} cast={false} collide />
      ))}
      <Box size={[w + 0.8, 0.5, 0.9]} material={wainscot} position={[cx, wings.doorH + 0.05, hall.z0 - 0.3]} cast={false} />
      <group ref={pivot} position={[hinge, 0, hall.z0 - 0.3]}>
        <Box size={[w, wings.doorH - 0.14, 0.15]} material={wainscot} position={[(dir * w) / 2, (wings.doorH - 0.14) / 2, 0]} cast={false} />
        <mesh ref={hit} position={[(dir * w) / 2, wings.doorH / 2, 0]} visible={false}>
          <boxGeometry args={[w, wings.doorH - 0.4, 0.6]} />
        </mesh>
      </group>
      {!open && <Collider minX={d.x0} maxX={d.x1} minZ={hall.z0 - 0.7} maxZ={hall.z0 + 0.1} />}
    </group>
  )
}

/**
 * A pair of doors at the end of the bridge, `BAND` feet up, over one of the
 * pairs below: jambs, header, two leaves hinged at the jambs that meet in
 * the middle and swing back onto the bridge. Space at them from either side.
 * Shut, they block the bridge; the floor below never notices them.
 */
function BridgeDoors({ d, wainscot }: { d: { x0: number; x1: number }; wainscot: THREE.Material }) {
  const { x0, x1 } = d
  const h = BRIDGE_DOOR_H
  const cx = (x0 + x1) / 2
  const w = (x1 - x0) / 2
  const [open, setOpen] = useState(false)
  const angle = useRef(0)
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const hit = useRef<THREE.Mesh>(null)
  const showHint = useOffice((s) => s.showHint)
  // raised panels a shade warmer than the stile, brass for the hardware, near-black for the meeting strip
  const panel = useMemo(() => M(0x5a3f2c, { roughness: 0.6 }), [])
  const brass = useMemo(() => M(0xb08d3c, { roughness: 0.35, metalness: 0.85 }), [])
  const astragal = useMemo(() => M(0x1a120e, { roughness: 0.7 }), [])

  useOpenable(hit, () => {
    const next = !open
    setOpen(next)
    showHint(next ? 'The balcony. Mind the dark.' : 'Doors shut.', 2000)
  })

  /*
    One leaf, hung on the pivot at its hinge and reaching `s` ways to the
    meeting edge: the slab, a tall panel over a short one on both faces, a
    pull bar and a brass kick plate on both faces. Every piece sits a
    hair into the slab rather than on its surface — flush, it would flicker.
    The left leaf carries the astragal, the strip that covers the join.
  */
  const leaf = (s: 1 | -1) => {
    const lw = w + 0.02
    const lh = h - 0.14
    const cx = (s * lw) / 2
    const pullX = s * (lw - 0.45)
    return (
      <>
        <Box size={[lw, lh, 0.15]} material={wainscot} position={[cx, lh / 2, 0]} cast={false} />
        {[-1, 1].map((f) => (
          <group key={f}>
            <Box size={[lw - 0.7, lh * 0.48, 0.03]} material={panel} position={[cx, lh * 0.64, f * 0.085]} cast={false} />
            <Box size={[lw - 0.7, lh * 0.2, 0.03]} material={panel} position={[cx, lh * 0.27, f * 0.085]} cast={false} />
            <Box size={[0.07, 1.4, 0.07]} material={brass} position={[pullX, 3.4, f * 0.12]} cast={false} />
            <Box size={[lw - 0.2, 0.8, 0.02]} material={brass} position={[cx, 0.5, f * 0.08]} cast={false} />
          </group>
        ))}
        {s > 0 && <Box size={[0.06, lh, 0.19]} material={astragal} position={[lw - 0.01, lh / 2, 0]} cast={false} />}
      </>
    )
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = open ? 1.3 : 0
    angle.current += (target - angle.current) * Math.min(1, dt * 5)
    // the leaves swing back onto the bridge (+Z), out of the hall: the left one turns one way, the right the other
    if (left.current) left.current.rotation.y = -angle.current
    if (right.current) right.current.rotation.y = angle.current
  })

  return (
    <group position={[0, BAND, hall.z1]}>
      {[x0 - 0.18, x1 + 0.18].map((x) => (
        <Box key={x} size={[0.4, h, 0.9]} material={wainscot} position={[x, h / 2, 0]} cast={false} />
      ))}
      <Box size={[x1 - x0 + 0.8, 0.5, 0.9]} material={wainscot} position={[cx, h + 0.05, 0]} cast={false} />
      {/* leaves run up into the header, and each is half the opening plus a hair so they meet */}
      <group ref={left} position={[x0, 0, 0]}>
        {leaf(1)}
      </group>
      <group ref={right} position={[x1, 0, 0]}>
        {leaf(-1)}
      </group>
      <mesh ref={hit} position={[cx, h / 2, 0]} visible={false}>
        <boxGeometry args={[x1 - x0, h - 0.4, 0.8]} />
      </mesh>
      {!open && <Collider minX={x0} maxX={x1} minZ={hall.z1 - 0.5} maxZ={hall.z1 + 0.5} above={BAND - 2} />}
    </group>
  )
}

/**
 * A long wall with the boxes let into it, from the balcony up: one solid
 * piece with three arched holes at their three heights, extruded to the
 * wall's thickness. Everything else about the wall is plain boxes.
 */
function useArchedBand() {
  return useMemo(() => {
    const y0 = balcony.y
    const y1 = hall.h
    const shape = new THREE.Shape()
    shape.moveTo(GALLERY.z0, y0)
    shape.lineTo(GALLERY.z1, y0)
    shape.lineTo(GALLERY.z1, y1)
    shape.lineTo(GALLERY.z0, y1)
    shape.closePath()
    boxes.arches.forEach((z0, k) => {
      const zc = z0 + boxes.width / 2
      const r = boxes.width / 2
      const sill = balcony.y + ARCH_RISE[k]
      const spring = sill + 4.5
      const hole = new THREE.Path()
      hole.moveTo(zc - r, sill)
      hole.lineTo(zc + r, sill)
      hole.lineTo(zc + r, spring)
      hole.absarc(zc, spring, r, 0, Math.PI, false)
      hole.lineTo(zc - r, sill)
      shape.holes.push(hole)
    })
    /*
      The zero-size bevel is a workaround, not a flourish. three r175's
      ExtrudeGeometry triangulates its caps from vertices collected in the
      bevel loop; with bevelEnabled false that loop never runs, the cap comes
      back as zero triangles, and the whole wall face silently disappears —
      which is why the boxes read as holes in the wall from the balcony.
    */
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0,
      bevelSegments: 1,
    })
  }, [])
}

/**
 * The hall: the shell of an old theatre, with the stage and the seats
 * built into it by the components that follow.
 *
 * Twenty-two feet to the ceiling, plaster over a dark wainscot, a cornice
 * all the way round, boxes up the long walls and a pilaster at the stage end
 * of each. Nothing in here casts a shadow — there is no sun to cast it — so
 * the only lights are the cans overhead and the two on the stage, and they
 * are point lights: cheap.
 */
export function Theatre() {
  const carpet = useMemo(() => {
    // the pattern is a 4 ft module whatever the size of the room
    const t = theatreCarpetTex().clone()
    t.needsUpdate = true
    t.repeat.set(W / 4, D / 4)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1 })
  }, [])
  const exitFrame = useMemo(() => M(0x4c4f55, { roughness: 0.5, metalness: 0.4 }), [])
  const exitLeaf = useMemo(() => M(0x8a8d92, { roughness: 0.45, metalness: 0.3 }), [])
  const panicBar = useMemo(() => M(0xc8302a, { roughness: 0.4 }), [])
  const plaster = useMemo(() => M(0xd3c4a2, { roughness: 0.9 }), [])
  const archedBand = useArchedBand()
  const pilaster = useMemo(() => M(0xc9b895, { roughness: 0.85 }), [])
  const ceiling = useMemo(() => M(0x2a2220, { roughness: 0.95 }), [])
  const wainscot = useMemo(() => M(0x4a3324, { roughness: 0.6 }), [])
  const brass = useMemo(() => M(0xb08a3c, { roughness: 0.35, metalness: 0.8 }), [])
  const cornice = useMemo(() => M(0xa8843c, { roughness: 0.5, metalness: 0.5 }), [])
  const torch = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffd9a0,
        emissive: 0xffb865,
        emissiveIntensity: 1.6,
        roughness: 0.6,
      }),
    [],
  )
  const can = useMemo(() => M(0x2e2622, { roughness: 0.5, metalness: 0.4 }), [])
  const canLens = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff0d8,
        emissiveIntensity: 1.4,
        roughness: 0.4,
      }),
    [],
  )
  const exit = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: exitTex(),
        emissive: 0xffffff,
        emissiveMap: exitTex(),
        emissiveIntensity: 0.9,
      }),
    [],
  )
  const tread = useMemo(() => M(0x5b3f2a, { roughness: 0.7 }), [])
  const wingCarpet = useMemo(() => {
    const t = theatreCarpetTex().clone()
    t.needsUpdate = true
    t.repeat.set(wings.width / 4, (hall.z0 - wings.z0) / 4)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1 })
  }, [])
  const tvFrame = useMemo(() => M(0x0b0c0e, { roughness: 0.6 }), [])
  // the side screens carry the camera feed, with the name strap over it
  const tv = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: FEED.texture,
        emissive: 0xffffff,
        emissiveMap: FEED.texture,
        emissiveIntensity: 1.1,
        roughness: 0.7,
      }),
    [],
  )
  const strap = useMemo(
    () => new THREE.MeshBasicMaterial({ map: lowerThirdTex(), transparent: true, depthWrite: false }),
    [],
  )

  return (
    <>
      {/*
        No window down here, and the house lights nearly off for the keynote:
        the room is the candles on the tables and the chandeliers over them,
        and the stage is the bright thing in it. Half-down, the hall read as
        a hotel ballroom with the lights on.
      */}
      <ambientLight ref={onBroadcast} color={0xffe6cc} intensity={L(0.03)} />
      <hemisphereLight ref={onBroadcast} args={[0xffdcb8, 0x2a1a16, L(0.05)]} />

      {/* floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0.003, CZ]} material={carpet}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CX, HT, CZ]} material={ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/*
        The north side. The hall's wall parts for the stage house, which runs
        deep behind the traveler, and for a door into each wing — the low
        rooms tucked either side of the backstage, three steps below the
        boards. Every fill and jamb here keeps clear of the wall's cut faces;
        two faces on one plane read as a flicker, not a wall.
      */}
      {NORTH_RUNS.map(([a, b]) => (
        <group key={a}>
          <Box size={[b - a, HT, 0.6]} material={plaster} position={[(a + b) / 2, HT / 2, hall.z0 - 0.3]} cast={false} />
          <Collider minX={a} maxX={b} minZ={hall.z0 - 0.6} maxZ={hall.z0} />
        </group>
      ))}
      {/*
        The confidence monitor: the same feed, on the back wall over the
        balcony, square to the podium — so whoever is speaking can see what
        the room is seeing without turning round. Faces the stage, so it is
        the side screens turned about.
      */}
      <group position={[B2_CX, MON_Y, hall.z1]} rotation={[0, Math.PI, 0]}>
        <Box size={[MON_W + 0.8, MON_H + 0.8, 0.5]} material={tvFrame} position={[0, 0, 0.25]} cast={false} />
        <Panel size={[MON_W, MON_H]} material={tv} position={[0, 0, 0.52]} />
      </group>

      {/* a screen either side of the proscenium, carrying the same slide as the stage */}
      {TV_XS.map((x) => (
        <group key={x}>
          <Box size={[TV_W + 1, TV_H + 1, 0.5]} material={tvFrame} position={[x, TV_Y, hall.z0 + 0.25]} cast={false} />
          <Panel size={[TV_W, TV_H]} material={tv} position={[x, TV_Y, hall.z0 + 0.52]} />
          <Panel size={[TV_W, TV_H]} material={strap} position={[x, TV_Y, hall.z0 + 0.54]} />
        </group>
      ))}

      {/* the wing doors, shut: space at one and it swings into the hall */}
      {wings.doorways.map((d, i) => (
        <WingDoor key={d.x0} d={d} dir={WINGS[i].dir} plaster={plaster} wainscot={wainscot} />
      ))}

      {/* the stage house: a wall each side with the stair opening from its wing, the back wall the screen hangs on, a ceiling, and work light over the backstage */}
      {WINGS.map((w) => {
        const inner = w.dir < 0 ? stage.x0 : stage.x1
        const x = inner + w.dir * 0.35
        const spans: Array<[number, number]> = [
          [stage.z0 - 0.6, wings.stair.z0],
          [wings.stair.z1, stage.z1],
        ]
        return (
          <group key={w.dir}>
            {spans.map(([a, b]) => (
              <group key={a}>
                <Box size={[0.6, HT, b - a]} material={plaster} position={[x, HT / 2, (a + b) / 2]} cast={false} />
                <Collider minX={x - 0.3} maxX={x + 0.3} minZ={a} maxZ={b} />
              </group>
            ))}
            <Box
              size={[0.6, HT - 8, wings.stair.z1 - wings.stair.z0]}
              material={plaster}
              position={[x, 8 + (HT - 8) / 2, STAIR_CZ]}
              cast={false}
            />
          </group>
        )
      })}
      <Box size={[stage.x1 - stage.x0 + 1.3, HT, 0.6]} material={plaster} position={[(stage.x0 + stage.x1) / 2, HT / 2, stage.z0 - 0.35]} cast={false} />
      <Collider minX={stage.x0 - 0.65} maxX={stage.x1 + 0.65} minZ={stage.z0 - 0.65} maxZ={stage.z0 - 0.05} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[(stage.x0 + stage.x1) / 2, HT, (stage.z0 - 0.3 + hall.z0 - 0.05) / 2]} material={ceiling}>
        <planeGeometry args={[stage.x1 - stage.x0 + 1.3, hall.z0 - 0.05 - (stage.z0 - 0.3)]} />
      </mesh>
      {[1, 25].map((x) => (
        <group key={x}>
          <mesh position={[x, HT - 0.45, -59]} material={can}>
            <cylinderGeometry args={[0.7, 0.7, 0.9, 20]} />
          </mesh>
          <mesh position={[x, HT - 0.92, -59]} rotation={[Math.PI / 2, 0, 0]} material={canLens}>
            <circleGeometry args={[0.55, 20]} />
          </mesh>
          <pointLight position={[x, HT - 1.4, -59]} color={0xfff0d8} intensity={candela(1.0, 14)} distance={44} decay={2} />
        </group>
      ))}

      {/*
        The wings themselves: floor, low ceiling, outer and end walls, three
        steps up to the boards, a light overhead. Every piece stops shy of
        the hall's wall plane and the house's — anything that crosses either
        shows up as a fin through the wall, or a line across it.
      */}
      {WINGS.map((w) => {
        const cx = (w.x0 + w.x1) / 2
        const inner = w.dir < 0 ? stage.x0 : stage.x1
        const outer = (w.dir < 0 ? w.x0 : w.x1) + w.dir * 0.3
        const endCx = cx + w.dir * 0.35
        const endW = wings.width + 0.5
        return (
          <group key={w.dir}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.004, WING_CZ]} material={wingCarpet}>
              <planeGeometry args={[wings.width, hall.z0 - wings.z0]} />
            </mesh>
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
              position={[cx + w.dir * 0.2, wings.h, (wings.z0 - 0.3 + hall.z0 - 0.05) / 2]}
              material={ceiling}
            >
              <planeGeometry args={[wings.width + 0.2, hall.z0 - wings.z0 + 0.25]} />
            </mesh>
            <Box
              size={[0.6, wings.h, hall.z0 - wings.z0 + 0.55]}
              material={plaster}
              position={[outer, wings.h / 2, (wings.z0 - 0.6 + hall.z0 - 0.05) / 2]}
              cast={false}
            />
            <Collider minX={outer - 0.3} maxX={outer + 0.3} minZ={wings.z0 - 0.6} maxZ={hall.z0} />
            <Box size={[endW, wings.h, 0.6]} material={plaster} position={[endCx, wings.h / 2, wings.z0 - 0.3]} cast={false} />
            <Collider minX={endCx - endW / 2} maxX={endCx + endW / 2} minZ={wings.z0 - 0.6} maxZ={wings.z0} />
            {(
              [
                { h: 1, d: 3.0, w: 1.2 },
                { h: 2, d: 1.8, w: 1.2 },
                { h: 3, d: 0.5, w: 1.4 },
              ] as const
            ).map((st) => (
              <Box
                key={st.h}
                size={[st.w, st.h, wings.stair.z1 - wings.stair.z0]}
                material={tread}
                position={[inner + w.dir * st.d, st.h / 2, STAIR_CZ]}
                cast={false}
              />
            ))}
            <mesh position={[cx, wings.h - 0.06, WING_CZ]} material={canLens}>
              <boxGeometry args={[2.6, 0.12, 1.4]} />
            </mesh>
            <pointLight position={[cx, wings.h - 0.6, WING_CZ]} color={0xfff0d8} intensity={candela(0.8, 9)} distance={26} decay={2} />
          </group>
        )
      })}

      {/*
        The two long walls, in bands. From the floor to the balcony, solid.
        Above the balcony: solid but for four openings — the gallery, where
        the wall is one piece with three arches let into it, and beside it a
        doorway at the foot of the stair well, which is otherwise walled in.
      */}
      {BOX_WALLS.map(({ wallX, dir }) => {
        const x = wallX - dir * 0.3
        const xa = wallX - dir * 0.6
        const xb = wallX
        const runs: Array<[number, number]> = [
          [hall.z0, GALLERY.z0],
          [WELL.z1, hall.z1],
        ]
        return (
          <group key={wallX}>
            <Box size={[0.6, balcony.y, D]} material={plaster} position={[x, balcony.y / 2, CZ]} cast={false} />
            <Collider minX={Math.min(xa, xb)} maxX={Math.max(xa, xb)} minZ={hall.z0} maxZ={hall.z1} below={balcony.y - 0.5} />
            {runs.map(([a, b]) => (
              <group key={a}>
                <Box size={[0.6, HT - balcony.y, b - a]} material={plaster} position={[x, (balcony.y + HT) / 2, (a + b) / 2]} cast={false} />
                <Collider minX={Math.min(xa, xb)} maxX={Math.max(xa, xb)} minZ={a} maxZ={b} above={balcony.y - 2} />
              </group>
            ))}
            {/* over the well: wall again from the gallery ceiling up */}
            <Box size={[0.6, HT - GALLERY_TOP, WELL.z1 - WELL.z0]} material={plaster} position={[x, (GALLERY_TOP + HT) / 2, (WELL.z0 + WELL.z1) / 2]} cast={false} />
            {/* the well's hall face: solid but for the doorway at the stair's foot */}
            <Box
              size={[0.6, GALLERY_TOP - balcony.y, boxes.run - boxes.mouth]}
              material={plaster}
              position={[x, (balcony.y + GALLERY_TOP) / 2, (WELL.z0 + WELL.z1 - boxes.mouth) / 2]}
              cast={false}
            />
            <Collider minX={Math.min(xa, xb)} maxX={Math.max(xa, xb)} minZ={WELL.z0} maxZ={WELL.z1 - boxes.mouth} above={balcony.y - 2} />
            <Box
              size={[0.6, GALLERY_TOP - balcony.y - DOOR, boxes.mouth]}
              material={plaster}
              position={[x, balcony.y + DOOR + (GALLERY_TOP - balcony.y - DOOR) / 2, WELL.z1 - boxes.mouth / 2]}
              cast={false}
            />
            {/* the arched piece: local x runs along z, and it extrudes toward -x from where it is put */}
            <mesh geometry={archedBand} material={plaster} position={[dir > 0 ? wallX : wallX + 0.6, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
            {/* at balcony level the arches are out of reach; up in the boxes she walks through them onto the ledges */}
            <Collider minX={Math.min(xa, xb)} maxX={Math.max(xa, xb)} minZ={GALLERY.z0} maxZ={GALLERY.z1} above={balcony.y - 2} below={balcony.y + Math.min(...ARCH_RISE) - 1.5} />
          </group>
        )
      })}
      {LOWER_RUNS.map(([a, b]) => (
        <group key={a}>
          <Box size={[b - a, BAND, 0.6]} material={plaster} position={[(a + b) / 2, BAND / 2, hall.z1]} cast={false} />
          {/* a wall from the floor; nothing once she is most of the way up a stair, where the ramp is still short of the band */}
          <Collider minX={a} maxX={b} minZ={hall.z1 - 0.3} maxZ={hall.z1 + 0.3} below={BAND - 2.5} />
        </group>
      ))}
      {doors.map((d) => (
        <Box
          key={d.x0}
          size={[d.x1 - d.x0 + 0.4, BAND - 7.6, 0.6]}
          material={plaster}
          position={[(d.x0 + d.x1) / 2, 7.6 + (BAND - 7.6) / 2, hall.z1]}
          cast={false}
        />
      ))}
      {/* the upper band: the same three runs as below, and a pair of doors over each pair of doors */}
      {LOWER_RUNS.map(([a, b]) => (
        <group key={a}>
          <Box size={[b - a, BAND, 0.6]} material={plaster} position={[(a + b) / 2, BAND * 1.5, hall.z1]} cast={false} />
          <Collider minX={a} maxX={b} minZ={hall.z1 - 0.3} maxZ={hall.z1 + 0.3} above={BAND - 2} />
        </group>
      ))}
      {doors.map((d) => (
        <group key={d.x0}>
          <Box
            size={[d.x1 - d.x0, BAND - BRIDGE_DOOR_H, 0.6]}
            material={plaster}
            position={[(d.x0 + d.x1) / 2, BAND + BRIDGE_DOOR_H + (BAND - BRIDGE_DOOR_H) / 2, hall.z1]}
            cast={false}
          />
          <BridgeDoors d={d} wainscot={wainscot} />
        </group>
      ))}
      <Box size={[W, HT - 2 * BAND, 0.6]} material={plaster} position={[CX, 2 * BAND + (HT - 2 * BAND) / 2, hall.z1]} cast={false} />

      {/* wainscot round the room */}
      <Box size={[0.16, WAIN, D]} material={wainscot} position={[hall.x0 + 0.08, WAIN / 2, CZ]} cast={false} />
      <Box size={[0.16, WAIN, D]} material={wainscot} position={[hall.x1 - 0.08, WAIN / 2, CZ]} cast={false} />
      {/* along the back wall in runs, stopping for the doors and each exit */}
      {(
        [
          [hall.x0, B2.exits[0] - 2],
          [B2.exits[0] + 2, doors[0].x0],
          [doors[0].x1, doors[1].x0],
          [doors[1].x1, B2.exits[1] - 2],
          [B2.exits[1] + 2, hall.x1],
        ] as const
      ).map(([a, b]) => (
        <Box
          key={a}
          size={[b - a, WAIN, 0.16]}
          material={wainscot}
          position={[(a + b) / 2, WAIN / 2, hall.z1 - 0.38]}
          cast={false}
        />
      ))}

      {/* cornice, all the way round at the ceiling — the north run parts for the stage house */}
      {([[hall.x0, stage.x0], [stage.x1, hall.x1]] as const).map(([a, b]) => (
        <Box key={a} size={[b - a, 1.0, 0.8]} material={cornice} position={[(a + b) / 2, HT - 0.5, hall.z0 + 0.4]} cast={false} />
      ))}
      <Box size={[W, 1.0, 0.8]} material={cornice} position={[CX, HT - 0.5, hall.z1 - 0.7]} cast={false} />
      <Box size={[0.8, 1.0, D]} material={cornice} position={[hall.x0 + 0.4, HT - 0.5, CZ]} cast={false} />
      <Box size={[0.8, 1.0, D]} material={cornice} position={[hall.x1 - 0.4, HT - 0.5, CZ]} cast={false} />

      {/* pilasters down the long walls, a sconce on each */}
      {PILASTERS.flatMap((z) =>
        [hall.x0 + 0.5, hall.x1 - 0.5].map((x) => {
          const inward = x < CX ? 1 : -1
          return (
            <group key={`${x}:${z}`}>
              <Box size={[1.0, HT, 1.4]} material={pilaster} position={[x, HT / 2, z]} cast={false} collide />
              <Box size={[1.2, 0.6, 1.6]} material={cornice} position={[x, HT - 1.3, z]} cast={false} />
              <Box size={[1.2, 0.5, 1.6]} material={wainscot} position={[x, WAIN + 0.25, z]} cast={false} />
              {/* bracket and torch */}
              <Box size={[0.6, 0.25, 0.25]} material={brass} position={[x + inward * 0.75, 8.6, z]} cast={false} />
              <mesh position={[x + inward * 1.0, 9.2, z]} material={torch}>
                <cylinderGeometry args={[0.16, 0.26, 1.1, 10]} />
              </mesh>
            </group>
          )
        }),
      )}

      {/* over the seating: chandeliers, and the light in the column of each — see Chandeliers */}
      <Chandeliers />

      {/* exits: a sign over each pair of doors you came in by, and a real fire door at each end of the back wall */}
      {doors.map((d) => (
        <Panel
          key={d.x0}
          size={[1.6, 0.6]}
          material={exit}
          position={[(d.x0 + d.x1) / 2, 6.7, hall.z1 - 0.32]}
          rotation={[0, Math.PI, 0]}
        />
      ))}
      {B2.exits.map((x) => (
        <ExitDoor key={x} x={x} frame={exitFrame} leaf={exitLeaf} bar={panicBar} sign={exit} />
      ))}
    </>
  )
}
