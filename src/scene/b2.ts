import { CAR, HALF, LIFT_BAY, LIFT_CX, LOBBY } from './constants'

/**
 * B2 — the theatre level, laid for dinner.
 *
 * Same origin and the same lift as the 23rd floor, so the car you step into
 * up there is the car you step out of down here. Out of the lift is a wide,
 * tall lobby; the wall facing you has two pairs of doors onto the floor of
 * the hall — round tables, the stage across the far end — and a grand
 * switchback stair at each end rising to the mezzanine, which is B1: a
 * walkway with rails that crosses a bridge through the hall wall onto the
 * balcony — a U round the back and both sides of the hall, more tables,
 * everyone facing the stage. The lift stops at the mezzanine too.
 *
 * Feet, as everywhere.
 */
export const B2 = {
  /** The hall: stage at the north end, doors in the south wall. */
  hall: { x0: -49, x1: 75, z0: -54, z1: HALF, h: 26 },
  /**
   * Raised platform across the north end, and the proscenium in front of it.
   * The house runs deep: through the hall's north wall and another fourteen
   * feet back, so there is a real backstage behind the traveler, closed in
   * by a wall each side and the back wall the screen hangs on.
   */
  stage: { x0: -9, x1: 35, z0: -68, z1: -40, h: 3 },
  /**
   * A wing room off each side of the backstage: a door from the hall in the
   * north wall beside the stage house, and inside, three steps up through
   * the house wall onto the boards. That is how you get on stage.
   */
  wings: {
    /** How far each room reaches out from the stage house wall. */
    width: 18,
    /** The rooms run from here to the hall's north wall. */
    z0: -66,
    /** Room height: lower than the hall, like the lobby's bay. */
    h: 12,
    /** The door from the hall, per side: x-span, in the north wall. */
    doorways: [
      { x0: -14, x1: -10 },
      { x0: 36, x1: 40 },
    ],
    doorH: 7.5,
    /** The stair band: three steps, `run` long, through the house wall. */
    stair: { z0: -64, z1: -60, run: 3.6 },
  },
  /**
   * The lift lobby: wide, deep and tall, with the grand stairs in it. No
   * alcove down here — the shaft stands proud of the south wall as a block,
   * and the room runs open around it.
   */
  lobby: { x0: -28, x1: 54, z0: HALF, z1: 44.6, h: 16 },
  /** Two pairs of doors from the lobby onto the floor of the hall, either side of the lift's axis. */
  doors: [
    { x0: 3.4, x1: 8.6 },
    { x0: 17.4, x1: 22.6 },
  ],
  /**
   * The grand stairs: one switchback each end of the lobby, mirrored about
   * the lift's axis. The outer lane climbs the end wall from the south end
   * to a landing against the hall wall, turns, and the inner lane climbs
   * back south to the mezzanine. Lanes are `w` wide; the flights run from
   * `run0` to `run1`, the landing fills the hall wall to `run0`, and a pad
   * at the top closes the corner onto the mezzanine strip.
   */
  grand: { w: 6, rise: 8, run0: 21, run1: 29, pad1: 30 },
  /** Emergency exits in the hall's back wall, at these x. They do not open. */
  exits: [-40, 66],
  /**
   * The dinner tables on the floor: a grid, with an aisle up the middle to
   * the stage and a walk along each wall. Six chairs to a table.
   */
  tables: {
    xs: [-28, -17, -6, 5, 21, 32, 43, 54],
    zs: [-35, -24, -13, -2],
    r: 2.5,
    seats: 6,
  },
  /**
   * The balcony: a U along the back wall and both side walls, its floor `y`
   * up — `back` deep across the back, `arm` deep down the sides, the arms
   * stopping short of the stage at `front`. Open underneath, on columns, so
   * the doors come in under it.
   */
  balcony: {
    y: 8,
    back: 14,
    arm: 18,
    front: -36,
    /** Tables on it: one row along the back, one down each arm. Three chairs, the far side. */
    backXs: [-42, -33, -24, -15, 4, 13, 22, 41, 50, 59, 68],
    armZs: [-25, -14, -3],
    /** How far out from the wall the arm tables stand: past the boxes and a walk. */
    armInset: 13,
    r: 2.0,
  },
  /**
   * The boxes: three a side, let into the long walls above the balcony's
   * arms, stepping up toward the stage — the highest box hangs nearest the
   * act.
   *
   * A gallery `depth` into the wall with an arch `width` wide onto the hall
   * at each of `arches`, and a `ledge` out into the hall in front of each;
   * the box by the lobby is `rise` above the balcony, the next `rise` above
   * that, and so on toward the stage, with a short flight between each
   * pair. One stair a side, also let into the wall, `lane` wide and `run`
   * long, rising from the lobby end of the arm into that lowest box. The
   * wall in front of it is solid but for a doorway `mouth` wide at the
   * stair's foot: that doorway is the only way in.
   */
  boxes: { rise: 3, depth: 5, width: 6, ledge: 2.2, arches: [-30, -19, -8], lane: 3.6, run: 6, mouth: 4, headroom: 8 },
} as const

/** How high above the balcony each arch's floor is: the first — by the stage — is the highest. */
export const ARCH_RISE = B2.boxes.arches.map((_, k, a) => B2.boxes.rise * (a.length - k))

/** The gallery runs from the first arch to a little past the last. */
export const GALLERY = {
  z0: B2.boxes.arches[0],
  z1: B2.boxes.arches[B2.boxes.arches.length - 1] + B2.boxes.width + 2,
}

/** The stair well: in the wall just past the gallery, rising from the lobby end of the arm into its last, lowest box. */
export const WELL = { z0: GALLERY.z1, z1: GALLERY.z1 + B2.boxes.run }

/** The two long walls: where each is, and which way "into the hall" is. */
export const BOX_WALLS: ReadonlyArray<{ wallX: number; dir: 1 | -1 }> = [
  { wallX: B2.hall.x0, dir: 1 },
  { wallX: B2.hall.x1, dir: -1 },
]

/** The two wings: their footprint, and which way "away from the stage" is. */
export const WINGS: ReadonlyArray<{ x0: number; x1: number; dir: 1 | -1 }> = [
  { x0: B2.stage.x0 - B2.wings.width, x1: B2.stage.x0, dir: -1 },
  { x0: B2.stage.x1, x1: B2.stage.x1 + B2.wings.width, dir: 1 },
]

/**
 * B1: the mezzanine, eight feet over the lobby floor. A strip along the
 * south side between the two stair tops, a bridge out through the opening
 * in the hall wall onto the balcony and its tables, and the deck over the
 * lift bay to the car's upper mouth. Not a floor of its own — the lift
 * serves it inside the B2 scene.
 */
export const MEZZ = {
  y: 8,
  strip: { x0: B2.lobby.x0 + 2 * B2.grand.w, x1: B2.lobby.x1 - 2 * B2.grand.w, z0: 26, z1: LOBBY.z1 },
  /**
   * The bridge: wide enough to serve both pairs of doors in the hall wall's
   * upper band, which sit straight over the two pairs on the floor below.
   */
  bridge: { x0: 3, x1: 23, z0: HALF, z1: 26 },
} as const

/**
 * The A/V booth's tongue: the balcony U grows a middle prong, seven feet
 * out over the floor, and the booth rides out on it.
 */
export const BOOTH_TONGUE = {
  x0: 26,
  x1: 38,
  z0: B2.hall.z1 - B2.balcony.back - 7,
}

/** Centre line of the stage, the screen and the aisle. */
export const B2_CX = (B2.stage.x0 + B2.stage.x1) / 2

/** Where the stage is, as seen from a table: the chairs go on the other side. */
export const STAGE_AT = { x: B2_CX, z: (B2.stage.z0 + B2.stage.z1) / 2 }

/**
 * Is this spot floor, on B2?
 *
 * The hall, the stage house running through its north wall, the wings off
 * the backstage, the galleries let into the long walls, the lobby, the lift
 * bay and the car. Wing and house rectangles overlap their walls a little on
 * every shared edge, the way the lobby's do: the wall colliders do the
 * blocking, and the overlap is what lets her cross at the openings.
 */
export function inBoundsB2(x: number, z: number, r: number) {
  const { hall, lobby, boxes, stage, wings } = B2
  if (x > hall.x0 + r && x < hall.x1 - r && z > hall.z0 + r && z < hall.z1 - r) return true
  if (x > stage.x0 - r && x < stage.x1 + r && z > stage.z0 + r && z < stage.z1) return true
  for (const w of WINGS) {
    const x0 = w.dir < 0 ? w.x0 + r : w.x0 - r
    const x1 = w.dir < 0 ? w.x1 + r : w.x1 - r
    if (x > x0 && x < x1 && z > wings.z0 + r && z < hall.z0 + r) return true
  }
  for (const { wallX, dir } of BOX_WALLS) {
    const out = (x - wallX) * dir
    if (out > -(boxes.depth - r) && out < boxes.ledge + 1 && z > GALLERY.z0 + 0.3 && z < WELL.z1 - 0.3) {
      return true
    }
  }
  if (x > lobby.x0 + r && x < lobby.x1 - r && z > lobby.z0 - r && z < lobby.z1 - r) return true
  if (x > CAR.x0 + r && x < CAR.x1 - r && z > CAR.z0 - r && z < CAR.z1 - r) return true
  return false
}

/** The most she steps up in one go. Under the balcony the balcony is out of reach. */
const STEP = 1.2

/** Is (x, z) on the balcony's U — or its middle prong, the booth's tongue? */
export function onBalcony(x: number, z: number) {
  const { hall, balcony } = B2
  if (x < hall.x0 || x > hall.x1 || z > hall.z1) return false
  if (z >= hall.z1 - balcony.back) return true
  if (x > BOOTH_TONGUE.x0 && x < BOOTH_TONGUE.x1 && z >= BOOTH_TONGUE.z0) return true
  if (z < balcony.front) return false
  return x <= hall.x0 + balcony.arm || x >= hall.x1 - balcony.arm
}

/** Is (x, z) inside one of the long walls — in a gallery or its stair well? */
export function inWall(x: number, z: number) {
  const { boxes } = B2
  for (const { wallX, dir } of BOX_WALLS) {
    const into = (wallX - x) * dir
    if (into >= 0 && into <= boxes.depth && z >= GALLERY.z0 && z <= WELL.z1) return true
  }
  return false
}

/**
 * Is (x, z) in a gallery or on its stair? The height of that, above the
 * balcony, or -1 if it is neither. Both are let into the wall, so what is
 * measured here is how far into the wall.
 *
 * In the gallery: a box's floor over its arch, and a ramp across each gap
 * between two boxes. On the stair: the ramp up from the arm.
 */
export function boxHeight(x: number, z: number) {
  const { boxes } = B2
  const n = boxes.arches.length
  for (const { wallX, dir } of BOX_WALLS) {
    const into = (wallX - x) * dir
    if (into > boxes.depth) continue
    if (into < -boxes.ledge) continue
    if (z >= GALLERY.z0 && z <= GALLERY.z1) {
      for (let k = 0; k < n; k++) {
        const z0 = boxes.arches[k]
        // on this box's floor, or out on its ledge
        if (z >= z0 && z <= z0 + boxes.width) return ARCH_RISE[k]
        // the flights between boxes, and the slack past the last, are inside the wall only
        if (into < 0) continue
        if (k + 1 < n) {
          const loEnd = z0 + boxes.width
          const hiStart = boxes.arches[k + 1]
          if (z > loEnd && z < hiStart) {
            return ARCH_RISE[k] + (ARCH_RISE[k + 1] - ARCH_RISE[k]) * ((z - loEnd) / (hiStart - loEnd))
          }
        }
      }
      return into >= 0 ? ARCH_RISE[n - 1] : -1
    }
    if (into >= 0 && into <= boxes.lane && z >= WELL.z0 && z <= WELL.z1) {
      return ARCH_RISE[n - 1] * ((WELL.z1 - z) / boxes.run)
    }
  }
  return -1
}

/**
 * How high the floor is here, on B2, given how high she is now.
 *
 * Zero nearly everywhere. On the balcony it is the balcony; on a stair it is
 * the ramp between the two, so walking up reads as walking up. A surface
 * more than a step above her is not offered — that is what lets the floor
 * under the balcony stay the floor, and the arm under a box's ledge stay
 * the arm. Inside the wall, in a gallery, there is only the one floor, so
 * that one is not offered but taken. The player eases toward the answer,
 * which is what turns ten steps into a climb.
 */
export function floorYB2(x: number, z: number, y: number) {
  const { lobby, grand, balcony, stage, wings } = B2
  const up = boxHeight(x, z)
  if (up >= 0 && inWall(x, z)) return balcony.y + up
  let best = 0
  const offer = (h: number) => {
    if (h <= y + STEP && h > best) best = h
  }
  if (onBalcony(x, z)) offer(balcony.y)
  if (up >= 0) offer(balcony.y + up)
  // the grand stairs: the same switchback at each end, mirrored about the lift
  for (const gx of [x, 2 * LIFT_CX - x]) {
    const d = gx - lobby.x0
    if (d < 0 || d > 2 * grand.w) continue
    if (z >= lobby.z0 && z < grand.run0) {
      offer(grand.rise / 2) // the landing, spanning both lanes
    } else if (z >= grand.run0 && z <= grand.run1) {
      const t = (z - grand.run0) / (grand.run1 - grand.run0)
      if (d <= grand.w) offer((grand.rise / 2) * (1 - t)) // outer lane, up from the south
      else offer(grand.rise / 2 + (grand.rise / 2) * t) // inner lane, on up
    } else if (z > grand.run1 && z < grand.pad1 && d > grand.w) {
      offer(grand.rise) // the pad at the top of the inner lane
    }
  }
  // the mezzanine: strip, bridge, and the deck out over the floor to the car's upper mouth
  if (
    (x > MEZZ.strip.x0 && x < MEZZ.strip.x1 && z > MEZZ.strip.z0 && z < MEZZ.strip.z1) ||
    (x > MEZZ.bridge.x0 && x < MEZZ.bridge.x1 && z > MEZZ.bridge.z0 && z < MEZZ.bridge.z1) ||
    (x > LIFT_BAY.x0 && x < LIFT_BAY.x1 && z > MEZZ.strip.z1 && z < CAR.z1)
  ) {
    offer(MEZZ.y)
  }
  // the boards, and the three steps up to them from each wing
  if (x > stage.x0 && x < stage.x1 && z > stage.z0 && z < stage.z1) offer(stage.h)
  if (z >= wings.stair.z0 && z <= wings.stair.z1) {
    for (const w of WINGS) {
      const d = w.dir < 0 ? stage.x0 - x : x - stage.x1
      if (d >= 0 && d <= wings.stair.run) offer(stage.h * (1 - d / wings.stair.run))
    }
  }
  return best
}
