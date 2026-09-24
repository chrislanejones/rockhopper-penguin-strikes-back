import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { M, mat } from '../../scene/materials'
import { canvasTex } from '../../lib/canvasTex'
import { BoxCollider } from './primitives'

/** Architect lamp, permanently aimed at nothing in particular. */
function DeskLamp({ x, z }: { x: number; z: number }) {
  const shadeMat = useMemo(() => M(0x2b2d31, { side: THREE.DoubleSide }), [])
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.025, 0]} material={mat.dark}>
        <cylinderGeometry args={[0.3, 0.32, 0.05, 16]} />
      </mesh>
      <mesh position={[0, 0.65, 0]} rotation={[0, 0, 0.3]} material={mat.dark}>
        <cylinderGeometry args={[0.03, 0.03, 1.3, 8]} />
      </mesh>
      <mesh position={[0.35, 1.55, 0]} rotation={[0, 0, -1.1]} material={mat.dark}>
        <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
      </mesh>
      <mesh position={[0.9, 1.7, 0]} rotation={[0, 0, 0.6]} material={shadeMat}>
        <coneGeometry args={[0.3, 0.4, 16, 1, true]} />
      </mesh>
      {/* A glowing bulb rather than a real light: seven desks a light each is
          seven more shader permutations for every material in the building. */}
      <mesh position={[0.86, 1.62, 0]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={0xfff0d0} emissive={0xffe2b0} emissiveIntensity={2.2} />
      </mesh>
    </group>
  )
}

export interface DeskProps {
  x: number
  z: number
  ry: number
  w: number
  d: number
  /** Whatever this particular person keeps on their desk. */
  children?: ReactNode
  /** The standard-issue stapler. Off for a desk that needs the space. */
  stapler?: boolean
}

/**
 * A laminate workstation. Bolted down — it is the things on top that move.
 */
export function Desk({ x, z, ry, w, d, children, stapler = true }: DeskProps) {
  const group = useRef<THREE.Group>(null)

  const topMat = useMemo(
    () =>
      M(0xcdbf9f, {
        roughness: 0.55,
        map: canvasTex(
          256,
          256,
          (gg, W, Hh) => {
            gg.fillStyle = '#cdbf9f'
            gg.fillRect(0, 0, W, Hh)
            for (let i = 0; i < W; i += 2) {
              gg.fillStyle = `rgba(${(120 + Math.random() * 40) | 0},${(95 + Math.random() * 30) | 0},60,${0.08 + Math.random() * 0.12})`
              gg.fillRect(i, 0, 1 + Math.random() * 2, Hh)
            }
          },
          [2, 1],
        ),
      }),
    [],
  )
  const drawerMat = useMemo(() => M(0xcfc4ad), [])
  const cupMat = useMemo(() => M(0x333333, { side: THREE.DoubleSide }), [])

  const cableGeo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.9, 2.4, d / 2 - 0.35),
          new THREE.Vector3(1.0, 1.6, d / 2 - 0.2),
          new THREE.Vector3(0.8, 0.6, d / 2 - 0.3),
          new THREE.Vector3(-0.3, 0.12, d / 2 - 0.4),
        ]),
        20,
        0.03,
        6,
      ),
    [d],
  )

  const footprint = Math.max(w, d) + 0.2

  return (
    <>
      <BoxCollider x={x} z={z} w={footprint} d={footprint} />
      <group ref={group} position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 2.44, 0]} material={topMat} castShadow receiveShadow>
        <boxGeometry args={[w, 0.12, d]} />
      </mesh>
      {/* PVC edge band */}
      <mesh position={[0, 2.41, 0]} material={mat.dark}>
        <boxGeometry args={[w + 0.04, 0.06, d + 0.04]} />
      </mesh>

      {/* drawer pedestal right, panel leg left */}
      <mesh position={[w / 2 - 0.75, 1.15, 0.15]} material={mat.laminate} castShadow>
        <boxGeometry args={[1.35, 2.3, d - 0.5]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh position={[w / 2 - 0.75, 0.45 + i * 0.72, -d / 2 + 0.12]} material={drawerMat}>
            <boxGeometry args={[1.2, 0.6, 0.04]} />
          </mesh>
          <mesh position={[w / 2 - 0.75, 0.45 + i * 0.72, -d / 2 + 0.08]} material={mat.steel}>
            <boxGeometry args={[0.5, 0.05, 0.06]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-w / 2 + 0.25, 1.15, 0.15]} material={mat.laminate}>
        <boxGeometry args={[0.12, 2.3, d - 0.5]} />
      </mesh>
      <mesh position={[-0.7, 1.7, d / 2 - 0.12]} material={mat.laminate}>
        <boxGeometry args={[w - 1.8, 1.2, 0.08]} />
      </mesh>

      {/* grommet, cable drop, power strip */}
      <mesh position={[0.9, 2.45, d / 2 - 0.35]} material={mat.black}>
        <cylinderGeometry args={[0.13, 0.13, 0.14, 16]} />
      </mesh>
      <mesh geometry={cableGeo} material={mat.black} />
      <mesh position={[-0.5, 0.06, d / 2 - 0.4]} material={mat.white}>
        <boxGeometry args={[1.2, 0.12, 0.25]} />
      </mesh>

      {/* everything sitting on the desk lives in here, at desk height */}
      <group position={[0, 2.5, 0]}>
        {children}
        <DeskLamp x={-w / 2 + 0.5} z={d / 2 - 0.5} />
        {stapler && (
          <>
            <mesh position={[w / 2 - 0.9, 0.06, -0.2]} rotation={[0, -0.35, 0]} material={mat.black}>
              <boxGeometry args={[0.8, 0.12, 0.65]} />
            </mesh>
            <mesh position={[w / 2 - 1.2, 0.17, -0.2]} rotation={[0, -0.35, 0]} material={mat.black}>
              <boxGeometry args={[0.18, 0.1, 0.6]} />
            </mesh>
          </>
        )}
        <mesh position={[-w / 2 + 1.9, 0.2, 0.7]} material={cupMat}>
          <cylinderGeometry args={[0.14, 0.12, 0.4, 12, 1, true]} />
        </mesh>
        {(['blue', 'red', 'black', 'yellow'] as const).map((c, i) => (
          <mesh
            key={c}
            position={[-w / 2 + 1.9 + (i - 1.5) * 0.05, 0.35, 0.7 + (i % 2) * 0.05]}
            rotation={[0, 0, (i - 1.5) * 0.15]}
            material={mat[c]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.55, 6]} />
          </mesh>
        ))}
        {/* stickies stuck flat to the desk top */}
        {(
          [
            [0xfff28a, -2.3, -0.9, 0.3],
            [0xa8e8ff, -1.9, -1.05, -0.2],
            [0xffc0e0, 2.3, -1.0, 0.5],
          ] as const
        ).map(([c, ox, oz, rz], i) => (
          <mesh key={i} position={[ox, 0.006, oz]} rotation={[-Math.PI / 2, 0, rz]}>
            <planeGeometry args={[0.35, 0.35]} />
            <meshStandardMaterial color={c} roughness={0.85} />
          </mesh>
        ))}
        </group>
      </group>
    </>
  )
}

/** A desk with its chair on the user's side, back to the aisle. */
export function Workstation({
  x,
  z,
  ry,
  w,
  d,
  chair,
  children,
  stapler,
}: DeskProps & { chair: THREE.Material }) {
  return (
    <>
      <Desk x={x} z={z} ry={ry} w={w} d={d} stapler={stapler}>
        {children}
      </Desk>
      <ChairAt x={x - Math.sin(ry) * 2.9} z={z - Math.cos(ry) * 2.9} ry={ry} seat={chair} />
    </>
  )
}

// Re-exported here so a workstation is a single import at the call site.
import { Chair as ChairAt } from './Furniture'
