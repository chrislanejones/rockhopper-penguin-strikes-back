# Parking lot

Adjacent problems noticed during a session, parked here rather than put in
the diff.

## Performance (from the 2026-08-29 frame-rate session)

- **Skyline as instances.** `City.tsx` is ~130 towers, each with its own
  window texture and two materials — about 330 draw calls and 260 materials
  for the view out of the glass. One `<Instances>` for the bodies (window UVs
  from the instance scale in a small `onBeforeCompile`, haze fade as instance
  colour) and three more for roofs, antennas and cones would make it ~5.
- **No occlusion culling.** Looking south from mid-suite draws ~2,600 calls,
  because everything behind the partitions is inside the frustum. The
  remaining big lever is merging static geometry per material (books, binders,
  partitions, desks). It cuts against the one-mesh-per-thing JSX style, so it
  wants a decision, not a quiet refactor.
- **Book spines** are ~184 separate 64×128/64×256 textures and materials.
  A single atlas would drop them to one material.
- **`Box` casts shadows by default.** 587 casters go into the sun's map;
  most are under a ceiling the sun does not pass. Either a casting slab over
  the suite (and the room gets darker, as the Lighting comment intends) or
  `cast={false}` on the small stuff.

## B2 (from the 2026-08-29/30 session)

- **Ride the lift to B1 in a real browser.** The three-stop cycle (call opens, car buttons choose,
  y jumps to 8 at the flip) is Node-verified for the walk model only; the state machine and the
  serve-gated doors have never been exercised live.
- **Walk the inset box stair in a real browser.** Node-verified heights (again after the
  2026-08-31 reversal), colliders reviewed by construction, but the in-browser walk never
  completed (hidden-tab freeze). Either arm, **lobby end**: a 4 ft doorway in the wall at the
  stair's foot, boxes climbing toward the stage.
- **Arched niches under the boxes** (the Carolina has them) — decorative only.
- **Plan doc** `docs/plans/b2-theatre.md` describes the first layout; the built one differs
  (dinner tables, U balcony, stepped boxes). Rewrite or retire.

## Elevator and broadcast (from the 2026-09-03 session)

- **Light the 14 button.** The other passenger's finger is on it; the puck could stay lit orange
  as if he pressed and the car ignored him. Small change in `CarButton` (Elevator.tsx).
- **Space on the passenger, live.** His three lines use the speaker's `useOpenable` pattern but
  were never fired from a real browser — the automation tab refuses pointer lock.
- **The side TVs face the house only.** From the boards you cannot see yourself on them; the
  confidence monitor over the mezzanine doors is what the speaker sees. Fine, but noted.

## People (from the 2026-09-18 session)

- **Her body draws until her first reach.** `registerRig` ends with `shown = false` but never turns
  the body materials' colour writes off, and `show()` returns early when nothing changed — so from
  boot, looking down shows her chest and jacket, and that stops after the first reach/carry ends.
  Either a nice accident or a bug; it wants a decision, not a quiet fix (`lib/avatar.ts`).
- **The studio's badge is blank.** `/studio.html` loads the GLB without `registerRig`, so the IITS
  badge is never painted there. Export `badgeTex` or paint it in the studio.
- **Her hair is rigid.** The fall and the two front locks hang off `Head`, so they swing with the
  look pitch: look down at a mirror and the back of her hair lifts off her jacket. Same as before
  the rebuild, more noticeable now that the hair is longer.
- **The men share a body below the neck** (`people/parts.tsx`: legs, oxfords, badge, fingers). A
  third standing man would want the torso strips (`strip()` in Passenger/Speaker) pulled out too.

## Docs (from the 2026-09-18 session)

- **README is a month behind.** Only the avatar section and the tree were fixed today. Still wrong:
  "the button does nothing" (the lift runs to B1/B2), Space also jumps, Storage 2301 dimensions,
  "Seven image files" (13 now; table and totals stale), Layout tree missing b2/, state/, studio/.
- **US-English sweep.** README (labour, colour, randomised), this file (colour), and
  `docs/plans/b2-theatre.md` (centre). The new people code was swept on the day.
- **No `engines` field.** `pnpm build:avatar` needs Node >= 22.18 (ADR-002); package.json does not say so.

## The watch (from the 09-21-2026 session)

- **British spellings came in with the watch PR.** `coloured` in `Watch.tsx`, `styles.css` and
  the README's watch section. House rule is US English; fix them in one pass, not piecemeal.
- **Start card still says "time, calendar, every key"** for the arrow keys. True, but the watch
  has four pages now. Naming all four wrapped the row onto a second line, so it was left alone.
  (2026-09-21: now "time, keys, lift camera", which fits on one line.)

## Watch rendezvous page (from the 2026-09-21 session)

- **Ride hints may sit under the blackout.** `.blackout` comes after `.hint` in `Hud.tsx`, so a
  line shown as the car goes dark ("Going down. The theatre is being built on the way…") could be
  covered for the whole ride. Not checked in a browser.
- **Her department disagrees with itself.** Her badge says Fiscal Services, Suite 2310; the car
  directory says 23 is Web Services; the watch says Suite 2300. The new dialogue names neither.
- **Space on him in person still gets the old three lines.** The conversation only runs through
  the watch. Running the same exchanges when she presses Space on him in the car is a small follow-up.

