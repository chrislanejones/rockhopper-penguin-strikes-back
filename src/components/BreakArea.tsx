import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { H, HALF, LX, RX0, TV_STAFF, TV_WEATHER, candela } from '../scene/constants'
import {
  dartboardTex, fridgeFlyerTex, pizzaBoxTex, pretzelBackTex, pretzelBoxTex,
  pretzelSideTex, sodaFrontTex, squirrelPhotoTex,
} from '../textures/signage'
import { drawWeather, slides } from '../textures/screens'
import { canvasTex } from '../lib/canvasTex'
import { Box, Collider, Panel } from './props/primitives'
import { FloorFan, Mug } from './props/Furniture'
import { Pickable } from './props/Pickable'
import { WaterFountain } from './LiftLobby'
import { useClickable, useOpenable } from '../lib/registry'
import { useOffice } from '../state/store'

/** The west wall — the new one, twelve feet past where it used to be. */
const EX = RX0
const BZ = -8
/**
 * East edge of the break room, where the carpet takes over from the vinyl.
 *
 * The cubicle block's west panel, which is the wall the soda machine backs
 * onto. The vinyl used to stop at the old west wall, which left the machine
 * and half the ping-pong table standing on office carpet.
 */
const BREAK_X1 = LX - 0.11

/** Native size of the slide deck canvas. */
const SLIDE_W = 640
const SLIDE_H = 360

/**
 * Ceiling-hung display looping the Parliament staff-update deck.
 *
 * Seven seconds a slide, which is long enough to read four of the six and
 * never the one you wanted.
 */
function StaffUpdateTv() {
  // Snapped to a ceiling cell, which the drop ceiling then keeps blank.
  const TX = TV_STAFF.x
  const TZ = TV_STAFF.z

  const { texture, material, ctx } = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = SLIDE_W
    cv.height = SLIDE_H
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    return {
      texture: tex,
      ctx: cv.getContext('2d')!,
      material: new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.85,
        color: 0,
        roughness: 0.1,
      }),
    }
  }, [])
  const slide = useRef(0)

  useEffect(() => {
    const draw = () => {
      slides[slide.current](ctx, SLIDE_W, SLIDE_H)
      ctx.fillStyle = 'rgba(0,0,0,.35)'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${slide.current + 1} / ${slides.length}`, SLIDE_W - 10, SLIDE_H - 8)
      texture.needsUpdate = true
      slide.current = (slide.current + 1) % slides.length
    }
    draw()
    const id = setInterval(draw, 7000)
    return () => clearInterval(id)
  }, [ctx, texture])

  const bodyMat = useMemo(() => M(0x121316, { roughness: 0.3 }), [])

  return (
    <>
      <Box size={[1.0, 0.08, 1.0]} material={mat.dark} position={[TX, H - 0.04, TZ]} />
      <Box size={[0.18, 1.2, 0.18]} material={mat.dark} position={[TX, H - 0.68, TZ]} />
      {/* pivot at the top edge, so the tilt swings the bottom of the screen out */}
      <group position={[TX, H - 1.28, TZ]} rotation={[0.2, 0, 0]}>
        <Box size={[0.5, 0.12, 0.4]} material={mat.dark} position={[0, -0.06, 0.15]} />
        <Box size={[3.2, 1.85, 0.1]} material={bodyMat} position={[0, -1.0, 0.32]} />
        <Panel size={[3.08, 1.73]} material={material} position={[0, -1.0, 0.375]} />
        <pointLight position={[0, -1, 1.2]} color={0xdde6ff} intensity={candela(0.35, 3)} distance={9} decay={2} />
      </group>
      <mesh position={[TX - 0.12, H - 0.7, TZ - 0.12]} material={mat.black}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
      </mesh>
    </>
  )
}

/** Working height of the counter top: 3.05 centre, 0.15 thick. */
const CTOP = 3.125

/** Soda can: radius, resting height on the vinyl, and how close two may sit. */
const CAN_R = 0.12
const CAN_LEN = 0.3
const REST_Y = 0.012 + CAN_R
const CAN_GAP = 0.29
const G = 26

/*
  Scratch for the can solver. Allocating a Vector3 per can per frame is how a
  physics loop ends up in the garbage collector's hands.
*/
const UP = new THREE.Vector3(0, 1, 0)
const side = new THREE.Vector3()
const horiz = new THREE.Vector3()
const qAlign = new THREE.Quaternion()
const qRoll = new THREE.Quaternion()

/**
 * The second TV, on the weather channel, hung over the south end of the room
 * and turned to face the ping-pong table.
 *
 * Same mount as the staff-update set. The canvas is redrawn once a second so
 * the clock in the corner is right and the crawl keeps crawling.
 */
function WeatherTv() {
  const TX = TV_WEATHER.x
  const TZ = TV_WEATHER.z

  const { texture, material, ctx } = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = SLIDE_W
    cv.height = SLIDE_H
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    return {
      texture: tex,
      ctx: cv.getContext('2d')!,
      material: new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.85,
        color: 0,
        roughness: 0.1,
      }),
    }
  }, [])

  useEffect(() => {
    const t0 = performance.now()
    const draw = () => {
      drawWeather(ctx, SLIDE_W, SLIDE_H, (performance.now() - t0) / 1000)
      texture.needsUpdate = true
    }
    draw()
    const id = setInterval(draw, 1000)
    return () => clearInterval(id)
  }, [ctx, texture])

  const bodyMat = useMemo(() => M(0x121316, { roughness: 0.3 }), [])

  return (
    <group position={[TX, 0, TZ]} rotation={[0, Math.PI, 0]}>
      <Box size={[1.0, 0.08, 1.0]} material={mat.dark} position={[0, H - 0.04, 0]} />
      <Box size={[0.18, 1.2, 0.18]} material={mat.dark} position={[0, H - 0.68, 0]} />
      <group position={[0, H - 1.28, 0]} rotation={[0.2, 0, 0]}>
        <Box size={[0.5, 0.12, 0.4]} material={mat.dark} position={[0, -0.06, 0.15]} />
        <Box size={[3.2, 1.85, 0.1]} material={bodyMat} position={[0, -1.0, 0.32]} />
        <Panel size={[3.08, 1.73]} material={material} position={[0, -1.0, 0.375]} />
        <pointLight position={[0, -1, 1.2]} color={0xcfe0ff} intensity={candela(0.35, 3)} distance={9} decay={2} />
      </group>
      <mesh position={[-0.12, H - 0.7, -0.12]} material={mat.black}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
      </mesh>
    </group>
  )
}

/**
 * The ping-pong table, which is why the break room got bigger.
 *
 * Regulation 9 x 5 at 2.5 ft, folded-leg frame, a net that has seen better
 * days, two bats and a ball on the near end. The ball can be picked up. The
 * bats cannot, which is a policy.
 */
function PingPongTable({ x, z }: { x: number; z: number }) {
  const top = useMemo(() => M(0x1f5e3a, { roughness: 0.55 }), [])
  const line = useMemo(() => M(0xf2f2ee, { roughness: 0.6 }), [])
  const frame = useMemo(() => M(0x2b2d31, { roughness: 0.5, metalness: 0.3 }), [])
  const netMat = useMemo(
    () => M(0x2a2a2e, { transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
    [],
  )
  const rubberRed = useMemo(() => M(0xb8281e, { roughness: 0.9 }), [])
  const rubberBlack = useMemo(() => M(0x1a1a1a, { roughness: 0.9 }), [])
  const ballMat = useMemo(() => M(0xfff6d6, { roughness: 0.45 }), [])

  const W = 9
  const D = 5
  const Y = 2.5

  return (
    <>
      <group position={[x, 0, z]}>
        <Box size={[W, 0.1, D]} material={top} position={[0, Y - 0.05, 0]} />
        {/* edge lines and the centre line */}
        <Box size={[W, 0.012, 0.08]} material={line} position={[0, Y + 0.006, D / 2 - 0.06]} cast={false} />
        <Box size={[W, 0.012, 0.08]} material={line} position={[0, Y + 0.006, -D / 2 + 0.06]} cast={false} />
        <Box size={[0.08, 0.012, D]} material={line} position={[W / 2 - 0.06, Y + 0.006, 0]} cast={false} />
        <Box size={[0.08, 0.012, D]} material={line} position={[-W / 2 + 0.06, Y + 0.006, 0]} cast={false} />
        <Box size={[W, 0.012, 0.05]} material={line} position={[0, Y + 0.006, 0]} cast={false} />

        {/* net and its posts */}
        <mesh position={[0, Y + 0.25, 0]} material={netMat}>
          <planeGeometry args={[0.02, 0.5]} />
        </mesh>
        <Box size={[0.03, 0.5, D + 0.4]} material={netMat} position={[0, Y + 0.25, 0]} cast={false} />
        <Box size={[0.04, 0.03, D + 0.4]} material={line} position={[0, Y + 0.5, 0]} cast={false} />
        {[-1, 1].map((sz) => (
          <mesh key={sz} position={[0, Y + 0.25, (sz * (D + 0.5)) / 2]} material={frame}>
            <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
          </mesh>
        ))}

        {/* folding frame: a leg at each corner and a bar between the pairs */}
        {(
          [
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ] as const
        ).map(([sx, sz], i) => (
          <mesh key={i} position={[(sx * (W - 1.6)) / 2, Y / 2 - 0.05, (sz * (D - 0.8)) / 2]} material={frame}>
            <cylinderGeometry args={[0.05, 0.05, Y - 0.1, 8]} />
          </mesh>
        ))}
        {[-1, 1].map((sx) => (
          <Box
            key={sx}
            size={[0.08, 0.08, D - 0.8]}
            material={frame}
            position={[(sx * (W - 1.6)) / 2, 0.9, 0]}
            cast={false}
          />
        ))}

        {/* two bats, one face up and one face down */}
        <group position={[W / 2 - 1.2, Y + 0.02, D / 2 - 0.9]} rotation={[0, 0.6, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={rubberRed}>
            <circleGeometry args={[0.26, 20]} />
          </mesh>
          <Box size={[0.1, 0.03, 0.42]} material={mat.oak} position={[0, 0, 0.42]} cast={false} />
        </group>
        <group position={[W / 2 - 2.3, Y + 0.02, -D / 2 + 1.1]} rotation={[0, -2.3, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={rubberBlack}>
            <circleGeometry args={[0.26, 20]} />
          </mesh>
          <Box size={[0.1, 0.03, 0.42]} material={mat.oak} position={[0, 0, 0.42]} cast={false} />
        </group>
      </group>

      <Pickable label="ping-pong ball">
        <mesh position={[x + W / 2 - 1.9, Y + 0.07, z + 0.3]} material={ballMat}>
          <sphereGeometry args={[0.065, 12, 10]} />
        </mesh>
      </Pickable>
      <Box size={[W + 0.4, 0.01, D + 0.4]} material={top} position={[x, -1, z]} collide cast={false} />
    </>
  )
}

/**
 * A hard sourdough pretzel: three torus loops, which is what a pretzel is.
 *
 * Lies flat at `y`, the local origin at the centre of the bottom loop. About
 * 0.3 ft across, which is a big pretzel, but it has to be big enough to click.
 */
function Pretzel({
  x,
  y,
  z,
  ry,
  material,
  salt,
}: {
  x: number
  y: number
  z: number
  ry: number
  material: THREE.Material
  salt: THREE.Material
}) {
  const grains = useMemo(
    () =>
      Array.from({ length: 9 }, () => {
        const a = Math.random() * 7
        const r = 0.05 + Math.random() * 0.1
        return { x: Math.cos(a) * r, z: Math.sin(a) * r - 0.03, ry: Math.random() * 3 }
      }),
    [],
  )
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={material} castShadow>
        <torusGeometry args={[0.11, 0.028, 8, 20, Math.PI * 1.1]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh
          key={sx}
          position={[sx * 0.065, 0, -0.07]}
          rotation={[Math.PI / 2, 0, 0]}
          material={material}
          castShadow
        >
          <torusGeometry args={[0.065, 0.028, 8, 18]} />
        </mesh>
      ))}
      {grains.map((g, i) => (
        <mesh key={i} position={[g.x, 0.03, g.z]} rotation={[0, g.ry, 0]} material={salt}>
          <boxGeometry args={[0.014, 0.01, 0.014]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Rockhopper Pretzels by the coffee maker — one open, one knocked over,
 * and a handful out on the counter that you can take with you.
 *
 * The carton is six faces of three different textures rather than one texture
 * six times: a single map on a BoxGeometry puts the brand name on the top flap
 * and a mirror image of it on the back.
 */
function Snacks() {
  const front = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pretzelBoxTex(), roughness: 0.65 }),
    [],
  )
  const back = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pretzelBackTex(), roughness: 0.7 }),
    [],
  )
  const side = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pretzelSideTex(), roughness: 0.65 }),
    [],
  )
  const board = useMemo(() => M(0x1c2d5a, { roughness: 0.75 }), [])
  const kraft = useMemo(() => M(0xc2a678, { roughness: 0.9 }), [])
  const liner = useMemo(() => M(0xe4dcc6, { roughness: 0.75 }), [])
  // BoxGeometry face order is +x, -x, +y, -y, +z, -z.
  const carton = useMemo(
    () => [side, side, board, kraft, front, back],
    [side, board, kraft, front, back],
  )

  const pretzelMat = useMemo(() => M(0xa8631f, { roughness: 0.85 }), [])
  const saltMat = useMemo(() => M(0xf2efe6, { roughness: 0.5 }), [])
  const crumbMat = useMemo(() => M(0x8f5a22, { roughness: 1 }), [])

  const W = 0.85
  const HT = 1.35
  const D = 0.4

  const crumbs = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        r: 0.008 + Math.random() * 0.016,
        x: EX + 0.85 + Math.random() * 1.3,
        z: BZ - 0.9 + Math.random() * 2.2,
        ry: Math.random() * 3,
      })),
    [],
  )
  const spilled = useMemo(
    () =>
      [
        [EX + 1.0, BZ - 0.85],
        [EX + 1.35, BZ - 0.55],
        [EX + 0.85, BZ - 0.25],
        [EX + 1.6, BZ - 0.15],
      ].map(([x, z]) => ({ x, z, ry: Math.random() * 3 })),
    [],
  )

  return (
    <>
      {/* the open one, stood against the splashback */}
      <group position={[EX + 1.25, CTOP, BZ - 2.15]} rotation={[0, Math.PI / 2 + 0.26, 0]}>
        <mesh position={[0, HT / 2, 0]} material={carton} castShadow receiveShadow>
          <boxGeometry args={[W, HT, D]} />
        </mesh>
        {/* top flap, folded back — hinged on the box so it stays with it */}
        <group position={[0, HT, -D / 2]} rotation={[-0.55, 0, 0]}>
          <mesh position={[0, 0.2, 0]} material={board}>
            <boxGeometry args={[W, 0.4, 0.025]} />
          </mesh>
        </group>
        {/* the waxed liner, showing just above the cut line */}
        <mesh position={[0, HT + 0.02, 0]} material={liner}>
          <boxGeometry args={[W - 0.2, 0.16, D - 0.14]} />
        </mesh>
      </group>

      {/* the one that went over, label up */}
      <group position={[EX + 1.5, CTOP, BZ + 0.25]} rotation={[0, 0.5, 0]}>
        <mesh
          position={[0, D / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={carton}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[W, HT, D]} />
        </mesh>
      </group>

      {/* four pretzels out on the counter, and the salt they shed */}
      {spilled.map((c, i) => (
        <Pickable key={`p${i}`} label="pretzel">
          <Pretzel x={c.x} y={CTOP + 0.03} z={c.z} ry={c.ry} material={pretzelMat} salt={saltMat} />
        </Pickable>
      ))}
      {crumbs.map((c, i) => (
        <mesh
          key={i}
          position={[c.x, CTOP + 0.006, c.z]}
          rotation={[-Math.PI / 2, 0, c.ry]}
          material={crumbMat}
        >
          <circleGeometry args={[c.r, 6]} />
        </mesh>
      ))}
    </>
  )
}

/** Sugar, sweetener and the stirrers, in the caddy they came in. */
function SugarCaddy({ x, z }: { x: number; z: number }) {
  const tray = useMemo(() => M(0xe8e6e0, { roughness: 0.5 }), [])
  const packets = useMemo(
    () => [0xffffff, 0xf06a9a, 0x3f7ec4, 0xffffff, 0xf0c93f, 0x3f7ec4].map((c) => M(c)),
    [],
  )
  const stirrer = useMemo(() => M(0xd9cfba, { roughness: 0.9 }), [])

  return (
    <group position={[x, CTOP, z]} rotation={[0, 0.18, 0]}>
      {/* open tray: base and four low walls */}
      <mesh position={[0, 0.03, 0]} material={tray} receiveShadow>
        <boxGeometry args={[0.62, 0.06, 0.46]} />
      </mesh>
      {(
        [
          [0.31, 0, 0.04, 0.46],
          [-0.31, 0, 0.04, 0.46],
          [0, 0.23, 0.62, 0.04],
          [0, -0.23, 0.62, 0.04],
        ] as const
      ).map(([ox, oz, sw, sd], i) => (
        <mesh key={i} position={[ox, 0.14, oz]} material={tray}>
          <boxGeometry args={[sw, 0.22, sd]} />
        </mesh>
      ))}
      {/* divider down the middle */}
      <mesh position={[0, 0.12, 0]} material={tray}>
        <boxGeometry args={[0.02, 0.18, 0.44]} />
      </mesh>

      {packets.map((m, i) => (
        <mesh
          key={i}
          position={[-0.18 + (i % 3) * 0.045 + Math.floor(i / 3) * 0.34, 0.17, -0.05 + (i % 2) * 0.08]}
          rotation={[0.14, (i % 2) * 0.3 - 0.15, 0.06]}
          material={m}
        >
          <boxGeometry args={[0.03, 0.24, 0.26]} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={`s${i}`}
          position={[0.22 + (i % 2) * 0.03, 0.2, 0.14 + i * 0.012]}
          rotation={[0.05, i * 0.1 - 0.2, 0.03]}
          material={stirrer}
        >
          <boxGeometry args={[0.02, 0.34, 0.02]} />
        </mesh>
      ))}
    </group>
  )
}

/** One selection button. Lights while it is thinking about it. */
function SodaButton({
  y,
  z,
  colour,
  onPress,
}: {
  y: number
  z: number
  colour: number
  onPress: () => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colour, roughness: 0.4 }),
    [colour],
  )
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useClickable(ref, () => {
    material.emissive.setHex(0xfff0a0)
    material.emissiveIntensity = 1.6
    onPress()
    clearTimeout(timer.current)
    timer.current = setTimeout(() => material.emissive.setHex(0), 700)
  })

  return (
    <mesh ref={ref} position={[0.9, y, z]} material={material}>
      <boxGeometry args={[0.46, 0.3, 0.1]} />
    </mesh>
  )
}

/**
 * The soda machine, against the cubicle wall at the end of the break room.
 *
 * Press a button and a can fires out of the delivery port and rolls across
 * the vinyl. The cans are simulated in world space rather than parented to
 * the machine — they have to land on a floor the machine is standing on, and
 * a can inside a rotated group would need its physics rotated too.
 *
 * Eight cans in the pool, reused oldest-first. Nothing ever tidies them up.
 */
function SodaMachine({ x, z, ry }: { x: number; z: number; ry: number }) {
  const shell = useMemo(() => M(0x14356b, { roughness: 0.45 }), [])
  const trim = useMemo(() => M(0x0a1c3a, { roughness: 0.4 }), [])
  const front = useMemo(
    () => new THREE.MeshStandardMaterial({ map: sodaFrontTex(), roughness: 0.35 }),
    [],
  )
  const portMat = useMemo(() => M(0x0a0b0d, { roughness: 0.9 }), [])
  const flapMat = useMemo(
    () => M(0x2a2d33, { roughness: 0.4, transparent: true, opacity: 0.7 }),
    [],
  )
  const canBody = useMemo(
    () => [0xc8102e, 0x1f7a3d, 0xe08a1e, 0x7a2b8f, 0x1c6fb8, 0xd6b41a].map((c) => M(c)),
    [],
  )
  const canEnd = useMemo(() => M(0xcfd4da, { roughness: 0.35, metalness: 0.7 }), [])
  /** Straight sides, rolled in at each end — one lathe, shared by all eight. */
  const canGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.0, -CAN_LEN / 2],
          [0.086, -CAN_LEN / 2],
          [0.108, -CAN_LEN / 2 + 0.022],
          [0.12, -CAN_LEN / 2 + 0.05],
          [0.12, CAN_LEN / 2 - 0.05],
          [0.108, CAN_LEN / 2 - 0.022],
          [0.086, CAN_LEN / 2],
          [0.0, CAN_LEN / 2],
        ].map(([r, y]) => new THREE.Vector2(r, y)),
        18,
      ),
    [],
  )
  const showHint = useOffice((s) => s.showHint)

  const W = 2.8
  const HT = 6.2
  const D = 2.4
  /** Where a can may roll to. The break room, less a foot of skirting. */
  const BOUND = useMemo(
    () => ({ x0: EX + 0.6, x1: BREAK_X1 - 0.6, z0: -HALF + 0.6, z1: HALF - 0.6 }),
    [],
  )
  /** Where the port is, and which way is out, in world feet. */
  const fwd = useMemo(() => new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)), [ry])
  const mouth = useMemo(
    () => new THREE.Vector3(x, 0.95, z).addScaledVector(fwd, D / 2 + 0.1),
    [x, z, fwd],
  )

  const POOL = 8
  const refs = useRef<Array<THREE.Group | null>>(Array(POOL).fill(null))
  const cans = useRef(
    Array.from({ length: POOL }, () => ({
      p: new THREE.Vector3(),
      v: new THREE.Vector3(),
      /** Direction of travel on the floor; the roll axis is square to it. */
      heading: new THREE.Vector3(1, 0, 0),
      roll: 0,
      shown: false,
      moving: false,
      airborne: false,
    })),
  )
  const next = useRef(0)

  const fire = (i: number) => {
    const slot = next.current++ % POOL
    const c = cans.current[slot]
    c.p.copy(mouth)
    c.v.copy(fwd).multiplyScalar(4.6 + Math.random() * 0.9)
    c.v.y = 1.15
    // a little scatter, so a second can never lands on the first
    c.v.x += (Math.random() - 0.5) * 0.7
    c.v.z += (Math.random() - 0.5) * 0.7
    c.heading.copy(fwd)
    c.roll = 0
    c.shown = true
    c.moving = true
    c.airborne = true
    const g = refs.current[slot]
    if (g) g.visible = true
    showHint(
      ['A can drops. It is warm.', 'Clunk. Still warm.', 'The machine keeps your change.'][i % 3],
      2400,
    )
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04)
    const list = cans.current

    list.forEach((c) => {
      if (!c.shown || !c.moving) return
      if (c.airborne) {
        c.v.y -= G * dt
        c.p.addScaledVector(c.v, dt)
        // end over end while it is in the air
        c.roll += 11 * dt
        if (c.p.y <= REST_Y) {
          c.p.y = REST_Y
          if (c.v.y < -1.2) {
            // a bounce, and it loses most of it
            c.v.y = -c.v.y * 0.34
            c.v.x *= 0.78
            c.v.z *= 0.78
          } else {
            c.v.y = 0
            c.airborne = false
          }
        }
      } else {
        /*
          Rolling. The roll angle is driven by distance over radius rather
          than by a spin rate, so the can cannot skate: however fast it is
          going, the tyre matches the ground.
        */
        horiz.set(c.v.x, 0, c.v.z)
        const speed = horiz.length()
        if (speed > 1e-4) c.heading.copy(horiz).divideScalar(speed)
        c.roll += (speed / CAN_R) * dt
        const damp = Math.exp(-2.4 * dt)
        c.v.x *= damp
        c.v.z *= damp
        c.p.addScaledVector(c.v, dt)
        c.p.y = REST_Y
        if (speed < 0.22) {
          c.v.set(0, 0, 0)
          c.moving = false
        }
      }

      // the break room has walls, and a can that reaches one comes back
      if (c.p.x < BOUND.x0) {
        c.p.x = BOUND.x0
        c.v.x = Math.abs(c.v.x) * 0.4
      } else if (c.p.x > BOUND.x1) {
        c.p.x = BOUND.x1
        c.v.x = -Math.abs(c.v.x) * 0.4
      }
      if (c.p.z < BOUND.z0) {
        c.p.z = BOUND.z0
        c.v.z = Math.abs(c.v.z) * 0.4
      } else if (c.p.z > BOUND.z1) {
        c.p.z = BOUND.z1
        c.v.z = -Math.abs(c.v.z) * 0.4
      }
    })

    /*
      Cans are solid to each other.

      Eight of them is few enough to just test every pair. Without this a
      second can fired at the same button lands inside the first and the two
      read as one striped object on the floor.
    */
    for (let i = 0; i < POOL; i++) {
      const a = list[i]
      if (!a.shown || a.airborne) continue
      for (let j = i + 1; j < POOL; j++) {
        const b = list[j]
        if (!b.shown || b.airborne) continue
        const dx = a.p.x - b.p.x
        const dz = a.p.z - b.p.z
        const d = Math.hypot(dx, dz)
        if (d > CAN_GAP || d < 1e-5) continue
        const push = (CAN_GAP - d) / 2
        const nx = dx / d
        const nz = dz / d
        a.p.x += nx * push
        a.p.z += nz * push
        b.p.x -= nx * push
        b.p.z -= nz * push
        // nudge them apart so they settle rather than jitter in contact
        a.v.x += nx * 0.35
        a.v.z += nz * 0.35
        b.v.x -= nx * 0.35
        b.v.z -= nz * 0.35
        a.moving = true
        b.moving = true
      }
    }

    /*
      Lay each can on its side and spin it about that axis.

      `side` is up x heading, so the cylinder's own axis ends up horizontal
      and square to the way it is going — which is the only orientation in
      which rolling looks like rolling.
    */
    list.forEach((c, i) => {
      const g = refs.current[i]
      if (!g || !c.shown) return
      side.crossVectors(UP, c.heading)
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
      side.normalize()
      qAlign.setFromUnitVectors(UP, side)
      qRoll.setFromAxisAngle(side, c.roll)
      g.quaternion.copy(qRoll).multiply(qAlign)
      g.position.copy(c.p)
    })
  })

  return (
    <>
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <Box size={[W, HT, D]} material={shell} position={[0, HT / 2, 0]} />
        <Box size={[W + 0.12, 0.3, D + 0.12]} material={trim} position={[0, HT - 0.15, 0]} cast={false} />
        {/* the printed front, and the black column the buttons live on */}
        <Panel size={[1.7, 4.4]} material={front} position={[-0.42, 3.7, D / 2 + 0.01]} />
        <Box size={[0.6, 4.4, 0.06]} material={trim} position={[0.9, 3.7, D / 2 + 0.02]} cast={false} />

        {/* coin slot, card reader and the delivery port */}
        <Box size={[0.5, 0.1, 0.06]} material={mat.steel} position={[0.9, 5.4, D / 2 + 0.06]} cast={false} />
        <Box size={[0.44, 0.62, 0.1]} material={mat.black} position={[0.9, 4.7, D / 2 + 0.06]} cast={false} />
        <Box size={[1.5, 1.05, 0.5]} material={portMat} position={[-0.42, 0.95, D / 2 - 0.24]} cast={false} />
        <Panel size={[1.36, 0.86]} material={flapMat} position={[-0.42, 1.05, D / 2 + 0.01]} />
        <Box size={[1.62, 0.1, 0.12]} material={trim} position={[-0.42, 1.55, D / 2 + 0.02]} cast={false} />
      </group>

      {/* buttons ride on the machine, so they turn with it */}
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        {canBody.map((_, i) => (
          <SodaButton
            key={i}
            y={5.0 - i * 0.52}
            z={D / 2 + 0.07}
            colour={[0xc8102e, 0x1f7a3d, 0xe08a1e, 0x7a2b8f, 0x1c6fb8, 0xd6b41a][i]}
            onPress={() => fire(i)}
          />
        ))}
      </group>

      {/*
        The cans, in world space so they land on the floor they fell to. Each
        is a Pickable, so once it has stopped rolling you can pick it up; the
        ones still in the machine are invisible and the crosshair skips them.
      */}
      {cans.current.map((_, i) => (
        <Pickable key={i} label="soda can">
          <group
            ref={(g) => {
              refs.current[i] = g
            }}
            visible={false}
          >
            <mesh geometry={canGeo} material={canBody[i % canBody.length]} castShadow />
            {[-1, 1].map((sy) => (
              <mesh key={sy} position={[0, (sy * CAN_LEN) / 2, 0]} material={canEnd}>
                <cylinderGeometry args={[0.088, 0.088, 0.012, 16]} />
              </mesh>
            ))}
          </group>
        </Pickable>
      ))}

      <Box
        size={[D + 0.3, 0.01, W + 0.3]}
        material={shell}
        position={[x, -1, z]}
        collide
        cast={false}
      />
    </>
  )
}

/**
 * The dartboard on the cubicle wall, with a squirrel taped over the bull.
 *
 * Regulation height — the bull is at 5 ft 8 — and three darts in it, none of
 * them near the squirrel. Nobody will say who put the photograph there.
 */
function Dartboard({ x, z, ry }: { x: number; z: number; ry: number }) {
  const face = useMemo(
    () => new THREE.MeshStandardMaterial({ map: dartboardTex(), roughness: 0.9 }),
    [],
  )
  const photo = useMemo(
    () => new THREE.MeshStandardMaterial({ map: squirrelPhotoTex(), roughness: 0.85 }),
    [],
  )
  const rim = useMemo(() => M(0x2b2118, { roughness: 0.7 }), [])
  const surround = useMemo(() => M(0x1f2226, { roughness: 0.85 }), [])
  const tape = useMemo(
    () => M(0xe9e3d2, { roughness: 0.9, transparent: true, opacity: 0.72 }),
    [],
  )
  const flightMats = useMemo(
    () => [0xc8402e, 0x2b63c9, 0xf2c53d].map((c) => M(c, { side: THREE.DoubleSide })),
    [],
  )

  /** Where the three darts landed. None of them is a good throw. */
  const darts = useMemo(
    () =>
      [
        [0.44, 0.31, 0.22],
        [-0.36, 0.18, -0.16],
        [0.12, -0.47, 0.34],
      ] as const,
    [],
  )

  const R = 0.75

  return (
    <group position={[x, 5.67, z]} rotation={[0, ry, 0]}>
      {/* the backboard everybody screws one of these to */}
      <mesh position={[0, -0.1, -0.05]} material={surround}>
        <boxGeometry args={[2.5, 2.7, 0.06]} />
      </mesh>
      {/* board body, wire face, and the ring round the edge */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={rim}>
        <cylinderGeometry args={[R, R, 0.14, 32]} />
      </mesh>
      <Panel size={[R * 2, R * 2]} material={face} position={[0, 0, 0.075]} />
      <mesh position={[0, 0, 0.04]} material={rim}>
        <torusGeometry args={[R, 0.03, 8, 36]} />
      </mesh>

      {/* the squirrel, taped over the bull */}
      <Panel size={[0.52, 0.52]} material={photo} position={[0, 0.02, 0.085]} />
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as const
      ).map(([sx, sy], i) => (
        <Panel
          key={i}
          size={[0.14, 0.07]}
          material={tape}
          position={[sx * 0.22, 0.02 + sy * 0.24, 0.09]}
          rotation={[0, 0, sx * sy * 0.7]}
        />
      ))}

      {darts.map(([dx, dy, rz], i) => (
        <group key={i} position={[dx, dy, 0.09]} rotation={[0.24, 0.16, rz]}>
          <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
            <cylinderGeometry args={[0.012, 0.004, 0.2, 6]} />
          </mesh>
          <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]} material={mat.black}>
            <cylinderGeometry args={[0.032, 0.032, 0.14, 8]} />
          </mesh>
          {[0, 1].map((k) => (
            <mesh
              key={k}
              position={[0, 0, 0.38]}
              rotation={[0, 0, (k * Math.PI) / 2]}
              material={flightMats[i]}
            >
              <planeGeometry args={[0.16, 0.11]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/**
 * The break-room fridge, and what is in it.
 *
 * A bottom-freezer: the drawer across the bottom is the freezer, and the
 * fridge door above it is the one that opens. Five slabs rather than one box,
 * so there is a cavity to put anything in, and the door is hinged on its far
 * edge. Space and it swings; space again and it shuts. The collider for the
 * open leaf comes and goes with the door, so you cannot walk through it
 * while it is standing open.
 */
function Fridge({ x, z, flyer }: { x: number; z: number; flyer: THREE.Material }) {
  const [open, setOpen] = useState(false)
  const pivot = useRef<THREE.Group>(null)
  const angle = useRef(0)
  const hit = useRef<THREE.Mesh>(null)
  const showHint = useOffice((s) => s.showHint)

  const shell = useMemo(() => M(0xeceeec, { roughness: 0.55 }), [])
  const doorSkin = useMemo(() => M(0xf6f6f4, { roughness: 0.35 }), [])
  const gasket = useMemo(() => M(0x3a3d42, { roughness: 0.8 }), [])
  const linerMat = useMemo(() => M(0xe8ebe6, { roughness: 0.6 }), [])
  const shelfMat = useMemo(
    () => M(0xdfe6ea, { roughness: 0.2, transparent: true, opacity: 0.55 }),
    [],
  )
  const drawerMat = useMemo(() => M(0xdfe4e6, { roughness: 0.5 }), [])
  const card = useMemo(() => M(0xc9b08a, { roughness: 0.95 }), [])
  const pizzaLid = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pizzaBoxTex(), roughness: 0.95 }),
    [],
  )
  const lampMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff4d8,
        emissiveIntensity: 1.4,
        roughness: 0.4,
      }),
    [],
  )
  const boxMats = useMemo(
    () => [0xc8402e, 0x2b63c9, 0x1f7a3d, 0x7a2b8f].map((c) => M(c, { roughness: 0.5 })),
    [],
  )
  const foam = useMemo(() => M(0xf6f6f0, { roughness: 0.9 }), [])
  const kraft = useMemo(() => M(0xb98f5e, { roughness: 0.95 }), [])
  const canMats = useMemo(
    () => [0xc8102e, 0x1f7a3d, 0xe08a1e, 0x1c6fb8].map((c) => M(c, { roughness: 0.4 })),
    [],
  )

  const W = 2.6
  const HT = 5.5
  /** Freezer drawer across the bottom; the fridge door sits on top of it. */
  const FRZ_H = 1.2
  const FRZ_Y = 0.5 + FRZ_H / 2
  const DOOR_H = HT - 0.25 - (0.5 + FRZ_H)
  const DOOR_Y = 0.5 + FRZ_H + DOOR_H / 2
  const D = 2.6
  const WALL = 0.22
  /** Inside face of the back. */
  const IN_X = -W / 2 + WALL
  const SHELVES = [1.62, 2.78, 3.94]

  useOpenable(hit, () => {
    const next = !open
    setOpen(next)
    showHint(
      next
        ? 'Somebody\'s pizza from Tuesday. The note says DO NOT EAT — TOM.'
        : 'Fridge shut. The light goes off. Probably.',
      3000,
    )
  })

  /*
    Eased rather than snapped, and driven off a ref: the angle changes every
    frame while it swings, and pushing that through state would re-render the
    whole break room sixty times a second.
  */
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = open ? -1.62 : 0
    angle.current += (target - angle.current) * Math.min(1, dt * 6)
    if (pivot.current) pivot.current.rotation.y = angle.current
  })

  return (
    <>
      <group position={[x, 0, z]}>
        {/* carcass: back, two sides, top and a plinth */}
        <Box size={[WALL, HT, D]} material={shell} position={[-W / 2 + WALL / 2, HT / 2, 0]} />
        {[-1, 1].map((sz) => (
          <Box
            key={sz}
            size={[W, HT, WALL]}
            material={shell}
            position={[0, HT / 2, (sz * (D - WALL)) / 2]}
          />
        ))}
        <Box size={[W, WALL, D]} material={shell} position={[0, HT - WALL / 2, 0]} />
        <Box size={[W, 0.5, D]} material={shell} position={[0, 0.25, 0]} />
        {/* the liner, a shade off the shell so the cavity reads as a cavity */}
        <Box
          size={[WALL, HT - 0.72, D - WALL * 2]}
          material={linerMat}
          position={[IN_X + 0.01, (HT + 0.5 - WALL) / 2, 0]}
          cast={false}
        />

        {/* the lamp, which is the only thing in here that still works */}
        <Box
          size={[0.5, 0.1, 0.7]}
          material={lampMat}
          position={[IN_X + 0.4, HT - WALL - 0.1, 0]}
          cast={false}
        />

        {/* three shelves and the crisper */}
        {SHELVES.map((y) => (
          <Box
            key={y}
            size={[W - WALL * 2 - 0.08, 0.05, D - WALL * 2 - 0.08]}
            material={shelfMat}
            position={[0.06, y, 0]}
            cast={false}
          />
        ))}
        <Box
          size={[W - WALL * 2 - 0.14, 0.85, D - WALL * 2 - 0.2]}
          material={drawerMat}
          position={[0.06, 1.0, 0]}
          cast={false}
        />

        {/* bottom shelf: the pizza box, flat, taking the whole shelf */}
        <group position={[0.1, 1.83, -0.05]} rotation={[0, 0.06, 0]}>
          <Box size={[1.9, 0.3, 1.9]} material={card} position={[0, 0, 0]} />
          <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} material={pizzaLid}>
            <planeGeometry args={[1.86, 1.86]} />
          </mesh>
        </group>

        {/* middle shelf: three lunchboxes, one with the lid not quite on */}
        {(
          [
            [-0.34, -0.62, 0.1, 0],
            [-0.3, 0.28, -0.24, 1],
            [0.42, 0.72, 0.5, 2],
          ] as const
        ).map(([ox, oz, ry, mi], i) => (
          <group key={i} position={[0.1 + ox, 2.99, oz]} rotation={[0, ry, 0]}>
            <Box size={[0.78, 0.36, 0.62]} material={boxMats[mi]} position={[0, 0, 0]} />
            <Box
              size={[0.82, 0.07, 0.66]}
              material={boxMats[(mi + 1) % 4]}
              position={[0, 0.21, i === 2 ? 0.08 : 0]}
              cast={false}
            />
            <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={boxMats[mi]}>
              <torusGeometry args={[0.16, 0.025, 6, 14, Math.PI]} />
            </mesh>
          </group>
        ))}

        {/* top shelf: takeout, and the drinks nobody claimed */}
        {(
          [
            [-0.36, -0.58],
            [-0.3, 0.2],
          ] as const
        ).map(([ox, oz], i) => (
          <group key={`c${i}`} position={[0.1 + ox, 4.12, oz]} rotation={[0, i * 0.4 - 0.2, 0]}>
            <Box size={[0.82, 0.24, 0.66]} material={foam} position={[0, 0, 0]} />
            <Box size={[0.86, 0.06, 0.7]} material={foam} position={[0, 0.15, 0]} cast={false} />
          </group>
        ))}
        <group position={[0.5, 4.28, 0.72]} rotation={[0, -0.5, 0]}>
          <Box size={[0.62, 0.62, 0.56]} material={kraft} position={[0, 0, 0]} />
          <Box size={[0.5, 0.06, 0.44]} material={kraft} position={[0, 0.34, 0]} cast={false} />
        </group>
        {canMats.slice(0, 2).map((m, i) => (
          <mesh key={`k${i}`} position={[0.62, 4.16, -0.62 + i * 0.34]} material={m}>
            <cylinderGeometry args={[0.12, 0.12, 0.3, 14]} />
          </mesh>
        ))}

        {/*
          The door. Hinged on the far side from the handle, which is where the
          handle already was, and swung out into the room.
        */}
        <group ref={pivot} position={[W / 2 - 0.08, 0, D / 2 - 0.02]}>
          <Box
            size={[0.18, DOOR_H, D]}
            material={doorSkin}
            position={[0.09, DOOR_Y, -D / 2]}
          />
          {/* the gasket: a dark line just inside the edge of the leaf */}
          {(
            [
              [DOOR_Y + DOOR_H / 2 - 0.08, -D / 2, 0.04, D - 0.2],
              [DOOR_Y - DOOR_H / 2 + 0.08, -D / 2, 0.04, D - 0.2],
              [DOOR_Y, -0.12, DOOR_H - 0.2, 0.04],
              [DOOR_Y, -D + 0.12, DOOR_H - 0.2, 0.04],
            ] as const
          ).map(([gy, gz, gh, gd], i) => (
            <Box key={i} size={[0.03, gh, gd]} material={gasket} position={[-0.01, gy, gz]} cast={false} />
          ))}
          {/* inner face and two door racks */}
          <Box
            size={[0.06, DOOR_H - 0.3, D - 0.3]}
            material={linerMat}
            position={[-0.03, DOOR_Y, -D / 2]}
            cast={false}
          />
          {[2.5, 3.7].map((y) => (
            <group key={y}>
              <Box
                size={[0.28, 0.06, D - 0.3]}
                material={shelfMat}
                position={[-0.14, y, -D / 2]}
                cast={false}
              />
              <Box
                size={[0.05, 0.34, D - 0.3]}
                material={shelfMat}
                position={[-0.26, y + 0.17, -D / 2]}
                cast={false}
              />
            </group>
          ))}
          {canMats.map((m, i) => (
            <mesh
              key={i}
              position={[-0.15, (i < 2 ? 2.5 : 3.7) + 0.2, -D / 2 - 0.5 + (i % 2) * 0.36]}
              material={m}
            >
              <cylinderGeometry args={[0.11, 0.11, 0.34, 14]} />
            </mesh>
          ))}

          {/* the pull, stood off the door on two posts, by the free edge */}
          {[-0.5, 0.5].map((dy) => (
            <Box key={dy} size={[0.12, 0.08, 0.08]} material={mat.steel} position={[0.24, 3.3 + dy, -D + 0.45]} cast={false} />
          ))}
          <mesh position={[0.3, 3.3, -D + 0.45]} material={mat.steel}>
            <cylinderGeometry args={[0.04, 0.04, 1.3, 10]} />
          </mesh>
          {/* the badge, up at the top by the hinge, and the magnets */}
          <Box size={[0.02, 0.1, 0.42]} material={gasket} position={[0.19, DOOR_Y + DOOR_H / 2 - 0.3, -0.5]} cast={false} />
          {(
            [
              [3.95, -D / 2 + 0.5, 0xc8402e],
              [3.95, -D / 2 - 0.5, 0x3a6ea5],
              [2.75, -D / 2 + 0.5, 0xf2c53d],
            ] as const
          ).map(([my, mz, c], i) => (
            <mesh key={i} position={[0.19, my, mz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
              <meshStandardMaterial color={c} roughness={0.5} />
            </mesh>
          ))}
          <Panel
            size={[0.9, 1.2]}
            material={flyer}
            position={[0.185, 3.4, -D / 2]}
            rotation={[0, Math.PI / 2, 0]}
          />

          {/* invisible click target over the whole leaf */}
          <mesh ref={hit} position={[0.1, DOOR_Y, -D / 2]} visible={false}>
            <boxGeometry args={[0.4, DOOR_H, D - 0.1]} />
          </mesh>
        </group>

        {/* the freezer drawer front across the bottom, with its bar, and the grille under it */}
        <Box size={[0.18, FRZ_H - 0.06, D]} material={doorSkin} position={[W / 2 + 0.01, FRZ_Y, 0]} />
        <Box size={[0.03, 0.04, D - 0.2]} material={gasket} position={[W / 2 + 0.09, FRZ_Y + FRZ_H / 2 - 0.1, 0]} cast={false} />
        {[-0.6, 0.6].map((dz) => (
          <Box key={dz} size={[0.12, 0.08, 0.08]} material={mat.steel} position={[W / 2 + 0.14, FRZ_Y + 0.3, dz]} cast={false} />
        ))}
        <mesh position={[W / 2 + 0.2, FRZ_Y + 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
          <cylinderGeometry args={[0.04, 0.04, 1.5, 10]} />
        </mesh>
        <Box size={[0.04, 0.22, D - 0.4]} material={gasket} position={[W / 2 - 0.01, 0.26, 0]} cast={false} />
      </group>

      <Collider minX={x - W / 2} maxX={x + W / 2} minZ={z - D / 2} maxZ={z + D / 2} />
      {open && (
        <Collider
          minX={x + W / 2 - 0.2}
          maxX={x + W / 2 + D}
          minZ={z + D / 2 - 0.5}
          maxZ={z + D / 2 + 0.3}
        />
      )}
    </>
  )
}

/** Carafe glass: a lathe profile, radius by height, in feet. */
const CARAFE = [
  [0.0, 0.0],
  [0.2, 0.0],
  [0.24, 0.02],
  [0.27, 0.16],
  [0.275, 0.3],
  [0.25, 0.44],
  [0.2, 0.54],
  [0.205, 0.6],
  [0.215, 0.62],
].map(([r, y]) => new THREE.Vector2(r, y))

/** The coffee in it, a shade inside the glass. */
const BREW = CARAFE.slice(0, 7).map((v) => new THREE.Vector2(Math.max(0, v.x - 0.018), v.y))

/**
 * A drip coffee maker, and it works.
 *
 * Click the button and it brews: a stream out of the basket, the level in the
 * carafe climbing, the light going from red to amber to green. Eight seconds,
 * because nobody wants to stand there for six minutes. When the pot is full
 * the next click pours it out, and you can start again.
 *
 * The front is +X, toward the room; the reservoir column stands at the back
 * against the wall.
 */
function CoffeeMaker({ x, y, z }: { x: number; y: number; z: number }) {
  const showHint = useOffice((s) => s.showHint)
  const button = useRef<THREE.Mesh>(null)
  const brew = useRef<THREE.Mesh>(null)
  const stream = useRef<THREE.Mesh>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  const state = useRef<{ level: number; phase: 'idle' | 'brewing' | 'ready' }>({
    level: 0.3,
    phase: 'idle',
  })

  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xdfe9ee,
        roughness: 0.05,
        metalness: 0,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  )
  const coffee = useMemo(() => M(0x2a1a0f, { roughness: 0.2 }), [])
  const housing = useMemo(() => M(0x1b1c1f, { roughness: 0.55 }), [])
  const trim = useMemo(() => M(0x8f949b, { roughness: 0.35, metalness: 0.7 }), [])
  const water = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x9fc4dc, transparent: true, opacity: 0.6, roughness: 0.2 }),
    [],
  )
  const glassGeo = useMemo(() => new THREE.LatheGeometry(CARAFE, 28), [])
  const brewGeo = useMemo(() => new THREE.LatheGeometry(BREW, 28), [])

  const BASE_H = 0.08
  const COL_H = 1.32
  const HEAD_H = 0.3
  const NOZZLE_Y = BASE_H + COL_H - 0.05

  useClickable(button, () => {
    const st = state.current
    if (st.phase === 'brewing') {
      showHint('It is brewing. Give it a minute.', 1800)
      return
    }
    if (st.phase === 'ready' || st.level > 0.9) {
      st.level = 0.12
      st.phase = 'idle'
      showHint('Poured it out. Somebody will complain.', 2200)
      return
    }
    st.phase = 'brewing'
    showHint('Brewing. The light means it is thinking about it.', 2600)
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const st = state.current
    if (st.phase === 'brewing') {
      st.level = Math.min(1, st.level + dt / 8)
      if (st.level >= 1) {
        st.phase = 'ready'
        showHint('Coffee is ready.', 2000)
      }
    }
    // the coffee: the lathe scaled by level, so the surface climbs the glass
    if (brew.current) {
      brew.current.scale.y = Math.max(0.02, st.level)
      brew.current.scale.x = brew.current.scale.z = 0.94 + st.level * 0.06
    }
    // the stream: a thin column from the nozzle to the surface
    if (stream.current) {
      const on = st.phase === 'brewing'
      stream.current.visible = on
      if (on) {
        const top = NOZZLE_Y
        const surface = BASE_H + 0.02 + st.level * 0.54
        stream.current.position.y = (top + surface) / 2
        stream.current.scale.y = Math.max(0.01, top - surface)
      }
    }
    if (lamp.current) {
      const c = st.phase === 'brewing' ? 0xffa020 : st.phase === 'ready' ? 0x30d060 : 0xff2020
      lamp.current.emissive.setHex(c)
      lamp.current.emissiveIntensity = st.phase === 'brewing' ? 1.6 + Math.sin(performance.now() / 160) * 0.8 : 2
    }
  })

  return (
    <group position={[x, y, z]}>
      {/* base plate and the warmer under the carafe */}
      <Box size={[0.9, BASE_H, 0.8]} material={housing} position={[0.05, BASE_H / 2, 0]} />
      <mesh position={[0.2, BASE_H + 0.01, 0]} material={trim}>
        <cylinderGeometry args={[0.3, 0.3, 0.02, 28]} />
      </mesh>

      {/* the reservoir column at the back, with its water window */}
      <Box size={[0.36, COL_H, 0.8]} material={housing} position={[-0.22, BASE_H + COL_H / 2, 0]} />
      <Box size={[0.02, 0.7, 0.12]} material={water} position={[-0.04, BASE_H + 0.55, 0.3]} cast={false} />
      {/* the head that overhangs the carafe, and the basket drawer in it */}
      <Box size={[0.86, HEAD_H, 0.8]} material={housing} position={[0.03, BASE_H + COL_H - HEAD_H / 2, 0]} />
      <Box size={[0.5, 0.06, 0.62]} material={trim} position={[0.22, BASE_H + COL_H - HEAD_H - 0.03, 0]} cast={false} />
      <mesh position={[0.2, NOZZLE_Y + 0.02, 0]} material={housing}>
        <cylinderGeometry args={[0.035, 0.025, 0.06, 10]} />
      </mesh>
      {/* lid over the water tank, with a hinge line */}
      <Box size={[0.4, 0.03, 0.7]} material={trim} position={[-0.2, BASE_H + COL_H + 0.015, 0]} cast={false} />

      {/* the panel: a lamp and the one button */}
      <Box size={[0.03, 0.22, 0.3]} material={trim} position={[-0.03, BASE_H + 0.32, -0.2]} cast={false} />
      <mesh position={[-0.01, BASE_H + 0.36, -0.14]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.05, 0.05]} />
        <meshStandardMaterial ref={lamp} color={0} emissive={0xff2020} emissiveIntensity={2} />
      </mesh>
      <mesh ref={button} position={[0.0, BASE_H + 0.28, -0.24]} rotation={[0, 0, Math.PI / 2]} material={mat.red}>
        <cylinderGeometry args={[0.045, 0.045, 0.05, 14]} />
      </mesh>

      {/* the carafe on the warmer: glass, what is in it, a lid and a handle */}
      <group position={[0.2, BASE_H + 0.02, 0]}>
        <mesh ref={brew} geometry={brewGeo} material={coffee} />
        <mesh geometry={glassGeo} material={glass} />
        <mesh position={[0, 0.63, 0]} material={housing}>
          <cylinderGeometry args={[0.23, 0.21, 0.05, 24]} />
        </mesh>
        <mesh position={[0, 0.665, 0]} material={housing}>
          <cylinderGeometry args={[0.05, 0.08, 0.03, 12]} />
        </mesh>
        {/* the handle: a vertical loop off the +X side, top joined to the collar */}
        <mesh position={[0.34, 0.4, 0]} rotation={[0, 0, -Math.PI / 2 - 0.35]} material={housing}>
          <torusGeometry args={[0.19, 0.03, 8, 20, Math.PI * 1.15]} />
        </mesh>
      </group>
      <mesh ref={stream} position={[0.2, 0, 0]} material={coffee} visible={false}>
        <cylinderGeometry args={[0.012, 0.016, 1, 6]} />
      </mesh>

      {/* the cord, down the back and off to the wall */}
      <mesh position={[-0.42, 0.3, 0.2]} rotation={[0.3, 0, 0.4]} material={mat.black}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
      </mesh>
    </group>
  )
}

/** A paper cup: a lathe, narrower at the foot, with a rolled lip. */
const CUP = [
  [0.0, 0.0],
  [0.13, 0.0],
  [0.135, 0.01],
  [0.165, 0.34],
  [0.175, 0.35],
  [0.165, 0.365],
  [0.155, 0.35],
  [0.125, 0.02],
  [0.0, 0.02],
].map(([r, y]) => new THREE.Vector2(r, y))

/**
 * The single-serve machine next to the drip one, which is the one people use.
 *
 * A cup sits under the spout. Click the button and it fills — a stream, a
 * level rising in the cup, done in three seconds. The cup is a Pickable; take
 * it, and the machine drops a fresh empty one onto the platform behind it.
 * Four cups in the pool, so the fifth coffee reuses the first cup wherever
 * it was left.
 */
function PodBrewer({ x, y, z }: { x: number; y: number; z: number }) {
  const showHint = useOffice((s) => s.showHint)
  const button = useRef<THREE.Mesh>(null)
  const stream = useRef<THREE.Mesh>(null)
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  const cups = useRef<Array<THREE.Group | null>>([null, null, null, null])
  const levels = useRef<Array<THREE.Mesh | null>>([null, null, null, null])
  const st = useRef({
    /** Which cup is on the platform. */
    cup: 0,
    fill: [0, 0, 0, 0],
    brewing: false,
    /** Seconds until the next cup drops, once the last was taken. */
    reload: 0,
  })

  const housing = useMemo(() => M(0x2a2c30, { roughness: 0.5 }), [])
  const trim = useMemo(() => M(0xb8bcc2, { roughness: 0.3, metalness: 0.7 }), [])
  const paper = useMemo(() => M(0xf2efe6, { roughness: 0.8, side: THREE.DoubleSide }), [])
  const coffee = useMemo(() => M(0x2a1a0f, { roughness: 0.2 }), [])
  const tank = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x9fc4dc, transparent: true, opacity: 0.55, roughness: 0.2 }),
    [],
  )
  const cupGeo = useMemo(() => new THREE.LatheGeometry(CUP, 22), [])

  const PLATFORM = [0.32, 0.06, 0] as const
  const SPOUT_Y = 1.02

  /** Is this cup the one under the spout? It is, until somebody lifts it. */
  const onPlatform = (i: number) => {
    const g = cups.current[i]
    if (!g) return false
    return Math.abs(g.position.x - PLATFORM[0]) < 0.05 && Math.abs(g.position.z - PLATFORM[2]) < 0.05
  }

  useClickable(button, () => {
    const s = st.current
    if (s.brewing) {
      showHint('Patience.', 1200)
      return
    }
    if (!onPlatform(s.cup)) {
      showHint('No cup. Give it a second.', 1600)
      return
    }
    if (s.fill[s.cup] >= 1) {
      showHint('That one is full. Take it.', 1800)
      return
    }
    s.brewing = true
    showHint('Filling. It counts as a break.', 2200)
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = st.current

    if (s.brewing) {
      s.fill[s.cup] = Math.min(1, s.fill[s.cup] + dt / 3)
      if (s.fill[s.cup] >= 1) {
        s.brewing = false
        showHint('Done. Take the cup.', 1800)
      }
    }

    // the cup on the platform has been taken: a fresh one drops in after a beat
    if (!s.brewing && !onPlatform(s.cup)) {
      s.reload += dt
      if (s.reload > 1.2) {
        s.reload = 0
        s.cup = (s.cup + 1) % 4
        s.fill[s.cup] = 0
        const g = cups.current[s.cup]
        if (g) {
          g.position.set(...PLATFORM)
          g.rotation.set(0, 0, 0)
          g.visible = true
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      const lv = levels.current[i]
      if (!lv) continue
      const f = s.fill[i]
      lv.visible = f > 0.02
      lv.position.y = 0.03 + f * 0.3
    }
    if (stream.current) {
      stream.current.visible = s.brewing
      if (s.brewing) {
        const surface = PLATFORM[1] + 0.03 + s.fill[s.cup] * 0.3
        stream.current.position.y = (SPOUT_Y + surface) / 2
        stream.current.scale.y = Math.max(0.01, SPOUT_Y - surface)
      }
    }
    if (lamp.current) {
      lamp.current.emissive.setHex(s.brewing ? 0xffa020 : 0x30d060)
    }
  })

  return (
    <group position={[x, y, z]}>
      {/* the body: a drum at the back, the head over the platform, the tank beside */}
      <Box size={[0.7, 1.25, 0.6]} material={housing} position={[-0.15, 0.625, 0]} />
      <Box size={[0.95, 0.28, 0.6]} material={housing} position={[0.0, 1.11, 0]} />
      <Box size={[0.5, 0.06, 0.5]} material={trim} position={[0.32, 0.03, 0]} cast={false} />
      <mesh position={[0.32, SPOUT_Y - 0.03, 0]} material={trim}>
        <cylinderGeometry args={[0.05, 0.035, 0.06, 10]} />
      </mesh>
      <Box size={[0.42, 0.9, 0.22]} material={tank} position={[-0.2, 0.55, 0.42]} cast={false} />
      <Box size={[0.42, 0.04, 0.24]} material={housing} position={[-0.2, 1.02, 0.42]} cast={false} />
      {/* the lid lever on top, and the one button on the front */}
      <Box size={[0.5, 0.05, 0.12]} material={trim} position={[-0.1, 1.28, 0]} cast={false} />
      <mesh ref={button} position={[0.33, 1.12, -0.31]} rotation={[Math.PI / 2, 0, 0]} material={trim}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 14]} />
      </mesh>
      <mesh position={[0.2, 1.12, -0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.025, 10]} />
        <meshStandardMaterial ref={lamp} color={0} emissive={0x30d060} emissiveIntensity={2} />
      </mesh>

      {/* the stream, when it runs */}
      <mesh ref={stream} position={[0.32, 0, 0]} material={coffee} visible={false}>
        <cylinderGeometry args={[0.012, 0.014, 1, 6]} />
      </mesh>

      {/* the cups: one on the platform, the rest wherever they were left */}
      {[0, 1, 2, 3].map((i) => (
        <Pickable key={i} label="coffee">
          <group
            ref={(g) => {
              cups.current[i] = g
            }}
            position={[PLATFORM[0], PLATFORM[1], PLATFORM[2]]}
            visible={i === 0}
          >
            <mesh geometry={cupGeo} material={paper} castShadow />
            <mesh
              ref={(m) => {
                levels.current[i] = m
              }}
              position={[0, 0.03, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={coffee}
              visible={false}
            >
              <circleGeometry args={[0.15, 20]} />
            </mesh>
          </group>
        </Pickable>
      ))}
    </group>
  )
}

/**
 * The break room: a 12 x 36 bay down the west side, on vinyl rather than
 * carpet. Counter, coffee, fountain and fridge along the wall, two TVs, and
 * the ping-pong table in the middle of the floor.
 */
export function BreakArea() {
  const counterTop = useMemo(() => M(0x3a3f45, { roughness: 0.3 }), [])
  const vinyl = useMemo(
    () =>
      M(0xffffff, {
        roughness: 0.6,
        map: canvasTex(
          128,
          128,
          (g, w, h) => {
            g.fillStyle = '#c9c4b4'
            g.fillRect(0, 0, w, h)
            g.fillStyle = '#b4ae9c'
            g.fillRect(0, 0, w / 2, h / 2)
            g.fillRect(w / 2, h / 2, w / 2, h / 2)
            for (let i = 0; i < 300; i++) {
              g.fillStyle = `rgba(90,85,70,${Math.random() * 0.15})`
              g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
            }
          },
          [(BREAK_X1 - EX) / 2, (HALF + HALF) / 2],
        ),
      }),
    [],
  )
  const flyerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: fridgeFlyerTex() }),
    [],
  )

  return (
    <>
      {/* vinyl, laid a hair above the carpet so the two do not fight */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(EX + BREAK_X1) / 2, 0.012, 0]}
        material={vinyl}
        receiveShadow
      >
        <planeGeometry args={[BREAK_X1 - EX, HALF * 2]} />
      </mesh>

      {/* counter run */}
      <Box size={[2.2, 3, 10]} material={mat.dark} position={[EX + 1.1, 1.5, BZ]} collide />
      <Box size={[2.4, 0.15, 10.2]} material={counterTop} position={[EX + 1.2, 3.05, BZ]} cast={false} />
      <Box size={[0.4, 2, 10]} material={mat.laminate} position={[EX + 0.2, 6, BZ]} cast={false} />

      <CoffeeMaker x={EX + 1.15} z={BZ - 3.2} y={CTOP} />
      <PodBrewer x={EX + 1.15} z={BZ - 4.4} y={CTOP} />

      {/*
        Three mugs out of the cupboard, none of them washed.

        Spaced by more than a mug: the old trio was 0.25 ft apart on a 0.18 ft
        radius, so the white one grew out of the side of the red one.
      */}
      {(
        [
          [EX + 1.0, BZ - 1.35, 'white', 0.4],
          [EX + 1.75, BZ - 1.2, 'red', 2.5],
          [EX + 1.1, BZ - 0.7, 'blue', -1.9],
        ] as const
      ).map(([x, z, key, ry], i) => (
        <group key={i} position={[x, CTOP, z]} rotation={[0, ry, 0]}>
          {/* the white one still has yesterday's coffee in it */}
          <Pickable label="mug">
            <Mug x={0} z={0} material={mat[key]} coffee={key === 'white'} />
          </Pickable>
        </group>
      ))}
      <SugarCaddy x={EX + 1.2} z={BZ + 1.9} />

      {/*
        The drinking fountain, on the west wall between the copier and the
        fridge: the same bottle-filler unit the lift lobby has, turned to face
        into the room. Its deck is two feet deep, so it stands a little south
        of where the old box did to keep clear of the copier's base.
        It was three steel boxes and a ring, which read as a grey box with a
        dent in it.
      */}
      <WaterFountain
        x={EX + 0.18}
        z={BZ + 6.6}
        ry={Math.PI}
        collide={[EX, EX + 1.6, BZ + 5.5, BZ + 7.7]}
      />

      <StaffUpdateTv />
      <WeatherTv />
      {/* backed onto the west face of the cubicle block, facing the room */}
      <SodaMachine x={LX - 1.32} z={-2.5} ry={-Math.PI / 2} />
      {/*
        Somebody taped party ribbons to this one and nobody has taken them off.

        North-east corner of the break room, where the cubicle block meets the
        glass, aimed back down the room at the ping-pong table.
      */}
      <FloorFan x={BREAK_X1 - 1.4} z={-HALF + 1.7} ry={-0.77} streamers />
      <Dartboard x={BREAK_X1 - 0.13} z={4.6} ry={-Math.PI / 2} />
      <Snacks />
      <PingPongTable x={EX + 10.0} z={9.5} />

      <Fridge x={EX + 1.4} z={BZ + 11.5} flyer={flyerMat} />
    </>
  )
}
