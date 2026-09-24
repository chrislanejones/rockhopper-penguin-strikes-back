import { useMemo } from 'react'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { H, LIFT_BAY, LIFT_CX, candela } from '../../scene/constants'
import { B2, MEZZ } from '../../scene/b2'
import { restroomSignTex, terrazzoTex } from '../../textures/lobby'
import { b2FloorSignTex, b2WayfindingTex, iitsPosterTex, exitTex } from '../../textures/b2'
import { Box, Collider, Panel } from '../props/primitives'
import { Elevator } from '../Elevator'
import { AgreementPage, BlendenHallPainting } from '../WallArt'

const { lobby, doors, grand } = B2
const W = lobby.x1 - lobby.x0
const D = lobby.z1 - lobby.z0
const CX = (lobby.x0 + lobby.x1) / 2
const MID_Z = (lobby.z0 + lobby.z1) / 2
const HT = lobby.h
const BAY_W = LIFT_BAY.x1 - LIFT_BAY.x0
/** The mezzanine deck: from the strip's edge out to the shaft's upper mouth. */
const DECK_D = LIFT_BAY.z1 - MEZZ.strip.z1
const DECK_MID = (MEZZ.strip.z1 + LIFT_BAY.z1) / 2
/** The shaft block's side walls, standing proud of the south wall. */
const SHELL = [7.4, 18.6] as const
const SHELL_Z0 = 37.8
/** Between the two pairs of doors: where the sign hangs. */
const MID_X = (doors[0].x1 + doors[1].x0) / 2
/** Ten treads a flight on the grand stairs, half the rise each flight. */
const STEPS = 10
const RISE = grand.rise / 2 / STEPS
const TREAD = (grand.run1 - grand.run0) / STEPS
/** The bathroom doors, on the south wall under the mezzanine. */
const BATHS = [
  { x: -3, sign: 'WOMEN' },
  { x: 29, sign: 'MEN' },
] as const

/** Wainscot cap height. */
const WAIN = 2.6

/**
 * The B2 lift lobby.
 *
 * Sixteen feet tall, with the lift in its own eight-foot alcove on the south
 * side, and on the north wall — the one facing you as you step out — left
 * to right: a stair, a pair of doors, a pair of doors, a stair. The doors go
 * to the floor of the hall; the stairs climb to the balcony through openings
 * in the same wall, eight feet up. The wall itself belongs to the hall.
 */
export function Lobby() {
  const floorFor = (w: number, d: number) => {
    const t = terrazzoTex().clone()
    t.needsUpdate = true
    t.repeat.set(w / 2, d / 2)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.05 })
  }
  const lobbyFloor = useMemo(() => floorFor(W, D), [])

  const plaster = useMemo(() => M(0xd6cbb0, { roughness: 0.9 }), [])
  const ceiling = useMemo(() => M(0xe8e2d2, { roughness: 0.95 }), [])
  const wainscot = useMemo(() => M(0x4a3324, { roughness: 0.6 }), [])
  const tread = useMemo(() => M(0x5b3f2a, { roughness: 0.7 }), [])
  const brass = useMemo(() => M(0xb08a3c, { roughness: 0.35, metalness: 0.8 }), [])
  const lens = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff1dc,
        emissiveIntensity: 1.15,
        roughness: 0.35,
      }),
    [],
  )
  const wayfinding = useMemo(
    () => new THREE.MeshStandardMaterial({ map: b2WayfindingTex(), roughness: 0.5 }),
    [],
  )
  const floorSign = useMemo(
    () => new THREE.MeshStandardMaterial({ map: b2FloorSignTex(), roughness: 0.5 }),
    [],
  )
  const poster = useMemo(
    () => new THREE.MeshStandardMaterial({ map: iitsPosterTex(), roughness: 0.6 }),
    [],
  )
  const exit = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: exitTex(),
        emissive: 0xffffff,
        emissiveMap: exitTex(),
        emissiveIntensity: 0.9,
      }),
    [],
  )
  const leaf = useMemo(() => M(0x4a3324, { roughness: 0.5 }), [])
  const slab = useMemo(() => M(0x3a2a22, { roughness: 0.85 }), [])
  const gilt = useMemo(() => M(0xb8912e, { roughness: 0.35, metalness: 0.75 }), [])
  const column = useMemo(() => M(0xc9b895, { roughness: 0.85 }), [])
  const signW = useMemo(
    () => new THREE.MeshStandardMaterial({ map: restroomSignTex('WOMEN'), roughness: 0.6 }),
    [],
  )
  const signM = useMemo(
    () => new THREE.MeshStandardMaterial({ map: restroomSignTex('MEN'), roughness: 0.6 }),
    [],
  )
  const stripFloor = useMemo(() => floorFor(MEZZ.strip.x1 - MEZZ.strip.x0, 4), [])
  const bridgeFloor = useMemo(() => floorFor(MEZZ.bridge.x1 - MEZZ.bridge.x0, 7.65), [])
  const deckFloor = useMemo(() => floorFor(BAY_W, DECK_D), [])

  return (
    <>
      {/* floor and ceiling: one big room, floor to the tall ceiling, the shaft standing in it */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0.005, MID_Z]} material={lobbyFloor}>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[CX, HT, MID_Z]} material={ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/* east and west walls */}
      {[lobby.x0 - 0.2, lobby.x1 + 0.2].map((x) => (
        <Box key={x} size={[0.4, HT, D]} material={plaster} position={[x, HT / 2, MID_Z]} cast={false} collide />
      ))}
      {/* south wall, either side of the shaft's block */}
      <Box
        size={[SHELL[0] + 0.3 - lobby.x0, HT, 0.4]}
        material={plaster}
        position={[(lobby.x0 + SHELL[0] + 0.3) / 2, HT / 2, lobby.z1 + 0.2]}
        cast={false}
        collide
      />
      <Box
        size={[lobby.x1 - SHELL[1] + 0.3, HT, 0.4]}
        material={plaster}
        position={[(SHELL[1] - 0.3 + lobby.x1) / 2, HT / 2, lobby.z1 + 0.2]}
        cast={false}
        collide
      />
      {/* the shaft's block: a full-height wall down each side, standing proud of the south wall */}
      {SHELL.map((x) => (
        <group key={x}>
          <Box
            size={[0.6, HT, lobby.z1 + 0.4 - SHELL_Z0]}
            material={plaster}
            position={[x, HT / 2, (SHELL_Z0 + lobby.z1 + 0.4) / 2]}
            cast={false}
          />
          <Collider minX={x - 0.3} maxX={x + 0.3} minZ={SHELL_Z0} maxZ={lobby.z1 + 0.4} />
        </group>
      ))}

      {/* wainscot, the old building showing through */}
      {[lobby.x0 + 0.07, lobby.x1 - 0.07].map((x) => (
        <Box key={x} size={[0.14, WAIN, D]} material={wainscot} position={[x, WAIN / 2, MID_Z]} cast={false} />
      ))}
      {/* along the south wall in runs, stopping for the bathroom doors and the bay */}
      {(
        [
          [lobby.x0, BATHS[0].x - 2.2],
          [BATHS[0].x + 2.2, LIFT_BAY.x0],
          [LIFT_BAY.x1, BATHS[1].x - 2.2],
          [BATHS[1].x + 2.2, lobby.x1],
        ] as const
      ).map(([a, b]) => (
        <Box
          key={a}
          size={[b - a, WAIN, 0.14]}
          material={wainscot}
          position={[(a + b) / 2, WAIN / 2, lobby.z1 - 0.07]}
          cast={false}
        />
      ))}

      {/* fixtures across the high ceiling, two rows now the room runs deep */}
      {(
        [
          [lobby.x0 + 7, 23, HT],
          [2, 23, HT],
          [lobby.x1 - 30, 23, HT],
          [lobby.x1 - 7, 23, HT],
          [lobby.x0 + 7, 39, HT],
          [2, 39, HT],
          [lobby.x1 - 30, 39, HT],
          [lobby.x1 - 7, 39, HT],
        ] as const
      ).map(([x, z, y]) => (
        <group key={`${x}:${z}:${y}`}>
          <mesh position={[x, y - 0.06, z]} material={lens}>
            <boxGeometry args={[3.4, 0.12, 1.8]} />
          </mesh>
          <pointLight
            position={[x, y - 0.6, z]}
            color={0xfff1dc}
            intensity={candela(0.8, y < H ? 7.5 : 12)}
            distance={y < H ? 30 : 44}
            decay={2}
          />
        </group>
      ))}

      {/* two door cases into the hall: jambs, header, and the leaves stood open against the hall wall */}
      {doors.map((d) => {
        const w = d.x1 - d.x0
        const cx = (d.x0 + d.x1) / 2
        return (
          <group key={d.x0}>
            {/* the jambs stand 0.02 proud into the opening: their reveals must not share the wall's cut faces, or the two flicker */}
            {[d.x0 - 0.18, d.x1 + 0.18].map((x) => (
              <Box key={x} size={[0.4, 7.6, 0.9]} material={wainscot} position={[x, 3.8, lobby.z0]} cast={false} collide />
            ))}
            <Box size={[w + 0.8, 0.5, 0.9]} material={wainscot} position={[cx, 7.65, lobby.z0]} cast={false} />
            <group position={[d.x0, 3.5, lobby.z0 - 0.4]} rotation={[0, 1.45, 0]}>
              <Box size={[w / 2 - 0.05, 7.0, 0.15]} material={leaf} position={[(w / 2 - 0.05) / 2, 0, 0]} cast={false} />
              <Box size={[0.5, 0.9, 0.05]} material={brass} position={[w / 2 - 0.5, 0, 0.1]} cast={false} />
            </group>
            <group position={[d.x1, 3.5, lobby.z0 - 0.4]} rotation={[0, -1.45, 0]}>
              <Box size={[w / 2 - 0.05, 7.0, 0.15]} material={leaf} position={[-(w / 2 - 0.05) / 2, 0, 0]} cast={false} />
              <Box size={[0.5, 0.9, 0.05]} material={brass} position={[-(w / 2 - 0.5), 0, 0.1]} cast={false} />
            </group>
            <Panel size={[1.6, 0.6]} material={exit} position={[cx, 7.4, lobby.z0 + 0.5]} />
          </group>
        )
      })}

      {/*
        The grand stairs: one switchback each end. The outer lane climbs the
        end wall from the south to a landing against the hall wall, turns,
        and the inner lane climbs back south to the mezzanine, arriving at
        the pad beside the strip. Solid plinths under everything, a sloped
        brass rail over each open edge, and colliders that keep a walker on
        the floor from strolling into the underside.
      */}
      {[-1, 1].map((sSide) => {
        const o = sSide < 0 ? lobby.x0 : lobby.x1
        const d = sSide < 0 ? 1 : -1
        const laneA = o + d * (grand.w / 2)
        const laneB = o + d * grand.w * 1.5
        const divide = o + d * grand.w
        const inner = o + d * grand.w * 2
        const mm = (a: number, b: number) => ({ minX: Math.min(a, b), maxX: Math.max(a, b) })
        const tilt = Math.atan2(grand.rise / 2, grand.run1 - grand.run0)
        return (
          <group key={sSide}>
            {Array.from({ length: STEPS }, (_, k) => {
              const h = (k + 1) * RISE
              const z = grand.run1 - (k + 0.5) * TREAD
              return (
                <Box key={k} size={[grand.w - 0.1, h, TREAD]} material={tread} position={[laneA, h / 2, z]} cast={false} />
              )
            })}
            <Box
              size={[2 * grand.w - 0.1, grand.rise / 2, grand.run0 - lobby.z0]}
              material={tread}
              position={[o + d * grand.w, grand.rise / 4, (lobby.z0 + grand.run0) / 2]}
              cast={false}
            />
            {Array.from({ length: STEPS }, (_, k) => {
              const h = grand.rise / 2 + (k + 1) * RISE
              const z = grand.run0 + (k + 0.5) * TREAD
              return (
                <Box key={k} size={[grand.w - 0.1, h, TREAD]} material={tread} position={[laneB, h / 2, z]} cast={false} />
              )
            })}
            <Box
              size={[grand.w - 0.1, grand.rise, grand.pad1 - grand.run1]}
              material={tread}
              position={[laneB, grand.rise / 2, (grand.run1 + grand.pad1) / 2]}
              cast={false}
            />
            {/*
              A handrail over each lane's open edge, three feet above its own
              treads, on posts — the outer lane's along the divide, the inner
              lane's along the edge over the lobby — but only where there is
              an edge. Both used to run the whole flight: the outer one poked
              into the landing turn, and the inner one carried on past 26,
              where the mezzanine strip comes alongside and you step onto the
              stair sideways — so the bar and its last post ran straight
              across the way on at chest height. Nothing here is a collider:
              the plinths are solid, and a rail you cannot walk past turns a
              staircase into a maze.
            */}
            {(
              [
                { x: divide - d * 0.2, up: false, z0: grand.run0 + 0.5, z1: grand.run1 - 0.5 },
                { x: inner - d * 0.2, up: true, z0: grand.run0 + 0.2, z1: MEZZ.strip.z0 + 0.2 },
              ] as const
            ).map(({ x, up, z0, z1 }) => {
              const deck = (z: number) => {
                const t = (z - grand.run0) / (grand.run1 - grand.run0)
                return up ? grand.rise / 2 + (grand.rise / 2) * t : (grand.rise / 2) * (1 - t)
              }
              const zc = (z0 + z1) / 2
              const posts = Math.max(2, Math.round((z1 - z0) / 2))
              return (
                <group key={x}>
                  <Box
                    size={[0.14, 0.14, (z1 - z0) / Math.cos(tilt)]}
                    material={brass}
                    position={[x, deck(zc) + 3, zc]}
                    rotation={[up ? -tilt : tilt, 0, 0]}
                    cast={false}
                  />
                  {Array.from({ length: posts + 1 }, (_, i) => {
                    const z = z0 + ((z1 - z0) * i) / posts
                    return (
                      <Box key={i} size={[0.09, 3, 0.09]} material={brass} position={[x, deck(z) + 1.5, z]} cast={false} />
                    )
                  })}
                </group>
              )
            })}
            <Collider {...mm(o, inner)} minZ={lobby.z0} maxZ={grand.run0} below={3} />
            <Collider {...mm(inner - 0.15, inner + 0.15)} minZ={grand.run0} maxZ={grand.pad1} below={7} />
            {/* the pad's south face overlooks the floor now: a rail across it */}
            <Box size={[grand.w + 0.2, 2.8, 0.3]} material={wainscot} position={[laneB, 9.4, grand.pad1 + 0.15]} cast={false} />
            <Box size={[grand.w + 0.4, 0.14, 0.4]} material={gilt} position={[laneB, 10.87, grand.pad1 + 0.15]} cast={false} />
            <Collider {...mm(laneB - grand.w / 2, laneB + grand.w / 2)} minZ={grand.pad1} maxZ={grand.pad1 + 0.3} above={6.5} />
          </group>
        )
      })}

      {/*
        B1: the mezzanine. The strip between the stair tops, the bridge out
        through the hall wall to the balcony, the deck over the bay to the
        car's upper mouth — dark slab, terrazzo on top, a rail wherever
        there is a drop, and columns under the strip so it stands on
        something.
      */}
      <Box size={[MEZZ.strip.x1 - MEZZ.strip.x0, 0.4, 4]} material={slab} position={[LIFT_CX, 7.8, 28]} cast={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LIFT_CX, 8.005, 28]} material={stripFloor}>
        <planeGeometry args={[MEZZ.strip.x1 - MEZZ.strip.x0, 4]} />
      </mesh>
      {/* the bridge: the width of both pairs of doors it serves, and two columns under it flanking the Blenden Hall */}
      <Box size={[MEZZ.bridge.x1 - MEZZ.bridge.x0, 0.4, 7.65]} material={slab} position={[LIFT_CX, 7.8, 22.175]} cast={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LIFT_CX, 8.005, 22.175]} material={bridgeFloor}>
        <planeGeometry args={[MEZZ.bridge.x1 - MEZZ.bridge.x0, 7.65]} />
      </mesh>
      {[9.4, 16.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.8, 21.5]} material={column}>
            <cylinderGeometry args={[0.5, 0.6, 7.6, 16]} />
          </mesh>
          <Box size={[1.5, 0.35, 1.5]} material={gilt} position={[x, 7.45, 21.5]} cast={false} />
          <Collider minX={x - 0.7} maxX={x + 0.7} minZ={20.8} maxZ={22.2} below={7} />
        </group>
      ))}
      <Box size={[BAY_W, 0.4, DECK_D]} material={slab} position={[LIFT_CX, 7.8, DECK_MID]} cast={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LIFT_CX, 8.005, DECK_MID]} material={deckFloor}>
        <planeGeometry args={[BAY_W, DECK_D]} />
      </mesh>
      {/* rails down both sides of the deck as it crosses the floor, and a column under each */}
      {[LIFT_BAY.x0 + 0.15, LIFT_BAY.x1 - 0.15].map((x) => (
        <group key={x}>
          <Box size={[0.3, 2.8, SHELL_Z0 - MEZZ.strip.z1]} material={wainscot} position={[x, 9.4, (MEZZ.strip.z1 + SHELL_Z0) / 2]} cast={false} />
          <Box size={[0.4, 0.14, SHELL_Z0 - MEZZ.strip.z1 + 0.2]} material={gilt} position={[x, 10.87, (MEZZ.strip.z1 + SHELL_Z0) / 2]} cast={false} />
          <Collider minX={x - 0.15} maxX={x + 0.15} minZ={MEZZ.strip.z1} maxZ={SHELL_Z0} above={6.5} />
        </group>
      ))}
      {[LIFT_BAY.x0 + 1, LIFT_BAY.x1 - 1].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.8, 36]} material={column}>
            <cylinderGeometry args={[0.5, 0.6, 7.6, 16]} />
          </mesh>
          <Box size={[1.5, 0.35, 1.5]} material={gilt} position={[x, 7.45, 36]} cast={false} />
          <Collider minX={x - 0.7} maxX={x + 0.7} minZ={35.3} maxZ={36.7} below={7} />
        </group>
      ))}
      {/* the strip's south edge overlooks the floor too: rails, parted where the deck sets off */}
      {(
        [
          [MEZZ.strip.x0, LIFT_BAY.x0],
          [LIFT_BAY.x1, MEZZ.strip.x1],
        ] as const
      ).map(([a, b]) => (
        <group key={a}>
          <Box size={[b - a, 2.8, 0.3]} material={wainscot} position={[(a + b) / 2, 9.4, MEZZ.strip.z1 + 0.15]} cast={false} />
          <Box size={[b - a + 0.2, 0.14, 0.4]} material={gilt} position={[(a + b) / 2, 10.87, MEZZ.strip.z1 + 0.15]} cast={false} />
          <Collider minX={a} maxX={b} minZ={MEZZ.strip.z1} maxZ={MEZZ.strip.z1 + 0.3} above={6.5} />
        </group>
      ))}
      {/* rails along the strip's edge, parted where the bridge leaves and where the stairs arrive */}
      {(
        [
          [MEZZ.strip.x0, MEZZ.bridge.x0],
          [MEZZ.bridge.x1, MEZZ.strip.x1],
        ] as const
      ).map(([a, b]) => (
        <group key={a}>
          <Box size={[b - a, 2.8, 0.3]} material={wainscot} position={[(a + b) / 2, 9.4, MEZZ.strip.z0 + 0.15]} cast={false} />
          <Box size={[b - a + 0.2, 0.14, 0.4]} material={gilt} position={[(a + b) / 2, 10.87, MEZZ.strip.z0 + 0.15]} cast={false} />
          <Collider minX={a} maxX={b} minZ={MEZZ.strip.z0} maxZ={MEZZ.strip.z0 + 0.3} above={6.5} />
        </group>
      ))}
      {[MEZZ.bridge.x0 + 0.15, MEZZ.bridge.x1 - 0.15].map((x) => (
        <group key={x}>
          <Box size={[0.3, 2.8, 7.65]} material={wainscot} position={[x, 9.4, 22.175]} cast={false} />
          <Box size={[0.4, 0.14, 7.85]} material={gilt} position={[x, 10.87, 22.175]} cast={false} />
          <Collider minX={x - 0.15} maxX={x + 0.15} minZ={MEZZ.bridge.z0 + 0.35} maxZ={MEZZ.bridge.z1} above={6.5} />
        </group>
      ))}
      {[-10, 0, 26, 36].map((x) => (
        <group key={x}>
          <mesh position={[x, 3.8, 28]} material={column}>
            <cylinderGeometry args={[0.5, 0.6, 7.6, 16]} />
          </mesh>
          <Box size={[1.5, 0.35, 1.5]} material={gilt} position={[x, 7.45, 28]} cast={false} />
          <Collider minX={x - 0.7} maxX={x + 0.7} minZ={27.3} maxZ={28.7} below={7} />
        </group>
      ))}

      {/* the bathroom doors, shut, under the mezzanine; whether anything is behind them is the building's business */}
      {BATHS.map(({ x, sign }) => (
        <group key={sign}>
          {[x - 1.95, x + 1.95].map((jx) => (
            <Box key={jx} size={[0.5, 7.2, 0.5]} material={wainscot} position={[jx, 3.6, lobby.z1 - 0.25]} cast={false} collide />
          ))}
          <Box size={[4.4, 0.5, 0.5]} material={wainscot} position={[x, 7.15, lobby.z1 - 0.25]} cast={false} />
          <Box size={[3.4, 6.9, 0.15]} material={leaf} position={[x, 3.45, lobby.z1 - 0.2]} cast={false} />
          <Box size={[0.5, 0.12, 0.35]} material={brass} position={[x + 1.2, 3.4, lobby.z1 - 0.42]} cast={false} />
          <Panel
            size={[0.72, 0.72]}
            material={sign === 'WOMEN' ? signW : signM}
            position={[x, 6.05, lobby.z1 - 0.45]}
            rotation={[0, Math.PI, 0]}
          />
        </group>
      ))}

      {/* the sign hangs from the bridge now, where you walk under it coming off the lift */}
      <Panel size={[4.4, 1.1]} material={wayfinding} position={[MID_X, 7.0, 24.5]} />
      {/* and under it the Blenden Hall, framed, with its story on the plate */}
      <BlendenHallPainting position={[MID_X, 5.2, lobby.z0 + 0.38]} />
      {/* and over it, on the mezzanine, between the two pairs of doors onto the balcony */}
      <AgreementPage position={[MID_X, MEZZ.y + 5.6, lobby.z0 + 0.38]} />

      {/* the floor's number in the bay, the poster case and a bench on the south wall */}
      <Panel
        size={[1.2, 1.2]}
        material={floorSign}
        position={[LIFT_CX - 5, 5.3, LIFT_BAY.z1 - 0.42]}
        rotation={[0, Math.PI, 0]}
      />
      <Box size={[3.5, 4.9, 0.12]} material={brass} position={[lobby.x0 + 8, 5, lobby.z1 - 0.06]} cast={false} />
      <Panel size={[3.0, 4.4]} material={poster} position={[lobby.x0 + 8, 5, lobby.z1 - 0.13]} rotation={[0, Math.PI, 0]} />
      <Box size={[5, 0.35, 1.6]} material={wainscot} position={[lobby.x1 - 9, 1.5, lobby.z1 - 1.1]} collide />
      {[-2.1, 2.1].map((ox) => (
        <Box key={ox} size={[0.25, 1.35, 1.3]} material={wainscot} position={[lobby.x1 - 9 + ox, 0.67, lobby.z1 - 1.1]} cast={false} />
      ))}

      <Elevator floor="b2" />
    </>
  )
}
