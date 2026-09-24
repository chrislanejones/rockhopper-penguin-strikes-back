/**
 * Suite 2300 — dimensions.
 *
 * Every unit in this project is a FOOT. The original single-file build used
 * feet and it is easier to keep than to convert: 8 ft ceilings, 36 ft rooms
 * and a 2x4 ceiling grid all stay whole numbers.
 */

/** Depth of the original suite, north (window) to south (elevator). */
export const ROOM = 36
/** Finished ceiling height. */
export const H = 8
export const HALF = ROOM / 2

/**
 * West wall.
 *
 * Twelve feet past the original suite: the break room was a counter along
 * the old west wall, and it is now a 12 x 36 bay with a ping-pong table.
 */
export const RX0 = -HALF - 12
/**
 * East wall.
 *
 * Twelve feet further out than it was. The floor was stretched past the old
 * wall at BX2 to take two more workstations off the head of the storage
 * room, and the room went with it — CLO is stated from RX1, so the closet
 * kept all thirteen feet of itself and simply moved east.
 *
 * It has to land on the ceiling grid: RW must divide by TW, so this moves in
 * fours. 46 to 58 is three more columns, 19 to 22.
 */
export const RX1 = 58
/** Total width including the wing. */
export const RW = RX1 - RX0
/** Centre of the floor plate on X. */
export const RCX = (RX0 + RX1) / 2

/** North curtain wall sits at this Z. */
export const NZ = -HALF

// ---- drop ceiling: 4 ft (X) x 2 ft (Z) lay-in grid --------------------------
export const TW = 4
export const TD = 2
export const COLS = RW / TW
export const ROWS = ROOM / TD
export const tileX = (c: number) => RX0 + TW / 2 + c * TW
export const tileZ = (r: number) => -HALF + TD / 2 + r * TD

/** Cell types in the ceiling grid. */
export const BLANK = 0
export const LIGHT = 1
export const VENT = 2
export const WAP = 3
export const CRACK = 4
export const SPEAKER = 5
export const SPRINKLER = 6
/** No tile at all: you are looking up into the plenum. */
export const GONE = 7

/** Which cell a world position falls in. The inverse of tileX / tileZ. */
export const tileCol = (x: number) => Math.round((x - RX0 - TW / 2) / TW)
export const tileRow = (z: number) => Math.round((z + HALF - TD / 2) / TD)

/**
 * Where the two break-room screens hang.
 *
 * Snapped to the centre of a ceiling cell, and the ceiling keeps those two
 * cells blank: a mount dropped through a light fitting or a diffuser looked
 * like the tile had been cut out around it, because it had.
 */
export const TV_STAFF = {
  x: tileX(tileCol(RX0 + 4.5)),
  z: tileZ(tileRow(-16.2)),
} as const
export const TV_WEATHER = {
  x: tileX(tileCol(RX0 + 10.0)),
  z: tileZ(tileRow(15.2)),
} as const

// ---- interior partition between the original suite and the wing -------------
/** Partition X. */
export const PWX = HALF
/** Cased opening through the partition, north and south edge. */
export const OP0 = 8.5
export const OP1 = 14

// ---- cubicle blocks ---------------------------------------------------------
/** A quarter turn — used constantly for east/west facing furniture. */
export const V = Math.PI / 2
/** Cubicle panel height. */
export const PH = 7.2

/** Block 1 (workstations 1-4): west edge, corridor walls, divider row, south edge. */
export const LX = -10.5
export const CL = -0.5
export const CR = 6.5
export const DZ = -5.5
export const BZ = 7
/** Gap in the corridor walls, so the corridor opens to the south. */
export const GAP: [number, number] = [-9, -2]

/**
 * Block 2 (workstations 5-8), same pattern shifted into the wing.
 *
 * Its west panel backs straight onto the partition — a quarter-inch off the
 * plaster — so there is no slot between the two. It used to stand at 20.5,
 * which left two feet of dead floor between the wall and the panel.
 */
export const LX2 = PWX + 0.25 + 0.15
export const CL2 = 29.5
export const CR2 = 36.5
export const DZ2 = -5.5
export const BZ2 = 7
export const GAP2: [number, number] = [-9, -2]

/**
 * Block 3 (workstations 9 and 10): the strip the stretch opened up.
 *
 * Not another 2x2 — there is no room for a corridor down it. Two bays on
 * block 2's divider line, backing onto the panel at BX2, opening east onto a
 * walkway that runs the length of the closet wall.
 */
/** East edge of blocks 1 and 2. It was the east wall until the floor moved. */
export const BX2 = 46
/** The panel line down the east side of block 3; the walkway is past it. */
export const EX3 = 53.5
/** Divider and south edge, both in line with block 2. */
export const DZ3 = DZ2
export const BZ3 = BZ2
/** The doorway onto the walkway, north bay then south bay. */
export const GAP3: readonly [[number, number], [number, number]] = [
  [-13, -8],
  [-1, 4],
]

/**
 * The lift lobby — building common area, reached through an opening in the
 * south wall. Not part of the suite: different floor, different ceiling, and
 * the two badge-locked doors off it go somewhere you do not have access to.
 *
 * It runs the full 64 ft of the floor plate and is 12 ft deep, so it reads as
 * the corridor it is rather than a room hung off one door. The south elevation
 * is glass either side of the lift bay.
 */
export const LOBBY = { x0: RX0, x1: RX1, z0: HALF, z1: HALF + 12 } as const
/** The cased opening from the suite into the lobby. */
export const LOBBY_DOOR = { x0: 10.4, x1: 15.6 } as const
/** Centre line of the lobby, which is also the centre line of the floor plate. */
export const LOBBY_CX = (LOBBY.x0 + LOBBY.x1) / 2

/**
 * The lift alcove, bumped out of the south wall opposite the suite door.
 *
 * The corridor is only 12 ft deep, which is not enough to stand back from a
 * pair of lift doors, so the lift gets its own bay. It is pinned to the suite
 * opening rather than the plate's centre line so that the lift stays straight
 * ahead as you walk out, whatever happens to the west end of the floor.
 */
export const LIFT_CX = (LOBBY_DOOR.x0 + LOBBY_DOOR.x1) / 2
export const LIFT_BAY = { x0: LIFT_CX - 6, x1: LIFT_CX + 6, z1: LOBBY.z1 + 8 } as const

/**
 * The one window in the lobby: the end wall of the west arm.
 *
 * You see it the moment you turn right out of the suite, at the far end of
 * the corridor, and the long south wall stays solid. Glass along the side
 * left nowhere for the doors but the piers beside the lift, where all four
 * stacked up and read as a single room; glass on the end takes nothing from
 * the walls the doors need.
 *
 * Given as a z range on the x = RX0 wall, which is the full depth of the
 * corridor less a jamb at each end.
 */
export const LOBBY_WIN = { z0: LOBBY.z0 + 0.6, z1: LOBBY.z1 - 0.6 } as const

/**
 * The restrooms, bumped out of the lobby's south wall on the east arm the
 * way the lift bay is. `door` is the centre of the opening in that wall;
 * the leaf is DOOR_W wide and hinged on its west jamb, swinging in.
 */
export const DOOR_W = 3.4
export const RESTROOMS = {
  women: {
    x0: LIFT_BAY.x1 + 0.5, x1: LIFT_BAY.x1 + 10.5,
    z0: LOBBY.z1, z1: LOBBY.z1 + 16,
    door: LIFT_BAY.x1 + 5.5,
  },
  men: {
    x0: LIFT_BAY.x1 + 11, x1: LIFT_BAY.x1 + 21,
    z0: LOBBY.z1, z1: LOBBY.z1 + 16,
    door: LIFT_BAY.x1 + 16,
  },
} as const

/** Elevator, on the far wall of the lift bay. */
export const EL = LIFT_CX
export const SZ = LIFT_BAY.z1
/** The elevator car, behind the doors: the one piece of floor on every level. */
export const CAR = { x0: EL - 3.3, x1: EL + 3.3, z0: SZ, z1: SZ + 6.2 } as const

/**
 * Storage room 2301: a 13 ft strip down the whole east side of the floor,
 * outside the wing, through the door at Z 10.3-13.7.
 */
export const CLO = { x0: RX1, x1: RX1 + 13, z0: -HALF, z1: HALF } as const

/**
 * The room used to be 18 x 13 off the same door, and everything in it — the
 * racks, the reams, the e-waste, the skeleton — was placed in world feet for
 * that room. Rather than re-place every ream, that layout is kept in its own
 * frame and turned through a quarter turn into the north end of the new room:
 * old X runs north along the strip, the old north wall becomes the east wall.
 *
 * `closetToWorld` is that turn, for the colliders, which are registered in
 * world space and cannot ride along inside a rotated group.
 */
export const CLO_OLD = { x0: 46, x1: 64, z0: 4.5, z1: 17.5 } as const
export const CLO_TURN = {
  x: CLO.x1 + CLO_OLD.z0,
  z: CLO.z0 - CLO_OLD.x0,
  ry: -Math.PI / 2,
} as const
export const closetToWorld = (b: {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}) => ({
  minX: CLO_TURN.x - b.maxZ,
  maxX: CLO_TURN.x - b.minZ,
  minZ: CLO_TURN.z + b.minX,
  maxZ: CLO_TURN.z + b.maxX,
})
/** The doorway punched through the shared wall. */
export const DOOR_Z0 = 10.3
export const DOOR_Z1 = 13.7

/** How far below the floor plate the city starts — we are ~250 ft up. */
export const GROUND_Y = -250

/**
 * Light-intensity scale.
 *
 * The original targeted three r128, whose renderer still used the legacy
 * lighting mode. Modern three (r155+) removed it, so every light reads about
 * PI times dim unless it is scaled back up. One knob, applied everywhere.
 */
export const LIGHT_SCALE = Math.PI
export const L = (intensity: number) => intensity * LIGHT_SCALE

/**
 * Intensity for a point or spot light, in candela.
 *
 * This is the one that bites. Ambient, hemisphere and directional lights just
 * needed a factor of PI, but punctual lights became genuinely physical in
 * three r155: intensity is candela and irradiance falls off with the square of
 * distance, where the old renderer used a soft linear ramp out to `distance`.
 *
 * So a ceiling fixture is specified by what it should deliver and how far it
 * has to throw: `candela(0.6)` reads as "about 0.6 of full brightness on the
 * floor 7.5 ft below". Passing the old legacy numbers straight through leaves
 * the room at roughly three percent of the intended light, which looks exactly
 * like a broken shadow map and wastes an hour.
 */
export const candela = (target: number, throwFt = 7.5) => target * throwFt * throwFt

/**
 * Where things hang on the south wall, measured as centre X and overall width.
 *
 * Kept together because the wall is shared by five separate components and
 * they were, at one point, all standing on top of each other. Clear wall runs
 * from the kanban board's frame edge (-2.85) to the lift surround (8.5).
 */
export const SOUTH_WALL = {
  printer: { x: -16.3, w: 2.2 },
  kanban: { x: -8, w: 10.3 },
  sign: { x: -0.6, w: 3.0 },
  iits: { x: 3.2, w: 2.2 },
} as const

// ---- render layers ----------------------------------------------------------

/**
 * The player's body is off layer 0.
 *
 * Raycasters only look at layer 0 by default, so this is what keeps the
 * crosshair off her sleeve and stops a mug being put down on her own shoe.
 * The camera enables the layer so she still draws.
 *
 * It is the only layer she uses. Hiding her is done by turning off colour
 * and depth writes on her materials, not by moving her to a layer the camera
 * cannot see: three's shadow pass filters objects by the *viewing* camera's
 * layers, so a layer the camera skips casts no shadow either.
 */
export const AVATAR_LAYER = 1
