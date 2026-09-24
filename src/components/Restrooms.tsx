import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { M, mat } from '../scene/materials'
import { AVATAR_LAYER, DOOR_W, H, RESTROOMS, candela } from '../scene/constants'
import { restroomSignTex, restroomTileTex, wallTileTex, washHandsTex } from '../textures/lobby'
import { useOpenable } from '../lib/registry'
import { drawWhole } from '../lib/avatar'
import { office, useOffice } from '../state/store'
import { Box, Collider, Panel } from './props/primitives'
import { player } from './Player'

/**
 * The two restrooms off the lift lobby, and what is in them.
 *
 * Both are built the same way — tile, a vanity with a mirror, stalls — and
 * differ in the fixtures and in whether she will go in. The women's door
 * opens on space. The men's does not, and she says why.
 *
 * Each room is laid out in its own frame: origin at the room's north-west
 * corner on the floor, x running east, z running south into the room. The
 * door is in the north wall, hinged on its west jamb, swinging in.
 */
export function Restrooms() {
  return (
    <>
      <Restroom which="women" />
      <Restroom which="men" />
    </>
  )
}

const WAIN = 4.2
const WALL = 0.3

/** Things she says at the men's room door, in turn. */
const NOT_GOING_IN = ['Yeah. I am not going in there.', "No thanks. Ladies' room, please."]

function Restroom({ which }: { which: 'women' | 'men' }) {
  const R = RESTROOMS[which]
  const W = R.x1 - R.x0
  const D = R.z1 - R.z0
  const doorX = R.door - R.x0
  const hinge = doorX - DOOR_W / 2

  const [open, setOpen] = useState(false)
  const angle = useRef(0)
  const pivot = useRef<THREE.Group>(null)
  const hit = useRef<THREE.Mesh>(null)
  const said = useRef(0)
  const showHint = useOffice((s) => s.showHint)

  const paint = useMemo(() => M(0xe6e4dc, { roughness: 0.9 }), [])
  const tile = useMemo(
    () => {
      const t = restroomTileTex().clone()
      t.repeat.set(W / 2, D / 2)
      t.needsUpdate = true
      return M(0xffffff, { map: t, roughness: 0.45 })
    },
    [W, D],
  )
  const wallTile = useMemo(() => M(0xffffff, { map: wallTileTex(), roughness: 0.35 }), [])
  // one-sided: two-sided, its upper face lay on every wall top and the light
  // lens and flickered from above, where nobody is anyway
  const ceiling = useMemo(() => M(0xf1f1ee, { roughness: 1, shadowSide: THREE.DoubleSide }), [])
  const porcelain = useMemo(() => M(0xf3f3f0, { roughness: 0.15 }), [])
  const laminate = useMemo(() => M(0x8c8f93, { roughness: 0.5 }), [])
  const counter = useMemo(() => M(0x3b3f45, { roughness: 0.3 }), [])
  const chrome = useMemo(() => M(0xc4c8cc, { roughness: 0.2, metalness: 0.9 }), [])
  const grey = useMemo(() => M(0x9ea2a7, { roughness: 0.5, metalness: 0.4 }), [])
  const lens = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.1 }),
    [],
  )
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: restroomSignTex(which === 'women' ? 'WOMEN' : 'MEN'), roughness: 0.4 }),
    [which],
  )
  const notice = useMemo(() => new THREE.MeshStandardMaterial({ map: washHandsTex(), roughness: 0.5 }), [])
  const leafMat = useMemo(() => M(0x6b5a45, { roughness: 0.55 }), [])
  const frameMat = useMemo(() => M(0x4c4f55, { roughness: 0.5, metalness: 0.4 }), [])

  useOpenable(hit, () => {
    // the men's: she says no twice, and the third time she goes
    if (which === 'men' && said.current < NOT_GOING_IN.length) {
      showHint(NOT_GOING_IN[said.current++], 2600)
      return
    }
    const next = !open
    setOpen(next)
    const opened = which === 'men' ? 'Fine. Hello? Nobody. Quick, then.' : 'The mirror in here is new.'
    showHint(next ? opened : 'Door shut.', 2000)
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = open ? 1.75 : 0
    angle.current += (target - angle.current) * Math.min(1, dt * 5)
    if (pivot.current) pivot.current.rotation.y = angle.current
  })

  return (
    <group position={[R.x0, 0, R.z0]}>
      {/* floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0.006, D / 2]} material={tile} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[W / 2, H, D / 2]} material={ceiling} castShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/*
        A slab over, so the sun stays out — the room pokes out past the eaves.
        Stood 0.05 clear of the ceiling: sat on H its underside was the same
        plane as the ceiling below it and the whole ceiling came out striped.
      */}
      <Box size={[W + 0.4, 0.3, D + 0.6]} material={paint} position={[W / 2, H + 0.2, D / 2]} />

      {/* three solid walls, painted above a tiled wainscot */}
      {(
        [
          // the side tiles stop 0.2 short of each end: run the full depth, the
          // north end of each landed on the plane the lobby's pier ends on and
          // showed through it as a strip of blue
          [W + WALL / 2, D / 2, WALL, D + WALL, W - WALL / 2, D / 2, 0.16, D - 0.4],
          [-WALL / 2, D / 2, WALL, D + WALL, WALL / 2, D / 2, 0.16, D - 0.4],
          [W / 2, D + WALL / 2, W + WALL, WALL, W / 2, D - WALL / 2, W, 0.16],
        ] as const
      ).map(([cx, cz, sx, sz, tx, tz, tw, td], i) => (
        <group key={i}>
          <Box size={[sx, H, sz]} material={paint} position={[cx, H / 2, cz]} />
          <Box size={[tw, WAIN, td]} material={wallTile} position={[tx, WAIN / 2, tz]} cast={false} />
          {/*
            Colliders are world-space and this group is not, so the footprint
            is stated from the room's origin rather than with `collide`.
          */}
          <Collider
            minX={R.x0 + cx - sx / 2}
            maxX={R.x0 + cx + sx / 2}
            minZ={R.z0 + cz - sz / 2}
            maxZ={R.z0 + cz + sz / 2}
          />
        </group>
      ))}

      {/* the north wall from inside: tile either side of the door, and over it */}
      <Box size={[hinge - 0.1, WAIN, 0.16]} material={wallTile} position={[(hinge - 0.1) / 2, WAIN / 2, 0.16]} cast={false} />
      <Box
        size={[W - hinge - DOOR_W - 0.1, WAIN, 0.16]}
        material={wallTile}
        position={[(W + hinge + DOOR_W + 0.1) / 2, WAIN / 2, 0.16]}
        cast={false}
      />
      {/*
        The wall over the door. Sized to the frame and sunk to the depth of
        the lobby's pier either side of it: at DOOR_W + 0.6 by 0.5 deep it
        stood proud of both and read as a shelf over the doorway.
      */}
      <Box
        size={[DOOR_W + 0.24, H - 7.4, 0.34]}
        material={paint}
        position={[doorX, (H + 7.4) / 2, 0.15]}
        cast={false}
      />

      {/*
        The door: frame in the wall, leaf on its west jamb.

        The head runs down to 7.0 and the leaf up into it. Stopped at 7.2 over
        a 7.0 leaf it left a 0.2 slot the width of the door — daylight from the
        restroom, straight through the wall — and its underside sat on the same
        plane as the wall over it, which flickered.

        0.6 deep rather than 0.5 so the casing bridges the whole 0.3 of pier:
        short of it, each jamb left a slot you could see through edge-on. And
        each jamb reaches 0.02 into the opening: its inner face used to sit on
        the very plane the pier ends on, and the two of them flickered.
      */}
      <group position={[doorX, 0, 0.06]}>
        <Box size={[0.14, 7.4, 0.6]} material={frameMat} position={[-DOOR_W / 2 - 0.05, 3.7, 0]} cast={false} />
        <Box size={[0.14, 7.4, 0.6]} material={frameMat} position={[DOOR_W / 2 + 0.05, 3.7, 0]} cast={false} />
        <Box size={[DOOR_W + 0.24, 0.45, 0.6]} material={frameMat} position={[0, 7.225, 0]} cast={false} />
        <Panel size={[0.9, 1.2]} material={signMat} position={[DOOR_W / 2 + 1.5, 5.0, -0.42]} rotation={[0, Math.PI, 0]} />
      </group>
      <group ref={pivot} position={[hinge, 0, 0.1]}>
        {/* 7.06, not 7.0: the top runs up inside the head so no seam opens as it swings */}
        <mesh position={[DOOR_W / 2, 3.53, 0]} material={leafMat} castShadow>
          <boxGeometry args={[DOOR_W, 7.06, 0.1]} />
        </mesh>
        {/*
          Push plate on the lobby side, a pull bar on the room side, kick
          plate both. The bar runs down the leaf on two standoffs — it was one
          rod on the door's own axis, which came out through the push plate
          like a peg and read as unfinished.
        */}
        <Box size={[0.5, 3.0, 0.06]} material={chrome} position={[DOOR_W - 0.5, 3.6, -0.08]} cast={false} />
        <mesh position={[DOOR_W - 0.5, 3.6, 0.2]} material={chrome}>
          <cylinderGeometry args={[0.05, 0.05, 1.7, 10]} />
        </mesh>
        {[2.85, 4.35].map((y) => (
          <mesh key={y} position={[DOOR_W - 0.5, y, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={chrome}>
            <cylinderGeometry args={[0.035, 0.035, 0.18, 8]} />
          </mesh>
        ))}
        <Box size={[DOOR_W - 0.1, 1.0, 0.14]} material={chrome} position={[DOOR_W / 2, 0.6, 0]} cast={false} />
        <mesh ref={hit} position={[DOOR_W / 2, 3.5, 0]} visible={false}>
          <boxGeometry args={[DOOR_W, 6.8, 0.5]} />
        </mesh>
      </group>
      {open ? (
        <Collider minX={R.x0 + hinge - 0.2} maxX={R.x0 + hinge + 0.2} minZ={R.z0} maxZ={R.z0 + DOOR_W} />
      ) : (
        <Collider minX={R.x0 + hinge} maxX={R.x0 + hinge + DOOR_W} minZ={R.z0 - 0.3} maxZ={R.z0 + 0.3} />
      )}

      {/* light */}
      <mesh position={[W / 2, H - 0.07, D / 2]} material={lens}>
        <boxGeometry args={[3.4, 0.12, 1.8]} />
      </mesh>
      <pointLight position={[W / 2, H - 0.7, D / 2]} color={0xf6f7ff} intensity={candela(0.75)} distance={24} decay={2} />

      {/*
        The vanity down the east wall, at the door end so the stalls along the
        south wall do not stand between you and the mirror: counter, two
        basins, the mirror over it.
      */}
      <Vanity x={W - 1.0} z0={0.8} len={7} ox={R.x0} oz={R.z0} porcelain={porcelain} counter={counter} chrome={chrome} />
      {/* 0.11 off the wall, not 0.09: the dark backing sat on the face of the tile and flickered */}
      <Mirror x={W - WALL / 2 - 0.11} z={4.3} w={6.4} h={3.2} y={5.2} live room={R} />
      <Panel size={[1.0, 0.62]} material={notice} position={[W - WALL / 2 - 0.1, 7.2, 4.3]} rotation={[0, -Math.PI / 2, 0]} />
      {/* soap over the counter; towels, the bin and the dryer past it, down the longer room */}
      <Box size={[0.3, 0.5, 0.5]} material={grey} position={[W - 0.35, 3.9, 5.4]} cast={false} />
      <Box size={[0.5, 1.2, 0.9]} material={grey} position={[W - 0.45, 4.6, 8.6]} cast={false} />
      <Box size={[0.9, 1.1, 0.7]} material={grey} position={[W - 0.65, 3.4, D - 1.2]} cast={false} />
      <mesh position={[W - 1.1, 1.1, 10.6]} material={mat.plastic}>
        <cylinderGeometry args={[0.55, 0.5, 2.2, 14]} />
      </mesh>

      {/* stalls along the south wall, from the west */}
      {[0, 1].map((i) => (
        <Stall key={i} x={0.2 + i * 3.6} z={D - 5.2} ox={R.x0} oz={R.z0} laminate={laminate} porcelain={porcelain} chrome={chrome} />
      ))}

      {/* men's: one urinal on the west wall, by the door */}
      {which === 'men' && <Urinal x={WALL / 2} z={2.4} ox={R.x0} oz={R.z0} porcelain={porcelain} chrome={chrome} />}
    </group>
  )
}

/** Counter along the east wall with basins let into it, facing west. */
function Vanity({
  x,
  z0,
  len,
  ox,
  oz,
  porcelain,
  counter,
  chrome,
}: {
  x: number
  z0: number
  len: number
  /** The room's origin, for the world-space footprint. */
  ox: number
  oz: number
  porcelain: THREE.Material
  counter: THREE.Material
  chrome: THREE.Material
}) {
  const bowl = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.0, 0.0],
          [0.3, 0.0],
          [0.5, 0.2],
          [0.6, 0.42],
          [0.62, 0.46],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        22,
      ),
    [],
  )
  return (
    <group position={[x, 0, z0 + len / 2]}>
      <Box size={[2.0, 0.12, len]} material={counter} position={[0, 2.85, 0]} />
      <Box size={[1.9, 2.3, len]} material={mat.laminate} position={[0.05, 1.5, 0]} />
      <Collider minX={ox + x - 1.0} maxX={ox + x + 1.0} minZ={oz + z0} maxZ={oz + z0 + len} />
      <Box size={[2.0, 0.3, len]} material={counter} position={[0, 2.95, 0]} cast={false} />
      {[-1, 1].map((s) => (
        <group key={s} position={[-0.1, 2.5, s * (len / 4)]}>
          <mesh geometry={bowl} material={porcelain} receiveShadow />
          <mesh position={[0.6, 0.72, 0]} material={chrome}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 10]} />
          </mesh>
          <mesh position={[0.45, 0.95, 0]} rotation={[0, 0, Math.PI / 2]} material={chrome}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** A room's footprint, in world feet. */
interface Room {
  readonly x0: number
  readonly x1: number
  readonly z0: number
  readonly z1: number
}

/**
 * A mirror that works, on the east wall, facing west.
 *
 * three's Reflector renders the scene from the far side of the glass. Its
 * virtual camera only sees layer 0 out of the box, so it is told about the
 * player's layer, and her materials are made to draw for the length of its
 * pass — in here she is a whole person, head and all.
 *
 * That second render is the whole floor again — every mesh, and the shadow
 * pass — and the Reflector runs it whenever the glass is in the camera's
 * frustum, which from the suite it is, through three walls. So it is only
 * switched on while she is actually in the room. Both rooms have one now:
 * she can be talked into the men's on the third press.
 */
function Mirror({
  x,
  z,
  w,
  h,
  y,
  live,
  room,
}: {
  x: number
  z: number
  w: number
  h: number
  y: number
  /** Reflect for real. Off, the mirror is a dark pane. */
  live: boolean
  room: Room
}) {
  const holder = useRef<THREE.Group>(null)
  const glassRef = useRef<Reflector | null>(null)
  const backing = useMemo(() => M(0x6f747a, { roughness: 0.12, metalness: 0.85 }), [])

  useEffect(() => {
    const g = holder.current
    if (!g || !live) return
    const glass = new Reflector(new THREE.PlaneGeometry(w, h), {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 512,
      color: 0xb8bcc0,
    })
    glass.camera.layers.enable(AVATAR_LAYER)
    const inner = glass.onBeforeRender
    glass.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      drawWhole(true)
      inner.call(glass, renderer, scene, camera, geometry, material, group)
      drawWhole(false)
    }
    glass.visible = false
    g.add(glass)
    glassRef.current = glass
    return () => {
      glassRef.current = null
      g.remove(glass)
      glass.dispose()
    }
  }, [w, h, live])

  // In the room, or at its door: close enough to see yourself.
  useFrame(() => {
    const glass = glassRef.current
    if (!glass) return
    const m = 1.5
    glass.visible =
      office().floor === '23' &&
      player.x > room.x0 - m && player.x < room.x1 + m && player.z > room.z0 - m && player.z < room.z1 + m
  })

  return (
    <group position={[x, y, z]} rotation={[0, -Math.PI / 2, 0]}>
      <group ref={holder} />
      {/* dark glass behind the Reflector: what shows while it is off */}
      <mesh position={[0, 0, -0.01]} material={backing}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* a bevelled steel frame round it */}
      {(
        [
          [0, h / 2 + 0.05, w + 0.2, 0.1],
          [0, -h / 2 - 0.05, w + 0.2, 0.1],
          [-w / 2 - 0.05, 0, 0.1, h],
          [w / 2 + 0.05, 0, 0.1, h],
        ] as const
      ).map(([fx, fy, fw, fh], i) => (
        <mesh key={i} position={[fx, fy, -0.02]} material={mat.steel}>
          <boxGeometry args={[fw, fh, 0.06]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A cubicle: two laminate panels, a door, a toilet inside. The door hangs
 * shut until she asks, then swings out into the room; while it is shut the
 * doorway blocks.
 */
function Stall({
  x,
  z,
  ox,
  oz,
  laminate,
  porcelain,
  chrome,
}: {
  x: number
  z: number
  ox: number
  oz: number
  laminate: THREE.Material
  porcelain: THREE.Material
  chrome: THREE.Material
}) {
  const SW = 3.4
  const SD = 5.0
  const DW = SW - 0.3
  const wx = ox + x
  const wz = oz + z
  const [open, setOpen] = useState(false)
  const angle = useRef(0)
  const pivot = useRef<THREE.Group>(null)
  const hit = useRef<THREE.Mesh>(null)
  const showHint = useOffice((s) => s.showHint)

  useOpenable(hit, () => {
    const next = !open
    setOpen(next)
    showHint(next ? 'Empty.' : 'Door shut.', 1500)
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = open ? 1.45 : 0
    angle.current += (target - angle.current) * Math.min(1, dt * 5)
    if (pivot.current) pivot.current.rotation.y = angle.current
  })

  return (
    <group position={[x, 0, z]}>
      {/* side panels, off the floor on legs, as they are */}
      {[0, SW].map((px) => (
        <group key={px}>
          <Box size={[0.08, 5.8, SD]} material={laminate} position={[px, 1.0 + 2.9, SD / 2]} />
          <Collider minX={wx + px - 0.1} maxX={wx + px + 0.1} minZ={wz} maxZ={wz + SD} />
        </group>
      ))}
      {/* the door, on its hinge at the west panel, the latch toward the other */}
      <group ref={pivot} position={[0.1, 0, 0.05]}>
        <Box size={[DW, 5.6, 0.06]} material={laminate} position={[DW / 2, 1.0 + 2.8, 0]} />
        <mesh position={[DW - 0.3, 3.6, -0.08]} material={chrome}>
          <boxGeometry args={[0.2, 0.1, 0.1]} />
        </mesh>
        <mesh ref={hit} position={[DW / 2, 3.8, 0]} visible={false}>
          <boxGeometry args={[DW, 5.6, 0.5]} />
        </mesh>
      </group>
      {!open && <Collider minX={wx + 0.1} maxX={wx + SW - 0.1} minZ={wz - 0.15} maxZ={wz + 0.25} />}
      {/* the toilet: tank, bowl, seat */}
      <group position={[SW / 2, 0, SD - 0.9]}>
        <Box size={[1.5, 1.3, 0.6]} material={porcelain} position={[0, 2.0, 0.2]} />
        <mesh position={[0, 0.8, -0.5]} material={porcelain}>
          <cylinderGeometry args={[0.62, 0.45, 1.3, 18]} />
        </mesh>
        <mesh position={[0, 1.42, -0.5]} material={porcelain}>
          <cylinderGeometry args={[0.68, 0.68, 0.1, 18]} />
        </mesh>
        <Collider minX={wx + SW / 2 - 0.7} maxX={wx + SW / 2 + 0.7} minZ={wz + SD - 1.6} maxZ={wz + SD} />
        <mesh position={[0, 3.8, 0.4]} material={chrome}>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        </mesh>
      </group>
      {/* the roll */}
      <mesh position={[0.25, 2.6, SD - 1.8]} rotation={[0, 0, Math.PI / 2]} material={mat.white}>
        <cylinderGeometry args={[0.2, 0.2, 0.35, 12]} />
      </mesh>
    </group>
  )
}

/** Wall-hung, on the west wall, facing east. The flush pipe is the tell. */
function Urinal({
  x,
  z,
  ox,
  oz,
  porcelain,
  chrome,
}: {
  x: number
  z: number
  ox: number
  oz: number
  porcelain: THREE.Material
  chrome: THREE.Material
}) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.8, 2.0, 1.2]} material={porcelain} position={[0.4, 2.7, 0]} />
      <Box size={[0.5, 0.3, 1.0]} material={porcelain} position={[0.55, 1.8, 0]} cast={false} />
      <mesh position={[0.25, 4.3, 0]} material={chrome}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
      </mesh>
      <mesh position={[0.25, 4.9, 0]} material={chrome}>
        <boxGeometry args={[0.3, 0.2, 0.3]} />
      </mesh>
      <Collider minX={ox + x} maxX={ox + x + 0.9} minZ={oz + z - 0.6} maxZ={oz + z + 0.6} />
    </group>
  )
}
