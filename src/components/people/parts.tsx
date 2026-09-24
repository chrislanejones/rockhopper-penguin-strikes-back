import * as THREE from 'three'
import type { Ring } from '../../lib/loft'
import { Limb, Loft } from './Loft'

/*
  What the two men who stand still have in common below the neck: shoes,
  trouser legs, fingers, the conference badge, and the bit of geometry that
  says where an elbow goes. The clothes and the poses are their own.
*/

type V3 = [number, number, number]

/** A frame for a hand: fingers run along `y`, `x` runs across the knuckles, and `z` comes out of the back of it. */
export function handFrame(x: V3, y: V3) {
  const Y = new THREE.Vector3(...y).normalize()
  const X = new THREE.Vector3(...x)
  const Z = X.clone().cross(Y).normalize()
  X.crossVectors(Y, Z).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z))
}

/** Where the elbow is, given the shoulder, the wrist and the two lengths: it hangs toward `pole`. */
export function elbowAt(shoulder: V3, wrist: V3, a: number, b: number, pole: V3): V3 {
  const S = new THREE.Vector3(...shoulder)
  const dir = new THREE.Vector3(...wrist).sub(S)
  const d = Math.min(dir.length(), a + b - 0.01)
  dir.normalize()
  const cosA = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)
  const P = new THREE.Vector3(...pole)
  P.addScaledVector(dir, -dir.dot(P)).normalize()
  return S.addScaledVector(dir, a * cosA)
    .addScaledVector(P, a * Math.sqrt(1 - cosA * cosA))
    .toArray()
}

/** A finger, or a length of one: round at both ends. */
export function Digit({
  at,
  rot,
  r,
  len,
  material,
}: {
  at: V3
  rot?: V3
  r: number
  len: number
  material: THREE.Material
}) {
  return (
    <mesh position={at} rotation={rot} material={material}>
      <capsuleGeometry args={[r, Math.max(len - 2 * r, 0.001), 3, 8]} />
    </mesh>
  )
}

/** An oxford, toe to -z: the welt of the upper, the vamp sloping up from the toe, the opening the ankle goes into. */
const SHOE: Ring[] = [
  { y: 0.04, w: 0.165, zf: -0.64, zb: 0.23, c: -0.08, n: 2.6, nb: 2.2 },
  { y: 0.13, w: 0.16, zf: -0.6, zb: 0.225, c: -0.08, n: 2.6, nb: 2.2 },
  { y: 0.2, w: 0.145, zf: -0.43, zb: 0.215, c: -0.04, n: 2.3, nb: 2.2 },
  { y: 0.27, w: 0.125, zf: -0.14, zb: 0.2, c: 0.03 },
  { y: 0.31, w: 0.115, zf: -0.07, zb: 0.19, c: 0.05 },
]
const SOLE: Ring[] = [
  { y: 0, w: 0.178, zf: -0.66, zb: 0.245, c: -0.08, n: 2.6, nb: 2.2 },
  { y: 0.05, w: 0.178, zf: -0.66, zb: 0.245, c: -0.08, n: 2.6, nb: 2.2 },
]

// trouser legs: [fraction along, across, front-to-back]
const THIGH: Array<[number, number, number]> = [
  [0, 0.31, 0.34],
  [1, 0.22, 0.24],
]
const SHIN: Array<[number, number, number]> = [
  [0, 0.22, 0.24],
  [0.35, 0.215, 0.235],
  [1, 0.2, 0.225],
]

/**
 * One leg of a standing man, `s` = -1 his left, 1 his right: a trouser leg
 * with a thigh and a knee in it, breaking on a laced shoe with a welt and a
 * sole, the foot turned out a little. Stands on y = 0.
 */
export function Leg({
  s,
  hip,
  knee,
  x,
  cloth,
  shoe,
  sole,
}: {
  s: number
  hip: number
  knee: number
  x: number
  cloth: THREE.Material
  shoe: THREE.Material
  sole: THREE.Material
}) {
  return (
    <group>
      <Limb a={[s * x, hip, 0]} b={[s * (x + 0.01), knee, -0.02]} radii={THIGH} material={cloth} />
      <Limb a={[s * (x + 0.01), knee, -0.02]} b={[s * (x + 0.025), 0.2, 0.03]} radii={SHIN} material={cloth} />
      <mesh position={[s * (x + 0.01), knee, -0.02]} material={cloth} scale={[1, 1, 1.08]}>
        <sphereGeometry args={[0.222, 12, 8]} />
      </mesh>
      <group position={[s * (x + 0.03), 0, 0]} rotation={[0, -s * 0.14, 0]}>
        <Loft rings={SOLE} material={sole} segs={14} />
        <Loft rings={SHOE} material={shoe} segs={14} smooth={1} />
        {[0, 1, 2].map((k) => (
          <mesh key={k} position={[0, 0.237 + k * 0.017, -0.3 + 0.07 * k]} rotation={[-0.24, 0, 0]} material={sole}>
            <boxGeometry args={[0.1, 0.012, 0.02]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** The conference badge on the end of a lanyard: a card, a band across the top, a photo and two lines of name. */
export function BadgeCard({
  card,
  ink,
  photo,
}: {
  card: THREE.Material
  ink: THREE.Material
  photo: THREE.Material
}) {
  return (
    <>
      <mesh material={card}>
        <boxGeometry args={[0.3, 0.42, 0.015]} />
      </mesh>
      <mesh position={[0, 0.16, -0.01]} material={ink}>
        <boxGeometry args={[0.3, 0.07, 0.006]} />
      </mesh>
      <mesh position={[-0.08, 0.0, -0.01]} material={photo}>
        <boxGeometry args={[0.1, 0.12, 0.006]} />
      </mesh>
      <mesh position={[0.05, 0.02, -0.01]} material={ink}>
        <boxGeometry args={[0.11, 0.015, 0.006]} />
      </mesh>
      <mesh position={[0.05, -0.02, -0.01]} material={ink}>
        <boxGeometry args={[0.11, 0.015, 0.006]} />
      </mesh>
    </>
  )
}
