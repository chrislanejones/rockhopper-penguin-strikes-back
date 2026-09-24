import { useCallback, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { kick } from '../lib/avatar'
import { fireDart } from './Darts'
import { BZ, CL, CR as CORRIDOR_R, DZ, HALF, RX0, V } from '../scene/constants'
import {
  copierScreenTex, corvetteTex, ideasBinSignTex, nightGardenTex, plaidTex, wallpaperLabelTex,
} from '../textures/signage'
import { Box, Collider, Panel } from './props/primitives'
import { StackPaper } from './props/Furniture'
import { Pickable } from './props/Pickable'

/** Where the hand closes round the blaster: the pistol grip, in its frame. */
const GRIP: [number, number, number] = [-0.2, -0.3, 0]
const CENTRE = new THREE.Vector2(0, 0)

/**
 * The foam blaster somebody left on a spare chair, and the darts around it.
 *
 * Pick it up and click to fire. The darts stick to the walls, which is not
 * in the lease.
 */
export function FoamBlaster() {
  const orange = useMemo(() => M(0xff7a1a, { roughness: 0.5 }), [])
  const blue = useMemo(() => M(0x2b63c9, { roughness: 0.5 }), [])
  const grey = useMemo(() => M(0x8a8f96, { roughness: 0.5 }), [])
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const muzzle = useRef<THREE.Mesh>(null)
  const body = useRef<THREE.Group>(null)
  const aim = useMemo(() => new THREE.Raycaster(), [])

  /*
    Darts go where the crosshair is, not where the barrel points.

    The blaster is held down and to the right of the eye, so a dart fired
    straight along its barrel lands low and right of what you were looking at.
    Instead the crosshair ray finds what you meant, and the dart is aimed from
    the muzzle at that point.
  */
  const shoot = useCallback(() => {
    const m = muzzle.current
    if (!m) return
    const from = m.getWorldPosition(new THREE.Vector3())
    aim.setFromCamera(CENTRE, camera)
    aim.far = 80
    const hit = aim.intersectObjects(scene.children, true).find((h) => {
      let o: THREE.Object3D | null = h.object
      while (o) {
        if (o === body.current) return false
        o = o.parent
      }
      return true
    })
    const at = hit ? hit.point : camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(80).add(camera.position)
    const dir = at.sub(from).normalize()
    fireDart(from.addScaledVector(dir, 0.12), dir)
    kick()
  }, [aim, camera, scene])

  const darts = useMemo(
    () =>
      Array.from({ length: 5 }, () => {
        const a = Math.random() * 6
        return {
          x: -14 + Math.cos(a) * (0.4 + Math.random() * 0.5),
          z: 11 + Math.sin(a) * (0.4 + Math.random() * 0.5),
          ry: Math.random() * 6,
        }
      }),
    [],
  )

  const Dart = ({
    position,
    rotation,
  }: {
    position: [number, number, number]
    rotation: [number, number, number]
  }) => (
    <group position={position} rotation={rotation}>
      <mesh material={blue}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 8]} />
      </mesh>
      <mesh position={[0, 0.17, 0]} material={orange}>
        <cylinderGeometry args={[0.035, 0.03, 0.06, 8]} />
      </mesh>
    </group>
  )

  return (
    <>
      {/*
        The placing group is outside the Pickable, so the pickable's own frame
        is the blaster's: +X down the barrel, the pistol grip below the origin.
        That is the frame `gripAt` is stated in.
      */}
      <group position={[-14, 1.72, 11]} rotation={[0, 2.4, 0.08]}>
        <Pickable label="foam blaster" hold="grip" gripAt={GRIP} onUse={shoot}>
          <group ref={body}>
          <mesh material={blue}>
            <boxGeometry args={[1.1, 0.3, 0.22]} />
          </mesh>
          <mesh position={[-0.1, 0.2, 0]} material={orange}>
            <boxGeometry args={[0.7, 0.14, 0.2]} />
          </mesh>
          <mesh position={[0.8, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} material={orange}>
            <cylinderGeometry args={[0.09, 0.09, 0.55, 14]} />
          </mesh>
          <mesh ref={muzzle} position={[1.08, 0.05, 0]} rotation={[0, 0, Math.PI / 2]} material={grey}>
            <cylinderGeometry args={[0.11, 0.11, 0.08, 14]} />
          </mesh>
          <mesh position={[-0.2, -0.3, 0]} rotation={[0, 0, 0.25]} material={blue}>
            <boxGeometry args={[0.22, 0.42, 0.18]} />
          </mesh>
          <mesh position={[0.02, -0.22, 0]} material={orange}>
            <boxGeometry args={[0.05, 0.14, 0.06]} />
          </mesh>
          <mesh position={[0.3, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={orange}>
            <cylinderGeometry args={[0.24, 0.24, 0.22, 18]} />
          </mesh>
          <mesh position={[-0.75, 0.02, 0]} material={grey}>
            <boxGeometry args={[0.45, 0.2, 0.16]} />
          </mesh>
          </group>
        </Pickable>
      </group>

      {darts.map((d, i) => (
        <Dart key={i} position={[d.x, 1.6, d.z]} rotation={[Math.PI / 2, d.ry, 0]} />
      ))}
      <Dart position={[-12.4, 0.03, 12.2]} rotation={[Math.PI / 2, 0, 0.7]} />
    </>
  )
}

/** Printer station and the recycling nobody empties. */
export function PrinterStation() {
  const charcoal = useMemo(() => M(0x2b2d31, { roughness: 0.62, metalness: 0.1 }), [])
  const body = useMemo(() => M(0x9c9ea2, { roughness: 0.55 }), [])
  const pale = useMemo(() => M(0xd9d9d5, { roughness: 0.6 }), [])
  const drawer = useMemo(() => M(0x84878c, { roughness: 0.5 }), [])
  const slot = useMemo(() => M(0x121316, { roughness: 0.9 }), [])
  // Lit from inside: the map is also the emissive map, so it reads in the corner's shade.
  const screen = useMemo(() => {
    const t = copierScreenTex()
    return new THREE.MeshStandardMaterial({
      map: t,
      emissiveMap: t,
      emissive: 0xffffff,
      emissiveIntensity: 0.55,
      roughness: 0.3,
    })
  }, [])
  const led = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x143d1a, emissive: 0x39e05a, emissiveIntensity: 2 }),
    [],
  )
  const bin = useMemo(() => M(0x3d4149, { roughness: 0.4, side: THREE.DoubleSide }), [])

  /*
    A floor-standing copier in the corner of the break room, its back to the
    west wall and its front to the room. It was a laminate cabinet with a
    grey lid on it. The same footprint and the same collider: what changed
    is that it now has the things a copier has — two paper drawers, an
    output slot with the tray under it and this morning's pages in the
    tray, the scanner deck, the feeder on top, a control panel tilted at you,
    and the green light that says it is not, for once, jammed.
  */
  const x = RX0 + 1.7
  const z = HALF - 1.6
  /** The front face, toward the room. Everything that sticks out sticks out from here. */
  const fx = x + 1.15

  return (
    <>
      {/* the base cabinet, and the two paper drawers in its front */}
      <Box size={[2.3, 2.2, 2.9]} material={charcoal} position={[x, 1.1, z]} collide />
      {[0.5, 1.5].map((y) => (
        <group key={y}>
          <Box size={[0.06, 0.82, 2.6]} material={drawer} position={[fx + 0.03, y, z]} cast={false} />
          <Box size={[0.08, 0.08, 1.4]} material={mat.steel} position={[fx + 0.1, y + 0.22, z]} cast={false} />
        </group>
      ))}

      {/* the print engine: the slot the pages come out of, and the tray they land in */}
      <Box size={[2.3, 1.25, 2.9]} material={body} position={[x, 2.82, z]} />
      <Box size={[0.05, 0.28, 2.0]} material={slot} position={[fx + 0.01, 3.1, z]} cast={false} />
      <Box size={[0.9, 0.05, 2.1]} material={pale} position={[fx + 0.45, 2.7, z]} cast={false} />
      <Box size={[0.9, 0.16, 0.06]} material={pale} position={[fx + 0.45, 2.78, z - 1.02]} cast={false} />
      <Box size={[0.9, 0.16, 0.06]} material={pale} position={[fx + 0.45, 2.78, z + 1.02]} cast={false} />
      <StackPaper x={fx + 0.45} z={z} n={5} y={2.73} />
      <mesh position={[fx + 0.02, 3.35, z + 1.05]} rotation={[0, V, 0]} material={led}>
        <circleGeometry args={[0.05, 10]} />
      </mesh>

      {/* the scanner deck, and the document feeder on top of it */}
      <Box size={[2.4, 0.22, 3.0]} material={pale} position={[x, 3.56, z]} />
      <Box size={[2.0, 0.42, 2.6]} material={body} position={[x - 0.1, 3.88, z]} />
      <Box size={[0.8, 0.04, 1.9]} material={charcoal} position={[x - 0.4, 4.16, z]} rotation={[0, 0, 0.2]} cast={false} />

      {/* the control panel, on a stalk at the front corner, tilted up at whoever is standing there */}
      <Box size={[0.08, 0.5, 0.08]} material={charcoal} position={[fx - 0.25, 3.9, z - 1.15]} cast={false} />
      <group position={[fx - 0.05, 4.2, z - 1.15]} rotation={[0, 0, -0.55]}>
        <Box size={[0.9, 0.08, 1.1]} material={charcoal} position={[0, 0, 0]} cast={false} />
        {/* laid flat, then turned so the top of the picture is the back of the panel */}
        <mesh position={[0.02, 0.045, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} material={screen}>
          <planeGeometry args={[0.96, 0.7]} />
        </mesh>
        <Box size={[0.14, 0.05, 0.14]} material={led} position={[-0.32, 0.04, 0.42]} cast={false} />
      </group>

      <mesh position={[7.6, 0.75, HALF - 1]} material={bin}>
        <cylinderGeometry args={[0.55, 0.45, 1.5, 16, 1, true]} />
      </mesh>
    </>
  )
}

/**
 * Jordan's side business: Night Garden wallpaper on every panel she owns,
 * plus the rolls, the sample book, and a dog bed the dog never sees.
 */
export function WallpaperSamples() {
  const paper = useMemo(
    () => new THREE.MeshStandardMaterial({ map: nightGardenTex(), roughness: 0.9 }),
    [],
  )
  const plainRoll = useMemo(() => M(0xd9c8a8), [])
  const label = useMemo(() => new THREE.MeshStandardMaterial({ map: wallpaperLabelTex() }), [])
  const bedMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: plaidTex(), roughness: 1 }),
    [],
  )
  const cushion = useMemo(() => M(0xd8c7a8, { roughness: 1 }), [])
  const dent = useMemo(() => M(0xcbb99a, { roughness: 1 }), [])
  const CR = 6.5
  /*
    The bed sits beside the floor fan in the corner of the bay.

    It used to be at (11, -2.6), which is the middle of the walk in — you had
    to step round it to reach the desk, and it had a collider, so you actually
    could not. Tucked into the corner it is furniture rather than an obstacle,
    and the collider is gone: it is ankle height.
  */
  const bx = 15.3
  const bz = -4.3

  const rolls = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: HALF - 0.7 - (i % 3) * 0.42,
        z: BZ - 0.75 - Math.floor(i / 3) * 0.45,
        rz: (Math.random() - 0.5) * 0.12,
        rx: (Math.random() - 0.5) * 0.1,
        papered: i % 2 === 1,
      })),
    [],
  )

  return (
    <>
      <Panel
        size={[HALF - CR - 0.4, 6.5]}
        material={paper}
        position={[(CR + HALF) / 2, 3.85, BZ - 0.12]}
        rotation={[0, Math.PI, 0]}
      />
      <Panel
        size={[BZ - -2 - 0.3, 6.5]}
        material={paper}
        position={[CR + 0.12, 3.85, (BZ + -2) / 2]}
        rotation={[0, V, 0]}
      />
      <Panel
        size={[HALF - CR - 3.5 - 0.3, 6.5]}
        material={paper}
        position={[(CR + 3.5 + HALF) / 2, 3.85, DZ + 0.12]}
      />
      <Panel
        size={[1.6, 0.36]}
        material={label}
        position={[12.5, 6.2, BZ - 0.14]}
        rotation={[0, Math.PI, 0]}
      />

      {rolls.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, 1.6, r.z]}
          rotation={[r.rx, 0, r.rz]}
          material={r.papered ? paper : plainRoll}
          castShadow
        >
          <cylinderGeometry args={[0.18, 0.18, 3.2, 14]} />
        </mesh>
      ))}

      {/* sample book on the desk */}
      <mesh position={[10.5, 2.68, BZ - 1.3]} rotation={[0, 0.2, 0]} material={useMemo(() => M(0x6b3a3a, { roughness: 0.6 }), [])}>
        <boxGeometry args={[1.1, 0.35, 1.3]} />
      </mesh>
      <mesh position={[10.55, 2.68, BZ - 1.3]} rotation={[0, 0.2, 0]} material={mat.white}>
        <boxGeometry args={[1.0, 0.3, 1.2]} />
      </mesh>
      <mesh
        position={[10.55, 2.86, BZ - 1.3]}
        rotation={[-Math.PI / 2, 0, 0.2]}
        material={paper}
      >
        <planeGeometry args={[0.9, 1.1]} />
      </mesh>

      {/* dog bed — empty, the dog stays home */}
      <mesh position={[bx, 0.32, bz]} rotation={[Math.PI / 2, 0, 0]} material={bedMat} castShadow>
        <torusGeometry args={[1.05, 0.32, 12, 32]} />
      </mesh>
      <mesh position={[bx, 0.1, bz]} material={cushion}>
        <cylinderGeometry args={[1.0, 1.0, 0.18, 32]} />
      </mesh>
      <mesh position={[bx + 0.1, 0.19, bz - 0.1]} material={dent}>
        <cylinderGeometry args={[0.55, 0.6, 0.06, 24]} />
      </mesh>
      <Pickable label="chew toy">
        <mesh position={[bx + 0.4, 0.24, bz + 0.3]} rotation={[0, 0.6, Math.PI / 2]} material={mat.white}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        </mesh>
      </Pickable>
      {/* the bed is ankle height and out of the way now, so it is not a wall */}
    </>
  )
}

/**
 * Marcus's record wall, the crate under it, and the turntable.
 *
 * The sleeves hang on the corridor panel, running south to the corner the
 * turntable stands in — ten of them, two rows of five, above the filing
 * cabinet the deck sits on. They were on the west wall over his desk, which
 * put the collection at one end of the bay and the thing that plays it at
 * the other.
 */
export function RecordWall() {
  const covers: Array<(g: CanvasRenderingContext2D) => void> = useMemo(
    () => [
      (g) => {
        g.fillStyle = '#e63946'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#1d3557'
        g.beginPath()
        g.arc(64, 64, 40, 0, 7)
        g.fill()
        g.fillStyle = '#f1faee'
        g.beginPath()
        g.arc(64, 64, 14, 0, 7)
        g.fill()
      },
      (g) => {
        g.fillStyle = '#111'
        g.fillRect(0, 0, 128, 128)
        for (let i = 0; i < 8; i++) {
          g.fillStyle = `hsl(${i * 40},80%,55%)`
          g.fillRect(8 + i * 14, 20 + Math.sin(i) * 10, 10, 80)
        }
      },
      (g) => {
        g.fillStyle = '#f4e1b5'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#8b5e34'
        g.font = 'bold 30px serif'
        g.fillText('LIVE', 14, 60)
        g.fillText('1973', 14, 100)
      },
      (g) => {
        const gr = g.createLinearGradient(0, 0, 128, 128)
        gr.addColorStop(0, '#5e60ce')
        gr.addColorStop(1, '#48bfe3')
        g.fillStyle = gr
        g.fillRect(0, 0, 128, 128)
        g.strokeStyle = '#fff'
        g.lineWidth = 3
        for (let i = 0; i < 6; i++) {
          g.beginPath()
          g.arc(64, 64, 10 + i * 10, 0, 7)
          g.stroke()
        }
      },
      (g) => {
        g.fillStyle = '#fff'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#000'
        g.fillRect(0, 0, 64, 64)
        g.fillRect(64, 64, 64, 64)
      },
      (g) => {
        g.fillStyle = '#2a9d8f'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#e9c46a'
        g.beginPath()
        g.moveTo(20, 108)
        g.lineTo(64, 20)
        g.lineTo(108, 108)
        g.closePath()
        g.fill()
      },
      (g) => {
        g.fillStyle = '#222'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#ff9f1c'
        g.font = 'bold 18px sans-serif'
        g.fillText('MIDNIGHT', 10, 50)
        g.fillText('SESSIONS', 10, 75)
        g.fillStyle = '#fff'
        g.fillRect(10, 90, 108, 3)
      },
      (g) => {
        g.fillStyle = '#ffe66d'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#ff6b6b'
        for (let i = 0; i < 30; i++) {
          g.beginPath()
          g.arc(Math.random() * 128, Math.random() * 128, 5, 0, 7)
          g.fill()
        }
      },
      (g) => {
        g.fillStyle = '#3d405b'
        g.fillRect(0, 0, 128, 128)
        g.fillStyle = '#f2cc8f'
        g.fillRect(24, 24, 80, 80)
        g.fillStyle = '#3d405b'
        g.fillRect(40, 40, 48, 48)
      },
      (g) => {
        g.fillStyle = '#000'
        g.fillRect(0, 0, 128, 128)
        g.strokeStyle = '#0f0'
        g.lineWidth = 2
        g.beginPath()
        for (let x = 0; x < 128; x++) g.lineTo(x, 64 + Math.sin(x * 0.2) * 20 * Math.sin(x * 0.03))
        g.stroke()
      },
    ],
    [],
  )

  const sleeveMats = useMemo(() => {
    const dark = M(0x222222)
    return covers.map((draw) => {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      draw(c.getContext('2d')!)
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      const face = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })
      // BoxGeometry face order is +x,-x,+y,-y,+z,-z; -x looks into the cubicle.
      return [dark, face, dark, dark, dark, face]
    })
  }, [covers])

  const cols = 5
  const rows = 2
  /** Crate of records, on the floor under the sleeves. */
  const crateX = CL - 1.4
  const crateZ = 3
  const x0 = CL - 0.14
  const z0 = 1.5
  const y0 = 4.2

  const crateColours = useMemo(
    () => [0xe63946, 0x1d3557, 0xf4e1b5, 0x2a9d8f, 0x222222].map((c) => M(c)),
    [],
  )
  const disc = useMemo(() => M(0x0a0a0a, { roughness: 0.35, metalness: 0.2 }), [])
  const discLabel = useMemo(() => M(0xe63946), [])
  const platter = useMemo(() => M(0x0a0a0a, { roughness: 0.3 }), [])

  return (
    <>
      {sleeveMats.map((m, i) => {
        const c = i % cols
        const r = Math.floor(i / cols)
        const y = y0 + (rows - 1 - r) * 1.25
        return (
          <group key={i}>
            <mesh position={[x0, y, z0 + c * 1.2]} material={m} castShadow>
              <boxGeometry args={[0.06, 1.05, 1.05]} />
            </mesh>
            <mesh position={[x0 - 0.07, y - 0.55, z0 + c * 1.2]} material={mat.steel}>
              <boxGeometry args={[0.2, 0.04, 1.1]} />
            </mesh>
          </group>
        )
      })}

      {/* one record half out of its sleeve */}
      <mesh position={[x0 - 0.08, y0 + 1.45, z0 + 2.75]} rotation={[0, 0, Math.PI / 2]} material={disc}>
        <cylinderGeometry args={[0.5, 0.5, 0.015, 40]} />
      </mesh>
      <mesh position={[x0 - 0.09, y0 + 1.45, z0 + 2.75]} rotation={[0, -V, 0]} material={discLabel}>
        <circleGeometry args={[0.17, 24]} />
      </mesh>

      {/*
        Crate of records on the floor, under the wall it belongs to. It has
        followed the sleeves twice now: out of the south-west corner when the
        floor fan took it, and across the bay with them to the corridor panel.
      */}
      <mesh position={[crateX, 0.55, crateZ]} material={mat.oak}>
        <boxGeometry args={[1.3, 1.1, 1.3]} />
      </mesh>
      <Collider
        minX={crateX - 0.65}
        maxX={crateX + 0.65}
        minZ={crateZ - 0.65}
        maxZ={crateZ + 0.65}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[crateX, 1.15, crateZ - 0.55 + i * 0.12]}
          rotation={[-0.15, 0, 0]}
          material={crateColours[i % 5]}
        >
          <boxGeometry args={[1.05, 1.05, 0.05]} />
        </mesh>
      ))}

      {/* turntable on the filing cabinet */}
      <mesh position={[-1.3, 3.08, BZ - 0.85]} material={mat.dark}>
        <boxGeometry args={[1.2, 0.15, 1.0]} />
      </mesh>
      <mesh position={[-1.45, 3.17, BZ - 0.85]} material={platter}>
        <cylinderGeometry args={[0.42, 0.42, 0.03, 32]} />
      </mesh>
      <mesh position={[-0.85, 3.2, BZ - 0.75]} rotation={[0, 0.4, 0]} material={mat.steel}>
        <boxGeometry args={[0.04, 0.03, 0.7]} />
      </mesh>
    </>
  )
}

/**
 * Marcus's Corvette poster, on the south panel of his bay.
 *
 * The corridor panel is the record wall now and the west panel is over his
 * desk, so the poster goes on the run behind him — the one he turns to when
 * the deploy is running.
 */
export function CorvettePoster() {
  const m = useMemo(
    () => new THREE.MeshStandardMaterial({ map: corvetteTex(), roughness: 0.72 }),
    [],
  )
  const x = -5.2
  const y = 4.6
  // Panel half-thickness is 0.11; 6.87 stands the print clear of the fabric.
  const z = BZ - 0.13

  return (
    <>
      <Panel size={[2.9, 2.0]} material={m} position={[x, y, z]} rotation={[0, Math.PI, 0]} />
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as const
      ).map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[x + (sx * 2.66) / 2, y + (sy * 1.76) / 2, z - 0.03]}
          material={mat.steel}
        >
          <sphereGeometry args={[0.035, 8, 6]} />
        </mesh>
      ))}
    </>
  )
}

/**
 * The bin in the corner of the marketing bay, and the sign over it.
 *
 * Jordan's corner, by the corridor. The sign has been up long enough that
 * nobody looks at it any more, which is the fate of every sign in here.
 */
export function IdeasBin() {
  const sign = useMemo(
    () => new THREE.MeshStandardMaterial({ map: ideasBinSignTex(), roughness: 0.4 }),
    [],
  )
  const bin = useMemo(
    () => M(0x2b2d31, { roughness: 0.55, side: THREE.DoubleSide }),
    [],
  )
  const liner = useMemo(
    () => M(0x9aa3ad, { roughness: 0.7, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
    [],
  )
  const paper = useMemo(() => M(0xf2efe4, { roughness: 0.95 }), [])

  const x = CORRIDOR_R + 1.2
  const z = BZ - 1.2

  /** Three balled-up ideas, two of which missed. */
  const balls = useMemo(
    () =>
      [
        [x - 0.12, 1.34, z + 0.1, 0.17],
        [x + 1.05, 0.16, z + 0.5, 0.15],
        [x + 0.5, 0.14, z + 1.25, 0.13],
      ] as const,
    [x, z],
  )

  return (
    <>
      <mesh position={[x, 0.78, z]} material={bin} castShadow>
        <cylinderGeometry args={[0.62, 0.48, 1.56, 22, 1, true]} />
      </mesh>
      <mesh position={[x, 0.02, z]} material={bin}>
        <cylinderGeometry args={[0.48, 0.48, 0.04, 22]} />
      </mesh>
      {/* the liner, folded over the rim */}
      <mesh position={[x, 1.5, z]} material={liner}>
        <cylinderGeometry args={[0.66, 0.6, 0.2, 22, 1, true]} />
      </mesh>
      <mesh position={[x, 1.62, z]} material={bin}>
        <torusGeometry args={[0.62, 0.035, 8, 24]} />
      </mesh>

      {balls.map(([bx, by, bz, r], i) => (
        <mesh key={i} position={[bx, by, bz]} material={paper} castShadow>
          <dodecahedronGeometry args={[r, 0]} />
        </mesh>
      ))}

      {/* the sign, on the panel above the bin */}
      <Panel
        size={[2.2, 1.5]}
        material={sign}
        position={[x, 4.4, BZ - 0.13]}
        rotation={[0, Math.PI, 0.015]}
      />
    </>
  )
}
