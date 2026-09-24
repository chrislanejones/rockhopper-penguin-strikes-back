import { StrictMode, Suspense, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Passenger, PASSENGER_AT } from '../components/Passenger'
import { Speaker, SPEAKER_AT } from '../components/b2/Speaker'
import { CAR, EL, L } from '../scene/constants'

/**
 * The people, out of the building: /studio.html on the dev server.
 *
 * The passenger is a lift ride away and the speaker is two floors down, and
 * the player only ever sees herself in a restroom mirror, so looking at any
 * of them in the suite costs a minute a time. Here all three stand in a row
 * under the office's own light, a second after the page loads. Dev only —
 * the production build takes index.html and nothing else.
 *
 * Drag to orbit. For a fixed shot: ?cam=x,y,z&at=x,y,z&fov=n
 */

/** The 14 button, as Elevator.tsx has it: what the passenger's finger is on. */
const PRESS: [number, number, number] = [EL + 3.27, 1.95 + 8 * 0.3, CAR.z0 + 3.2]

const SPACING = 3.6

function Woman() {
  const { scene } = useGLTF('/models/office-woman.glb')
  // the app flat-shades her at load (lib/avatar.ts); so does this
  const model = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      const m = (o.material as THREE.MeshStandardMaterial).clone()
      m.flatShading = true
      o.material = m
    })
    return copy
  }, [scene])
  return <primitive object={model} />
}

const nums = (s: string | null, fallback: [number, number, number]) => {
  const v = s?.split(',').map(Number)
  return v?.length === 3 && v.every(Number.isFinite) ? (v as [number, number, number]) : fallback
}

function Studio() {
  const q = new URLSearchParams(location.search)
  const cam = nums(q.get('cam'), [0, 4.6, -11])
  const at = nums(q.get('at'), [0, 3.4, 0])
  const fov = Number(q.get('fov')) || 40

  return (
    <Canvas
      flat
      dpr={1}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov, near: 0.05, far: 200, position: cam }}
      onCreated={(state) =>
        Object.assign(window, {
          __r3f: state,
          /** Move the camera and draw, for a tab that is not being painted: __shot([x,y,z],[x,y,z],fov) */
          __shot: (cam: number[], at: number[], fov = 40) => {
            const s = state.get()
            const c = s.camera as THREE.PerspectiveCamera
            c.position.set(cam[0], cam[1], cam[2])
            c.fov = fov
            c.updateProjectionMatrix()
            ;(s.controls as unknown as { target: THREE.Vector3 } | null)?.target.set(at[0], at[1], at[2])
            for (let i = 0; i < 3; i++) s.advance(performance.now())
          },
        })
      }
    >
      <color attach="background" args={[0x8d949c]} />
      {/* the suite's light, from Lighting.tsx, with the sun brought round to the front */}
      <ambientLight color={0xe8eef8} intensity={L(0.42)} />
      <hemisphereLight args={[0xdde7ff, 0x7d7468, L(0.95)]} />
      <directionalLight color={0xfff1dc} intensity={L(1.1)} position={[-6, 12, -10]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color={0x5c6470} roughness={1} />
      </mesh>

      <Suspense fallback={null}>
        {/* everyone faces -z, which is the camera */}
        <group position={[SPACING - PASSENGER_AT[0], 0, -PASSENGER_AT[2]]}>
          <Passenger base={0} press={PRESS} />
        </group>
        <Woman />
        <group position={[-SPACING, 0, 0]} rotation={[0, Math.PI, 0]}>
          <group position={[-SPEAKER_AT[0], -SPEAKER_AT[1], -SPEAKER_AT[2]]}>
            <Speaker />
          </group>
        </group>
      </Suspense>

      <OrbitControls makeDefault target={at} />
    </Canvas>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Studio />
  </StrictMode>,
)
