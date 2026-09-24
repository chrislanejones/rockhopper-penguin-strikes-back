import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { GROUND_Y } from '../scene/constants'
import {
  CITY_EXTENT, DECK, GARAGES, HWY as HWY_LAYOUT, ROAD_W, STREET_LINES, inRiver, riverGap,
} from '../scene/city'
import { LOTTERY } from './LotteryTower'

/**
 * What the grid needs before it reads as a city rather than a field of boxes:
 * the crossings over the Thames, the expressway on its piers, the ramps that
 * get between the two, and the open-deck garages that take up half of any
 * block downtown.
 *
 * Everything here is static. The traffic in `Streets.tsx` still wraps within
 * its own segment and never uses a bridge — cars on the crossings want the
 * car model to know about grade, which it does not.
 */

const HAZE = new THREE.Color(0x9fb0bf)

/** Road surface, from Streets. The water sits at GROUND_Y + 0.6. */
const ROAD_Y = GROUND_Y + 0.4
/** Deck of a river crossing: high enough over the water to read as a bridge. */
const BRIDGE_Y = GROUND_Y + 24
/** How much street a crossing takes to climb to its deck. */
const APPROACH = 300

/** The expressway, in world feet. Its line and width are shared layout. */
const HWY = { ...HWY_LAYOUT, y: GROUND_Y + HWY_LAYOUT.y } as const

/** Distance fade, matching the towers so the far side of the river agrees. */
function haze(hex: number, x: number, z: number) {
  const fade = Math.min(1, Math.max(0, (Math.hypot(x, z) - 100) / 800))
  return new THREE.Color(hex).lerp(HAZE, fade * 0.85)
}

// ---- crossings ---------------------------------------------------------------

interface Crossing {
  alongX: boolean
  line: number
  g0: number
  g1: number
}

/**
 * Which streets get a bridge.
 *
 * `riverGap` already knows where each street runs out of land, so a crossing
 * is exactly that interval with an approach stuck on each end. A street that
 * runs near enough to parallel with the river has a gap hundreds of feet
 * long — that is a street beside the water, not a crossing, so it is cut.
 * London has a handful of bridges rather than one per street, so every
 * other candidate is dropped.
 */
function useCrossings(): Crossing[] {
  return useMemo(() => {
    const all: Crossing[] = []
    for (const alongX of [true, false]) {
      for (const line of STREET_LINES) {
        const gap = riverGap(alongX, line, CITY_EXTENT)
        if (!gap) continue
        const [g0, g1] = gap
        if (g1 - g0 > 420) continue
        if (g0 <= -CITY_EXTENT + APPROACH || g1 >= CITY_EXTENT - APPROACH) continue
        // The Lottery building is hand-placed and straddles the street at
        // x = 0; an approach up that line would climb straight through it.
        if (Math.abs(line - (alongX ? LOTTERY.z : LOTTERY.x)) < 120) continue
        all.push({ alongX, line, g0, g1 })
      }
    }
    // Every third candidate: a crossing every 660 ft, not every 220.
    return all.filter((_, i) => i % 3 === 0)
  }, [])
}

/**
 * One crossing: two graded approaches, the flat span between them, a girder
 * under it and a parapet down each side.
 *
 * Built in a frame whose +X runs along the road and +Z across it, so the two
 * street directions are the same code turned a quarter.
 */
function Crossing({
  c,
  deck,
  parapet,
}: {
  c: Crossing
  deck: THREE.Material
  parapet: THREE.Material
}) {
  const w = ROAD_W + 8
  const span = c.g1 - c.g0
  const mid = (c.g0 + c.g1) / 2
  const rise = BRIDGE_Y - ROAD_Y
  const pitch = Math.atan2(rise, APPROACH)
  const rampLen = Math.hypot(APPROACH, rise)

  const pos: [number, number, number] = c.alongX ? [mid, 0, c.line] : [c.line, 0, mid]

  return (
    <group position={pos} rotation={[0, c.alongX ? 0 : Math.PI / 2, 0]}>
      {/* the flat span, and the girder that carries it */}
      <mesh position={[0, BRIDGE_Y, 0]} material={deck}>
        <boxGeometry args={[span, 2.2, w]} />
      </mesh>
      <mesh position={[0, BRIDGE_Y - 4, 0]} material={deck}>
        <boxGeometry args={[span, 6, w - 14]} />
      </mesh>

      {/* the two approaches, pitched up out of the street */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (span / 2 + APPROACH / 2), (BRIDGE_Y + ROAD_Y) / 2, 0]}>
          <mesh rotation={[0, 0, -s * pitch]} material={deck}>
            <boxGeometry args={[rampLen, 2.2, w]} />
          </mesh>
          {[-1, 1].map((e) => (
            <mesh
              key={e}
              position={[0, 0, (e * w) / 2]}
              rotation={[0, 0, -s * pitch]}
              material={parapet}
            >
              <boxGeometry args={[rampLen, 5, 1.6]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* parapets down the span */}
      {[-1, 1].map((e) => (
        <mesh key={e} position={[0, BRIDGE_Y + 2.4, (e * w) / 2]} material={parapet}>
          <boxGeometry args={[span, 5, 1.6]} />
        </mesh>
      ))}
    </group>
  )
}

/** Where every crossing's piers stand. A pair per bay, one under each edge. */
function crossingPiers(list: Crossing[]) {
  const out: Array<[number, number, number]> = []
  const off = (ROAD_W + 8) / 2 - 6
  for (const c of list) {
    const span = c.g1 - c.g0
    const bays = Math.max(2, Math.round(span / 130))
    for (let i = 1; i < bays; i++) {
      const t = c.g0 + (span * i) / bays
      for (const s of [-1, 1]) {
        out.push(c.alongX ? [t, c.line + s * off, 0] : [c.line + s * off, t, 0])
      }
    }
  }
  return out
}

// ---- the expressway ----------------------------------------------------------

/**
 * The elevated run, and the piers under it.
 *
 * It crosses the Thames around x = 437, so the pier spacing skips anything
 * that would stand in the channel and the deck simply spans it.
 */
function useHighwayPiers() {
  return useMemo(() => {
    const out: number[] = []
    for (let x = -CITY_EXTENT + 80; x < CITY_EXTENT - 80; x += 118) {
      if (inRiver(x, HWY.z, 30)) continue
      out.push(x)
    }
    return out
  }, [])
}

// ---- ramps -------------------------------------------------------------------

interface RampPart {
  x: number
  y: number
  z: number
  ry: number
  pitch: number
  len: number
}

/**
 * A quarter-loop ramp: a street below, the deck above, and a 90-degree turn
 * spent climbing between them.
 *
 * The arc is walked in fixed steps; each step is one short slab laid on the
 * tangent and pitched by the grade, which is how a real ramp is poured and
 * also the only way to bend a box.
 */
function loopRamp(
  cx: number,
  cz: number,
  radius: number,
  a0: number,
  a1: number,
  y0: number,
  y1: number,
  steps = 14,
): RampPart[] {
  const out: RampPart[] = []
  const arc = Math.abs(a1 - a0) * radius
  const pitch = Math.atan2(y1 - y0, arc)
  const segLen = arc / steps + 3
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps
    const a = a0 + (a1 - a0) * t
    out.push({
      x: cx + Math.cos(a) * radius,
      z: cz + Math.sin(a) * radius,
      y: y0 + (y1 - y0) * t,
      // tangent to the circle, turned into a heading about Y
      ry: -(a + (a1 > a0 ? Math.PI / 2 : -Math.PI / 2)),
      pitch,
      len: segLen,
    })
  }
  return out
}

function useRamps(): RampPart[] {
  return useMemo(() => {
    const onto = HWY.y - 3
    /*
      Both loops leave the deck at the top of their arc and land on a block.
      They stand well west and well east of x = 437, which is where the
      expressway is out over the channel and has nowhere to put a ramp.
    */
    return [
      // off the deck, curving down into the blocks west of downtown
      ...loopRamp(-600, HWY.z + 150, 150, -Math.PI / 2, 0, onto, ROAD_Y + 6),
      // and back up onto it from the east side
      ...loopRamp(1000, HWY.z + 150, 150, -Math.PI, -Math.PI / 2, ROAD_Y + 6, onto),
    ]
  }, [])
}


// ---- landmarks ---------------------------------------------------------------

/**
 * Two silhouettes that make the skyline London rather than anywhere.
 *
 * The Lottery building is the near one and stays exactly where `LotteryTower`
 * puts it; these two stand well clear of it, clear of the sight line straight
 * out of the glass, and off the expressway's line at z = -550.
 */
function Landmarks({ concrete }: { concrete: THREE.MeshStandardMaterial }) {
  const slab = useMemo(() => {
    const m = concrete.clone()
    m.color = haze(0x6c6f74, -430, -880)
    return m
  }, [concrete])
  const pale = useMemo(() => {
    const m = concrete.clone()
    m.color = haze(0xe6e3da, 330, -120)
    return m
  }, [concrete])

  return (
    <>
      {/* the tall dark slab on the hill, the tallest thing on the island */}
      <group position={[-430, GROUND_Y, -880]} rotation={[0, 0.24, 0]}>
        <mesh position={[0, 225, 0]} material={slab}>
          <boxGeometry args={[132, 450, 74]} />
        </mesh>
        <mesh position={[0, 458, 0]} material={slab}>
          <boxGeometry args={[96, 16, 54]} />
        </mesh>
      </group>

      {/* the pale twin slabs by the river, with the gap straight through them */}
      <group position={[330, GROUND_Y, -120]} rotation={[0, -0.18, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 34, 190, 0]} material={pale}>
            <boxGeometry args={[46, 380, 96]} />
          </mesh>
        ))}
        <mesh position={[0, 300, 0]} material={pale}>
          <boxGeometry args={[22, 160, 88]} />
        </mesh>
      </group>
    </>
  )
}

// ---- the lot -----------------------------------------------------------------

export function Infrastructure() {
  const crossings = useCrossings()
  const piers = useMemo(() => crossingPiers(crossings), [crossings])
  const hwyPiers = useHighwayPiers()
  const ramps = useRamps()

  const { deck, parapet, concrete, dark, box } = useMemo(() => {
    const concrete = new THREE.MeshStandardMaterial({ color: 0x9a9c9f, roughness: 0.94 })
    return {
      deck: new THREE.MeshStandardMaterial({ color: 0x8e9094, roughness: 0.95 }),
      parapet: new THREE.MeshStandardMaterial({ color: 0xb4b6b8, roughness: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 1 }),
      concrete,
      box: new THREE.BoxGeometry(1, 1, 1),
    }
  }, [])

  /** Every garage slab and spandrel, flattened so they instance in one call. */
  const decks = useMemo(() => {
    const slabs: Array<{ p: [number, number, number]; s: [number, number, number]; ry: number; c: THREE.Color }> = []
    const bands: typeof slabs = []
    for (const g of GARAGES) {
      const tint = haze(0xb0b2b4, g.x, g.z)
      for (let i = 0; i < g.levels; i++) {
        const y = GROUND_Y + 4 + i * DECK
        slabs.push({ p: [g.x, y, g.z], s: [g.w, 1.6, g.d], ry: g.ry, c: tint })
        bands.push({ p: [g.x, y + 3.4, g.z], s: [g.w + 1.5, 3.6, g.d + 1.5], ry: g.ry, c: tint })
      }
      // the parapet round the roof deck, a course above the top slab
      const top = GROUND_Y + 4 + g.levels * DECK
      bands.push({ p: [g.x, top, g.z], s: [g.w + 1.5, 4.2, g.d + 1.5], ry: g.ry, c: tint })
    }
    return { slabs, bands }
  }, [])

  return (
    <>
      {/* the crossings over the Thames */}
      {crossings.map((c, i) => (
        <Crossing key={i} c={c} deck={deck} parapet={parapet} />
      ))}

      {/* every pier in the water, and every pier under the expressway */}
      <Instances geometry={box} material={concrete} limit={piers.length + hwyPiers.length * 2}>
        {piers.map(([x, z], i) => (
          <Instance
            key={`p${i}`}
            position={[x, (GROUND_Y + BRIDGE_Y) / 2, z]}
            scale={[7, BRIDGE_Y - GROUND_Y, 7]}
          />
        ))}
        {hwyPiers.map((x, i) =>
          [-1, 1].map((s) => (
            <Instance
              key={`h${i}:${s}`}
              position={[x, (GROUND_Y + HWY.y) / 2, HWY.z + s * 16]}
              scale={[6, HWY.y - GROUND_Y, 6]}
            />
          )),
        )}
      </Instances>

      {/* the expressway itself: deck, girder, parapets */}
      <mesh position={[0, HWY.y, HWY.z]} material={deck}>
        <boxGeometry args={[CITY_EXTENT * 2, 2.4, HWY.w]} />
      </mesh>
      <mesh position={[0, HWY.y - 4.5, HWY.z]} material={deck}>
        <boxGeometry args={[CITY_EXTENT * 2, 7, HWY.w - 18]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, HWY.y + 2.6, HWY.z + (s * HWY.w) / 2]} material={parapet}>
          <boxGeometry args={[CITY_EXTENT * 2, 5, 1.8]} />
        </mesh>
      ))}

      {/* the ramps, one slab per step of the turn */}
      <Instances geometry={box} material={deck} limit={ramps.length}>
        {ramps.map((r, i) => (
          <Instance
            key={i}
            position={[r.x, r.y, r.z]}
            rotation={[0, r.ry, r.pitch]}
            scale={[r.len, 2, 26]}
          />
        ))}
      </Instances>
      <Instances geometry={box} material={concrete} limit={ramps.length}>
        {ramps.map((r, i) => (
          <Instance
            key={i}
            position={[r.x, (GROUND_Y + r.y) / 2, r.z]}
            scale={[5, r.y - GROUND_Y, 5]}
          />
        ))}
      </Instances>

      {/* garages: the dark inside first, so the open sides have something in them */}
      <Instances geometry={box} material={dark} limit={GARAGES.length}>
        {GARAGES.map((g, i) => (
          <Instance
            key={i}
            position={[g.x, GROUND_Y + (g.levels * DECK) / 2 + 2, g.z]}
            rotation={[0, g.ry, 0]}
            scale={[g.w - 10, g.levels * DECK, g.d - 10]}
          />
        ))}
      </Instances>
      <Instances geometry={box} material={concrete} limit={decks.slabs.length}>
        {decks.slabs.map((d, i) => (
          <Instance key={i} position={d.p} rotation={[0, d.ry, 0]} scale={d.s} color={d.c} />
        ))}
      </Instances>
      <Instances geometry={box} material={concrete} limit={decks.bands.length}>
        {decks.bands.map((d, i) => (
          <Instance key={i} position={d.p} rotation={[0, d.ry, 0]} scale={d.s} color={d.c} />
        ))}
      </Instances>
      {/* each garage's stair and lift core, solid up the short side */}
      <Instances geometry={box} material={concrete} limit={GARAGES.length}>
        {GARAGES.map((g, i) => (
          <Instance
            key={i}
            position={[
              g.x + Math.cos(g.ry) * (g.w / 2 - 9),
              GROUND_Y + (g.levels * DECK) / 2 + 6,
              g.z - Math.sin(g.ry) * (g.w / 2 - 9),
            ]}
            rotation={[0, g.ry, 0]}
            scale={[20, g.levels * DECK + 12, 26]}
            color={haze(0xa8aaac, g.x, g.z)}
          />
        ))}
      </Instances>

      <Landmarks concrete={concrete} />
    </>
  )
}
