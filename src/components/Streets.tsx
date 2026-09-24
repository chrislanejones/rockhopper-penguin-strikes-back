import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GROUND_Y } from '../scene/constants'
import { BLOCK, CITY_EXTENT, ROAD_W, STREET_LINES, streetSegments } from '../scene/city'
import { blocksTex, roadTex } from '../textures/streets'

const ROAD_Y = GROUND_Y + 0.4
const CAR_Y = ROAD_Y + 0.1
/** Cars keep right, one lane either side of the centre line. */
const LANE = ROAD_W / 4

/** One run of roadway between the edge of the grid and the river bank. */
interface Segment {
  alongX: boolean
  line: number
  from: number
  to: number
}

/** Every drivable stretch of road in the city, with the river taken out. */
function useSegments(): Segment[] {
  return useMemo(() => {
    const out: Segment[] = []
    for (const alongX of [true, false]) {
      for (const line of STREET_LINES) {
        for (const [from, to] of streetSegments(alongX, line, CITY_EXTENT)) {
          if (to - from > 40) out.push({ alongX, line, from, to })
        }
      }
    }
    return out
  }, [])
}

interface Car {
  seg: Segment
  dir: number
  speed: number
  start: number
  colour: string
  tall: boolean
}

const PAINT = [
  '#c9ccd1', '#2f333a', '#b8bcc2', '#8b2f2a', '#25406b',
  '#f0f1f3', '#3f4a55', '#6d7278', '#1f5c46', '#c8a03a',
]

/**
 * Traffic on the grid below.
 *
 * Each car belongs to one road segment and wraps within it, so nothing ever
 * drives off the end of a street and into the water.
 */
function useCars(segments: Segment[], count: number): Car[] {
  return useMemo(
    () =>
      Array.from({ length: count }, () => {
        const seg = segments[(Math.random() * segments.length) | 0]
        return {
          seg,
          dir: Math.random() < 0.5 ? 1 : -1,
          speed: 38 + Math.random() * 34,
          start: seg.from + Math.random() * (seg.to - seg.from),
          colour: PAINT[(Math.random() * PAINT.length) | 0],
          tall: Math.random() < 0.22,
        }
      }),
    [segments, count],
  )
}

/** A sedan: low body with a cabin set back on it. Built once, drawn as instances. */
function useCarGeometry() {
  return useMemo(() => {
    const body = new THREE.BoxGeometry(15, 3.4, 6.4)
    body.translate(0, 1.7, 0)
    const cabin = new THREE.BoxGeometry(7.4, 2.6, 5.6)
    cabin.translate(-0.8, 4.0, 0)
    const merged = mergeGeometries([body, cabin])!
    body.dispose()
    cabin.dispose()
    return merged
  }, [])
}

function Traffic({ segments, count = 110 }: { segments: Segment[]; count?: number }) {
  const cars = useCars(segments, count)
  const geometry = useCarGeometry()
  const refs = useRef<(THREE.Object3D | null)[]>([])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    for (let i = 0; i < cars.length; i++) {
      const o = refs.current[i]
      if (!o) continue
      const c = cars[i]
      const { seg } = c
      let along = seg.alongX ? o.position.x : o.position.z
      along += c.dir * c.speed * dt
      // Wrap within this segment, never across the river.
      if (along > seg.to) along = seg.from
      if (along < seg.from) along = seg.to
      if (seg.alongX) o.position.x = along
      else o.position.z = along
    }
  })

  return (
    <Instances limit={count} geometry={geometry} castShadow={false} receiveShadow={false}>
      <meshStandardMaterial roughness={0.45} metalness={0.25} />
      {cars.map((c, i) => {
        const lane = c.dir * LANE
        const position: [number, number, number] = c.seg.alongX
          ? [c.start, CAR_Y, c.seg.line + lane]
          : [c.seg.line - lane, CAR_Y, c.start]
        const ry = c.seg.alongX
          ? c.dir > 0
            ? 0
            : Math.PI
          : c.dir > 0
            ? -Math.PI / 2
            : Math.PI / 2
        return (
          <Instance
            key={i}
            ref={(el: THREE.Object3D | null) => {
              refs.current[i] = el
            }}
            position={position}
            rotation={[0, ry, 0]}
            scale={[1, c.tall ? 1.45 : 1, 1]}
            color={c.colour}
          />
        )
      })}
    </Instances>
  )
}

/**
 * The street grid, the blocks between it, and the traffic on it.
 *
 * Roads sit a few inches proud of the block surface so the two never fight
 * over the same depth, and every run stops at the river bank.
 */
export function Streets() {
  const segments = useSegments()
  const road = useMemo(
    () => new THREE.MeshStandardMaterial({ map: roadTex(), roughness: 0.92 }),
    [],
  )
  const blocks = useMemo(
    () => new THREE.MeshStandardMaterial({ map: blocksTex(), roughness: 1 }),
    [],
  )
  const span = CITY_EXTENT * 2 + BLOCK

  return (
    <>
      {/* the ground the city stands on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} material={blocks}>
        <planeGeometry args={[span, span]} />
      </mesh>

      {segments.map((s, i) => {
        const len = s.to - s.from
        const mid = (s.from + s.to) / 2
        return s.alongX ? (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            position={[mid, ROAD_Y, s.line]}
            material={road}
          >
            <planeGeometry args={[ROAD_W, len]} />
          </mesh>
        ) : (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[s.line, ROAD_Y + 0.05, mid]}
            material={road}
          >
            <planeGeometry args={[ROAD_W, len]} />
          </mesh>
        )
      })}

      <Traffic segments={segments} />
    </>
  )
}
