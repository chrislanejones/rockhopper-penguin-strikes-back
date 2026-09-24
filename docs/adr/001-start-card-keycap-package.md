# ADR-001: The start card draws its key hints with the `keycap` package
Date: 2026-09-02   Status: draft

## Context
The start card (`src/components/ui/StartOverlay.tsx`) lists the controls as
keycaps. Hand-styled `<kbd>` elements drew the caps but could not show a
press. The point of drawing keys is that pressing W with the card up dips
the W cap, so the player can see it is the right one. Chris asked for the
key icons from keycap.vercel.app by name.

## Decision
Add `keycap@1.0.4` (MIT per the repo README; the tarball ships no license
file) as a runtime dependency. `<Keycap activeKey="w">W</Keycap>` renders a
`<kbd>` that carries a pressed class while `event.key === activeKey` is
held, via window keydown/keyup listeners. The card's `Cap` wrapper maps our
labels onto it. `src/styles.css` restates its dark variables under `.start`
(its own dark set only applies on `html[data-theme=dark]`) and overrides
the fixed 20 x 18 box; word keys like Shift get `wide`.

## Consequences
+ Live press feedback for free. The component is under 1 KB and uses only
  useState/useEffect plus jsx-runtime.
+ Reversal is one import and one CSS block.
- Peer range is React ^18.2.0; we are on 19.2.8. pnpm installed it without
  complaint and it runs, but nothing upstream promises that holds.
- The payload is not the component: clsx and tailwind-merge are inlined in
  `dist/_utils` (~60 KB of a ~62 KB dist) to join two class names. ESM only,
  and the CSS is auto-imported, so the caps' base look rides on that side
  effect surviving the bundler.
- Look is set by its CSS variables and a fixed box, so every change to the
  card's caps is an override on top of theirs.

## Alternatives rejected
1. Keep the hand-rolled `<kbd>` CSS and add the pressed state with our own
   keydown/keyup hook (~20 lines). Lost because Chris named the library, it
   is small, and reversing is trivial.

## Pre-mortem
It is six months later and this decision was a mistake. Most likely reason:
a React major bump falls outside the ^18 peer range, pnpm starts refusing
or warning, and the upstream repo is quiet, so the fix is to vendor the
30-line component we could have written in the first place, after carrying
60 KB of tailwind-merge for a class join.
Early warning sign to watch for: a peer-dependency warning on
`pnpm install`, or the caps stop dipping after a React upgrade.
