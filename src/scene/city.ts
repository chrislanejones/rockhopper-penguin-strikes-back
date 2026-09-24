/** Layout of the city grid below the window. Shared by the streets and the towers. */

/** Distance between street centrelines. */
export const BLOCK = 220
/** Kerb-to-kerb width of a street. */
export const ROAD_W = 46
/** How far the grid runs in each direction from the tower. */
export const CITY_EXTENT = 1320
/** Street centrelines, as multiples of BLOCK. */
export const STREET_LINES = (() => {
  const n = Math.floor(CITY_EXTENT / BLOCK)
  const out: number[] = []
  for (let i = -n; i <= n; i++) out.push(i * BLOCK)
  return out
})()

/** Nudge a point off the roadway and into the middle of the block it landed on. */
export function snapToBlock(v: number, footprint: number) {
  const centre = (Math.floor(v / BLOCK) + 0.5) * BLOCK
  const room = Math.max(0, BLOCK / 2 - ROAD_W / 2 - footprint / 2 - 6)
  return centre + (Math.random() - 0.5) * 2 * room
}

// ---- the Thames -------------------------------------------------------------

/** Centreline of the river, and how it is angled across the grid. */
export const RIVER = {
  cx: 300,
  cz: -500,
  /** Heading, matching the rotation applied to the water plane. */
  angle: 0.35,
  halfWidth: 70,
  length: 3200,
  /** Nothing may be built or paved within this much of the water's edge. */
  bank: 12,
} as const

/** Unit vector along the river. */
export const RIVER_U = { x: Math.cos(RIVER.angle), z: -Math.sin(RIVER.angle) }
/** Unit vector across the river. */
export const RIVER_V = { x: -Math.sin(RIVER.angle), z: -Math.cos(RIVER.angle) }

/** Distance from the river centreline, in feet. */
export function riverDistance(x: number, z: number) {
  return Math.abs((x - RIVER.cx) * RIVER_V.x + (z - RIVER.cz) * RIVER_V.z)
}

/** Is this footprint in the water, or on the bank? */
export function inRiver(x: number, z: number, footprint = 0) {
  return riverDistance(x, z) < RIVER.halfWidth + RIVER.bank + footprint / 2
}

/**
 * The stretch of one street that lies in the water.
 *
 * Streets run dead straight, so the distance-to-centreline is linear along a
 * street and the crossing is a single interval. Returns null when the street
 * never reaches the river, or when it is entirely submerged.
 */
export function riverGap(
  alongX: boolean,
  line: number,
  extent: number,
): [number, number] | null {
  const slope = alongX ? RIVER_V.x : RIVER_V.z
  const c0 = alongX
    ? (line - RIVER.cz) * RIVER_V.z - RIVER.cx * RIVER_V.x
    : (line - RIVER.cx) * RIVER_V.x - RIVER.cz * RIVER_V.z

  const edge = RIVER.halfWidth + RIVER.bank
  const t1 = (edge - c0) / slope
  const t2 = (-edge - c0) / slope
  const g0 = Math.min(t1, t2)
  const g1 = Math.max(t1, t2)

  if (g1 <= -extent || g0 >= extent) return null
  return [Math.max(g0, -extent), Math.min(g1, extent)]
}

/** The drivable runs of one street, once the river has been taken out of it. */
export function streetSegments(
  alongX: boolean,
  line: number,
  extent: number,
): Array<[number, number]> {
  const gap = riverGap(alongX, line, extent)
  if (!gap) return [[-extent, extent]]
  const [g0, g1] = gap
  const out: Array<[number, number]> = []
  if (g0 > -extent + 1) out.push([-extent, g0])
  if (g1 < extent - 1) out.push([g1, extent])
  return out
}

// ---- what else is on the grid ------------------------------------------------

/**
 * The elevated expressway.
 *
 * It runs along X on the line between the streets at -660 and -440, so it
 * paves nothing, and crosses the Thames around x = 437. `y` is measured up
 * from GROUND_Y like everything else out there.
 */
export const HWY = { z: -550, y: 46, w: 62 } as const

/** One open-deck garage. */
export interface Garage {
  x: number
  z: number
  w: number
  d: number
  levels: number
  ry: number
}

/**
 * The garages, hand-placed on blocks rather than scattered.
 *
 * They are the one downtown building you can name from a distance — a stack
 * of slabs with a dark gap at every level — so they are worth placing by hand
 * and worth the towers giving way to them.
 */
export const GARAGES: Garage[] = [
  { x: -420, z: 150, w: 150, d: 118, levels: 7, ry: 0.1 },
  { x: 250, z: 120, w: 130, d: 104, levels: 6, ry: -0.05 },
  { x: -170, z: 420, w: 164, d: 110, levels: 8, ry: 0 },
  { x: 470, z: -180, w: 138, d: 120, levels: 6, ry: 0.22 },
  { x: -560, z: 60, w: 142, d: 100, levels: 7, ry: -0.14 },
]

/** Floor to floor in a garage, which is shorter than an office storey. */
export const DECK = 11.5

/** Is this footprint in the expressway's corridor? */
export function underHighway(z: number, footprint = 0) {
  return Math.abs(z - HWY.z) < HWY.w / 2 + 26 + footprint / 2
}

/** Is this footprint on a block a garage has already taken? */
export function onGarageBlock(x: number, z: number, footprint = 0) {
  return GARAGES.some(
    (g) =>
      Math.abs(x - g.x) < (g.w + footprint) / 2 + 24 &&
      Math.abs(z - g.z) < (g.d + footprint) / 2 + 24,
  )
}
