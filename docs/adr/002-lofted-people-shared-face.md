# ADR-002: People are lofted surfaces with one shared face, and the avatar script imports that TypeScript into Node
Date: 2026-09-18   Status: draft

## Context
The three people (the player's avatar, the lift passenger, the B2 speaker)
were each hand-assembled from cylinders, spheres and boxes, three different
ways, with the same faults: bucket jaw, bug eyes, pencil neck, tube torso,
pipe legs with a gap at the crotch. Earlier sessions tuned each figure alone
and the faults came back. The avatar is baked to a .glb by a Node script;
the two men are JSX.

## Decision
1. One primitive, `src/lib/loft.ts`: `loftGeometry(rings, opts)` skins one
   indexed BufferGeometry over a stack of cross-section rings. `open` leaves
   a gap at the front (a hairline, an open jacket); `span` takes a strip, so
   a shirt V, tie or lapel is a strip of the jacket's own let-out surface.
   `limbGeometry` and `strandGeometry` cover sleeves, legs and hair locks.
2. One face, `src/lib/face.ts`: `makeFace(spec)` returns the skull loft plus
   a flat parts list in head units; `soft` 0..1 runs from a man's jaw to a
   woman's. `src/components/people/` maps the list into `<mesh>` elements, so
   the hierarchy stays in JSX, not in a `THREE.Group` behind `<primitive>`.
3. `scripts/build-avatar.mjs` imports `loft.ts` and `face.ts` from `src/` on
   Node's built-in type stripping, so the .glb and the JSX figures run the
   same geometry code.

## Consequences
+ One head and one surface tool for all three: a fix to the jaw lands on
  everyone. Cloth lies on the body by construction, so nothing floats.
- Heavier. All three in the studio scene: draw calls 276 -> 319, triangles
  19,494 -> 48,952. Avatar .glb: 101 -> 110 meshes, 6,632 -> 13,626
  triangles, 244,184 -> 246,796 bytes.
- `pnpm build:avatar` needs Node >= 22.18 (this machine: v25.2.1);
  package.json has no `engines` field to say so.
- The two lib files must stay free of React and the DOM, use only erasable
  TS (no enums, no parameter properties) and give relative imports their
  `.ts` extension. Only a comment enforces it: `pnpm build` passes either
  way and the break shows at the next bake.
- A style split: the avatar is flat-shaded at load, the men smooth-shaded.

## Alternatives rejected
1. Keep tuning primitives per figure: three divergent faces, same faults.
2. Download or generate models (Sketchfab, Poly Pizza, Hyper3D): the premise
   is no modeling tool and no downloaded assets, third-party licensing is
   already open before the repo goes public, and the avatar needs named joints.
3. Copy the loft into the .mjs: two copies of the core geometry code.

## Pre-mortem
It is six months later and this decision was a mistake. Most likely reason:
we wrote a small modeling tool to avoid using one. The figures are tables of
hand-tuned numbers (`SKULL`, `JACKET`) that only tune by eye, faces made of
rings and scaled spheres hit a ceiling a rigged model would not, and the
avatar alone is 110 meshes on a floor that already draws ~2,600 calls
looking south. And the .glb is committed, so nobody bakes for months, then
the first bake elsewhere fails on an old Node or an enum in `face.ts`.
Early warning sign to watch for: a second session re-tuning the same ring
tables for the same complaint, or `pnpm build:avatar` failing where
`pnpm build` passes.
