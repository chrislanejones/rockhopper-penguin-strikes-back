import { useMemo } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { HALF, SOUTH_WALL } from '../scene/constants'
import { parliamentSignTex } from '../textures/island'
import { Box, Collider, Panel } from './props/primitives'

/**
 * Water cooler by the opening through to the wing.
 *
 * A bottled cooler the way they actually look: a five-gallon carboy stood
 * neck-down in a collar on top of a cabinet, two taps over a drip tray, and
 * a cup dispenser on the side. The old one was a white cylinder with two
 * blue cylinders balanced on it.
 */
export function WaterCooler() {
  const water = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x8fcde6,
        transparent: true,
        opacity: 0.55,
        roughness: 0.08,
        // No `transmission`: any transmissive material makes three render the
        // whole opaque scene a second time, every frame, for one jug of water.
      }),
    [],
  )
  const bottle = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xdff0f6,
        transparent: true,
        opacity: 0.25,
        roughness: 0.15,
        side: THREE.DoubleSide,
      }),
    [],
  )
  const shell = useMemo(() => M(0xf2f3f2, { roughness: 0.5 }), [])
  const grey = useMemo(() => M(0xb9bcc0, { roughness: 0.5 }), [])
  const dark = useMemo(() => M(0x2b2d31, { roughness: 0.5 }), [])
  const capBlue = useMemo(() => M(0x2b63c9, { roughness: 0.5 }), [])
  const capRed = useMemo(() => M(0xc8402e, { roughness: 0.5 }), [])
  const cupMat = useMemo(() => M(0xf6f6f2, { roughness: 0.7, side: THREE.DoubleSide }), [])

  const x = 19.6
  const z = HALF - 1.6
  /** Top of the cabinet, where the collar and the bottle sit. */
  const DECK = 3.4

  return (
    <group position={[x, 0, z]}>
      {/* cabinet, with a recess for the taps */}
      <mesh position={[0, DECK / 2, 0]} material={shell} castShadow>
        <boxGeometry args={[1.25, DECK, 1.15]} />
      </mesh>
      <mesh position={[0, 0.09, 0]} material={dark}>
        <boxGeometry args={[1.3, 0.18, 1.2]} />
      </mesh>
      <mesh position={[0, DECK - 0.86, -0.5]} material={dark}>
        <boxGeometry args={[0.95, 0.95, 0.2]} />
      </mesh>

      {/* two taps over a slotted drip tray */}
      {(
        [
          [-0.22, capBlue],
          [0.22, capRed],
        ] as const
      ).map(([ox, m], i) => (
        <group key={i} position={[ox, DECK - 0.62, -0.56]}>
          <mesh material={grey}>
            <boxGeometry args={[0.16, 0.16, 0.3]} />
          </mesh>
          <mesh position={[0, -0.16, -0.06]} material={grey}>
            <cylinderGeometry args={[0.045, 0.045, 0.22, 10]} />
          </mesh>
          <mesh position={[0, 0.14, -0.18]} rotation={[0.5, 0, 0]} material={m}>
            <boxGeometry args={[0.2, 0.28, 0.08]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, DECK - 1.42, -0.52]} material={grey}>
        <boxGeometry args={[0.8, 0.06, 0.28]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[-0.3 + i * 0.1, DECK - 1.38, -0.52]} material={dark}>
          <boxGeometry args={[0.03, 0.02, 0.22]} />
        </mesh>
      ))}

      {/* collar, then the carboy stood neck-down in it */}
      <mesh position={[0, DECK + 0.09, 0]} material={grey}>
        <cylinderGeometry args={[0.58, 0.64, 0.18, 20]} />
      </mesh>
      <mesh position={[0, DECK + 0.26, 0]} material={water}>
        <cylinderGeometry args={[0.16, 0.16, 0.34, 14]} />
      </mesh>
      {/* the bottle: neck, shoulder, body — water inside it, air at the top */}
      <mesh position={[0, DECK + 0.62, 0]} material={bottle}>
        <cylinderGeometry args={[0.52, 0.2, 0.44, 20, 1, true]} />
      </mesh>
      <mesh position={[0, DECK + 1.52, 0]} material={bottle}>
        <cylinderGeometry args={[0.56, 0.52, 1.4, 20, 1, true]} />
      </mesh>
      <mesh position={[0, DECK + 2.24, 0]} material={bottle}>
        <sphereGeometry args={[0.56, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, DECK + 1.26, 0]} material={water}>
        <cylinderGeometry args={[0.5, 0.48, 1.62, 20]} />
      </mesh>
      {/* moulded ribs round the middle, which every one of these has */}
      {[-0.28, 0, 0.28].map((oy) => (
        <mesh key={oy} position={[0, DECK + 1.5 + oy, 0]} material={bottle}>
          <torusGeometry args={[0.555, 0.03, 6, 22]} />
        </mesh>
      ))}

      {/* cup dispenser down the side, and one cup left in it */}
      <mesh position={[0.7, DECK - 0.5, 0.2]} material={grey}>
        <cylinderGeometry args={[0.15, 0.15, 1.3, 12, 1, true]} />
      </mesh>
      <mesh position={[0.7, DECK - 1.2, 0.2]} material={cupMat}>
        <cylinderGeometry args={[0.12, 0.09, 0.26, 12, 1, true]} />
      </mesh>

      <Collider minX={x - 0.9} maxX={x + 0.9} minZ={z - 0.9} maxZ={z + 0.9} />
    </group>
  )
}

/**
 * Agency sign in the lift lobby.
 *
 * The logo on a white acrylic panel with a standoff-mounted frame, which is
 * how every agency in the building announces itself.
 */
export function ParliamentSign() {
  const logo = parliamentSignTex()

  const face = useMemo(
    () => new THREE.MeshStandardMaterial({ map: logo, roughness: 0.4 }),
    [logo],
  )
  const acrylic = useMemo(() => M(0xf6f7f8, { roughness: 0.25 }), [])

  // South wall, in the clear run between the kanban board and the poster.
  const x = SOUTH_WALL.sign.x
  const y = 5.4
  const z = HALF - 0.06

  // The logo is 800 x 232.
  const w = SOUTH_WALL.sign.w
  const h = w * (232 / 800)

  return (
    <>
      <Box size={[w + 0.5, h + 0.5, 0.08]} material={acrylic} position={[x, y, z]} cast={false} />
      <Panel size={[w, h]} material={face} position={[x, y, z - 0.05]} rotation={[0, Math.PI, 0]} />
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as const
      ).map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[x + (sx * (w + 0.28)) / 2, y + (sy * (h + 0.28)) / 2, z - 0.09]}
          rotation={[Math.PI / 2, 0, 0]}
          material={mat.steel}
        >
          <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
        </mesh>
      ))}
    </>
  )
}
