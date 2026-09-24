import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { candela } from '../../scene/constants'
import { B2 } from '../../scene/b2'
import { canvasTex } from '../../lib/canvasTex'
import { BoxCollider } from '../props/primitives'

const { tables } = B2

/** Where every table stands. */
const TABLES = tables.xs.flatMap((x) => tables.zs.map((z) => ({ x, z })))

/** Chairs round each: evenly spaced, the first one off the aisle line. */
const ANGLES = Array.from({ length: tables.seats }, (_, i) => Math.PI / 6 + (i * 2 * Math.PI) / tables.seats)
const CHAIRS = TABLES.flatMap((t) =>
  ANGLES.map((a) => ({
    x: t.x + Math.cos(a) * (tables.r + 0.9),
    z: t.z + Math.sin(a) * (tables.r + 0.9),
    /** Turned to face the table: local +Z runs out along the radius, to the chair's back. */
    ry: Math.PI / 2 - a,
  })),
)

/** Where a chair stands and which way it faces: local +Z runs out through its back. */
export interface Chair {
  x: number
  z: number
  ry: number
}

/** A point in a chair's own frame — x across the seat, z toward its back — in the hall. */
const at = (c: Chair, dx: number, dz: number): [number, number] => [
  c.x + dx * Math.cos(c.ry) + dz * Math.sin(c.ry),
  c.z - dx * Math.sin(c.ry) + dz * Math.cos(c.ry),
]

/**
 * Where a banquet chair's uprights stand: two legs at the front corners,
 * and at the back two posts that are leg and back frame in one piece.
 */
const FRONT_LEGS: Array<[number, number]> = [[-0.55, -0.55], [0.55, -0.55]]
const REAR_POSTS: Array<[number, number]> = [[-0.58, 0.6], [0.58, 0.6]]

/**
 * A room's worth of gilt banquet chairs, `y` feet up, in six instanced draws.
 *
 * A chair is a cushion on a rail, two legs in front, two posts behind that
 * run up to carry a padded back and a top rail; they used to be a slab, a
 * plank and one peg, which from table height read as toadstools. The floor
 * and the balcony both set their tables with these.
 */
export function BanquetChairs({ chairs, y = 0 }: { chairs: Chair[]; y?: number }) {
  const gilt = useMemo(() => M(0xb8912e, { roughness: 0.35, metalness: 0.7 }), [])
  const cushion = useMemo(() => M(0x7a1a22, { roughness: 0.9 }), [])
  const geo = useMemo(
    () => ({
      seat: new THREE.BoxGeometry(1.35, 0.22, 1.35),
      rail: new THREE.BoxGeometry(1.3, 0.1, 1.3),
      back: new THREE.BoxGeometry(1.22, 1.0, 0.14),
      top: new THREE.BoxGeometry(1.32, 0.1, 0.1),
      leg: new THREE.CylinderGeometry(0.055, 0.055, 1.36, 8),
      post: new THREE.CylinderGeometry(0.055, 0.055, 3.3, 8),
    }),
    [],
  )
  return (
    <>
      <Instances geometry={geo.seat} material={cushion} limit={chairs.length}>
        {chairs.map((c, i) => (
          <Instance key={i} position={[c.x, y + 1.47, c.z]} rotation={[0, c.ry, 0]} />
        ))}
      </Instances>
      <Instances geometry={geo.rail} material={gilt} limit={chairs.length}>
        {chairs.map((c, i) => (
          <Instance key={i} position={[c.x, y + 1.31, c.z]} rotation={[0, c.ry, 0]} />
        ))}
      </Instances>
      <Instances geometry={geo.back} material={cushion} limit={chairs.length}>
        {chairs.map((c, i) => {
          const [x, z] = at(c, 0, 0.6)
          return <Instance key={i} position={[x, y + 2.7, z]} rotation={[0, c.ry, 0]} />
        })}
      </Instances>
      <Instances geometry={geo.top} material={gilt} limit={chairs.length}>
        {chairs.map((c, i) => {
          const [x, z] = at(c, 0, 0.6)
          return <Instance key={i} position={[x, y + 3.3, z]} rotation={[0, c.ry, 0]} />
        })}
      </Instances>
      <Instances geometry={geo.leg} material={gilt} limit={chairs.length * FRONT_LEGS.length}>
        {chairs.flatMap((c, i) =>
          FRONT_LEGS.map(([dx, dz], k) => {
            const [x, z] = at(c, dx, dz)
            return <Instance key={`${i}:${k}`} position={[x, y + 0.68, z]} />
          }),
        )}
      </Instances>
      <Instances geometry={geo.post} material={gilt} limit={chairs.length * REAR_POSTS.length}>
        {chairs.flatMap((c, i) =>
          REAR_POSTS.map(([dx, dz], k) => {
            const [x, z] = at(c, dx, dz)
            return <Instance key={`${i}:${k}`} position={[x, y + 1.65, z]} />
          }),
        )}
      </Instances>
    </>
  )
}

/**
 * A glass votive with an LED candle in it, on every table given — the cup,
 * the candle, the flame, and the pool it throws on the cloth. `y` is the
 * cup's centre: the tabletop plus the cup's half height. The floor and the
 * balcony both set their tables with these.
 *
 * It was a lit cylinder, which read as a lamp. None of these is a light:
 * a point light per table would be a term in every fragment in the hall.
 * The flame is emissive, the pool is a warm gradient added onto the cloth,
 * and a few real lights below each floor stand in for the lot of them.
 */
export function Votives({ at }: { at: Array<[number, number, number]> }) {
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xfff4e4,
        emissive: 0xffb877,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  )
  const wax = useMemo(() => M(0xf6efdf, { roughness: 0.7 }), [])
  const flame = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffe9b0,
        emissive: 0xffb348,
        emissiveIntensity: 3,
        roughness: 0.5,
      }),
    [],
  )
  // the pool fades out from the cup: a radial gradient, added onto the cloth
  const pool = useMemo(() => {
    const t = canvasTex(128, 128, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2)
      r.addColorStop(0, 'rgba(255,190,120,0.75)')
      r.addColorStop(0.45, 'rgba(255,160,90,0.32)')
      r.addColorStop(1, 'rgba(255,140,70,0)')
      g.fillStyle = r
      g.fillRect(0, 0, w, h)
    })
    return new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])
  const geo = useMemo(() => {
    const flameGeo = new THREE.SphereGeometry(0.06, 8, 8)
    flameGeo.scale(1, 1.9, 1)
    return {
      votive: new THREE.CylinderGeometry(0.3, 0.24, 0.55, 16, 1, true),
      base: new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16),
      candle: new THREE.CylinderGeometry(0.15, 0.15, 0.36, 12),
      flame: flameGeo,
      pool: new THREE.PlaneGeometry(3.2, 3.2),
    }
  }, [])

  return (
    <>
      {/* the pool first, flat on the cloth; then the candle, the cup round it, the flame */}
      <Instances geometry={geo.pool} material={pool} limit={at.length}>
        {at.map(([x, y, z], i) => (
          <Instance key={i} position={[x, y - 0.29, z]} rotation={[-Math.PI / 2, 0, 0]} />
        ))}
      </Instances>
      <Instances geometry={geo.base} material={glass} limit={at.length}>
        {at.map(([x, y, z], i) => (
          <Instance key={i} position={[x, y - 0.28, z]} />
        ))}
      </Instances>
      <Instances geometry={geo.candle} material={wax} limit={at.length}>
        {at.map(([x, y, z], i) => (
          <Instance key={i} position={[x, y - 0.08, z]} />
        ))}
      </Instances>
      <Instances geometry={geo.flame} material={flame} limit={at.length}>
        {at.map(([x, y, z], i) => (
          <Instance key={i} position={[x, y + 0.18, z]} />
        ))}
      </Instances>
      <Instances geometry={geo.votive} material={glass} limit={at.length}>
        {at.map(([x, y, z], i) => (
          <Instance key={i} position={[x, y, z]} />
        ))}
      </Instances>
    </>
  )
}

/**
 * The floor, laid for dinner.
 *
 * Thirty-two rounds under blue cloth, a votive on each, six gilt banquet
 * chairs with red cushions round every one — eight instanced draws for the
 * lot. A chair is a cushion on a rail, two legs in front, two posts behind
 * that run up to carry a padded back and a top rail; they used to be a slab,
 * a plank and one peg, which from table height read as toadstools. Every
 * table and every chair is a collider of its own, so you thread between
 * them the way you would in the room; the grid leaves a walk between.
 */
export function Tables() {
  // Parliament blue, the same field as the flag: the rounds were white, and
  // under the lamps the whole floor read as a wedding
  const cloth = useMemo(() => M(0x0d2a66, { roughness: 0.95 }), [])
  const geo = useMemo(
    () => ({ table: new THREE.CylinderGeometry(tables.r + 0.05, tables.r, 2.45, 28) }),
    [],
  )

  return (
    <>
      <Instances geometry={geo.table} material={cloth} limit={TABLES.length}>
        {TABLES.map((t, i) => (
          <Instance key={i} position={[t.x, 1.225, t.z]} />
        ))}
      </Instances>
      <Votives at={TABLES.map((t) => [t.x, 2.75, t.z] as [number, number, number])} />
      <BanquetChairs chairs={CHAIRS} />

      {/*
        The pooled glow of thirty-two lamps, as four lights instead of
        thirty-two: warm, low, and short-range, so the floor reads as lit
        from the tables while the house lights sit half-down.
      */}
      {[-11, 37].flatMap((x) =>
        [-26, -9].map((z) => (
          <pointLight
            key={`${x}:${z}`}
            position={[x, 5.5, z]}
            color={0xffd9a0}
            intensity={candela(0.45, 8)}
            distance={34}
            decay={2}
          />
        )),
      )}

      {TABLES.map((t, i) => (
        <BoxCollider key={i} x={t.x} z={t.z} w={tables.r * 2 + 0.3} d={tables.r * 2 + 0.3} />
      ))}
      {CHAIRS.map((c, i) => (
        <BoxCollider key={i} x={c.x} z={c.z} w={1.5} d={1.5} />
      ))}
    </>
  )
}
