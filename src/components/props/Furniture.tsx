import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { M, mat } from '../../scene/materials'
import { canvasTex, lazy } from '../../lib/canvasTex'
import { keyboardTex, screenTexture, type ScreenSpec } from '../../textures/screens'
import { plaqueTex } from '../../textures/signage'
import { Box, BoxCollider, Panel } from './primitives'

/** Task chair: seat, back, gas lift, five-star base. */
export function Chair({
  x,
  z,
  ry,
  seat,
}: {
  x: number
  z: number
  ry: number
  seat: THREE.Material
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 1.55, 0]} material={seat} castShadow>
        <boxGeometry args={[1.6, 0.25, 1.6]} />
      </mesh>
      <mesh position={[0, 2.6, -0.7]} material={seat} castShadow>
        <boxGeometry args={[1.6, 1.8, 0.25]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={mat.steel}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 10]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * Math.PI * 2) / 5
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.5, 0.08, Math.sin(a) * 0.5]}
            rotation={[0, -a + Math.PI / 2, 0]}
            material={mat.black}
          >
            <boxGeometry args={[0.15, 0.1, 1.1]} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Desktop monitor on a stand, lit from behind by its own screen. */
export function Monitor({
  x,
  z,
  ry,
  screen,
  wide,
  arm,
  y = 0,
  tilt = -0.06,
  big,
}: {
  x: number
  z: number
  ry: number
  /** What this person has open. */
  screen: ScreenSpec
  wide?: boolean
  /**
   * On a bracket rather than its own foot.
   *
   * Five monitors on one desk means one pole and five arms, not five feet.
   * `y` then places the panel centre, since the stand is not setting it.
   */
  arm?: boolean
  y?: number
  tilt?: number
  /** A 43-inch panel. Two of these fill a desk. */
  big?: boolean
}) {
  const w = big ? 4.0 : wide ? 2.6 : 2.05
  const h = big ? 2.0 : wide ? 1.3 : 1.2
  const screenMat = useMemo(() => {
    const tex = screenTexture(screen, wide)
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: 0xffffff,
      emissiveIntensity: 0.85,
      color: 0x000000,
      roughness: 0.15,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, big, JSON.stringify(screen)])

  return (
    <group position={[x, 0, z]} rotation={[0, ry + Math.PI, 0]}>
      {!arm && (
        <>
          <mesh position={[0, 0.025, 0]} material={mat.plastic}>
            <cylinderGeometry args={[0.55, 0.6, 0.05, 24]} />
          </mesh>
          <mesh position={[0, 0.55, -0.12]} material={mat.plastic}>
            <boxGeometry args={[0.28, 1.1, 0.09]} />
          </mesh>
        </>
      )}
      <group position={[0, arm ? y : 1.3, 0]} rotation={[tilt, 0, 0]}>
        <mesh position={[0, 0, -0.12]} material={mat.plastic}>
          <boxGeometry args={[w * 0.8, h * 0.8, 0.18]} />
        </mesh>
        <mesh material={useMemo(() => M(0x1a1b1e, { roughness: 0.35 }), [])}>
          <boxGeometry args={[w + 0.1, h + 0.1, 0.06]} />
        </mesh>
        <mesh position={[0, 0, 0.032]} material={screenMat}>
          <planeGeometry args={[w - 0.05, h - 0.05]} />
        </mesh>
        <mesh position={[0, h / 2 + 0.02, 0.035]} material={mat.black}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
        <mesh position={[w / 2 - 0.1, -h / 2 - 0.02, 0.035]}>
          <planeGeometry args={[0.04, 0.02]} />
          <meshStandardMaterial color={0x000000} emissive={0x44ff88} emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  )
}

/** Keyboard, mouse and pad. */
export function Keyboard({ x, z }: { x: number; z: number }) {
  const faces = useMemo(() => {
    const top = new THREE.MeshStandardMaterial({ map: keyboardTex(), roughness: 0.6 })
    return [mat.plastic, mat.plastic, top, mat.plastic, mat.plastic, mat.plastic]
  }, [])
  return (
    <>
      <mesh position={[x, 0.035, z]} rotation={[-0.04, 0, 0]} material={faces} castShadow>
        <boxGeometry args={[1.5, 0.07, 0.55]} />
      </mesh>
      <mesh
        position={[x + 1.15, 0.07, z]}
        scale={[0.75, 0.45, 1.1]}
        material={useMemo(() => M(0x24262b, { roughness: 0.35 }), [])}
      >
        <sphereGeometry args={[0.16, 16, 12]} />
      </mesh>
      <mesh position={[x + 1.15, 0.01, z]} material={useMemo(() => M(0x1c1d21, { roughness: 1 }), [])}>
        <boxGeometry args={[0.9, 0.02, 0.75]} />
      </mesh>
    </>
  )
}

/** The pot: thrown terracotta, a foot, a swell, and a rolled rim. */
const POT = [
  [0.0, 0.0],
  [0.132, 0.0],
  [0.142, 0.014],
  [0.158, 0.06],
  [0.188, 0.2],
  [0.206, 0.3],
  [0.214, 0.336],
  [0.224, 0.352],
  [0.216, 0.366],
  [0.198, 0.358],
  [0.192, 0.33],
  [0.188, 0.28],
].map(([r, y]) => new THREE.Vector2(r, y))

/**
 * Compost, crowned the way it sits when nobody has topped the pot up. Its rim
 * is set wide enough to bite into the inside of the pot: the pot is a shell
 * with no back faces, so any gap here is a hole straight through to the carpet.
 *
 * Run rim-first, inward and up: a lathe takes its winding from the order of
 * the profile, and the other way round the crown faces down into the pot and
 * culls away to nothing.
 */
const SOIL = [
  [0.194, 0.0],
  [0.176, 0.008],
  [0.13, 0.026],
  [0.07, 0.038],
  [0.0, 0.042],
].map(([r, y]) => new THREE.Vector2(r, y))

const BLADE_SEGS = 9

/** Half-width along a blade: narrow at the soil, widest at a third, a point at the tip. */
const bladeWidth = (t: number) =>
  Math.max(
    0.06,
    Math.pow(Math.min(1, t / 0.28), 0.55) * Math.pow(Math.min(1, (1 - t) / 0.5), 0.75),
  )

/**
 * One blade: a tapered ribbon that rises, arcs away from the clump, and twists
 * about its own length, so no two edges catch the ceiling light the same way.
 * Built in radial/tangential terms and then swung round to `az`.
 */
function bladeGeometry(
  h: number,
  w: number,
  lean: number,
  twist: number,
  curl: number,
  az: number,
  r0: number,
) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const ca = Math.cos(az)
  const sa = Math.sin(az)
  for (let i = 0; i <= BLADE_SEGS; i++) {
    const t = i / BLADE_SEGS
    const half = w * bladeWidth(t)
    const rad = r0 + lean * t * t + curl * t ** 5
    const y = h * t * (1 - 0.1 * t * t) - curl * 0.6 * t ** 5
    const tw = twist * t
    const wx = Math.sin(tw) * half
    const wz = Math.cos(tw) * half
    for (const sgn of [-1, 1]) {
      const rx = rad + sgn * wx
      const rz = sgn * wz
      pos.push(rx * ca - rz * sa, y, rx * sa + rz * ca)
      uv.push(sgn < 0 ? 0 : 1, t)
    }
  }
  for (let i = 0; i < BLADE_SEGS; i++) {
    const a = i * 2
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * A whole clump, merged down to one geometry — a plant costs three draw calls
 * however many blades it grows. The generator is seeded, so the same plant
 * comes back every load rather than reshuffling itself on a refresh.
 */
function clumpGeometry(seed: number) {
  let s = seed * 9301 + 49297
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280

  const n = 9 + Math.floor(rnd() * 4)
  const blades = Array.from({ length: n }, (_, i) =>
    bladeGeometry(
      0.45 + rnd() * 0.3,
      0.055 + rnd() * 0.02,
      0.1 + rnd() * 0.2,
      (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.5),
      rnd() < 0.25 ? 0.06 + rnd() * 0.1 : 0,
      (i / n) * Math.PI * 2 + rnd() * 0.5,
      0.02 + rnd() * 0.05,
    ),
  )
  return mergeGeometries(blades)!
}

const potGeo = lazy(() => new THREE.LatheGeometry(POT, 16))
const soilGeo = lazy(() => new THREE.LatheGeometry(SOIL, 14))
const clumps = lazy(() => [1, 2, 3].map(clumpGeometry))

/**
 * Potted sansevieria — the plant every office settles on, because it survives
 * a fortnight of nobody watering it over Christmas.
 *
 * Three clumps, picked off the position, so a row of them down a corridor does
 * not read as one plant stamped five times.
 */
export function Plant({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  const clump = clumps()[Math.abs(Math.round(x * 7.3 + z * 3.1)) % 3]
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh geometry={potGeo()} material={mat.pot} />
      <mesh geometry={soilGeo()} position={[0, 0.302, 0]} material={mat.soil} />
      <mesh geometry={clump} position={[0, 0.328, 0]} material={mat.leaf} />
    </group>
  )
}

export function Trophy({ x, z }: { x: number; z: number }) {
  const cupMat = useMemo(() => M(0xd4a33a, { roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide }), [])
  return (
    <>
      <mesh position={[x, 0.06, z]} material={mat.black}>
        <boxGeometry args={[0.45, 0.12, 0.45]} />
      </mesh>
      <mesh position={[x, 0.32, z]} material={mat.gold}>
        <cylinderGeometry args={[0.05, 0.08, 0.4, 10]} />
      </mesh>
      <mesh position={[x, 0.72, z]} material={cupMat}>
        <cylinderGeometry args={[0.22, 0.1, 0.4, 16, 1, true]} />
      </mesh>
    </>
  )
}

/** Wall award: oak surround with an engraved brass plate. */
export function Plaque({
  x,
  y,
  z,
  ry,
  lines,
}: {
  x: number
  y: number
  z: number
  ry: number
  lines: string[]
}) {
  const faceMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: plaqueTex(lines), metalness: 0.5, roughness: 0.4 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines.join('|')],
  )
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh material={mat.oak}>
        <boxGeometry args={[1.1, 0.9, 0.06]} />
      </mesh>
      <Panel size={[0.85, 0.6]} material={faceMat} position={[0, 0, 0.035]} />
    </group>
  )
}

/**
 * Rubber Inaccessible Island rail. Standard issue for debugging, in this
 * office.
 *
 * The smallest flightless bird there is, and it lives nowhere else: a round
 * dark-chestnut body, stubby wings with faint white bars, a short black bill
 * and red eyes. It faces +X, the way the duck it replaced did, so anything
 * that picks it up holds it the same way round.
 */
export function Rail({ x, z }: { x: number; z: number }) {
  const body = useMemo(() => M(0x3b2a1e, { roughness: 0.8 }), [])
  const wing = useMemo(() => M(0x2e2118, { roughness: 0.8 }), [])
  const bar = useMemo(() => M(0xe8e2d4, { roughness: 0.7 }), [])
  const bill = useMemo(() => M(0x15120f, { roughness: 0.5 }), [])
  const eye = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xc0201a, emissive: 0x5a0a08, roughness: 0.3 }),
    [],
  )
  return (
    <>
      {/* body, round and low, and the stub of a tail */}
      <mesh position={[x, 0.17, z]} scale={[1.2, 0.85, 0.85]} material={body}>
        <sphereGeometry args={[0.18, 14, 10]} />
      </mesh>
      <mesh position={[x - 0.22, 0.2, z]} rotation={[0, 0, 1.3]} material={body}>
        <coneGeometry args={[0.05, 0.12, 6]} />
      </mesh>
      {/* the wings it cannot fly with, barred in white */}
      {[-1, 1].map((sz) => (
        <group key={sz}>
          <mesh position={[x - 0.03, 0.2, z + sz * 0.13]} scale={[1.1, 0.7, 0.3]} material={wing}>
            <sphereGeometry args={[0.12, 10, 8]} />
          </mesh>
          {[-0.06, 0, 0.06].map((o) => (
            <mesh key={o} position={[x - 0.03 + o, 0.2, z + sz * 0.165]} rotation={[0, 0, 0.5]} material={bar}>
              <boxGeometry args={[0.012, 0.09, 0.006]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* head, bill and the red eyes */}
      <mesh position={[x + 0.2, 0.3, z]} material={body}>
        <sphereGeometry args={[0.09, 12, 10]} />
      </mesh>
      <mesh position={[x + 0.31, 0.29, z]} rotation={[0, 0, -Math.PI / 2]} material={bill}>
        <coneGeometry args={[0.028, 0.1, 8]} />
      </mesh>
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[x + 0.25, 0.32, z + sz * 0.065]} material={eye}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      ))}
      {/* legs, dark and short */}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[x + 0.02, 0.04, z + sz * 0.06]} material={bill}>
          <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
        </mesh>
      ))}
    </>
  )
}

/** Desk robot with a glowing visor. */
export function Robot({ x, z }: { x: number; z: number }) {
  return (
    <>
      <mesh position={[x, 0.35, z]} material={mat.steel}>
        <boxGeometry args={[0.3, 0.4, 0.2]} />
      </mesh>
      <mesh position={[x, 0.68, z]} material={mat.steel}>
        <boxGeometry args={[0.24, 0.22, 0.22]} />
      </mesh>
      <mesh position={[x, 0.7, z + 0.12]}>
        <boxGeometry args={[0.18, 0.05, 0.02]} />
        <meshStandardMaterial color={0x000000} emissive={0x40ffd0} emissiveIntensity={1.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[x + s * 0.21, 0.35, z]} material={mat.plastic}>
            <boxGeometry args={[0.08, 0.35, 0.08]} />
          </mesh>
          <mesh position={[x + s * 0.08, 0.08, z]} material={mat.plastic}>
            <boxGeometry args={[0.1, 0.16, 0.12]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** A pile of paper that nobody is going to file. */
export function StackPaper({ x, z, n, y = 0 }: { x: number; z: number; n: number; y?: number }) {
  const sheets = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        x: x + (Math.random() - 0.5) * 0.06,
        y: y + 0.015 + i * 0.03,
        z: z + (Math.random() - 0.5) * 0.06,
        ry: (Math.random() - 0.5) * 0.1,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [x, z, n, y],
  )
  return (
    <>
      {sheets.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, s.ry, 0]} material={mat.white}>
          <boxGeometry args={[0.9, 0.03, 1.15]} />
        </mesh>
      ))}
    </>
  )
}

/**
 * A mug, turned rather than stacked.
 *
 * The profile goes up the outside, over the rolled rim and back down the
 * inside, so a lathe gives a genuinely hollow cup in one mesh with the
 * normals already right — you can see into it, and the passed-in material
 * needs no double-siding. It used to be a solid fourteen-sided cylinder with
 * a full torus floating beside it, which read as a lump and a ring.
 *
 * The handle is a partial torus turned so its two cut ends sit inside the
 * wall, which is where a handle joins a mug.
 */
const MUG_PROFILE = [
  [0.0, 0.0],
  [0.132, 0.0],
  [0.142, 0.014],
  [0.144, 0.045],
  [0.158, 0.2],
  [0.168, 0.31],
  [0.172, 0.335],
  [0.166, 0.348],
  [0.152, 0.336],
  [0.148, 0.31],
  [0.134, 0.05],
  [0.0, 0.038],
].map(([r, y]) => new THREE.Vector2(r, y))

export function Mug({
  x,
  z,
  material,
  coffee,
}: {
  x: number
  z: number
  material: THREE.Material
  /** Half full, and cold. */
  coffee?: boolean
}) {
  const geo = useMemo(() => new THREE.LatheGeometry(MUG_PROFILE, 26), [])
  const brew = useMemo(() => M(0x3a2216, { roughness: 0.25 }), [])

  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geo} material={material} castShadow receiveShadow />
      <mesh
        position={[0.2, 0.185, 0]}
        rotation={[0, 0, -2.2]}
        material={material}
        castShadow
      >
        <torusGeometry args={[0.105, 0.027, 8, 20, 4.4]} />
      </mesh>
      {coffee && (
        <mesh position={[0, 0.245, 0]} rotation={[-Math.PI / 2, 0, 0]} material={brew}>
          <circleGeometry args={[0.142, 24]} />
        </mesh>
      )}
    </group>
  )
}

/** Small framed photo, angled on a desk. */
export function DeskFrame({ x, z, ry }: { x: number; z: number; ry: number }) {
  const pic = useMemo(() => M(0x7ab7d6), [])
  return (
    <>
      <mesh position={[x, 0.35, z]} rotation={[0, ry, 0]} material={mat.oak}>
        <boxGeometry args={[0.9, 0.7, 0.05]} />
      </mesh>
      <mesh position={[x - 0.01, 0.35, z - 0.02]} rotation={[0, Math.PI + ry, 0]} material={pic}>
        <planeGeometry args={[0.7, 0.5]} />
      </mesh>
    </>
  )
}

/** Nameplate strip clipped to a cubicle panel. */
export function Nameplate({
  tex,
  x,
  z,
  ry,
}: {
  tex: THREE.Texture
  x: number
  z: number
  ry: number
}) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex }), [tex])
  return <Panel size={[2.2, 0.55]} material={m} position={[x, 5.4, z]} rotation={[0, ry, 0]} />
}

/** Marker tray under a whiteboard, with three dried-out markers. */
export function MarkerTray({ x, z }: { x: number; z: number }) {
  return (
    <>
      <Box size={[10, 0.15, 0.4]} material={mat.steel} position={[x, 2.0, z]} cast={false} />
      {(['red', 'blue', 'black'] as const).map((c, i) => (
        <Box
          key={c}
          size={[0.55, 0.12, 0.12]}
          material={mat[c]}
          position={[x - 2 + i * 0.9, 2.13, z - 0.03]}
          cast={false}
        />
      ))}
    </>
  )
}

/** Small canvas-textured plane, used all over for labels. */
export function LabelPlane({
  w,
  h,
  draw,
  texW = 160,
  texH = 70,
  position,
  rotation,
  doubleSided,
}: {
  w: number
  h: number
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void
  texW?: number
  texH?: number
  position: [number, number, number]
  rotation?: [number, number, number]
  doubleSided?: boolean
}) {
  const m = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: canvasTex(texW, texH, draw),
        side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texW, texH, doubleSided],
  )
  return <Panel size={[w, h]} material={m} position={position} rotation={rotation} />
}

/**
 * Small oscillating desk fan.
 *
 * Sat on a desk until the floor fans arrived. The one left is in the records
 * bay, on a stack of banker's boxes, cooling nothing.
 */
export function DeskFan({ x, y = 0, z }: { x: number; y?: number; z: number }) {
  const head = useRef<THREE.Group>(null)
  const blades = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * 6, [])
  const cageMat = useMemo(() => M(0x777777, { roughness: 0.4, metalness: 0.6 }), [])
  const bladeMat = useMemo(
    () => M(0xd8d8d4, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
    [],
  )
  const badgeMat = useMemo(() => M(0xc8102e), [])

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    if (blades.current) blades.current.rotation.z += d * 28
    if (head.current) head.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.9 + phase) * 0.65
  })

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.03, 0]} material={mat.black}>
        <cylinderGeometry args={[0.42, 0.46, 0.06, 24]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={mat.steel}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 10]} />
      </mesh>
      <group ref={head} position={[0, 1.0, 0]}>
        <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]} material={mat.black}>
          <cylinderGeometry args={[0.14, 0.16, 0.35, 16]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mat.black}>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 12]} />
        </mesh>
        <group ref={blades}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <mesh position={[0, 0.32, 0]} rotation={[0, 0.35, 0]} material={bladeMat}>
                <boxGeometry args={[0.22, 0.52, 0.01]} />
              </mesh>
            </group>
          ))}
        </group>
        <mesh position={[0, 0, 0.1]} material={cageMat}>
          <torusGeometry args={[0.6, 0.015, 6, 40]} />
        </mesh>
        <mesh position={[0, 0, -0.08]} material={cageMat}>
          <torusGeometry args={[0.6, 0.015, 6, 40]} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 6]}>
            <mesh position={[0, 0.3, 0.1]} material={cageMat}>
              <boxGeometry args={[0.01, 0.6, 0.01]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0, 0.115]} material={badgeMat}>
          <circleGeometry args={[0.09, 16]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * The white pedestal fan that facilities put in every office.
 *
 * The building's air handling gave up long before the budget for it did, so
 * each bay got one of these instead of a fix. At `ry` = 0 it blows toward +Z;
 * the head sweeps a narrow arc either side of that.
 *
 * Every fan stands in the corner of its bay, so the guard is the dimension
 * that matters: 2.6 ft across the rim means a centre 1.45 ft off each panel
 * line and no clipping. Blade tips stop 0.06 ft inside the guard and the
 * rings sit clear of the blade disc, so nothing here shares a plane with
 * anything else.
 */
export function FloorFan({
  x,
  z,
  ry = 0,
  streamers = false,
}: {
  x: number
  z: number
  ry?: number
  /** Party ribbons taped to the guard, for the one in the break room. */
  streamers?: boolean
}) {
  const head = useRef<THREE.Group>(null)
  const blades = useRef<THREE.Group>(null)
  const phase = useMemo(() => Math.random() * 6, [])

  /** One ribbon: where it is taped on, its colour, and its own wobble. */
  const ribbons = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2 + 0.4
        return {
          a,
          r: 0.5 + ((i * 7) % 5) * 0.16,
          colour: [0xd93a3a, 0xf2c53d, 0x3fa34d, 0x2b63c9, 0xe06fae, 0xf28c28][i % 6],
          phase: (i * 1.7) % 6,
          speed: 5 + (i % 4) * 1.1,
        }
      }),
    [],
  )
  const ribbonRefs = useRef<Array<Array<THREE.Group | null>>>(
    Array.from({ length: 11 }, () => [null, null, null, null]),
  )
  const ribbonMats = useMemo(
    () =>
      [0xd93a3a, 0xf2c53d, 0x3fa34d, 0x2b63c9, 0xe06fae, 0xf28c28].map((c) =>
        M(c, { roughness: 0.85, side: THREE.DoubleSide }),
      ),
    [],
  )

  const shell = useMemo(() => M(0xf1f1ee, { roughness: 0.55 }), [])
  const trim = useMemo(() => M(0xdcdedb, { roughness: 0.45, metalness: 0.15 }), [])
  const cageMat = useMemo(() => M(0xe6e8e5, { roughness: 0.35, metalness: 0.35 }), [])
  const bladeMat = useMemo(
    () => M(0xf6f6f3, { transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    [],
  )
  const badgeMat = useMemo(() => M(0x1c3d8f, { roughness: 0.5 }), [])

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    const t = state.clock.elapsedTime
    if (blades.current) blades.current.rotation.z += d * 18
    if (head.current) {
      // A short sweep, not the full 80 degrees — in a corner the wide arc
      // spent most of its time blowing at the panel.
      head.current.rotation.y = Math.sin(t * 0.5 + phase) * 0.22
    }
    if (!streamers) return
    /*
      Each ribbon is four segments nested inside one another, so a small
      rotation on each compounds down the tail. The wave travels outward —
      every segment lags the one before it — which is what makes it read as
      air moving along the ribbon rather than the whole thing waggling.
    */
    ribbonRefs.current.forEach((segs, i) => {
      const rb = ribbons[i]
      segs.forEach((g, k) => {
        if (!g) return
        const w = t * rb.speed + rb.phase - k * 0.9
        g.rotation.x = (k === 0 ? -0.5 : 0) + Math.sin(w) * (0.16 + k * 0.1)
        g.rotation.y = Math.sin(w * 0.7 + 1.3) * (0.1 + k * 0.08)
      })
    })
  })

  return (
    <>
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        {/* weighted base and the column out of it */}
        <mesh position={[0, 0.07, 0]} material={shell} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 1.05, 0.14, 28]} />
        </mesh>
        <mesh position={[0, 0.24, 0]} material={shell}>
          <cylinderGeometry args={[0.42, 0.6, 0.2, 22]} />
        </mesh>
        <mesh position={[0, 2.25, 0]} material={shell} castShadow>
          <cylinderGeometry args={[0.105, 0.13, 3.9, 16]} />
        </mesh>
        {/* height collar, the bit nobody has ever adjusted */}
        <mesh position={[0, 3.0, 0]} material={trim}>
          <cylinderGeometry args={[0.17, 0.17, 0.2, 16]} />
        </mesh>
        <mesh position={[0, 4.22, 0]} material={trim}>
          <cylinderGeometry args={[0.2, 0.18, 0.24, 16]} />
        </mesh>

        <group ref={head} position={[0, 4.55, 0]}>
          {/* motor can */}
          <mesh position={[0, 0, -0.56]} rotation={[Math.PI / 2, 0, 0]} material={shell} castShadow>
            <cylinderGeometry args={[0.37, 0.43, 0.95, 24]} />
          </mesh>
          <mesh position={[0, 0, -1.05]} rotation={[Math.PI / 2, 0, 0]} material={trim}>
            <sphereGeometry args={[0.37, 18, 12]} />
          </mesh>
          {/* hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={trim}>
            <cylinderGeometry args={[0.21, 0.21, 0.26, 18]} />
          </mesh>

          <group ref={blades}>
            {[0, 1, 2, 3, 4].map((i) => (
              <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
                <mesh position={[0, 0.66, 0]} rotation={[0, 0.42, 0]} material={bladeMat}>
                  <boxGeometry args={[0.52, 1.12, 0.03]} />
                </mesh>
              </group>
            ))}
          </group>

          {/* guard: a ring either side of the blade disc, spokes on the front */}
          <mesh position={[0, 0, 0.4]} material={cageMat}>
            <torusGeometry args={[1.18, 0.03, 6, 48]} />
          </mesh>
          <mesh position={[0, 0, -0.3]} material={cageMat}>
            <torusGeometry args={[1.18, 0.03, 6, 48]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} material={cageMat}>
            <torusGeometry args={[1.25, 0.055, 8, 48]} />
          </mesh>
          {/* Spokes run hub to rim, so each is one radius long, not one
              diameter — at a full diameter they shot out the far side. */}
          {Array.from({ length: 16 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI) / 8]}>
              <mesh position={[0, 0.59, 0.4]} material={cageMat}>
                <boxGeometry args={[0.03, 1.18, 0.03]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0, 0.44]} material={badgeMat}>
            <circleGeometry args={[0.25, 20]} />
          </mesh>

          {/* ribbons, taped to the front of the guard */}
          {streamers &&
            ribbons.map((rb, i) => (
              <group
                key={i}
                position={[Math.cos(rb.a) * rb.r, Math.sin(rb.a) * rb.r, 0.46]}
                rotation={[0, 0, rb.a]}
              >
                {/* the tape */}
                <mesh material={trim}>
                  <boxGeometry args={[0.12, 0.16, 0.02]} />
                </mesh>
                <group
                  ref={(g) => {
                    ribbonRefs.current[i][0] = g
                  }}
                >
                  <mesh position={[0, 0, 0.16]} material={ribbonMats[i % 6]}>
                    <boxGeometry args={[0.07, 0.012, 0.32]} />
                  </mesh>
                  <group
                    position={[0, 0, 0.32]}
                    ref={(g) => {
                      ribbonRefs.current[i][1] = g
                    }}
                  >
                    <mesh position={[0, 0, 0.15]} material={ribbonMats[i % 6]}>
                      <boxGeometry args={[0.06, 0.012, 0.3]} />
                    </mesh>
                    <group
                      position={[0, 0, 0.3]}
                      ref={(g) => {
                        ribbonRefs.current[i][2] = g
                      }}
                    >
                      <mesh position={[0, 0, 0.14]} material={ribbonMats[i % 6]}>
                        <boxGeometry args={[0.05, 0.012, 0.28]} />
                      </mesh>
                      <group
                        position={[0, 0, 0.28]}
                        ref={(g) => {
                          ribbonRefs.current[i][3] = g
                        }}
                      >
                        <mesh position={[0, 0, 0.13]} material={ribbonMats[i % 6]}>
                          <boxGeometry args={[0.04, 0.012, 0.26]} />
                        </mesh>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            ))}
        </group>
      </group>
      <BoxCollider x={x} z={z} w={2.3} d={2.3} />
    </>
  )
}
