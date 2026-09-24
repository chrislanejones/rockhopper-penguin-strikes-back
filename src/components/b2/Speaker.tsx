import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { B2 } from '../../scene/b2'
import { useOpenable } from '../../lib/registry'
import { useOffice } from '../../state/store'
import { makeFace, type FaceRole, type FaceSpec, type HairSpec } from '../../lib/face'
import { cutRings, frontAngle, letOut, smoothRings, surfaceAt, type FullRing, type Ring } from '../../lib/loft'
import { Collider } from '../props/primitives'
import { Hair, Head } from '../people/Head'
import { Limb, Loft } from '../people/Loft'
import { BadgeCard, Digit, Leg, handFrame } from '../people/parts'
import { onBroadcast } from './Broadcast'

type V3 = [number, number, number]

const { stage } = B2
/** He stands behind the podium, which Stage.tsx puts at this spot. */
export const SPEAKER_AT: V3 = [stage.x0 + 7.5, stage.h, stage.z1 - 2.4 - 1.5]
const AT = SPEAKER_AT

// Landmark heights from the stage floor, in feet: a man of six foot one,
// a little taller and broader than the one in the lift. He is authored
// facing -Z like the player and turned to face the house.
const KNEE = 1.72
const HIP = 3.1
const BELT = 3.76
const SHOULDER = 4.86
const CHIN = 5.28
const HIP_X = 0.29
const SHOULDER_X = 0.62

/**
 * The shirt, tucked in: out of the belt, a little fuller over the stomach
 * than a younger man's, the chest, the shoulder line — softer than a padded
 * jacket's — and the slope up to the collar.
 */
const SHIRT: Ring[] = [
  { y: 3.7, w: 0.5, zf: -0.4, zb: 0.335, n: 2.4 },
  { y: 3.95, w: 0.53, zf: -0.44, zb: 0.355, n: 2.4 },
  { y: 4.42, w: 0.6, zf: -0.455, zb: 0.395, n: 2.3 },
  { y: 4.76, w: 0.645, zf: -0.41, zb: 0.385, n: 2.3 },
  { y: 4.95, w: 0.61, zf: -0.31, zb: 0.325, n: 2.2 },
  { y: 5.07, w: 0.42, zf: -0.24, zb: 0.285, n: 2.1 },
  { y: 5.15, w: 0.25, zf: -0.2, zb: 0.25 },
]
/** The slacks from the belt to where the legs part: a seat behind, flat in front. */
const SEAT: Ring[] = [
  { y: 2.78, w: 0.56, zf: -0.35, zb: 0.4, n: 2.4 },
  { y: 3.2, w: 0.585, zf: -0.405, zb: 0.45, n: 2.4 },
  { y: 3.8, w: 0.505, zf: -0.405, zb: 0.34, n: 2.4 },
]
const NECK: Ring[] = [
  { y: 5.05, w: 0.21, zf: -0.17, zb: 0.255 },
  { y: 5.3, w: 0.19, zf: -0.175, zb: 0.205 },
  { y: 5.56, w: 0.195, zf: -0.17, zb: 0.215 },
]
const COLLAR: Ring[] = [
  { y: 5.1, w: 0.24, zf: -0.22, zb: 0.275 },
  { y: 5.27, w: 0.205, zf: -0.195, zb: 0.22 },
]
/** Where the collar stands open, and the placket runs down from. */
const THROAT = 5.12

// shirt sleeves: [fraction along, across, front-to-back]
const UPPER: Array<[number, number, number]> = [
  [0, 0.185, 0.195],
  [1, 0.15, 0.155],
]
const FORE: Array<[number, number, number]> = [
  [0, 0.15, 0.15],
  [0.85, 0.12, 0.125],
  [1, 0.115, 0.12],
]

const FACE: FaceSpec = {
  h: 0.84,
  soft: 0,
  segs: 20,
  smooth: 2,
  lid: 0.3,
  lash: 0.05,
  slant: 0.01,
  eye: 1.1,
  nose: 1.1,
  lips: 0.85,
  smile: 0.45,
  brow: [0.615, 0.028, 0.05],
  gaze: [0, 0],
}
/** Gray, short, and further back off the forehead than it used to be. */
const HAIR: HairSpec = {
  from: 0.27,
  line: [
    [0.27, 150],
    [0.34, 124],
    [0.42, 103],
    [0.465, 97],
    [0.5, 80],
    [0.6, 74],
    [0.72, 69],
    [0.8, 62],
    [0.86, 47],
    [0.895, 0],
  ],
  grow: [1.03, 1.05, 1.035],
}

/** A strip of cloth lying on the shirt between two heights, `d` proud of it, its edges stated in feet across. */
function strip(y0: number, y1: number, d: number, edges: (y: number) => [number, number]) {
  return {
    rings: cutRings(letOut(SHIRT, d), y0, y1, 2),
    span: (r: FullRing): [number, number] => {
      const [x0, x1] = edges(r.y)
      return [frontAngle(r, x0), frontAngle(r, x1)]
    },
  }
}

/** What he says if you bother him before the program. */
const LINES = [
  'Tom Rendell, Parliament. Chief Technology Officer of the island. On at eight.',
  'He has given this keynote before. It shows, in a good way.',
]

/*
  The crossed arms. The upper arms come down the ribs and forward; the left
  forearm lies across the stomach and the right lies over it and further
  out, which is what keeps two forearms from passing through each other.
  The right hand closes on the left upper arm; the left goes out of sight
  under the right elbow, which is most of what makes the pose read.
*/
const ARMS = {
  shoulderR: [SHOULDER_X, SHOULDER, 0] as V3,
  shoulderL: [-SHOULDER_X, SHOULDER, 0] as V3,
  elbowR: [0.67, 3.95, -0.34] as V3,
  elbowL: [-0.67, 3.9, -0.32] as V3,
  wristR: [-0.2, 4.1, -0.78] as V3,
  wristL: [0.24, 3.86, -0.6] as V3,
  /** Where each hand is going: the far upper arm. */
  gripR: [-0.62, 4.16, -0.4] as V3,
  gripL: [0.6, 3.95, -0.42] as V3,
}

/**
 * A hand laid on the far arm: palm, four fingers stacked one over another
 * and closing round it, thumb along the top. Fingers run along `to - from`
 * and curl toward the body, whichever way across it the hand is going.
 */
function RestingHand({ from, to, skin }: { from: V3; to: V3; skin: THREE.Material }) {
  const quat = useMemo(() => {
    const along: V3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
    const q = handFrame([0, 1, 0], along)
    const curlsTo = new THREE.Vector3(0, 0, 1).applyQuaternion(q)
    return curlsTo.z < 0 ? handFrame([0, -1, 0], along) : q
  }, [from, to])
  return (
    <group position={from} quaternion={quat}>
      <mesh position={[0, 0.17, 0]} material={skin} scale={[0.1, 0.13, 0.045]}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
      {[-0.066, -0.022, 0.022, 0.066].map((x, i) => (
        <group key={x}>
          <Digit at={[x, 0.34, 0.012]} rot={[0.18, 0, 0]} r={0.022} len={0.15 - Math.abs(i - 1.4) * 0.012} material={skin} />
          <Digit at={[x, 0.45, 0.045]} rot={[0.45, 0, 0]} r={0.02} len={0.13 - Math.abs(i - 1.4) * 0.012} material={skin} />
        </group>
      ))}
      <Digit at={[0.115, 0.2, 0.0]} rot={[0, 0, -0.5]} r={0.024} len={0.17} material={skin} />
    </group>
  )
}

/**
 * Tom Rendell, at the podium.
 *
 * Built the way the man in the lift is built — lofted, not stacked, and
 * baked into no model file, because he stands still all evening. White
 * button-down, charcoal slacks, gray hair, arms crossed while the room
 * fills; the pose is his staff photo's. Space on him gets you the billing.
 */
export function Speaker() {
  const skin = useMemo(() => M(0xd6a37e, { roughness: 0.8 }), [])
  const shirt = useMemo(() => M(0xe6e5de, { roughness: 0.8, side: THREE.DoubleSide }), [])
  // the placket and the collar's fold, a tone down so they show on white
  const seam = useMemo(() => M(0xd3d1c8, { roughness: 0.8, side: THREE.DoubleSide }), [])
  const button = useMemo(() => M(0xc9c6bb, { roughness: 0.5 }), [])
  const slacks = useMemo(() => M(0x33363d, { roughness: 0.9 }), [])
  const belt = useMemo(() => M(0x221d19, { roughness: 0.6 }), [])
  const buckle = useMemo(() => M(0xa9adb3, { roughness: 0.3, metalness: 0.8 }), [])
  const shoe = useMemo(() => M(0x1b1c20, { roughness: 0.45 }), [])
  const sole = useMemo(() => M(0x0c0c0e, { roughness: 0.9 }), [])
  const hair = useMemo(() => M(0x8f8f8b, { roughness: 0.7, side: THREE.DoubleSide }), [])
  const strap = useMemo(() => M(0x1d3b8a, { roughness: 1, side: THREE.DoubleSide }), [])
  const badge = useMemo(() => M(0xf2f0e8, { roughness: 0.7 }), [])
  const ink = useMemo(() => M(0x1d3b8a, { roughness: 0.7 }), [])
  const faceMats = useMemo<Record<FaceRole, THREE.Material>>(
    () => ({
      skin,
      shade: M(0xaa7a5c, { roughness: 0.8 }),
      sclera: M(0xf3f0ea, { roughness: 0.3 }),
      iris: M(0x5a4030, { roughness: 0.25 }),
      pupil: M(0x0b0a0a, { roughness: 0.2 }),
      lip: M(0xb98672, { roughness: 0.75 }),
      lipLine: M(0x6e4a3c, { roughness: 0.8 }),
      brow: M(0x6f6d68, { roughness: 0.7 }),
      lash: M(0x5e4234, { roughness: 0.8 }),
    }),
    [skin],
  )

  const face = useMemo(() => makeFace(FACE), [])

  /*
    What lies on the shirt: the placket down the front with its buttons, the
    lanyard from under the collar, the badge on the end of it — hanging high,
    above the arms. Strips of the shirt's own surface, so they follow it.
  */
  const cloth = useMemo(() => {
    const surface = smoothRings(SHIRT, 2)
    const BADGE_TOP = 4.72
    const lanyardX = (y: number) => 0.035 + ((y - BADGE_TOP) / (THROAT - BADGE_TOP)) * 0.16
    return {
      placket: strip(BELT - 0.04, THROAT, 0.008, () => [-0.05, 0.05]),
      buttons: [4.92, 4.62, 4.32].map((y) => surfaceAt(surface, 0, y, 0.014)),
      lanyard: [-1, 1].map((s) =>
        strip(BADGE_TOP, THROAT, 0.02, (y) => (s > 0 ? [lanyardX(y) - 0.02, lanyardX(y) + 0.02] : [-lanyardX(y) - 0.02, -lanyardX(y) + 0.02])),
      ),
      badge: surfaceAt(surface, 0, BADGE_TOP - 0.2, 0.035),
      belt: cutRings(letOut(SEAT, 0.012), BELT - 0.07, BELT + 0.04),
      buckle: surfaceAt(smoothRings(SEAT, 0), 0, BELT, 0.03),
    }
  }, [])

  const hit = useRef<THREE.Mesh>(null)
  const said = useRef(0)
  const showHint = useOffice((s) => s.showHint)
  useOpenable(hit, () => showHint(LINES[said.current++ % LINES.length], 3000))

  return (
    <group ref={onBroadcast} position={AT} rotation={[0, Math.PI, 0]}>
      {/* slacks, a belt with a buckle, shoes */}
      {[-1, 1].map((s) => (
        <Leg key={s} s={s} hip={HIP} knee={KNEE} x={HIP_X} cloth={slacks} shoe={shoe} sole={sole} />
      ))}
      <Loft rings={SEAT} material={slacks} segs={20} smooth={2} />
      <Loft rings={cloth.belt} material={belt} segs={20} cap="none" />
      <mesh position={cloth.buckle.p} material={buckle}>
        <boxGeometry args={[0.16, 0.11, 0.02]} />
      </mesh>

      {/* the shirt: one surface from the belt to the collar, a placket and buttons down it */}
      <Loft rings={SHIRT} material={shirt} segs={24} smooth={2} />
      <Loft {...cloth.placket} material={seam} segs={1} />
      {cloth.buttons.map((b, i) => (
        <mesh key={i} position={b.p} material={button} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.02, 8, 6]} />
        </mesh>
      ))}

      {/* neck, and the collar round it, open at the throat, its points down onto the shirt */}
      <Loft rings={NECK} material={skin} segs={14} cap="none" />
      <Loft rings={COLLAR} material={shirt} segs={14} open={0.5} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.115, THROAT - 0.02, -0.235]} rotation={[0.32, s * 0.55, -s * 0.55]} material={seam}>
          <boxGeometry args={[0.1, 0.2, 0.015]} />
        </mesh>
      ))}

      {/* the arms, crossed: sleeve heads, sleeves, elbows, cuffs, hands */}
      {[ARMS.shoulderR, ARMS.shoulderL].map((p, i) => (
        <mesh key={i} position={[p[0] - Math.sign(p[0]) * 0.015, p[1] - 0.02, p[2]]} material={shirt} scale={[1, 0.95, 1.05]}>
          <sphereGeometry args={[0.188, 14, 10]} />
        </mesh>
      ))}
      <Limb a={ARMS.shoulderR} b={ARMS.elbowR} radii={UPPER} material={shirt} />
      <Limb a={ARMS.elbowR} b={ARMS.wristR} radii={FORE} material={shirt} />
      <Limb a={ARMS.shoulderL} b={ARMS.elbowL} radii={UPPER} material={shirt} />
      <Limb a={ARMS.elbowL} b={ARMS.wristL} radii={FORE} material={shirt} />
      {[ARMS.elbowR, ARMS.elbowL].map((p, i) => (
        <mesh key={i} position={p} material={shirt}>
          <sphereGeometry args={[0.152, 12, 8]} />
        </mesh>
      ))}
      <RestingHand from={ARMS.wristR} to={ARMS.gripR} skin={skin} />
      <RestingHand from={ARMS.wristL} to={ARMS.gripL} skin={skin} />

      {/* the lanyard and badge every speaker wears anyway */}
      {cloth.lanyard.map((l, i) => (
        <Loft key={i} {...l} material={strap} segs={1} />
      ))}
      <group position={cloth.badge.p} rotation={[-0.08, 0, 0]}>
        <BadgeCard card={badge} ink={ink} photo={skin} />
      </group>

      {/* the head, turned a touch as if he has seen someone he knows */}
      <group position={[0, CHIN, -0.05]} rotation={[0.03, 0.28, 0]}>
        <Head face={face} mats={faceMats}>
          <Hair face={face} hair={HAIR} material={hair} />
        </Head>
      </group>

      {/* what Space hits, and what a walk bumps into */}
      <mesh ref={hit} position={[0, 3.4, 0]} visible={false}>
        <boxGeometry args={[1.5, 6.4, 1.1]} />
      </mesh>
      <Collider
        minX={AT[0] - 0.7}
        maxX={AT[0] + 0.7}
        minZ={AT[2] - 0.55}
        maxZ={AT[2] + 0.55}
        above={stage.h - 1.5}
      />
    </group>
  )
}
