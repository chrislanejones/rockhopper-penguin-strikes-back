import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../scene/materials'
import {
  COLS,
  CRACK,
  H,
  candela,
  LIGHT,
  RCX,
  ROOM,
  ROWS,
  RW,
  RX0,
  TD,
  TW,
  VENT,
  WAP,
  tileX,
  tileZ,
  BLANK,
  GONE,
  SPEAKER,
  SPRINKLER,
  TV_STAFF,
  TV_WEATHER,
  tileCol,
  tileRow,
} from '../scene/constants'
import {
  apTag, crackTile, diffTex, dustTex, plainTile, speakerGrilleTex,
} from '../textures/ceiling'

/**
 * A real 2x4 lay-in ceiling.
 *
 * Every cell is blank, a light, a supply diffuser, a wireless access point, a
 * ceiling speaker, a sprinkler drop, or a tile that has failed. The pattern is
 * fixed rather than random so the lights stay on a believable lay-in grid.
 *
 * Anything hung through the ceiling claims its cell last, and claims it blank.
 */
function buildCells() {
  const cells: number[][] = []
  for (let r = 0; r < ROWS; r++) {
    cells.push([])
    for (let c = 0; c < COLS; c++) cells[r].push(0)
  }
  const set = (c: number, r: number, t: number) => {
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) cells[r][c] = t
  }
  // lights on a regular run: every third column, every sixth row
  for (let c = 1; c < COLS; c += 3) for (let r = 2; r < ROWS; r += 6) set(c, r, LIGHT)
  // diffusers keep to their own runs, never beside a light
  const vents: Array<[number, number]> = [
    [0, 5], [3, 11], [6, 5], [8, 14], [2, 16], [7, 1],
    [4, 8], [10, 4], [13, 10], [11, 16], [15, 6], [9, 12],
  ]
  vents.forEach(([c, r]) => set(c, r, VENT))
  const waps: Array<[number, number]> = [[1, 7], [5, 3], [7, 13], [11, 7], [14, 15]]
  waps.forEach(([c, r]) => set(c, r, WAP))
  const bad: Array<[number, number]> = [[2, 3], [6, 10], [8, 6], [3, 17], [12, 2], [15, 13]]
  bad.forEach(([c, r]) => set(c, r, CRACK))
  // paging speakers, sparse — one per room's worth of ceiling
  const speakers: Array<[number, number]> = [[3, 4], [9, 10], [15, 4], [6, 16]]
  speakers.forEach(([c, r]) => set(c, r, SPEAKER))
  // sprinklers on a wider grid, as a wet system actually runs
  const sprinklers: Array<[number, number]> = [
    [2, 6], [5, 12], [8, 2], [11, 8], [14, 4], [17, 10], [3, 16], [12, 14],
  ]
  sprinklers.forEach(([c, r]) => set(c, r, SPRINKLER))

  /*
    Records storage: four tiles out and never put back, so you can see the
    duct, the hangers and the conduit that are over the whole floor.
  */
  const gone: Array<[number, number]> = [[17, 1], [18, 3], [17, 4], [18, 5]]
  gone.forEach(([c, r]) => set(c, r, GONE))

  // last word: the cells the TVs hang through are blank, whatever was there
  ;[TV_STAFF, TV_WEATHER].forEach((t) => set(tileCol(t.x), tileRow(t.z), BLANK))
  return cells
}

/** One lay-in tile: where it sits, and the slight twist a cracked one has. */
interface Tile {
  x: number
  y: number
  z: number
  rz: number
}

/**
 * Every fitting has a lit lens, but only every other one carries a light.
 *
 * A point light is a term in every fragment of every material in the
 * building, so eighteen of them cost more than the floor gains. Nine on a
 * checkerboard, each a little stronger, light it about the same.
 */
const lit = (c: number, r: number) => (Math.round((c - 1) / 3) + Math.round((r - 2) / 6)) % 2 === 0

export function DropCeiling() {
  const cells = useMemo(buildCells, [])

  const tileMats = useMemo(
    () => Array.from({ length: 7 }, () => M(0xffffff, { map: plainTile(Math.random()), roughness: 0.95 })),
    [],
  )
  const crackMats = useMemo(
    () => Array.from({ length: 3 }, () => M(0xffffff, { map: crackTile(), roughness: 0.95 })),
    [],
  )
  const dustMat = useMemo(() => M(0xffffff, { map: dustTex(), roughness: 0.95 }), [])
  const diffMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: diffTex(), roughness: 0.6, metalness: 0.2 }),
    [],
  )
  const lensMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xf2f5ff,
        emissiveIntensity: 1.15,
        roughness: 0.35,
      }),
    [],
  )
  const gridMat = useMemo(() => M(0xb9b6ae, { roughness: 0.7, metalness: 0.15 }), [])
  const housingMat = useMemo(() => M(0xd6d3cb), [])
  const neckMat = useMemo(() => M(0x8d8f93), [])
  const grilleMat = useMemo(() => M(0xf0efe9, { roughness: 0.6 }), [])
  const grillePerf = useMemo(
    () => new THREE.MeshStandardMaterial({ map: speakerGrilleTex(), roughness: 0.7 }),
    [],
  )
  const chromeMat = useMemo(() => M(0xc4c8ce, { roughness: 0.25, metalness: 0.85 }), [])
  const wireMat = useMemo(() => M(0x9aa0a8, { roughness: 0.4, metalness: 0.6 }), [])
  const ductBodyMat = useMemo(() => M(0x9a9da3, { roughness: 0.5, metalness: 0.4 }), [])
  const conduitMat = useMemo(() => M(0x7c8087, { roughness: 0.45, metalness: 0.5 }), [])
  const cableMat = useMemo(() => M(0x2f3237, { roughness: 0.8 }), [])
  const bulbMat = useMemo(() => M(0xc8302a, { roughness: 0.2 }), [])
  const apMat = useMemo(() => M(0xf4f4f0, { roughness: 0.5 }), [])
  const ledMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0x3fd0ff,
        emissiveIntensity: 2.5,
        side: THREE.DoubleSide,
      }),
    [],
  )

  /*
    A tile stops 0.01 short of the runners either side of it.

    At TW - 0.06 it overhung the runner's inner face by 0.02 and the plane ran
    on into the box, which is what the seams were fighting over. Held back
    instead of lifted: lifting it clear put the whole ceiling a finger's width
    above the head of every wall, and the perimeter opened into the plenum.
  */
  const tileGeo = useMemo(() => new THREE.PlaneGeometry(TW - 0.12, TD - 0.12), [])

  const { cellNodes, tiles } = useMemo(() => {
    const out: React.ReactNode[] = []
    /*
      Plain tiles are instanced, one draw per texture, rather than being
      three hundred meshes. Only the fixtures stay as meshes of their own.
    */
    const tiles = new Map<THREE.Material, Tile[]>()
    const tile = (m: THREE.Material, x: number, z: number, y = H, rz = 0) => {
      let list = tiles.get(m)
      if (!list) tiles.set(m, (list = []))
      list.push({ x, y, z, rz })
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = tileX(c)
        const z = tileZ(r)
        const t = cells[r][c]
        const key = `${r}:${c}`

        if (t === LIGHT) {
          out.push(
            <group key={key}>
              <mesh position={[x, H - 0.05, z]} material={lensMat}>
                <boxGeometry args={[TW - 0.14, 0.1, TD - 0.14]} />
              </mesh>
              <mesh position={[x, H + 0.16, z]} material={housingMat}>
                <boxGeometry args={[TW - 0.06, 0.35, TD - 0.06]} />
              </mesh>
              {/* The drop ceiling blocks the sun almost entirely, so these
                  fluorescents are what actually lights the floor. */}
              {lit(c, r) && (
                <pointLight
                  position={[x, H - 0.5, z]}
                  color={0xf6f7ff}
                  intensity={candela(0.9)}
                  distance={40}
                  decay={2}
                />
              )}
            </group>,
          )
        } else if (t === VENT) {
          tile(dustMat, x, z)
          out.push(
            <group key={key}>
              <mesh position={[x, H - 0.04, z]} material={diffMat}>
                <boxGeometry args={[TD - 0.2, 0.07, TD - 0.2]} />
              </mesh>
              <mesh position={[x, H + 0.3, z]} material={neckMat}>
                <boxGeometry args={[TD - 0.4, 0.5, TD - 0.4]} />
              </mesh>
            </group>,
          )
        } else if (t === WAP) {
          tile(tileMats[(r + c) % 7], x, z)
          out.push(
            <group key={key}>
              <group position={[x + 0.7, H, z]}>
                <mesh position={[0, -0.07, 0]} material={apMat}>
                  <cylinderGeometry args={[0.5, 0.56, 0.14, 32]} />
                </mesh>
                <mesh position={[0, -0.14, 0]} scale={[1, 0.35, 1]} material={apMat}>
                  <sphereGeometry args={[0.46, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                </mesh>
                <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={ledMat}>
                  <ringGeometry args={[0.12, 0.17, 24]} />
                </mesh>
                <mesh position={[0, -0.155, 0.72]} rotation={[Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.46, 0.13]} />
                  <meshStandardMaterial map={apTag(1 + ((r + c) % 9))} />
                </mesh>
              </group>
            </group>,
          )
        } else if (t === SPEAKER) {
          tile(tileMats[(r + c) % 7], x, z)
          out.push(
            <group key={key}>
              {/* flush 8-inch grille: rim, perforated face, and the can above */}
              <mesh position={[x, H - 0.02, z]} material={grilleMat}>
                <cylinderGeometry args={[0.42, 0.42, 0.04, 24]} />
              </mesh>
              <mesh position={[x, H - 0.05, z]} material={grillePerf}>
                <cylinderGeometry args={[0.34, 0.34, 0.03, 24]} />
              </mesh>
              <mesh position={[x, H - 0.06, z]} material={grilleMat}>
                <cylinderGeometry args={[0.05, 0.05, 0.02, 10]} />
              </mesh>
              <mesh position={[x, H + 0.22, z]} material={neckMat}>
                <cylinderGeometry args={[0.42, 0.42, 0.44, 16]} />
              </mesh>
            </group>,
          )
        } else if (t === SPRINKLER) {
          tile(tileMats[(r + c) % 7], x, z)
          out.push(
            <group key={key}>
              {/* escutcheon, body, bulb and deflector, then the drop above */}
              <mesh position={[x, H - 0.015, z]} material={chromeMat}>
                <cylinderGeometry args={[0.13, 0.15, 0.03, 16]} />
              </mesh>
              <mesh position={[x, H - 0.07, z]} material={chromeMat}>
                <cylinderGeometry args={[0.055, 0.055, 0.12, 12]} />
              </mesh>
              <mesh position={[x, H - 0.145, z]} material={bulbMat}>
                <cylinderGeometry args={[0.016, 0.016, 0.09, 8]} />
              </mesh>
              <mesh position={[x, H - 0.2, z]} material={chromeMat}>
                <cylinderGeometry args={[0.1, 0.1, 0.015, 12]} />
              </mesh>
              <mesh position={[x, H + 0.42, z]} material={chromeMat}>
                <cylinderGeometry args={[0.05, 0.05, 0.9, 10]} />
              </mesh>
            </group>,
          )
        } else if (t === GONE) {
          out.push(
            <group key={key}>
              {/* hanger wires from the grid up to the slab */}
              {(
                [
                  [-1, -1],
                  [1, -1],
                  [-1, 1],
                  [1, 1],
                ] as const
              ).map(([sx, sz], i) => (
                <mesh
                  key={i}
                  position={[x + (sx * (TW - 0.5)) / 2, H + 1.1, z + (sz * (TD - 0.4)) / 2]}
                  material={wireMat}
                >
                  <cylinderGeometry args={[0.015, 0.015, 2.2, 4]} />
                </mesh>
              ))}
              {/* rectangular duct running the length of the bay */}
              <mesh position={[x, H + 1.35, z]} material={ductBodyMat}>
                <boxGeometry args={[TW + 0.2, 0.85, 1.15]} />
              </mesh>
              <mesh position={[x - TW / 2, H + 1.35, z]} material={ductBodyMat}>
                <boxGeometry args={[0.1, 0.95, 1.25]} />
              </mesh>
              {/* conduit and a bundle of cable, clipped to the slab */}
              {[-0.55, 0.55].map((oz) => (
                <mesh
                  key={oz}
                  position={[x, H + 1.95, z + oz]}
                  rotation={[0, 0, Math.PI / 2]}
                  material={conduitMat}
                >
                  <cylinderGeometry args={[0.06, 0.06, TW + 0.4, 8]} />
                </mesh>
              ))}
              <mesh
                position={[x, H + 1.78, z + 0.75]}
                rotation={[0, 0, Math.PI / 2]}
                material={cableMat}
              >
                <cylinderGeometry args={[0.11, 0.11, TW + 0.4, 8]} />
              </mesh>
            </group>,
          )
        } else if (t === CRACK) {
          // dropped clear of the runners' underside (H - 0.02) rather than
          // sitting exactly on it, which was a plane-on-plane fight
          tile(crackMats[(r + c) % 3], x, z, H - 0.06, (Math.random() - 0.5) * 0.02)
        } else {
          tile(tileMats[(r * 3 + c) % 7], x, z)
        }
      }
    }
    return { cellNodes: out, tiles }
  }, [cells, tileGeo, tileMats, crackMats, dustMat, diffMat, lensMat, housingMat, neckMat, apMat, ledMat])

  return (
    <>
      {cellNodes}
      {[...tiles].map(([m, list], i) => (
        <Instances key={i} geometry={tileGeo} material={m} limit={list.length}>
          {list.map((t, k) => (
            <Instance key={k} position={[t.x, t.y, t.z]} rotation={[Math.PI / 2, 0, t.rz]} />
          ))}
        </Instances>
      ))}
      {/* T-bar: main runners along Z, cross tees along X */}
      {Array.from({ length: COLS + 1 }, (_, c) => (
        <mesh key={`m${c}`} position={[RX0 + c * TW, H + 0.01, 0]} material={gridMat}>
          <boxGeometry args={[0.1, 0.06, ROOM]} />
        </mesh>
      ))}
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <mesh key={`x${r}`} position={[RCX, H + 0.01, -ROOM / 2 + r * TD]} material={gridMat}>
          <boxGeometry args={[RW, 0.06, 0.1]} />
        </mesh>
      ))}
    </>
  )
}
