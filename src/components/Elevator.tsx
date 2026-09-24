import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { CAR, EL, H, SZ, candela } from '../scene/constants'
import type { FloorId } from '../scene/floors'
import { floorIndicatorTex } from '../textures/signage'
import {
  liftIitsTagsTex, liftNumeralsTex, liftPlateColumnTex, liftStickerTex, type LiftPlate,
} from '../textures/b2'
import { live, office, useOffice, type Stop } from '../state/store'
import { useClickable } from '../lib/registry'
import { Box, Collider, Panel } from './props/primitives'
import { CarCamera } from './LiftCam'
import { Passenger } from './Passenger'
import { player } from './Player'

/** What the building says when you press UP on 23. It is never good news. */
const LINES = [
  'The button lights. Nothing else happens.',
  'A soft chime from somewhere above. The doors stay shut.',
  'You hear the car pass by without stopping.',
  'The cable groans. The doors do not move.',
  'The indicator still reads 23. It always reads 23.',
]

/**
 * Two-speed doors: two panels a side, nesting.
 *
 * A single 3.4 ft leaf a side needs a 3.4 ft pocket to hide in, and the pier
 * beside the frame was one foot — so with the doors open, two and a half feet
 * of dark leaf stood in the wall either side of the door, and on 23 the end
 * of it went through the bay's return. That is what every wide lift opening
 * has instead: each side is a fast panel and a slow one, each half the
 * width, the fast one travelling twice as far, and open they stack behind
 * the pier. `SLIDE` is the slow panel's travel; the fast panel goes 2x.
 */
const SLIDE = 1.75
/** Each panel's width, and where the pair sits shut: fast (inner) and slow (outer) centres. */
const PANEL = 1.74
const FAST_X = PANEL / 2 + 0.01
const SLOW_X = PANEL * 1.5 - 0.02

/** What the indicator over each mouth of the shaft reads. */
const INDICATOR: Record<Stop, string> = { '23': '▲ 23', b2: '▼ B2', b1: '◆ B1' }

/** What a dead button gets you. Every press takes the next one. */
const DEAD = [
  'It lights. The car stays exactly where it is.',
  'Nothing. That floor is not on tonight.',
  'The button lights, then thinks better of it.',
  'Locked out after six. Everything is, up there.',
]
const dead = { at: 0 }

/** One row of the car's directory, and whether the car will actually go there. */
interface CarFloor extends LiftPlate {
  stop?: Stop
}

/**
 * The car panel, bottom row first.
 *
 * The Rockhopper Building claims twenty-nine stops. Three of them go
 * anywhere: 23, and the two levels of the theatre. The rest light and sit
 * there, which is the honest state of a building at nine on a Wednesday.
 *
 * Odd floors run down the left column, even down the right, with the
 * basements at the foot of each. B1 has no even opposite number, so that
 * slot in the right column is blank plate.
 */
const ODD: Array<CarFloor | null> = [
  { label: 'B3', name: 'Parking P3' },
  { label: 'B1', name: 'Theater · Balcony', stop: 'b1' },
  { label: '1', name: 'Lobby & Security' },
  { label: '3', name: 'Payroll' },
  { label: '5', name: 'Fleet Services' },
  { label: '7', name: 'Training Rooms' },
  { label: '9', name: 'Network Operations' },
  { label: '11', name: 'Telecom' },
  { label: '13', name: 'Facilities' },
  { label: '15', name: 'Legal' },
  { label: '17', name: 'Internal Audit' },
  { label: '19', name: 'Cybersecurity', tape: true },
  { label: '21', name: 'Vendor Relations' },
  { label: '23', name: 'Web Services', stop: '23' },
  { label: '25', name: 'Commissions' },
]

const EVEN: Array<CarFloor | null> = [
  { label: 'B2', name: 'Theater · Stage', stop: 'b2' },
  null,
  { label: '2', name: 'Mail & Records' },
  { label: '4', name: 'Procurement' },
  { label: '6', name: 'Human Resources' },
  { label: '8', name: 'Service Desk' },
  { label: '10', name: 'Data Center' },
  { label: '12', name: 'Marketing' },
  { label: '14', name: 'Print Shop' },
  { label: '16', name: 'Budget & Finance' },
  { label: '18', name: 'Enterprise Apps' },
  { label: '20', name: 'Data Governance', tape: true },
  { label: '22', name: 'Conference Center' },
  { label: '24', name: 'Executive Offices' },
  { label: '26', name: 'Mechanical' },
]

/**
 * The panel's grid, in car feet.
 *
 * Fifteen rows and four columns — button, plate, button, plate — on the east
 * wall, a little back from the doors. `PANEL_X` is the centre of the face
 * plate; everything on it stands off the front of that.
 */
const ROWS = ODD.length
const ROW = 0.3
/** Bottom row, off the car floor. */
const ROW0 = 1.95
const PANEL_Y = ROW0 + ((ROWS - 1) * ROW) / 2
const PANEL_Z = CAR.z0 + 3.0
const PANEL_X = EL + 3.38
/** The face plate's width along the car, and the directory plates' within it. */
const PANEL_W = 3.3
const PLATE_W = 1.15
/** Column centres, as offsets from the panel's centre on Z. */
const COL = { oddBtn: -1.38, oddPlate: -0.605, evenBtn: 0.2, evenPlate: 0.975 }
/** The face of the 14 button — even column, row eight — where the other passenger's finger is. 14 goes nowhere. */
const PRESS: [number, number, number] = [EL + 3.27, ROW0 + 8 * ROW, PANEL_Z + COL.evenBtn]

/** One call button. Lights on press, gives up after a couple of seconds. */
function CallButton({ y, onPress }: { y: number; onPress: () => string }) {
  const ref = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xdcdcdc,
        emissive: 0x000000,
        roughness: 0.3,
        metalness: 0.4,
      }),
    [],
  )
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showHint = useOffice((s) => s.showHint)

  useClickable(ref, () => {
    material.emissive.setHex(0xffa040)
    material.emissiveIntensity = 1.4
    showHint(onPress(), 3200)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => material.emissive.setHex(0), 2600)
  })

  return (
    <mesh
      ref={ref}
      position={[EL + 4.6, y, SZ - 0.5]}
      rotation={[Math.PI / 2, 0, 0]}
      material={material}
    >
      <cylinderGeometry args={[0.18, 0.18, 0.08, 20]} />
    </mesh>
  )
}

/**
 * One button on the car's panel: press it and the car goes there, or, on
 * twenty-six of the twenty-nine, it lights and that is the end of it.
 *
 * Only answers while this floor is the visible one — the other floor draws
 * the same panel in the same spot — and only while the doors stand open,
 * which is the only time anyone is inside to press it.
 *
 * The numeral is not here. All fifteen in a column are printed on one strip
 * laid over the pucks, so a button is one mesh rather than two.
 */
function CarButton({
  floor,
  base,
  plate,
  y,
  z,
}: {
  floor: FloorId
  base: number
  plate: CarFloor
  y: number
  z: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xdcdcdc,
        emissive: 0x000000,
        roughness: 0.3,
        metalness: 0.4,
      }),
    [],
  )
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showHint = useOffice((s) => s.showHint)

  useClickable(ref, () => {
    const s = office()
    if (s.floor !== floor) return
    material.emissive.setHex(0xffa040)
    material.emissiveIntensity = 1.4
    clearTimeout(timer.current)
    timer.current = setTimeout(() => material.emissive.setHex(0), 2600)
    if (!plate.stop) return showHint(DEAD[dead.at++ % DEAD.length], 2600)
    const at: Stop = s.floor === '23' ? '23' : player.y > 4 ? 'b1' : 'b2'
    if (plate.stop === at) return showHint('This is where you are.', 2400)
    if (s.lift.phase !== 'open') return showHint('One moment.', 2000)
    s.setLift('closing', plate.stop)
    showHint('The doors close.', 1600)
  })

  return (
    <mesh
      ref={ref}
      position={[EL + 3.325, base + y, z]}
      rotation={[0, 0, Math.PI / 2]}
      material={material}
    >
      <cylinderGeometry args={[0.1, 0.1, 0.07, 16]} />
    </mesh>
  )
}

/**
 * One column of the panel: fifteen pucks, their numerals on one strip over
 * them, and the engraved directory beside it.
 */
function CarColumn({
  floor,
  base,
  rows,
  btnZ,
  plateZ,
}: {
  floor: FloorId
  base: number
  rows: Array<CarFloor | null>
  btnZ: number
  plateZ: number
}) {
  const numerals = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: liftNumeralsTex(rows),
        transparent: true,
        depthWrite: false,
        roughness: 0.5,
      }),
    [rows],
  )
  const directory = useMemo(
    () => new THREE.MeshStandardMaterial({ map: liftPlateColumnTex(rows), roughness: 0.42, metalness: 0.5 }),
    [rows],
  )
  const h = ROWS * ROW

  return (
    <>
      {rows.map((r, i) =>
        r ? (
          <CarButton key={r.label} floor={floor} base={base} plate={r} y={ROW0 + i * ROW} z={btnZ} />
        ) : null,
      )}
      <Panel
        size={[0.3, h]}
        material={numerals}
        position={[EL + 3.275, base + PANEL_Y, btnZ]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <Panel
        size={[PLATE_W, h]}
        material={directory}
        position={[EL + 3.34, base + PANEL_Y, plateZ]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </>
  )
}

/**
 * One mouth of the shaft and the car behind it, `base` feet up.
 *
 * The B2 shaft has two: the lobby floor and the mezzanine, stacked, sharing
 * one set of state. Only the mouth being served animates its doors — the
 * other pair stays shut and keeps its collider.
 */
function Shaft({ floor, base, stop }: { floor: FloorId; base: number; stop: Stop }) {
  const phase = useOffice((s) => s.lift.phase)
  const serve = useOffice((s) => s.liftServe)
  const setLift = useOffice((s) => s.setLift)
  const setLiftServe = useOffice((s) => s.setLiftServe)
  const servesHere = serve === (stop === 'b1' ? 'upper' : 'lower')

  const jamb = useMemo(() => M(0x6b6e73, { roughness: 0.4, metalness: 0.6 }), [])
  const brushed = useMemo(() => M(0xb9bcc1, { roughness: 0.28, metalness: 0.85 }), [])
  // darker than the doors: under the 23rd floor's fill a light metal blew out to white
  const carWall = useMemo(() => M(0x6b6f75, { roughness: 0.4, metalness: 0.75 }), [])
  const carFloor = useMemo(() => M(0x2a2c30, { roughness: 0.9 }), [])
  const lens = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff3e2,
        emissiveIntensity: 1.2,
        roughness: 0.35,
      }),
    [],
  )
  const brass = useMemo(() => M(0xb08d3c, { roughness: 0.34, metalness: 0.85 }), [])
  /*
    The same canvas drives colour and glow, so the black field stays black
    and only the digits carry any light.
  */
  const indicator = useMemo(() => {
    const map = floorIndicatorTex(INDICATOR[stop])
    return new THREE.MeshStandardMaterial({
      map,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: 1.5,
      roughness: 0.5,
    })
  }, [stop])
  const sticker = useMemo(
    () => new THREE.MeshStandardMaterial({ map: liftStickerTex(), roughness: 0.9 }),
    [],
  )
  const tags = useMemo(
    () => new THREE.MeshStandardMaterial({ map: liftIitsTagsTex(), roughness: 0.9 }),
    [],
  )

  // Each press of the dud button advances through the list, so it says something new.
  const line = useRef(0)
  const nextLine = () => LINES[line.current++ % LINES.length]

  /** A call only opens the doors here. Where the car goes is chosen inside. */
  const call = () => {
    const { lift } = office()
    if (lift.phase !== 'idle') {
      return lift.phase === 'open' || lift.phase === 'opening'
        ? 'The doors are open.'
        : 'It is on its way.'
    }
    setLiftServe(stop === 'b1' ? 'upper' : 'lower')
    setLift('opening', null)
    return stop === '23' ? 'A chime. This time the doors move.' : 'Called.'
  }
  const up = stop === '23' ? nextLine : call
  const down = stop === 'b2' ? () => 'This is as far down as it goes.' : call

  // The panels slide into the wall either side — of the mouth being served.
  // Index 0 is the fast (inner) panel, 1 the slow (outer) one, for each side.
  const leftP = useRef<(THREE.Mesh | null)[]>([null, null])
  const rightP = useRef<(THREE.Mesh | null)[]>([null, null])
  useFrame(() => {
    const o = (servesHere ? live.liftDoors : 0) * SLIDE
    const l = leftP.current
    const r = rightP.current
    if (l[0]) l[0].position.x = EL - FAST_X - 2 * o
    if (l[1]) l[1].position.x = EL - SLOW_X - o
    if (r[0]) r[0].position.x = EL + FAST_X + 2 * o
    if (r[1]) r[1].position.x = EL + SLOW_X + o
  })

  // While the doors are shut they are a wall; a mouth the car is not at is always a wall.
  const shut = phase === 'idle' || phase === 'riding'
  /** These footprints exist at both bases; each level's colliders mind their own storey. */
  const gate = base > 0 ? { above: 6 } : { below: 6 }

  const carMidZ = (CAR.z0 + CAR.z1) / 2
  const carD = CAR.z1 - CAR.z0
  // On B2 the shaft is a block standing proud of the south wall, so its
  // face piers run wide enough to meet the block's side walls.
  // Wide enough to hide the open panels, which stack out to EL +/- 5.22.
  const pierW = floor === 'b2' ? 2.4 : 2.0
  const pierX = floor === 'b2' ? 4.7 : 4.5
  const pierOut = floor === 'b2' ? 5.9 : 5.5

  return (
    <>
      {/*
        The wall the doors are in: a pier each side, a header over. The piers
        stop where the header starts — full height, the 0.8 they shared with
        it put two faces on the lobby plane and the corners over the doors
        came out striped.
      */}
      {[-1, 1].map((s) => (
        <Box key={s} size={[pierW, 7.2, 0.4]} material={mat.laminate} position={[EL + s * pierX, base + 3.6, SZ - 0.2]} />
      ))}
      <Box size={[9, H - 7.2, 0.4]} material={mat.laminate} position={[EL, base + 7.2 + (H - 7.2) / 2, SZ - 0.2]} />
      <Collider minX={EL - pierOut} maxX={EL - 3.5} minZ={SZ - 0.6} maxZ={SZ + 0.2} {...gate} />
      <Collider minX={EL + 3.5} maxX={EL + pierOut} minZ={SZ - 0.6} maxZ={SZ + 0.2} {...gate} />

      {/*
        The trim round the opening.

        The head runs down to 7.0, not 7.2. At 7.2 over a 7.0 leaf there was a
        slot the width of the doors that looked straight into the shaft, and
        its underside sat on the same plane as the wall over it, which came
        out hatched. The posts reach in to 3.4 for the same reason: at 3.475
        there was a slot down each side of each leaf.
      */}
      <Box size={[0.4, 7.2, 0.5]} material={jamb} position={[EL - 3.6, base + 3.6, SZ - 0.3]} />
      <Box size={[0.4, 7.2, 0.5]} material={jamb} position={[EL + 3.6, base + 3.6, SZ - 0.3]} />
      <Box size={[7.7, 0.5, 0.5]} material={jamb} position={[EL, base + 7.25, SZ - 0.3]} />

      {/*
        The four panels, inside the wall's thickness so they slide behind the
        piers. The fast pair is a hair nearer the lobby than the slow pair, so
        the two of a side pass each other rather than through each other.
      */}
      {([-1, 1] as const).map((s) =>
        [0, 1].map((i) => (
          <mesh
            key={`${s}:${i}`}
            ref={(m) => {
              ;(s < 0 ? leftP : rightP).current[i] = m
            }}
            position={[EL + s * (i === 0 ? FAST_X : SLOW_X), base + 3.53, SZ - (i === 0 ? 0.26 : 0.14)]}
            material={brushed}
            castShadow
          >
            <boxGeometry args={[PANEL, 7.06, 0.1]} />
          </mesh>
        )),
      )}
      {(shut || !servesHere) && (
        <Collider minX={EL - 3.6} maxX={EL + 3.6} minZ={SZ - 0.7} maxZ={SZ + 0.2} {...gate} />
      )}

      {/*
        Floor indicator, in a brass bezel over the doors.

        It used to be a bare plate laid on the face of the jamb head, sharing
        that plane, so the bottom of it dithered. It stands proud of the trim
        now, and only the digits are lit — the whole rectangle glowed before,
        which read as an orange card taped up rather than a readout.
      */}
      <Box
        size={[2.6, 0.62, 0.26]}
        material={brass}
        position={[EL, base + 7.68, SZ - 0.5]}
        cast={false}
      />
      <Panel
        size={[2.0, 0.42]}
        material={indicator}
        position={[EL, base + 7.68, SZ - 0.64]}
        rotation={[0, Math.PI, 0]}
      />

      {/* call plate: any button brings the car; the choosing happens inside */}
      <Box
        size={[1.0, 1.6, 0.08]}
        material={brushed}
        position={[EL + 4.6, base + 3.6, SZ - 0.42]}
        cast={false}
      />
      <CallButton y={base + 3.9} onPress={up} />
      <CallButton y={base + 3.3} onPress={down} />
      {/* taped under the buttons on 23, a little crooked: where the event is */}
      {stop === '23' && (
        <Panel
          size={[0.9, 0.6]}
          material={sticker}
          position={[EL + 4.6, 2.36, SZ - 0.43]}
          rotation={[0, Math.PI, 0.04]}
        />
      )}

      {/* the car: floor, ceiling and lens, three walls, a rail, the panel and its buttons */}
      <Box size={[7.2, 0.2, carD + 0.4]} material={carFloor} position={[EL, base - 0.1, carMidZ + 0.1]} cast={false} />
      <Box size={[7.4, 0.3, carD + 0.6]} material={carWall} position={[EL, base + 7.75, carMidZ + 0.1]} cast={false} />
      <Panel
        size={[3.2, 2.2]}
        material={lens}
        position={[EL, base + 7.58, carMidZ]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Box size={[7.4, 8, 0.3]} material={carWall} position={[EL, base + 4, CAR.z1 + 0.15]} cast={false} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          size={[0.3, 8, carD + 0.3]}
          material={carWall}
          position={[EL + s * 3.55, base + 4, carMidZ + 0.05]}
          cast={false}
        />
      ))}
      <Box size={[6.6, 0.12, 0.12]} material={mat.steel} position={[EL, base + 3.0, CAR.z1 - 0.1]} cast={false} />

      {/*
        The car operating panel, on the east wall.

        Four columns: odd buttons, the odd directory, even buttons, the even
        directory. The plate is sunk into the wall by a hundredth rather than
        stood on its face — flush, they shared a plane and striped.
      */}
      <Box
        size={[0.06, (ROWS - 1) * ROW + 0.44, PANEL_W]}
        material={brushed}
        position={[PANEL_X, base + PANEL_Y, PANEL_Z]}
        cast={false}
      />
      <CarColumn
        floor={floor}
        base={base}
        rows={ODD}
        btnZ={PANEL_Z + COL.oddBtn}
        plateZ={PANEL_Z + COL.oddPlate}
      />
      <CarColumn
        floor={floor}
        base={base}
        rows={EVEN}
        btnZ={PANEL_Z + COL.evenBtn}
        plateZ={PANEL_Z + COL.evenPlate}
      />
      {/* taped up on the door side of the panel: which basement is which */}
      <Panel
        size={[1.2, 0.8]}
        material={tags}
        position={[EL + 3.38, base + 4.4, PANEL_Z - PANEL_W / 2 - 0.7]}
        rotation={[0, -Math.PI / 2, 0.03]}
      />
      <Collider minX={EL - 3.8} maxX={EL - 3.3} minZ={CAR.z0} maxZ={CAR.z1 + 0.3} />
      <Collider minX={EL + 3.3} maxX={EL + 3.8} minZ={CAR.z0} maxZ={CAR.z1 + 0.3} />
      <Collider minX={EL - 3.8} maxX={EL + 3.8} minZ={CAR.z1} maxZ={CAR.z1 + 0.3} />
      {/* the other passenger, by the buttons; he rides wherever the car goes */}
      <Passenger base={base} press={PRESS} />
      {/* and the camera over the doors that watches him, for the watch's rendezvous page */}
      <CarCamera floor={floor} base={base} stop={stop} />
      <pointLight
        position={[EL, base + 7.2, carMidZ]}
        color={0xfff4e0}
        intensity={candela(0.55, 4)}
        distance={12}
        decay={2}
      />
    </>
  )
}

/**
 * The elevator: one shaft on 23, two mouths of the same shaft on B2 — the
 * lobby floor and the mezzanine eight feet over it. The car behind the
 * doors goes wherever the panel says now. Both floors draw their cars in
 * the same spot, so the one you step into up there is the one you step out
 * of down here; only the visible floor's buttons answer.
 */
export function Elevator({ floor }: { floor: FloorId }) {
  return floor === '23' ? (
    <Shaft floor="23" base={0} stop="23" />
  ) : (
    <>
      <Shaft floor="b2" base={0} stop="b2" />
      <Shaft floor="b2" base={8} stop="b1" />
    </>
  )
}
