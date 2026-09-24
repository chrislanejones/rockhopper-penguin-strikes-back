# B2 — the IITS theatre

*Plan, 2026-08-29. Built the same day — see `src/components/b2/`. The layout changed on the way: theatre seats in the centre, tables to the sides, a podium with a microphone, and the screen carrying the word. What follows is the plan as it was.*

The elevator gets a second stop. B2 is an elevator lobby and a theatre laid
out cabaret-style — round tables, not rows — with the IITS stage at the far
end. No windows, so no city, no sun, no curtain wall: the cheapest floor in
the building by a long way.

## What it has to do

| Need | Detail |
|---|---|
| Elevator works | Press **B2** on 23 → doors close → ride → doors open on B2. Same trip back. |
| B2 lobby | Lift bay + short lobby, no restrooms, wayfinding to the theatre. |
| Theatre | ~60 × 40 ft hall, round tables with chairs, stage at the far end. |
| IITS stage | Raised platform, backdrop with the existing IITS art, lectern, screen. |
| No windows | Interior lighting only. The `Outside` scene stays on 23. |
| Frame rate | B2 must be *cheaper* than 23, not a second floor's worth on top of it. |

## The one decision that matters: how two floors share one scene

| Option | How | Cost while on B2 | Switch time | Verdict |
|---|---|---|---|---|
| A. Swap floors | Unmount 23, mount B2 | Lowest | **3–11 s** rebuild every ride | ✗ the floor build is the slow part |
| B. Stack, both visible | B2 at another Y, always drawn | 23 + B2 every frame | Instant | ✗ doubles draw calls |
| **C. Both mounted, one visible** | `<group visible={floor === id}>` per floor | **B2 only** | Instant | **✓ recommended** |

three skips an invisible group entirely — no draw calls, and its lights are
not gathered — so C gives A's frame cost with B's instant switch. The
sun goes inside floor 23's group, so B2 never pays for a shadow pass.

Two things assume there is only one floor and need a floor tag:

| Today | Change |
|---|---|
| `registry.ts` colliders / clickables / openables are one flat list | Each entry carries a `floor`; `hitsCollider` and the raycast lists filter by the current floor |
| `Player.tsx` `inBounds()` is the 23rd-floor footprint, hard-coded | Becomes a per-floor function; B2 registers its own |

A `FloorContext` (`<Floor id="b2">`) supplies the tag, so `Box collide`,
`Pickable` and `useOpenable` keep their current call sites unchanged.

## The ride

The 23rd-floor elevator has no car and the code says it never will. It does
not need one.

| Step | What happens | Where |
|---|---|---|
| 1 | Press the B2 button — it lights, hint *"Going down."* | `Elevator.tsx` (shared by both floors, `floor` prop) |
| 2 | Door leaves slide shut over ~1.2 s | ref-driven `useFrame`, like the storage door |
| 3 | HUD fades to black, 0.4 s | `Hud.tsx` gets a `.blackout` layer driven by the store |
| 4 | `floor` flips; player teleports to B2's lift bay; `Warmup` re-compiles for B2's lights *during the blackout* | store + a `warm(floor)` call |
| 5 | Fade up, doors open, indicator reads **B2** | `floorIndicatorTex('B2')` |

Step 4 is why the blackout exists: shader programs are keyed on light count,
so the first frame on a new floor would otherwise hitch exactly the way
turning a corner used to.

## B2 layout

Origin at the B2 lift doors, matching 23's `LIFT_CX` / `SZ` so the elevator
component is literally the same object. All units feet.

```
                     ┌─────────────────── 60 ───────────────────┐
                     │                    STAGE  30 × 12, +3 ft │ 40
                     │   screen 16:9 above · IITS backdrop    │
                     │   lectern L · tech rack R                │
                     ├──────────────────────────────────────────┤
                     │  ○   ○   ○   ○   ○      ○ = round table  │
                     │    ○   ○   ○   ○        6 chairs each    │
                     │  ○   ○   ○   ○   ○      ~20 tables       │
                     │    ○   ○   ○   ○                         │
                     │  ○   ○   ○   ○   ○      tech table ■     │
                     └────────┤ double doors ├──────────────────┘
                              │   lobby 12   │
                              │ [ELEVATOR]   │  lift bay, wayfinding, no windows
```

| Zone | Contents | Notes |
|---|---|---|
| Lift bay + lobby | Elevator, call plate, floor sign, fire map, a bench, double doors | Mirror the 23rd lobby's build so it reads as the same building |
| Hall | Carpet, 12 ft acoustic ceiling with can lights, acoustic wall panels, exit signs, aisle to the stage | `DropCeiling` is 2×4 lay-in; B2 wants a plain painted ceiling — new, simpler |
| Tables | ~20 rounds, 5 ft, black cloth, 6 chairs each, table numbers | **Instanced** — 120 chairs is one draw, not 120 × 8 |
| Stage | 30 × 12 platform 3 ft up, steps both sides, skirt, lectern, two floor monitors | Existing IITS textures from `signage.ts` for the backdrop and the screen |
| Screen | 16:9, emissive, a IITS title slide | Same pattern as Marcus's five screens |
| Stage light | 4 spots on a truss aimed at the stage, warm | `spotLight` × 4, no shadows |
| Tech table | Back of the hall: laptop, mixer, a coffee | Pickables if wanted |

## Lighting budget

| Floor | Point / spot lights | Shadow pass | Sun |
|---|---|---|---|
| 23 (today) | 20 | yes, alternate frames | yes |
| B2 | **~12** (8 cans + 4 spots) | **none** — no sun, no `castShadow` | no |

B2 should land well under 1,000 draw calls with the tables instanced.

## Work breakdown

| # | Piece | Files | Size |
|---|---|---|---|
| 1 | Floor plumbing: `floor` in store, `FloorContext`, tagged registry, per-floor `inBounds`, `<Floor>` group | `store.ts`, `registry.ts`, `Player.tsx`, `primitives.tsx`, new `Floor.tsx` | M |
| 2 | Wrap 23 in `<Floor id="23">` incl. `Lighting` and `Outside`; nothing visible changes | `Suite.tsx`, `App.tsx` | S |
| 3 | Elevator ride: door animation, blackout, teleport, indicator per floor, `Warmup.warm(floor)` | `Elevator.tsx`, `Hud.tsx`, `Warmup.tsx`, `signage.ts` | M |
| 4 | B2 lobby: lift bay, lobby, doors, signage | new `b2/Lobby.tsx` | M |
| 5 | Theatre shell: walls, floor, ceiling, cans, panels, exits | new `b2/Theatre.tsx`, `b2/constants.ts` | M |
| 6 | Stage + IITS dressing: platform, backdrop, screen, lectern, spots | new `b2/Stage.tsx` | M |
| 7 | Tables and chairs, instanced; table numbers; tech table | new `b2/Tables.tsx` | S |
| 8 | QC: both directions of the ride, colliders on both floors, pickables cannot cross floors | Tara's gate | S |

Order is the order above. 1–3 are the risky part and should ship first with
an empty B2 (four walls and the elevator) so the ride can be tested before
the theatre exists.

## Questions for Chris

| # | Question | Default if unanswered |
|---|---|---|
| 1 | How many tables? | 20 rounds of 6 |
| 2 | Anyone on stage or at the tables? | Empty — set up, doors just opened |
| 3 | What's on the screen? | IITS title slide |
| 4 | Does the stairwell come into it? | No — elevator only |
| 5 | Does she carry things between floors? | Held item comes with her; pocketed items too |

## Not in this plan

- Merging the 23rd floor's static geometry (still in `PARKING_LOT.md`)
- Sound
- Anything on floors other than 23 and B2
