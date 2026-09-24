import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { stirShadows } from '../state/store'
import * as THREE from 'three'
import { M } from '../scene/materials'

/**
 * Foam darts in flight, and where they ended up.
 *
 * A fixed pool: the blaster fires into it and the oldest dart is reused when
 * it runs out, so the office never fills up. Each dart flies, drops a little,
 * and sticks to whatever it hits — suction tips — or lies flat if that was the
 * floor. The pool lives at module level so the blaster can fire without a
 * render, and the component only paints it.
 */

const POOL = 14
const SPEED = 46
const GRAVITY = 12
const DRAG = 0.3
const LIFE = 4

interface Dart {
  active: boolean
  stuck: boolean
  age: number
  p: THREE.Vector3
  v: THREE.Vector3
  q: THREE.Quaternion
}

const pool: Dart[] = Array.from({ length: POOL }, () => ({
  active: false,
  stuck: false,
  age: 0,
  p: new THREE.Vector3(),
  v: new THREE.Vector3(),
  q: new THREE.Quaternion(),
}))
let nextSlot = 0
const queued: { from: THREE.Vector3; dir: THREE.Vector3 }[] = []

/** Fire one dart from `from` along `dir` (unit). */
export function fireDart(from: THREE.Vector3, dir: THREE.Vector3) {
  queued.push({ from: from.clone(), dir: dir.clone().normalize() })
}

const Y = new THREE.Vector3(0, 1, 0)
const step = new THREE.Vector3()
const heading = new THREE.Vector3()
const normal = new THREE.Vector3()
const flat = new THREE.Vector3()
const raycaster = new THREE.Raycaster()

function partOf(o: THREE.Object3D | null, root: THREE.Object3D) {
  while (o) {
    if (o === root) return true
    o = o.parent
  }
  return false
}

export function Darts() {
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const container = useRef<THREE.Group>(null)
  const refs = useRef<(THREE.Group | null)[]>([])
  const blue = useMemo(() => M(0x2b63c9, { roughness: 0.5 }), [])
  const orange = useMemo(() => M(0xff7a1a, { roughness: 0.5 }), [])
  const body = useMemo(() => new THREE.CylinderGeometry(0.03, 0.03, 0.28, 8), [])
  const tip = useMemo(() => new THREE.CylinderGeometry(0.035, 0.03, 0.06, 8), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const mine = container.current
    if (!mine) return

    while (queued.length) {
      const { from, dir } = queued.shift()!
      const d = pool[nextSlot]
      nextSlot = (nextSlot + 1) % POOL
      d.active = true
      d.stuck = false
      d.age = 0
      d.p.copy(from)
      d.v.copy(dir).multiplyScalar(SPEED)
      d.q.setFromUnitVectors(Y, dir)
    }

    raycaster.camera = camera
    for (let i = 0; i < POOL; i++) {
      const d = pool[i]
      const g = refs.current[i]
      if (!g) continue
      g.visible = d.active
      if (!d.active) continue

      if (!d.stuck) {
        stirShadows()
        d.age += dt
        if (d.age > LIFE) {
          d.active = false
          continue
        }
        d.v.y -= GRAVITY * dt
        d.v.multiplyScalar(1 - DRAG * dt)
        step.copy(d.v).multiplyScalar(dt)
        const len = step.length()
        heading.copy(step).divideScalar(len || 1)

        /*
          Swept: the ray covers the whole of this frame's travel, so a dart
          cannot pass through a partition between two samples. The pool is
          left out of the hit list, or the ray would find the dart it starts
          inside of.
        */
        raycaster.set(d.p, heading)
        raycaster.far = len + 0.08
        const hit = raycaster
          .intersectObjects(scene.children, true)
          .find((h) => !partOf(h.object, mine))

        if (hit) {
          d.stuck = true
          if (hit.face) {
            normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
          } else {
            normal.copy(heading).negate()
          }
          if (Math.abs(normal.y) > 0.7) {
            // a floor or a desk top: it does not stick, it lies there
            flat.copy(heading).setY(0)
            if (flat.lengthSq() < 1e-4) flat.set(1, 0, 0)
            flat.normalize()
            d.q.setFromUnitVectors(Y, flat)
            d.p.copy(hit.point).addScaledVector(normal, 0.035)
          } else {
            // a wall: the tip is on the surface and the rest stands proud
            d.q.setFromUnitVectors(Y, heading)
            d.p.copy(hit.point).addScaledVector(heading, -0.18)
          }
        } else {
          d.p.add(step)
          d.q.setFromUnitVectors(Y, heading)
        }
      }

      g.position.copy(d.p)
      g.quaternion.copy(d.q)
    }
  })

  return (
    <group ref={container}>
      {pool.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          visible={false}
        >
          <mesh geometry={body} material={blue} castShadow />
          <mesh geometry={tip} material={orange} position={[0, 0.17, 0]} />
        </group>
      ))}
    </group>
  )
}
