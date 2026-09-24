# Suite 2300

![Rockhopper Penguin Strikes Back — an event poster for Inaccessible Island](docs/img/rockhopper-penguin-strikes-back.webp)

A walkable 23rd floor of the Rockhopper Building, 1821 Waterfall Road, London — the London offices of the Parliament of Inaccessible Island. Built with **React Three Fiber**, **React 19** and **TypeScript** on Vite.

Why London: Inaccessible Island is part of a British Overseas Territory and has no buildings on it at all, and nothing on Tristan da Cunha is taller than a house. A 23-floor office has to be somewhere else.

You walk around an office. There are eight desks with other people's things on them, a break room with a staff-update deck on one TV and the weather on the other, a storage room with a skeleton in it, and a lift lobby where the button does nothing. Out the window is London from 250 feet up, with traffic on the streets below.

It started as a single 300 KB HTML file running three.js r128 from a CDN. This is that scene rebuilt as a project.

## Quick start

Needs Node and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev          # localhost:5173
```

```bash
pnpm build        # tsc --noEmit, then vite build
pnpm typecheck    # just the types
```

## Controls

| Input | Does |
| --- | --- |
| `W` `A` `S` `D` | Walk |
| Mouse | Look |
| `Shift` | Run |
| Click | Pick up a mug, the duck, a biscuit, the foam blaster. Click again to set it down |
| `Shift` + click | Throw whatever is in your hands |
| Click | Press a button: the lift, the soda machine. Fire the foam blaster |
| `Shift` + click | With the blaster: put it down |
| `Space` | Open what you are looking at: the storage door, the fridge, the safe |
| `T` | Her wrist comes up and the watch fills the screen. `T` again puts it down |
| `←` `→` | With the watch up: turn its pages |
| `Esc` | Release the mouse |

You aim with the crosshair, not the cursor. Whatever you are carrying is listed
in the bottom left corner — what is in your hands, and what is in your pockets.

You have a body. It stays out of the way until it is doing something: reach for
a mug and the arm comes up with the mug on its palm, press space at a door and
a hand goes to the handle, pick up the blaster and it is held by the grip with
the barrel where you are looking. The rest of the time the arms hang at her
sides, out of frame, and all you see of her is her shadow.

## The watch

`T` is the GoldenEye watch. Her left wrist comes up — the same pose the arm IK
has always had for it — the lens closes from 70 degrees to 34, and the dial
fills the screen: black case, a ring of coloured segments, a green LCD behind
scanlines. Four pages, left and right through them, `T` or the EXIT button to
put it down. The case is 007's. What is on the glass is closer to what is on
your own wrist: round on every page, a face first that takes all of it, then
square cards in the middle with the page's name above and the dots below.

| Page | On it |
| --- | --- |
| Watch face | A round dial that fills the glass: the time off your own clock, a date window at 3 with the day the building is on, and above the 6, ISLAND TIME ZONE and which keys turn the page |
| Status | The time in figures and the full date. Where you are standing. What you are carrying, and how far through the safe you are |
| Calendar | September 2026, with the 16th filled and the 17th ringed the way the break-room wall calendar has them, and the three things on: IITS day one, the awards gala in B2, IITS day two |
| Shortcuts | Every key, so the start card is not the only place they are written down |

Nothing moves while it is up. Walking, looking, clicking and the space bar all
stop at the keyboard — you are looking at your watch — and a key you were
holding when it came up is released for you, so she does not walk into a wall
while you read the calendar.

The dial is a DOM overlay rather than a texture on the 3 mm watch face in her
cuff. The screen is small text, small text on a cylinder is a smudge, and the
zoom is what ties the two together: the office behind the case is the same
office, the same distance away, seen through a longer lens.

## The floor

Units are feet, everywhere. Eight-foot ceilings and a 2x4 lay-in grid stay whole numbers that way.

| Area | What's there |
| --- | --- |
| Main suite | Two cubicle blocks, eight workstations, kanban board, printer, a floor fan in every corner |
| Break room | 19 x 36 on vinyl: counter, two TVs, ping-pong, soda machine, dartboard |
| West wall | Two coffee machines, a kettle, two Rockhopper biscuit tins, a bottom-freezer fridge, wall calendar, labour law board |
| Wing | Reference bookcases, records overflow, on-call board, the island's flag |
| Storage 2301 | A 13 x 36 strip down the east side: racks, paper, e-waste, eleven dead laptops, a teaching skeleton in a paper crown, and a safe |
| Lift lobby | A 64 ft corridor along the south side: a window at one end, the lift in a bay, two badge doors, a British food cart parked by the glass |
| Restrooms | Two 10 x 11 rooms off the lobby: tile, a vanity with a mirror that works, two stalls each, urinals in the men's. She will go in one of them |
| Outside | The Walkie-Talkie straight out the glass, 130 more towers, a street grid with 110 cars, and the Thames |

The safe is locked. The key is a small brass thing on a desk out in the
cubicles, stamped 2301 so you know where it goes. What is in the safe is the box
of passports the compliance board has been asking about since March, and a five
pound fuel card that expired in 2019.

Things that do something: the drip coffee maker brews when you press its
button; the single-serve one next to it fills a paper cup you can take, and
puts out a new cup when you do. The soda machine drops a can that rolls, and
you can pick it up once it stops. The fridge opens. The foam blaster fires
darts that stick to the walls. The lobby doors all answer space, even the ones
that do not open.

The ceiling is a real grid: 19 columns by 18 rows, every cell either blank, a light, a supply diffuser, a wireless access point, a paging speaker, a sprinkler drop, a tile that has failed, or — over records storage — no tile at all, so you can see the duct and the hangers.

## The avatar

One model file: `public/models/office-woman.glb`, 241 KB, 13,626 triangles in
110 meshes. She is written in code in `scripts/build-avatar.mjs` the same way
the rest of the office is, then exported once, because she is posed every frame
and wants a stable set of named joints to do it with. `pnpm build:avatar`
regenerates her. That script wants Node 22.18 or later: it imports two
TypeScript files from `src/lib/` as they are and lets Node strip the types.

The building is boxes and cylinders because a building is. She is not. A torso
built as a cylinder is a pipe with a head on it, so her trunk, limbs, shoes and
hair are lofted: `src/lib/loft.ts` takes how wide and how deep she is at each
height, front and back separately, and runs one surface through all of it. The
small things are still primitives: fingers, heels, buttons, the watch. Her head
is `src/lib/face.ts`, and the two other people in the building, a man in the
lift and the speaker on the stage in B2, wear the same one with a man's jaw.
Those two are JSX, not model files, built on the same loft. `/studio.html` on
the dev server stands all three in a row.

There is no skinning. The limbs hang off sixteen empties — hips, spine, neck,
head, and shoulder / elbow / wrist, hip / knee / ankle each side — and posing
is a matter of rotating them. The arms are aimed with two-bone IK at a point;
the wrist is then turned to suit what the hand is doing: palm up under a mug,
wrapped round a pistol grip, back of the hand to the face for the watch.

She is off layer 0, so the raycasters — which only look at layer 0 — never
hit her: a mug put down would otherwise land on her own shoe. Hiding her is
not done with layers, though. three's shadow pass filters objects by the
viewing camera's layers, so anything the camera cannot see casts no shadow
either, and a shadow with no head is worse than none. Instead her materials
stop writing colour and depth when she has nothing to do, and the head's
materials never write at all. The shadow pass uses its own depth material and
ignores both, so the whole of her is on the carpet whatever you can see.

## Images

Ten image files in `public/textures/`. Everything else in the scene is drawn with the 2D canvas API at load time — ceiling tiles, monitor screens, book spines, box labels, the flag, the paintings in the lobbies. It keeps the download small and the labels legible.

| Asset | Source | WebP | Change | Where |
| --- | --- | --- | --- | --- |
| gatekeeper | 709,723 | 49,622 | −93% | Framed in the lift lobby: You Shall Not Pass |
| albatross | 1,759,438 | 24,898 | −99% | Tile mosaic on the break-room wall calendar |
| oliva-wreck | 784,750 | 22,666 | −97% | Tile mosaic framed in the B2 lobby, the 2011 wreck on Nightingale |
| loneliest-house | 3,597,494 | 25,976 | −99% | Tile mosaic taped to the storage-room end wall |
| stamp-1961 | 213,484 | 8,928 | −96% | Tile mosaic of Tristan's 1961 eruption stamp, framed over the kettle |
| agreement-1817 | 1,326,358 | 21,422 | −98% | Framed on the B2 mezzanine |
| hen | 834,623 | 61,490 | −93% | Photo on James's cubicle panel |
| farm | — | 57,044 | — | Framed beside James's desk |
| fire-git | 33,130 | 11,622 | −65% | Printout pinned in Ava's cubicle |
| happy-feet-dvd | 255,492 | 7,448 | −97% | Cover of the DVD in the storage room, half torn off |

The albatross, the Oliva, the loneliest house and the 1961 stamp are tile mosaics built from pictures the repo has no rights to, so none of the originals ship. The house on Elliðaey comes out as one white tile.

The agreement is the page the first settlers of Tristan da Cunha signed at Somerset Camp on 7 November 1817. It is cropped out of the binding and held at 560 px wide.

## Things worth knowing

**Lighting is the one that bites.** three.js r155 made point and spot lights physical: intensity is candela and irradiance falls off with the square of distance, where the old renderer used a soft linear ramp out to `distance`. Carrying the original numbers straight across leaves the room at roughly three percent of the intended light, and it looks exactly like a broken shadow map. `candela()` in `src/scene/constants.ts` states the intent instead — `candela(0.62)` means "about 0.62 of full brightness on the floor 7.5 ft below". Ambient, hemisphere and directional lights only needed a flat factor of PI, which is `L()`.

Two more lighting notes. R3F applies ACES filmic tone mapping by default, which crushes the midtones; `flat` on the `<Canvas>` turns it off. And point lights in a ceiling rake vertical surfaces almost edge-on, so partitions come out near-black without global illumination — two dim shadowless directional lights stand in for the bounce.

**Aiming.** R3F's pointer events raycast through the mouse position, which stops updating under pointer lock. `Interaction.tsx` keeps its own list of clickable objects and casts a ray straight down the camera axis, which is where the crosshair is.

**Colliders live outside React.** The player reads the collider list every frame and the raycast reads the clickable list on every mousedown. Neither should cause a render, so both are plain module-level arrays in `src/lib/registry.ts` that components add to and remove from.

**The mirror is a Reflector.** three's `Reflector` renders the scene again from the far side of the glass. Its virtual camera only sees layer 0 out of the box, so it is told about the player's layer, and her materials are made to draw — head included — for the length of its pass, then hidden again before the main render.

**Two verbs, two lists.** Click is for what you can pick up and what you can press. Space is for what swings. They aim the same way, one ray down the camera axis, but they read different registries — on one button, a click near a desk was a coin toss between carrying something and opening something.

**A collider can appear around you.** The safe door and the fridge door each register a footprint only while they are open, and one that turns up where you are standing would refuse every direction and leave you in it for good. `tryMove` checks whether you are already inside a footprint and skips the collider test for that step if you are, so you can always walk back out.

**A thrown mug used to end up in the street.** `stepThrown` applies gravity and then casts a ray down to find the floor. Cast from where the object has just arrived, a fast fall steps clean past the carpet in one frame: the floor is now behind the ray, and the next surface under it is the city 250 feet below. The ray is swept instead, starting from wherever the object was highest that frame, with a hard backstop at floor level for the case where it still misses.

**The river has a footprint.** `scene/city.ts` knows where the Thames is, so towers do not get built in it and 18 of the 26 streets stop at the bank. Each car belongs to one road segment and wraps within it, so nothing drives into the water.

**The floor is not one rectangle.** The suite is the main plate, the lift lobby hangs off its south wall, and the storage room off its east wall. A spot is in bounds if it falls inside any of them; the walls between are ordinary colliders.

## Layout

```
src/
├── scene/
│   ├── constants.ts        # every dimension, in feet; L() and candela()
│   ├── city.ts             # street grid, river footprint, block snapping
│   └── materials.ts        # the shared material palette
├── lib/
│   ├── canvasTex.ts        # canvas-drawn textures
│   ├── registry.ts         # colliders, clickables and openables, outside React
│   ├── pickup.ts           # what is in the player's hands
│   ├── avatar.ts           # the body: joints, IK, what each hand is doing
│   ├── loft.ts             # a surface through a stack of cross-sections: torsos, limbs, hair
│   └── face.ts             # the one head all three people share, as a list of parts
├── textures/               # every canvas-drawn surface, grouped by subject
├── components/
│   ├── props/              # desks, chairs, monitors, pickables
│   ├── people/             # Head, Loft, Limb, and what the two men share below the neck
│   └── ui/                 # start card, crosshair, the watch, error boundary
├── Suite.tsx               # the floor, assembled in build order
└── App.tsx                 # Canvas, player, avatar, interaction
scripts/
└── build-avatar.mjs        # authors and exports public/models/office-woman.glb
```

## Notes

Geometry and hierarchy are JSX. `useMemo` only holds what has to stay stable across renders — procedural data, textures, materials — because a randomised texture rebuilt on a re-render both costs frames and visibly reshuffles the scene.

The building, the Parliament, the symposium and everyone in it are made up. London is London. Inaccessible Island is real: the uninhabited one in the Tristan da Cunha group, cliffs all round and one waterfall down the north face. So are its two birds, the wreck of the MS Oliva in 2011, and the 1817 agreement.
