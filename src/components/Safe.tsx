import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { CLO, candela } from '../scene/constants'
import { useOpenable } from '../lib/registry'
import { carrying, useOffice } from '../state/store'
import { Box, Collider, Panel } from './props/primitives'
import { Collectable } from './props/Collectable'
import { gasCardTex, passportTex, safePlateTex } from '../textures/signage'

/**
 * The safe at the far end of storage 2301.
 *
 * Locked until you are carrying the brass key, which is on the desk in the
 * marketing cubicle. Press space without the key and it tells you so; press
 * space with the key and the door swings.
 *
 * What is in it is not worth the walk, which is the point.
 */
export function Safe({ x, z }: { x: number; z: number }) {
  const [open, setOpen] = useState(false)
  const pivot = useRef<THREE.Group>(null)
  const angle = useRef(0)
  const hit = useRef<THREE.Mesh>(null)
  const showHint = useOffice((s) => s.showHint)

  const body = useMemo(() => M(0x2f3339, { roughness: 0.5, metalness: 0.35 }), [])
  const doorMat = useMemo(() => M(0x363b42, { roughness: 0.45, metalness: 0.4 }), [])
  const trim = useMemo(() => M(0xb9a45a, { roughness: 0.3, metalness: 0.75 }), [])
  const steel = useMemo(() => M(0xa8adb4, { roughness: 0.3, metalness: 0.7 }), [])
  const felt = useMemo(() => M(0x2a2f36, { roughness: 1 }), [])
  const plate = useMemo(
    () => new THREE.MeshStandardMaterial({ map: safePlateTex(), roughness: 0.35, metalness: 0.5 }),
    [],
  )
  const passportCover = useMemo(() => M(0x1b2a4a, { roughness: 0.75 }), [])
  const passportFace = useMemo(
    () => new THREE.MeshStandardMaterial({ map: passportTex(), roughness: 0.75 }),
    [],
  )
  const pages = useMemo(() => M(0xe4dcc2, { roughness: 0.9 }), [])
  const cardMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: gasCardTex(), roughness: 0.35 }),
    [],
  )
  const band = useMemo(() => M(0xc8402e, { roughness: 0.8 }), [])

  const W = 2.4
  const HT = 2.6
  const D = 2.0
  const WALL = 0.22

  useOpenable(hit, () => {
    if (!carrying('safe-key')) {
      showHint('Locked. Small keyhole under the dial — the key is somewhere.', 3200)
      return
    }
    const next = !open
    setOpen(next)
    showHint(
      next
        ? 'The key turns. Inside: the box of passports, and a five pound fuel card.'
        : 'Safe shut.',
      3400,
    )
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = open ? -1.5 : 0
    angle.current += (target - angle.current) * Math.min(1, dt * 5)
    if (pivot.current) pivot.current.rotation.y = angle.current
  })

  return (
    <>
      <group position={[x, 0, z]}>
        {/* carcass: five slabs round a cavity that opens to -Z */}
        <Box size={[W, HT, WALL]} material={body} position={[0, HT / 2, (D - WALL) / 2]} />
        {[-1, 1].map((sx) => (
          <Box
            key={sx}
            size={[WALL, HT, D]}
            material={body}
            position={[(sx * (W - WALL)) / 2, HT / 2, 0]}
          />
        ))}
        <Box size={[W, WALL, D]} material={body} position={[0, HT - WALL / 2, 0]} />
        <Box size={[W, WALL, D]} material={body} position={[0, WALL / 2, 0]} />
        {/* feet, so it does not read as sunk into the floor */}
        {(
          [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ] as const
        ).map(([sx, sz], i) => (
          <Box
            key={i}
            size={[0.22, 0.1, 0.22]}
            material={steel}
            position={[(sx * (W - 0.5)) / 2, 0.05, (sz * (D - 0.5)) / 2]}
            cast={false}
          />
        ))}
        {/* felt lining, and one shelf */}
        <Box
          size={[W - WALL * 2 - 0.02, HT - WALL * 2 - 0.02, 0.03]}
          material={felt}
          position={[0, HT / 2, (D - WALL) / 2 - 0.12]}
          cast={false}
        />
        <Box
          size={[W - WALL * 2 - 0.06, 0.06, D - WALL - 0.2]}
          material={steel}
          position={[0, 1.36, 0.06]}
          cast={false}
        />

        {/*
          What is in it: the box of passports the compliance board has been
          asking about since March, and a five pound fuel card.
        */}
        <group position={[-0.38, 0.42, -0.28]} rotation={[0, 0.14, 0]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <group
              key={i}
              position={[((i % 2) - 0.5) * 0.06, 0.09 * i, ((i * 7) % 5) * 0.03 - 0.06]}
              rotation={[0, ((i * 11) % 7) * 0.05 - 0.15, 0]}
            >
              <Box size={[0.62, 0.08, 0.44]} material={passportCover} position={[0, 0, 0]} />
              <Box
                size={[0.58, 0.05, 0.41]}
                material={pages}
                position={[0.015, 0, 0]}
                cast={false}
              />
              {i === 4 && (
                <mesh
                  position={[0, 0.045, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  material={passportFace}
                >
                  <planeGeometry args={[0.6, 0.42]} />
                </mesh>
              )}
            </group>
          ))}
          {/* the elastic band round the lot, which is the filing system */}
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} material={band}>
            <torusGeometry args={[0.24, 0.014, 6, 20]} />
          </mesh>
        </group>

        <Collectable
          id="gas-card"
          label="£5 fuel card"
          hint="A five pound fuel card. It expired in 2019."
        >
          <group position={[0.42, 1.42, -0.46]} rotation={[0, 0.24, 0]}>
            <Box size={[0.56, 0.02, 0.35]} material={cardMat} position={[0, 0, 0]} />
            <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={cardMat}>
              <planeGeometry args={[0.55, 0.34]} />
            </mesh>
          </group>
        </Collectable>

        {/*
          A lamp in the crown, on only while the door is open.

          Without it the cavity is a black rectangle: the felt lining is dark
          on purpose, the ceiling grid does not reach inside a steel box, and
          the whole point of the walk is seeing what is in there.
        */}
        {open && (
          <>
            <pointLight
              position={[0, HT - 0.36, -0.62]}
              color={0xffeccd}
              intensity={candela(0.26, 2)}
              distance={3.4}
              decay={2}
            />
            {/* the shelf casts a hard line across the cavity, so light under it too */}
            <pointLight
              position={[0, 0.86, -0.7]}
              color={0xffeccd}
              intensity={candela(0.16, 1.7)}
              distance={2.6}
              decay={2}
            />
          </>
        )}

        {/* the door, hinged on the +X edge */}
        <group ref={pivot} position={[(W - WALL) / 2, 0, -(D - WALL) / 2]}>
          <Box size={[W, HT - 0.1, 0.2]} material={doorMat} position={[-W / 2 + 0.02, HT / 2, -0.1]} />
          {/* dial, spokes and the handle */}
          <group position={[-W / 2 + 0.34, 1.62, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={trim}>
              <cylinderGeometry args={[0.3, 0.3, 0.09, 24]} />
            </mesh>
            <mesh position={[0, 0.06, 0]} material={steel}>
              <cylinderGeometry args={[0.19, 0.19, 0.07, 20]} />
            </mesh>
          </group>
          <group position={[-W / 2 + 0.34, 0.92, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh material={trim}>
              <cylinderGeometry args={[0.11, 0.11, 0.12, 14]} />
            </mesh>
            {[0, 1, 2].map((i) => (
              <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} material={trim}>
                <boxGeometry args={[0.08, 0.09, 0.78]} />
              </mesh>
            ))}
          </group>
          {/* the keyhole everybody misses, under the dial */}
          <mesh position={[-W / 2 + 0.34, 1.24, -0.22]} material={mat.black}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
          </mesh>
          <Panel
            size={[0.72, 0.26]}
            material={plate}
            position={[-W / 2 + 1.42, 2.16, -0.21]}
            rotation={[0, Math.PI, 0]}
          />
          {/* hinges */}
          {[0.6, 2.0].map((y) => (
            <mesh key={y} position={[0.04, y, -0.02]} material={steel}>
              <cylinderGeometry args={[0.08, 0.08, 0.34, 10]} />
            </mesh>
          ))}

          <mesh ref={hit} position={[-W / 2 + 0.02, HT / 2, -0.16]} visible={false}>
            <boxGeometry args={[W, HT - 0.2, 0.4]} />
          </mesh>
        </group>
      </group>

      <Collider minX={x - W / 2} maxX={x + W / 2} minZ={z - D / 2} maxZ={z + D / 2} />
      {/*
        The open leaf, stated from the same numbers the hinge uses: it swings
        to -Z and ends up standing off the front face.
      */}
      {open && (
        <Collider
          minX={x + (W - WALL) / 2 - 0.3}
          maxX={x + (W - WALL) / 2 + 0.3}
          minZ={z - (D - WALL) / 2 - W}
          maxZ={z - (D - WALL) / 2 + 0.2}
        />
      )}
    </>
  )
}

/** Where it stands: the far end of the store room, past everything. */
export const SAFE_AT = { x: (CLO.x0 + CLO.x1) / 2 - 0.6, z: CLO.z1 - 1.6 } as const
