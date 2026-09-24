import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { M } from '../scene/materials'
import { CAR, EL } from '../scene/constants'
import { useOpenable } from '../lib/registry'
import { useOffice } from '../state/store'
import { makeFace, type FaceRole, type FaceSpec, type HairSpec } from '../lib/face'
import { cutRings, frontAngle, letOut, ringAt, smoothRings, surfaceAt, type FullRing, type Ring } from '../lib/loft'
import { Collider } from './props/primitives'
import { Hair, Head } from './people/Head'
import { Limb, Loft } from './people/Loft'
import { BadgeCard, Digit, Leg, elbowAt, handFrame } from './people/parts'

type V3 = [number, number, number]

/**
 * Where he stands: the panel side of the car, at the back end of the panel,
 * clear of the buttons so they can still be pressed past him. Turned a
 * little into the car, the way someone is once you have started talking.
 */
export const PASSENGER_AT: V3 = [EL + 2.55, 0, CAR.z0 + 4.5]
const AT = PASSENGER_AT
const TURN = 0.35

/** A point in the car — world x and z, height off the car floor — in his own frame. */
function local([wx, y, wz]: V3): V3 {
  const dx = wx - AT[0]
  const dz = wz - AT[2]
  return [dx * Math.cos(TURN) - dz * Math.sin(TURN), y, dx * Math.sin(TURN) + dz * Math.cos(TURN)]
}
/** Straight into the panel: world +x, in his frame. */
const INTO: V3 = [Math.cos(TURN), 0, Math.sin(TURN)]

// Landmark heights from the car floor, in feet: a man of five foot eleven,
// a shade shorter than the speaker. Authored facing -Z, which is the doors.
const KNEE = 1.68
const HIP = 3.0
const SHOULDER = 4.74
const CHIN = 5.13
const HIP_X = 0.29
const SHOULDER_X = 0.62
const UPPER_ARM = 1.03
const FOREARM = 0.86

/**
 * The jacket, buttoned, as the body under it shapes it: hem, seat, in at the
 * waist, out over the chest, the padded shoulder line, and up the slope of
 * the neck to the collar. Deeper in front of the spine than behind it, and
 * squarer than an ellipse, which is what a chest in a suit is.
 */
const JACKET: Ring[] = [
  { y: 2.72, w: 0.575, zf: -0.4, zb: 0.4, n: 2.5 },
  { y: 3.05, w: 0.585, zf: -0.415, zb: 0.43, n: 2.5 },
  { y: 3.7, w: 0.535, zf: -0.41, zb: 0.355, n: 2.4 },
  { y: 4.3, w: 0.62, zf: -0.46, zb: 0.4, n: 2.3 },
  { y: 4.66, w: 0.66, zf: -0.42, zb: 0.385, n: 2.3 },
  { y: 4.86, w: 0.64, zf: -0.32, zb: 0.33, n: 2.2 },
  { y: 4.97, w: 0.45, zf: -0.25, zb: 0.29, n: 2.1 },
  { y: 5.04, w: 0.25, zf: -0.2, zb: 0.25 },
]
/** The jacket closes on one button here, and the shirt shows from here up. */
const BUTTON = 4.0
const COLLAR = 5.03
/** Half the width of shirt showing at a height: nothing at the button, a hand's width at the collar. */
const vee = (y: number) => THREE.MathUtils.clamp((y - BUTTON) / (COLLAR - BUTTON), 0, 1) * 0.2

const NECK: Ring[] = [
  { y: 4.95, w: 0.205, zf: -0.17, zb: 0.25 },
  { y: 5.2, w: 0.185, zf: -0.175, zb: 0.2 },
  { y: 5.45, w: 0.19, zf: -0.17, zb: 0.21 },
]
const SHIRT_COLLAR: Ring[] = [
  { y: 4.99, w: 0.235, zf: -0.215, zb: 0.27 },
  { y: 5.15, w: 0.2, zf: -0.19, zb: 0.215 },
]

// sleeves: [fraction along, across, front-to-back]
const UPPER: Array<[number, number, number]> = [
  [0, 0.19, 0.2],
  [1, 0.155, 0.16],
]
const FORE: Array<[number, number, number]> = [
  [0, 0.155, 0.155],
  [1, 0.125, 0.13],
]

const FACE: FaceSpec = {
  h: 0.82,
  soft: 0,
  segs: 20,
  smooth: 2,
  lid: 0.28,
  lash: 0.05,
  slant: 0.02,
  eye: 1.15,
  nose: 1.0,
  lips: 0.8,
  smile: 0.25,
  brow: [0.612, 0.03, 0.04],
  gaze: [0, 0],
}
/** Dark hair, short, tidy: up off the nape, round behind the ear, a sideburn, a corner at the temple. */
const HAIR: HairSpec = {
  from: 0.26,
  line: [
    [0.26, 150],
    [0.34, 124],
    [0.42, 103],
    [0.465, 97],
    [0.5, 77],
    [0.6, 70],
    [0.72, 62],
    [0.79, 50],
    [0.835, 0],
  ],
  grow: [1.035, 1.07, 1.04],
}

/** A strip of cloth lying on the jacket between two heights, `d` proud of it, its edges stated in feet across. */
function strip(y0: number, y1: number, d: number, edges: (y: number) => [number, number]) {
  return {
    rings: cutRings(letOut(JACKET, d), y0, y1, 2),
    span: (r: FullRing): [number, number] => {
      const [x0, x1] = edges(r.y)
      return [frontAngle(r, x0), frontAngle(r, x1)]
    },
  }
}

/** What he says, if you press him. He is mostly waiting for his floor. */
const LINES = [
  'Which floor?',
  'He nods. He has heard a pitch in here before.',
  'He is watching the numbers. Everyone in here watches the numbers.',
]

/**
 * The other passenger.
 *
 * A man in a navy suit, by the buttons, one finger on the panel, briefcase
 * in the other hand — the person every elevator pitch is made to. He never
 * moves, so he is built here and baked into no model file; but he is seen
 * from two feet away, so he is lofted, not stacked: the jacket is one
 * surface from hem to collar with a chest and a waist in it, the shirt, tie
 * and lapels are strips of that same surface, and the head is the shared one
 * from lib/face.ts with glasses on it. Space on him gets you a line.
 *
 * `base` is the car floor's height, because the B2 shaft draws its car at
 * two mouths; `press` is the button his fingertip is on — world x and z,
 * height off the car floor.
 */
export function Passenger({ base, press }: { base: number; press: V3 }) {
  const skin = useMemo(() => M(0xd4a07a, { roughness: 0.75 }), [])
  const suit = useMemo(() => M(0x22304f, { roughness: 0.9 }), [])
  // the lapel catches the light the body of the jacket does not
  const lapel = useMemo(() => M(0x2b3b60, { roughness: 0.85, side: THREE.DoubleSide }), [])
  const shirt = useMemo(() => M(0xf0eee8, { roughness: 0.8, side: THREE.DoubleSide }), [])
  const tie = useMemo(() => M(0x8a2433, { roughness: 0.55, side: THREE.DoubleSide }), [])
  const shoe = useMemo(() => M(0x151517, { roughness: 0.35 }), [])
  const sole = useMemo(() => M(0x0a0a0b, { roughness: 0.9 }), [])
  const hair = useMemo(() => M(0x2f2420, { roughness: 0.7, side: THREE.DoubleSide }), [])
  const frame = useMemo(() => M(0x1a1a1c, { roughness: 0.4, metalness: 0.3 }), [])
  const leather = useMemo(() => M(0x3a2a22, { roughness: 0.6 }), [])
  const brass = useMemo(() => M(0xb08d3c, { roughness: 0.35, metalness: 0.8 }), [])
  const steel = useMemo(() => M(0xa9adb3, { roughness: 0.3, metalness: 0.8 }), [])
  const dial = useMemo(() => M(0xe8e4da, { roughness: 0.5 }), [])
  const strap = useMemo(() => M(0x1d3b8a, { roughness: 1, side: THREE.DoubleSide }), [])
  const badge = useMemo(() => M(0xf2f0e8, { roughness: 0.7 }), [])
  const ink = useMemo(() => M(0x1d3b8a, { roughness: 0.7 }), [])
  const faceMats = useMemo<Record<FaceRole, THREE.Material>>(
    () => ({
      skin,
      shade: M(0xa8765a, { roughness: 0.8 }),
      sclera: M(0xf3f0ea, { roughness: 0.3 }),
      iris: M(0x4a6a8a, { roughness: 0.25 }),
      pupil: M(0x0b0a0a, { roughness: 0.2 }),
      lip: M(0xbd8372, { roughness: 0.7 }),
      lipLine: M(0x6e4438, { roughness: 0.8 }),
      brow: hair,
      lash: M(0x5a3d30, { roughness: 0.8 }),
    }),
    [skin, hair],
  )

  const face = useMemo(() => makeFace(FACE), [])

  /*
    The arms. The right is worked back from the fingertip: the tip is on the
    button, the index finger runs straight into the panel from a hand held
    knuckles-down, the wrist is behind that, and the elbow is wherever two
    arm-lengths put it, hanging down and out. The left hangs straight, with
    the case in it.
  */
  const arms = useMemo(() => {
    const tip = local(press)
    // the index finger: knuckle to tip, in the hand's own frame below
    const along = 0.25 + 0.06
    // hand origin: back along the finger, and the index sits 0.05 up the knuckle row
    const handR: V3 = [tip[0] - along * INTO[0], tip[1] - 0.05, tip[2] - along * INTO[2]]
    const wristR: V3 = [handR[0] - 0.13 * INTO[0], handR[1] - 0.02, handR[2] - 0.13 * INTO[2]]
    const shoulderR: V3 = [SHOULDER_X, SHOULDER, 0]
    const shoulderL: V3 = [-SHOULDER_X, SHOULDER, 0]
    const wristL: V3 = [-0.75, 2.97, -0.03]
    return {
      shoulderR,
      shoulderL,
      elbowR: elbowAt(shoulderR, wristR, UPPER_ARM, FOREARM, [0.55, -1, 0.35]),
      elbowL: elbowAt(shoulderL, wristL, UPPER_ARM, FOREARM, [-0.3, 0, 1]),
      wristR,
      wristL,
      handR,
      // knuckles down the wall, fingers into it
      handRQ: handFrame([0, -1, 0], INTO),
    }
  }, [press])

  /*
    What lies on the jacket's front: the shirt between the lapels, the tie
    down the middle of that, a lapel each side up to the notch and the collar
    above it, and the lanyard. Each is a strip of the jacket's own surface a
    little proud of it, so they follow the chest and nothing floats.
  */
  const cloth = useMemo(() => {
    const NOTCH = 4.7
    const lapelW = (y: number) => 0.2 * Math.sin((Math.PI * 0.5 * (y - BUTTON)) / (NOTCH - BUTTON))
    const tieW = (y: number) => Math.min(0.085 - (y - BUTTON) * 0.04, vee(y) * 0.92)
    const lanyardX = (y: number) => 0.035 + ((y - 4.58) / (COLLAR - 4.58)) * 0.17
    const surface = smoothRings(JACKET, 2)
    return {
      shirt: strip(BUTTON, COLLAR, 0.012, (y) => [-vee(y), vee(y)]),
      tie: strip(BUTTON + 0.04, COLLAR - 0.1, 0.03, (y) => [-tieW(y), tieW(y)]),
      lapels: [-1, 1].flatMap((s) => [
        strip(BUTTON, NOTCH, 0.024, (y) => (s > 0 ? [vee(y), vee(y) + lapelW(y)] : [-vee(y) - lapelW(y), -vee(y)])),
        strip(NOTCH + 0.035, COLLAR, 0.024, (y) => (s > 0 ? [vee(y), vee(y) + 0.13] : [-vee(y) - 0.13, -vee(y)])),
      ]),
      lanyard: [-1, 1].map((s) =>
        strip(4.58, COLLAR, 0.045, (y) => (s > 0 ? [lanyardX(y) - 0.02, lanyardX(y) + 0.02] : [-lanyardX(y) - 0.02, -lanyardX(y) + 0.02])),
      ),
      button: surfaceAt(surface, 0, BUTTON - 0.03, 0.01),
      pockets: [-1, 1].map((s) => surfaceAt(surface, s * 0.36, 3.42, 0.012)),
      square: surfaceAt(surface, -0.3, 4.4, 0.014),
      badge: surfaceAt(surface, 0, 4.37, 0.075),
    }
  }, [])

  // glasses: a rim in front of each eye, a bridge, a temple back to each ear
  const specs = useMemo(() => {
    const h = FACE.h
    const eyeY = 0.5 * h
    const rimZ = face.at(0.135 * h, eyeY, 0.05).p[2]
    const earX = ringAt(face.rings, 0.49 * h).w + 0.01
    return { eyeX: 0.135 * h, eyeY, rimZ, r: 0.078, earX, templeLen: Math.abs(rimZ) + 0.02 }
  }, [face])

  const hit = useRef<THREE.Mesh>(null)
  const said = useRef(0)
  const showHint = useOffice((s) => s.showHint)
  useOpenable(hit, () => showHint(LINES[said.current++ % LINES.length], 3000))

  const HAND_L: V3 = [arms.wristL[0], arms.wristL[1] - 0.1, arms.wristL[2]]
  const HANDLE_Y = HAND_L[1] - 0.25

  return (
    <group position={[AT[0], base, AT[2]]} rotation={[0, TURN, 0]}>
      {[-1, 1].map((s) => (
        <Leg key={s} s={s} hip={HIP} knee={KNEE} x={HIP_X} cloth={suit} shoe={shoe} sole={sole} />
      ))}

      {/* the jacket: one surface, hem to collar */}
      <Loft rings={JACKET} material={suit} segs={24} smooth={2} />
      <Loft {...cloth.shirt} material={shirt} segs={6} />
      <Loft {...cloth.tie} material={tie} segs={2} />
      {cloth.lapels.map((l, i) => (
        <Loft key={i} {...l} material={lapel} segs={3} />
      ))}
      <mesh position={cloth.button.p} material={lapel}>
        <sphereGeometry args={[0.028, 8, 6]} />
      </mesh>
      {cloth.pockets.map((p, i) => (
        <mesh key={i} position={p.p} rotation={[0, p.yaw, 0]} material={lapel}>
          <boxGeometry args={[0.34, 0.085, 0.02]} />
        </mesh>
      ))}
      <mesh position={cloth.square.p} rotation={[0, cloth.square.yaw, 0]} material={shirt}>
        <boxGeometry args={[0.15, 0.035, 0.012]} />
      </mesh>
      {/* the knot of the tie, in the gap of the collar */}
      <mesh position={[0, COLLAR - 0.07, -0.245]} rotation={[0.25, 0, 0]} material={tie}>
        <cylinderGeometry args={[0.07, 0.045, 0.11, 4, 1]} />
      </mesh>

      {/* neck, and the shirt collar round it, open at the knot, its points down onto the shirt */}
      <Loft rings={NECK} material={skin} segs={14} cap="none" />
      <Loft rings={SHIRT_COLLAR} material={shirt} segs={14} open={0.42} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.1, COLLAR - 0.06, -0.235]} rotation={[0.3, s * 0.5, -s * 0.6]} material={shirt}>
          <boxGeometry args={[0.1, 0.2, 0.015]} />
        </mesh>
      ))}

      {/* the arms: a sleeve head on the shoulder, sleeves, elbows, a line of cuff at each wrist */}
      {[arms.shoulderR, arms.shoulderL].map((p, i) => (
        <mesh key={i} position={[p[0] - Math.sign(p[0]) * 0.015, p[1] - 0.02, p[2]]} material={suit} scale={[1, 0.95, 1.05]}>
          <sphereGeometry args={[0.192, 14, 10]} />
        </mesh>
      ))}
      <Limb a={arms.shoulderR} b={arms.elbowR} radii={UPPER} material={suit} />
      <Limb a={arms.elbowR} b={arms.wristR} radii={FORE} material={suit} />
      <Limb a={arms.shoulderL} b={arms.elbowL} radii={UPPER} material={suit} />
      <Limb a={arms.elbowL} b={arms.wristL} radii={FORE} material={suit} />
      {[arms.elbowR, arms.elbowL].map((p, i) => (
        <mesh key={i} position={p} material={suit}>
          <sphereGeometry args={[0.158, 12, 8]} />
        </mesh>
      ))}
      <Limb
        a={arms.wristR}
        b={[arms.wristR[0] + 0.07 * INTO[0], arms.wristR[1], arms.wristR[2] + 0.07 * INTO[2]]}
        radii={[
          [0, 0.11],
          [1, 0.1],
        ]}
        material={shirt}
      />
      <Limb
        a={arms.wristL}
        b={[arms.wristL[0], arms.wristL[1] - 0.07, arms.wristL[2]]}
        radii={[
          [0, 0.11],
          [1, 0.1],
        ]}
        material={shirt}
      />

      {/*
        The right hand, at the panel: knuckles down the wall, the index
        finger straight into it, the other three curled into the palm in two
        joints each, the thumb up along the top. Laid out in the hand's own
        frame — x down the knuckle row, y along the fingers, z out of the palm.
      */}
      <group position={arms.handR} quaternion={arms.handRQ}>
        <mesh position={[0.025, -0.05, 0]} material={skin} scale={[0.1, 0.125, 0.042]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        <Digit at={[-0.05, 0.06 + 0.125, 0]} r={0.021} len={0.27} material={skin} />
        {[-0.05, 0, 0.045, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.06, 0]} material={skin}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
        ))}
        {[0, 0.045, 0.09].map((x) => (
          <group key={x}>
            <Digit at={[x, 0.072, 0.054]} rot={[1.35, 0, 0]} r={0.021} len={0.13} material={skin} />
            <Digit at={[x, 0.051, 0.125]} rot={[2.4, 0, 0]} r={0.019} len={0.1} material={skin} />
          </group>
        ))}
        <Digit at={[-0.12, 0.02, 0.012]} rot={[0, 0, 0.64]} r={0.023} len={0.16} material={skin} />
      </group>

      {/*
        The left hand, round the handle of the case: a palm against the top
        of the arch, four fingers down the far side and hooked under the bar,
        the thumb over the near side.
      */}
      <group position={HAND_L}>
        <mesh material={skin} scale={[0.042, 0.11, 0.09]}>
          <sphereGeometry args={[1, 12, 8]} />
        </mesh>
        {[-0.06, -0.02, 0.02, 0.06].map((z) => (
          <group key={z}>
            <Digit at={[0.035, -0.12, z]} rot={[0, 0, 0.2]} r={0.02} len={0.13} material={skin} />
            <Digit at={[-0.005, -0.18, z]} rot={[0, 0, Math.PI / 2]} r={0.019} len={0.11} material={skin} />
          </group>
        ))}
        <Digit at={[-0.045, -0.07, -0.06]} rot={[0.5, 0, -0.2]} r={0.022} len={0.14} material={skin} />
      </group>
      {/* a watch on the left wrist, its face outboard */}
      <mesh position={[arms.wristL[0], arms.wristL[1] + 0.13, arms.wristL[2]]} rotation={[Math.PI / 2, 0, 0]} material={frame}>
        <torusGeometry args={[0.128, 0.012, 6, 16]} />
      </mesh>
      <mesh position={[arms.wristL[0] - 0.135, arms.wristL[1] + 0.13, arms.wristL[2]]} material={steel}>
        <boxGeometry args={[0.03, 0.11, 0.1]} />
      </mesh>
      <mesh position={[arms.wristL[0] - 0.152, arms.wristL[1] + 0.13, arms.wristL[2]]} material={dial}>
        <boxGeometry args={[0.005, 0.08, 0.07]} />
      </mesh>

      {/* the briefcase, hanging at his left knee: a slab, an arched handle, two clasps and a lock */}
      <group position={[HAND_L[0], HANDLE_Y, HAND_L[2]]}>
        <mesh position={[0, -0.475, 0]} material={leather}>
          <boxGeometry args={[0.18, 0.95, 1.3]} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} material={leather}>
          <torusGeometry args={[0.16, 0.022, 6, 14, Math.PI]} />
        </mesh>
        {[-0.42, 0.42].map((z) => (
          <mesh key={z} position={[-0.1, -0.08, z]} material={brass}>
            <boxGeometry args={[0.02, 0.06, 0.14]} />
          </mesh>
        ))}
        <mesh position={[-0.1, -0.08, 0]} material={brass}>
          <boxGeometry args={[0.02, 0.08, 0.1]} />
        </mesh>
      </group>

      {/* the lanyard, out from under the collar, and the badge; the building is full of them this week */}
      {cloth.lanyard.map((l, i) => (
        <Loft key={i} {...l} material={strap} segs={1} />
      ))}
      <group position={cloth.badge.p} rotation={[-0.06, 0, 0]}>
        <BadgeCard card={badge} ink={ink} photo={skin} />
      </group>

      {/* the head, turned further into the car than the body: he is listening */}
      <group position={[0, CHIN, -0.05]} rotation={[0.04, 0.5, 0.03]}>
        <Head face={face} mats={faceMats}>
          <Hair face={face} hair={HAIR} material={hair} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * specs.eyeX, specs.eyeY, specs.rimZ]} material={frame}>
                <torusGeometry args={[specs.r, 0.008, 6, 20]} />
              </mesh>
              <mesh
                position={[s * (specs.eyeX + specs.r + (specs.earX - specs.eyeX - specs.r) / 2), specs.eyeY + 0.01, specs.rimZ + specs.templeLen / 2]}
                rotation={[0, s * Math.atan2(specs.earX - specs.eyeX - specs.r, specs.templeLen), 0]}
                material={frame}
              >
                <boxGeometry args={[0.012, 0.014, Math.hypot(specs.templeLen, specs.earX - specs.eyeX - specs.r)]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, specs.eyeY + 0.015, specs.rimZ]} material={frame}>
            <boxGeometry args={[2 * (specs.eyeX - specs.r) + 0.01, 0.012, 0.012]} />
          </mesh>
        </Head>
      </group>

      {/* what Space hits, and what a walk bumps into */}
      <mesh ref={hit} position={[0, 3.3, 0]} visible={false}>
        <boxGeometry args={[1.5, 6.2, 1.1]} />
      </mesh>
      <Collider minX={AT[0] - 1.05} maxX={AT[0] + 0.75} minZ={AT[2] - 0.7} maxZ={AT[2] + 0.65} />
    </group>
  )
}
