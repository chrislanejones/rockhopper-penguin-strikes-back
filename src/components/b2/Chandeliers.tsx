import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { B2, B2_CX } from '../../scene/b2'
import { candela } from '../../scene/constants'

const { hall } = B2
const HT = hall.h

/**
 * Where they hang: four across and two deep over the dinner floor.
 *
 * Not the cans' three-by-three. The rig over the stage is an H that owns
 * z -35 to -22 between x -17 and 43, and the old middle-front can sat on
 * its spine. These columns thread between the runs, and the front row at
 * -26 is between the two runs on any column.
 */
export const CHANDELIERS: Array<[number, number]> = [-33.5, -2.5, 28.5, 59.5].flatMap((x) =>
  [-26, -6].map((z) => [x, z] as [number, number]),
)

/** The body: from the bottom finial to the top of the column. Below the truss chords at 20.9. */
const TOP = 20.2
const CHAIN = HT - 0.25 - TOP

/** One tier of arms: how many, how far out, and where the drip pans sit. */
interface Tier {
  arms: number
  r: number
  y: number
  /** Everything on the tier scales with this: the upper tier is the lower one, smaller. */
  s: number
  /** Turned half an arm, so the upper candles sit between the lower ones from the floor. */
  twist: number
}
const TIERS: Tier[] = [
  { arms: 8, r: 2.6, y: 17.0, s: 1, twist: 0 },
  { arms: 5, r: 1.55, y: 18.55, s: 0.82, twist: Math.PI / 5 },
]

/** The crystal: a ring under each tier, and a smaller one round the foot. */
const RINGS: Array<{ n: number; r: number; y: number }> = [
  { n: 24, r: 2.25, y: 16.35 },
  { n: 18, r: 1.3, y: 17.95 },
  { n: 12, r: 0.85, y: 15.55 },
]

type V3 = [number, number, number]
interface Part {
  p: V3
  rot?: V3
  s?: V3
}

/** A point `r` out from a centre at bearing `a`, `y` up. */
const out = (cx: number, cz: number, a: number, r: number, y: number): V3 => [
  cx + Math.cos(a) * r,
  y,
  cz + Math.sin(a) * r,
]

/**
 * Every piece of every chandelier, laid out once.
 *
 * A ballroom chandelier is a brass column on a chain, two tiers of scrolled
 * arms with a drip pan and a candle on the end of each, and crystal hung
 * wherever there is somewhere to hang it. Each kind of piece is one
 * instanced draw across all eight fixtures, so the whole set is a dozen
 * calls — about what the nine cans cost — and a thousand-odd pieces.
 */
function useParts() {
  return useMemo(() => {
    const spokes: Part[] = []
    const curls: Part[] = []
    const pans: Part[] = []
    const candles: Part[] = []
    const flames: Part[] = []
    const drops: Part[] = []
    const beads: Part[] = []
    const stems: Part[] = []
    const knops: Part[] = []
    const finials: Part[] = []
    const chains: Part[] = []
    const canopies: Part[] = []

    for (const [cx, cz] of CHANDELIERS) {
      canopies.push({ p: [cx, HT - 0.12, cz] })
      chains.push({ p: [cx, TOP + CHAIN / 2, cz], s: [1, CHAIN, 1] })

      // the column: a knop at the top, the stem, a big knop at the bottom, the finial under it
      knops.push({ p: [cx, TOP - 0.05, cz], s: [0.3, 0.3, 0.3] })
      stems.push({ p: [cx, (TOP - 0.3 + 16.55) / 2, cz], s: [1, TOP - 0.3 - 16.55, 1] })
      knops.push({ p: [cx, 16.25, cz], s: [0.56, 0.56, 0.56] })
      knops.push({ p: [cx, 18.55, cz], s: [0.34, 0.26, 0.34] })
      finials.push({ p: [cx, 15.5, cz] })

      for (const t of TIERS) {
        for (let i = 0; i < t.arms; i++) {
          const a = t.twist + (i / t.arms) * Math.PI * 2
          const ry = -a
          // the spoke runs out from the stem, a hair up; the scroll curls under its end
          spokes.push({
            p: out(cx, cz, a, t.r / 2, t.y - 0.25 * t.s),
            rot: [0, ry, Math.PI / 2 - 0.09],
            s: [t.s, t.r, t.s],
          })
          curls.push({
            p: out(cx, cz, a, t.r - 0.3 * t.s, t.y - 0.6 * t.s),
            rot: [0, ry, 0],
            s: [t.s, t.s, t.s],
          })
          pans.push({ p: out(cx, cz, a, t.r, t.y), s: [t.s, t.s, t.s] })
          candles.push({ p: out(cx, cz, a, t.r, t.y + 0.32 * t.s), s: [t.s, t.s, t.s] })
          flames.push({ p: out(cx, cz, a, t.r, t.y + 0.7 * t.s), s: [t.s, t.s, t.s] })
          drops.push({ p: out(cx, cz, a, t.r, t.y - 0.22 * t.s), s: [t.s, t.s, t.s] })
        }
      }

      for (const ring of RINGS) {
        for (let i = 0; i < ring.n; i++) {
          const a = (i / ring.n) * Math.PI * 2
          // every other bead hangs a little lower, so the ring reads as a swag
          beads.push({ p: out(cx, cz, a, ring.r, ring.y - (i % 2) * 0.16), rot: [0, a, 0] })
        }
      }
    }
    return { spokes, curls, pans, candles, flames, drops, beads, stems, knops, finials, chains, canopies }
  }, [])
}

export function Chandeliers() {
  const brass = useMemo(() => M(0xb99340, { roughness: 0.3, metalness: 0.88 }), [])
  const wax = useMemo(() => M(0xf3ecd9, { roughness: 0.75 }), [])
  /*
    LED candles: the flame is an emissive sliver, not a light. The real light
    is one point light in the column of each fixture — a point light is a
    term in every fragment of every material in the hall, and eight of them
    is already one fewer than the cans had.
  */
  const flame = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffe9b0,
        emissive: 0xffb348,
        emissiveIntensity: 2.6,
        roughness: 0.5,
      }),
    [],
  )
  /*
    Crystal without transmission: a transmissive material costs a second
    opaque pass of the whole hall. Pale, metallic, nearly smooth, with a
    breath of the candles' colour in its emissive so it does not go black
    in the parts of the room the point lights do not reach.
  */
  const crystal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xf2f6ff,
        emissive: 0xfff0d2,
        emissiveIntensity: 0.22,
        roughness: 0.12,
        metalness: 0.65,
      }),
    [],
  )
  const geo = useMemo(
    () => ({
      canopy: new THREE.CylinderGeometry(0.42, 0.5, 0.24, 16),
      chain: new THREE.CylinderGeometry(0.06, 0.06, 1, 6),
      stem: new THREE.CylinderGeometry(0.14, 0.16, 1, 12),
      knop: new THREE.SphereGeometry(1, 16, 12),
      finial: new THREE.ConeGeometry(0.3, 0.75, 12),
      spoke: new THREE.CylinderGeometry(0.05, 0.065, 1, 8),
      curl: new THREE.TorusGeometry(0.34, 0.045, 8, 16, Math.PI * 1.25),
      pan: new THREE.CylinderGeometry(0.24, 0.18, 0.07, 16),
      candle: new THREE.CylinderGeometry(0.085, 0.095, 0.56, 12),
      flame: new THREE.SphereGeometry(0.07, 8, 8),
      drop: new THREE.OctahedronGeometry(0.11, 0),
      bead: new THREE.OctahedronGeometry(0.085, 0),
    }),
    [],
  )
  // the finial points down; the flame is a sliver, taller than wide
  useMemo(() => {
    geo.finial.rotateX(Math.PI)
    geo.flame.scale(1, 1.9, 1)
    geo.drop.scale(1, 1.6, 1)
    geo.bead.scale(1, 1.5, 1)
  }, [geo])
  const parts = useParts()

  const draw = (list: Part[], geometry: THREE.BufferGeometry, material: THREE.Material) => (
    <Instances geometry={geometry} material={material} limit={list.length}>
      {list.map((c, i) => (
        <Instance key={i} position={c.p} rotation={c.rot} scale={c.s} />
      ))}
    </Instances>
  )

  return (
    <>
      {draw(parts.canopies, geo.canopy, brass)}
      {draw(parts.chains, geo.chain, brass)}
      {draw(parts.stems, geo.stem, brass)}
      {draw(parts.knops, geo.knop, brass)}
      {draw(parts.finials, geo.finial, brass)}
      {draw(parts.spokes, geo.spoke, brass)}
      {draw(parts.curls, geo.curl, brass)}
      {draw(parts.pans, geo.pan, brass)}
      {draw(parts.candles, geo.candle, wax)}
      {draw(parts.flames, geo.flame, flame)}
      {draw(parts.drops, geo.drop, crystal)}
      {draw(parts.beads, geo.bead, crystal)}

      {/* the light itself: one in the column of each, at the height of the candles */}
      {CHANDELIERS.map(([x, z]) => (
        <pointLight
          key={`${x}:${z}`}
          position={[x, 17.6, z]}
          color={0xffd6a4}
          intensity={candela(0.46, 15)}
          distance={62}
          decay={2}
        />
      ))}
    </>
  )
}

/** Exported for anything that wants to keep clear of them — the truss already does by layout. */
export const CHANDELIER_R = 2.6
export const CHANDELIER_CX = B2_CX
