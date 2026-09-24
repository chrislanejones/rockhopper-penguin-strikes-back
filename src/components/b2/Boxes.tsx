import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { ARCH_RISE, B2, BOX_WALLS, GALLERY, WELL } from '../../scene/b2'
import { meanderTex, velvetTex } from '../../textures/b2'
import { Box, Collider } from '../props/primitives'

const { boxes, balcony } = B2
/** The balcony floor the stair starts from. */
const BASE = balcony.y
/** Each arch's floor, in world feet: the first — by the stage — the highest. */
const TOPS = ARCH_RISE.map((r) => BASE + r)
/** The gallery ceiling: headroom over the highest box. */
const CEIL = Math.max(...TOPS) + boxes.headroom
/** The last box, by the lobby: the lowest, and what the stair climbs to. */
const ENTRY = TOPS[TOPS.length - 1]
const STEPS = 6
const RISE = (ENTRY - BASE) / STEPS
const TREAD = boxes.run / STEPS
/** The parapet on each ledge, above its floor. */
const RAIL_H = 2.2
/** Colliders at balcony level count from here up; the gallery's own from higher. */
const ON_BALCONY = BASE - 2
const IN_GALLERY = ENTRY - 1.5
const G_LEN = GALLERY.z1 - GALLERY.z0
const G_MID = (GALLERY.z0 + GALLERY.z1) / 2

/** One side's gallery. */
interface Side {
  wallX: number
  dir: 1 | -1
}

/** A distance into the wall, as a world x; negative is out into the hall. */
const into = (s: Side, d: number) => s.wallX - s.dir * d

/** Three chairs in each arch, a row across it, looking out over the ledge. */
const CHAIRS = BOX_WALLS.flatMap((s) =>
  boxes.arches.flatMap((z0, k) =>
    [-1.7, 0, 1.7].map((dz) => ({
      x: into(s, 1.0),
      bx: into(s, 1.6),
      y: TOPS[k],
      z: z0 + boxes.width / 2 + dz,
    })),
  ),
)

/**
 * The boxes, let into the long walls above the balcony, each one higher up
 * the wall than the one before it.
 *
 * Statler and Waldorf seating, after the Carolina: three arches a side, the
 * highest by the stage, each with a small ledge out over the hall behind a
 * Greek-key parapet, three chairs in the arch, and behind all three one
 * room, so you walk from box to box — up a short flight each time, toward
 * the act. The way in is a stair let into the same wall at the lobby end of
 * the balcony arm, rising into the lowest box through a doorway at its
 * foot; there is no other.
 *
 * The wall itself, with its three arches at their three heights and the
 * stair's doorway, is built by the hall; this is what is behind, inside,
 * and in front of it.
 */
export function Boxes() {
  const velvet = useMemo(
    () => new THREE.MeshStandardMaterial({ map: velvetTex(), roughness: 0.95 }),
    [],
  )
  const meander = useMemo(
    () => new THREE.MeshStandardMaterial({ map: meanderTex(), roughness: 0.8 }),
    [],
  )
  const plaster = useMemo(() => M(0xd3c4a2, { roughness: 0.9 }), [])
  const stone = useMemo(() => M(0xd9ccab, { roughness: 0.85 }), [])
  const wood = useMemo(() => M(0x4a3324, { roughness: 0.6 }), [])
  const tread = useMemo(() => M(0x5b3f2a, { roughness: 0.7 }), [])
  const gilt = useMemo(() => M(0xb8912e, { roughness: 0.35, metalness: 0.75 }), [])
  const brass = useMemo(() => M(0xb08a3c, { roughness: 0.35, metalness: 0.8 }), [])
  const ceiling = useMemo(() => M(0x2a2220, { roughness: 0.95 }), [])
  const torch = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffd9a0,
        emissive: 0xffb865,
        emissiveIntensity: 1.6,
        roughness: 0.6,
      }),
    [],
  )
  const cushion = useMemo(() => M(0x7a1a22, { roughness: 0.9 }), [])
  const geo = useMemo(
    () => ({
      seat: new THREE.BoxGeometry(1.3, 0.28, 1.3),
      back: new THREE.BoxGeometry(0.2, 1.5, 1.3),
      leg: new THREE.CylinderGeometry(0.12, 0.16, 1.45, 10),
    }),
    [],
  )

  const lo = (a: number, b: number) => Math.min(a, b)
  const hi = (a: number, b: number) => Math.max(a, b)

  return (
    <>
      {BOX_WALLS.map((s) => {
        const back = into(s, boxes.depth)
        const backFace = into(s, boxes.depth + 0.3)
        const span = (a: number, b: number) => ({ minX: lo(a, b), maxX: hi(a, b) })
        return (
          <group key={s.wallX}>
            {/* the room: ceiling, back wall, stage-end wall; the lobby end is where the stair comes in */}
            <Box
              size={[boxes.depth + 0.6, 0.6, G_LEN + boxes.run + 0.6]}
              material={ceiling}
              position={[into(s, boxes.depth / 2), CEIL + 0.3, (GALLERY.z0 + WELL.z1) / 2]}
              cast={false}
            />
            <Box size={[0.6, CEIL - BASE, G_LEN]} material={plaster} position={[backFace, (BASE + CEIL) / 2, G_MID]} cast={false} />
            <Collider {...span(backFace - 0.3, backFace + 0.3)} minZ={GALLERY.z0} maxZ={GALLERY.z1} above={IN_GALLERY} />
            <Box size={[boxes.depth + 0.6, CEIL - BASE, 0.6]} material={plaster} position={[into(s, boxes.depth / 2), (BASE + CEIL) / 2, GALLERY.z0 - 0.3]} cast={false} />
            <Collider {...span(s.wallX, back)} minZ={GALLERY.z0 - 0.6} maxZ={GALLERY.z0} above={IN_GALLERY} />
            {/* the lobby end, but for the stair lane */}
            <Box
              size={[boxes.depth - boxes.lane, CEIL - BASE, 0.6]}
              material={plaster}
              position={[into(s, boxes.lane + (boxes.depth - boxes.lane) / 2), (BASE + CEIL) / 2, GALLERY.z1 + 0.3]}
              cast={false}
            />
            <Collider {...span(into(s, boxes.lane), back)} minZ={GALLERY.z1} maxZ={GALLERY.z1 + 0.6} above={IN_GALLERY} />

            {/*
              Each box: a plinth up to its floor, a ledge out over the hall,
              and the flight up to the next. Every fill inside the wall stops
              0.65 short of the hall plane — the arched band owns that plane,
              and a coplanar wood face reads as a hole in the wall.
            */}
            {boxes.arches.map((z0, k) => {
              const top = TOPS[k]
              const zc = z0 + boxes.width / 2
              const next = boxes.arches[k + 1]
              const ledgeW = boxes.width + 1.2
              return (
                <group key={z0}>
                  <Box
                    size={[boxes.depth - 0.65, top - BASE, boxes.width]}
                    material={wood}
                    position={[into(s, (boxes.depth + 0.65) / 2), (BASE + top) / 2, zc]}
                    cast={false}
                  />
                  {next === undefined && (
                    <Box
                      size={[boxes.depth - 0.65, top - BASE, GALLERY.z1 - (z0 + boxes.width)]}
                      material={wood}
                      position={[into(s, (boxes.depth + 0.65) / 2), (BASE + top) / 2, (z0 + boxes.width + GALLERY.z1) / 2]}
                      cast={false}
                    />
                  )}
                  {next !== undefined &&
                    Array.from({ length: 5 }, (_, i) => {
                      const from = z0 + boxes.width
                      const run = next - from
                      const h = top + ((i + 1) * (TOPS[k + 1] - top)) / 5
                      const z = from + (i + 0.5) * (run / 5)
                      return (
                        <Box
                          key={i}
                          size={[boxes.depth - 0.65, h - BASE, run / 5]}
                          material={tread}
                          position={[into(s, (boxes.depth + 0.65) / 2), (BASE + h) / 2, z]}
                          cast={false}
                        />
                      )
                    })}

                  {/* the ledge: a slab out through the arch reaching back to the plinth, a Greek-key parapet round it, gilt on top */}
                  {/* 0.01 below the plinth floor, so where the two overlap under the arch they never share a face */}
                  <Box size={[boxes.ledge + 0.7, 0.6, ledgeW]} material={stone} position={[into(s, (0.7 - boxes.ledge) / 2), top - 0.31, zc]} cast={false} />
                  <Box size={[0.4, RAIL_H, ledgeW]} material={meander} position={[into(s, -boxes.ledge + 0.2), top + RAIL_H / 2, zc]} cast={false} />
                  {[-1, 1].map((e) => (
                    <Box key={e} size={[boxes.ledge, RAIL_H, 0.4]} material={meander} position={[into(s, -boxes.ledge / 2), top + RAIL_H / 2, zc + (e * (ledgeW - 0.4)) / 2]} cast={false} />
                  ))}
                  <Box size={[boxes.ledge + 0.3, 0.14, ledgeW + 0.3]} material={gilt} position={[into(s, -boxes.ledge / 2), top + RAIL_H + 0.07, zc]} cast={false} />
                  <Collider {...span(into(s, -boxes.ledge + 0.4), into(s, -boxes.ledge))} minZ={zc - ledgeW / 2} maxZ={zc + ledgeW / 2} above={top - 1.5} />
                  {[-1, 1].map((e) => (
                    <Collider key={e} {...span(into(s, 0), into(s, -boxes.ledge))} minZ={zc + (e * ledgeW) / 2 - 0.2} maxZ={zc + (e * ledgeW) / 2 + 0.2} above={top - 1.5} />
                  ))}
                  {/* a velvet drape down each side of the arch */}
                  {[-1, 1].map((e) => (
                    <Box key={`d${e}`} size={[0.5, 7, 0.6]} material={velvet} position={[into(s, 0.4), top + 3.5, zc + e * (boxes.width / 2 - 0.3)]} cast={false} />
                  ))}

                  {/* a sconce on the back wall */}
                  <Box size={[0.6, 0.25, 0.25]} material={brass} position={[into(s, boxes.depth - 0.35), top + 5.2, zc]} cast={false} />
                  <mesh position={[into(s, boxes.depth - 0.6), top + 5.8, zc]} material={torch}>
                    <cylinderGeometry args={[0.16, 0.26, 1.1, 10]} />
                  </mesh>
                </group>
              )
            })}

            {/* the piers between the arches, at gallery level, and the slack past the last one */}
            {boxes.arches.slice(1).map((z0, i) => (
              <Collider key={z0} {...span(s.wallX, into(s, 0.6))} minZ={boxes.arches[i] + boxes.width} maxZ={z0} above={IN_GALLERY} />
            ))}
            <Collider {...span(s.wallX, into(s, 0.6))} minZ={boxes.arches[boxes.arches.length - 1] + boxes.width} maxZ={GALLERY.z1} above={IN_GALLERY} />

            {/* the stair well from the arm: its back, its far-end wall, six treads rising toward the gallery; the hall wall closes it in, so a sconce keeps it from being a black slot */}
            <Box size={[0.6, CEIL - BASE, boxes.run]} material={plaster} position={[into(s, boxes.lane + 0.3), (BASE + CEIL) / 2, (WELL.z0 + WELL.z1) / 2]} cast={false} />
            <Collider {...span(into(s, boxes.lane), into(s, boxes.lane + 0.6))} minZ={WELL.z0} maxZ={WELL.z1} above={ON_BALCONY} />
            <Box size={[boxes.lane + 0.6, CEIL - BASE, 0.6]} material={plaster} position={[into(s, boxes.lane / 2), (BASE + CEIL) / 2, WELL.z1 + 0.3]} cast={false} />
            <Collider {...span(s.wallX, into(s, boxes.lane + 0.6))} minZ={WELL.z1} maxZ={WELL.z1 + 0.6} above={ON_BALCONY} />
            {Array.from({ length: STEPS }, (_, k) => {
              const h = (k + 1) * RISE
              const z = WELL.z1 - (k + 0.5) * TREAD
              return (
                <Box key={k} size={[boxes.lane - 0.65, h, TREAD]} material={tread} position={[into(s, (boxes.lane + 0.65) / 2), BASE + h / 2, z]} cast={false} />
              )
            })}
            <Box size={[0.6, 0.25, 0.25]} material={brass} position={[into(s, boxes.lane - 0.35), BASE + 5.5, (WELL.z0 + WELL.z1) / 2]} cast={false} />
            <mesh position={[into(s, boxes.lane - 0.6), BASE + 6.1, (WELL.z0 + WELL.z1) / 2]} material={torch}>
              <cylinderGeometry args={[0.16, 0.26, 1.1, 10]} />
            </mesh>
          </group>
        )
      })}

      {/* the chairs, three to an arch, all of them in three draws */}
      <Instances geometry={geo.seat} material={cushion} limit={CHAIRS.length}>
        {CHAIRS.map((c, i) => (
          <Instance key={i} position={[c.x, c.y + 1.55, c.z]} />
        ))}
      </Instances>
      <Instances geometry={geo.back} material={wood} limit={CHAIRS.length}>
        {CHAIRS.map((c, i) => (
          <Instance key={i} position={[c.bx, c.y + 2.5, c.z]} />
        ))}
      </Instances>
      <Instances geometry={geo.leg} material={wood} limit={CHAIRS.length}>
        {CHAIRS.map((c, i) => (
          <Instance key={i} position={[c.x, c.y + 0.72, c.z]} />
        ))}
      </Instances>
    </>
  )
}
