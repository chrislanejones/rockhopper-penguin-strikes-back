import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { mat } from '../scene/materials'
import {
  BX2, BZ, BZ2, BZ3, CL, CL2, CR, CR2, DZ, DZ2, DZ3, EX3, GAP, GAP2, GAP3, HALF, LX,
  LX2, PH, V,
} from '../scene/constants'
import { corridorSignTex, nameplateTex } from '../textures/signage'
import { Collider, Panel } from './props/primitives'
import { Nameplate } from './props/Furniture'

/**
 * One run of cubicle panel: fabric face, hard cap, kick plate.
 *
 * The footprint is worked out from the run's own rotation so a panel blocks
 * the player whichever way it is turned.
 *
 * Cap and kick are held back 0.02 at each end. Cut to the same `len` as the
 * fabric, all three end caps landed on one plane and every exposed end of
 * every run came out striped — dark kick against light fabric, fighting for
 * the same depth. The setback is a quarter of an inch and reads as a stop.
 */
const TRIM_BACK = 0.04

export function CubiclePanel({
  x,
  z,
  ry,
  len,
  dark,
}: {
  x: number
  z: number
  ry: number
  len: number
  dark?: boolean
}) {
  const hw = len / 2
  const c = Math.cos(ry)
  const sn = Math.sin(ry)
  const ex = Math.abs(c * hw) + Math.abs(sn * 0.15)
  const ez = Math.abs(sn * hw) + Math.abs(c * 0.15)

  /*
    The fabric is one tiling square of cloth, so the box has to say how much
    wall it is covering: a plain box's UVs run 0..1 per face, which stretched
    a single repeat over a thirty-foot run and turned the nub into confetti.
    Scaled here, a repeat is a foot of panel whatever the run's length.
  */
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(len, PH, 0.22)
    const uv = g.attributes.uv as THREE.BufferAttribute
    // faces come in the order +x, -x, +y, -y, +z, -z, four vertices each
    const across = [0.22, 0.22, len, len, len, len]
    const down = [PH, PH, 0.22, 0.22, PH, PH]
    for (let f = 0; f < 6; f++) {
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v
        uv.setXY(i, uv.getX(i) * across[f], uv.getY(i) * down[f])
      }
    }
    uv.needsUpdate = true
    return g
  }, [len])

  return (
    <>
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <mesh
          geometry={geo}
          position={[0, PH / 2, 0]}
          material={dark ? mat.fabricDark : mat.fabric}
          castShadow
          receiveShadow
        />
        <mesh position={[0, PH + 0.06, 0]} material={mat.cap}>
          <boxGeometry args={[len - TRIM_BACK, 0.12, 0.3]} />
        </mesh>
        <mesh position={[0, 0.25, 0]} material={mat.dark}>
          <boxGeometry args={[len - TRIM_BACK, 0.5, 0.26]} />
        </mesh>
      </group>
      <Collider minX={x - ex} maxX={x + ex} minZ={z - ez} maxZ={z + ez} />
    </>
  )
}

/**
 * The printout pinned inside Ava's cubicle: what to do in case of fire, in
 * the order an engineer would do it. Somebody's laminated joke, and the
 * oldest thing on this panel.
 */
function FireDrill({ x, z, ry }: { x: number; z: number; ry: number }) {
  const tex = useTexture('/textures/fire-git.webp')
  const paper = useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
  }, [tex])
  // 512 x 358, hung a little out of true the way a pinned sheet is
  const w = 2.6
  return (
    <group position={[x, 4.4, z]} rotation={[0, ry, 0.02]}>
      <Panel size={[w, w * (358 / 512)]} material={paper} position={[0, 0, 0]} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.1), w * (358 / 512) / 2 - 0.06, 0.012]} material={mat.steel}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

interface Person {
  name: string
  role: string
  x: number
  z: number
  ry: number
}

/**
 * A 2x2 block of cubicles split by a central corridor that opens to the south.
 *
 * Both blocks on this floor are laid out the same way; only the coordinates
 * and the people in them differ.
 */
export function CubicleBlock({
  west,
  corridorL,
  corridorR,
  dividerZ,
  southZ,
  eastEdge,
  gap,
  people,
  sign,
}: {
  west: number
  corridorL: number
  corridorR: number
  dividerZ: number
  southZ: number
  eastEdge: number
  gap: [number, number]
  people: Person[]
  sign: string
}) {
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: corridorSignTex(sign) }),
    [sign],
  )
  const plates = useMemo(
    () => people.map((p) => nameplateTex(p.name, p.role)),
    [people],
  )

  return (
    <>
      {/* west edge of the block */}
      <CubiclePanel x={west} z={(southZ - HALF) / 2} ry={V} len={southZ + HALF} dark />

      {/* south edges, either side of the corridor mouth */}
      <CubiclePanel x={(west + corridorL) / 2} z={southZ} ry={0} len={corridorL - west} dark />
      <CubiclePanel
        x={(corridorR + eastEdge) / 2}
        z={southZ}
        ry={0}
        len={eastEdge - corridorR}
        dark
      />

      {/* corridor walls, each broken by the gap that lets you through */}
      {[corridorL, corridorR].map((x) => (
        <group key={x}>
          <CubiclePanel x={x} z={(gap[0] - HALF) / 2} ry={V} len={gap[0] + HALF} />
          <CubiclePanel x={x} z={(southZ + gap[1]) / 2} ry={V} len={southZ - gap[1]} />
        </group>
      ))}

      {/* the two dividers, each stopping short of the corridor */}
      <CubiclePanel
        x={(west + corridorL - 3.5) / 2}
        z={dividerZ}
        ry={0}
        len={corridorL - west - 3.5}
      />
      <CubiclePanel
        x={(corridorR + 3.5 + eastEdge) / 2}
        z={dividerZ}
        ry={0}
        len={eastEdge - corridorR - 3.5}
      />

      {people.map((p, i) => (
        <Nameplate key={p.name} tex={plates[i]} x={p.x} z={p.z} ry={p.ry} />
      ))}

      <Panel
        size={[3, 0.7]}
        material={signMat}
        position={[(corridorL + corridorR) / 2, 6.6, southZ - 0.05]}
      />
    </>
  )
}

/** Workstations 1-4: systems engineering on the west, marketing on the east. */
export function BlockOne() {
  const people: Person[] = useMemo(
    () => [
      { name: 'JAMES SAPP', role: 'Systems Engineering', x: CL + 0.12, z: GAP[0] - 1.3, ry: V },
      { name: 'MARCUS HALE', role: 'Systems Engineering', x: CL + 0.12, z: GAP[1] + 1.3, ry: V },
      { name: 'PRIYA DESAI', role: 'Marketing', x: CR - 0.12, z: GAP[0] - 1.3, ry: -V },
      { name: 'JORDAN REYES', role: 'Marketing', x: CR - 0.12, z: GAP[1] + 1.3, ry: -V },
    ],
    [],
  )
  return (
    <>
      <CubicleBlock
        west={LX}
        corridorL={CL}
        corridorR={CR}
        dividerZ={DZ}
        southZ={BZ}
        eastEdge={HALF}
        gap={GAP}
        people={people}
        sign="WORKSTATIONS 1–4  ▲"
      />
    </>
  )
}

/**
 * The runs of block three's east panel, once the two doorways are cut out.
 *
 * Stated here rather than in constants because it is the shape of one wall,
 * not a dimension anything else needs.
 */
const EAST3: Array<[number, number]> = [
  [-HALF, GAP3[0][0]],
  [GAP3[0][1], GAP3[1][0]],
  [GAP3[1][1], BZ3],
]

/**
 * Workstations 9 and 10 — the strip the floor gained when the east wall went
 * out past BX2.
 *
 * Not another 2x2: twelve feet will not carry a corridor down the middle of
 * it. Two bays on block two's divider line, backed onto a panel at BX2 —
 * which block two never needed, because the building wall was there — and
 * each opening east through its own doorway onto the walkway that runs the
 * length of the closet wall.
 *
 * The back bay is empty. Nothing has been moved into it.
 */
export function BlockThree() {
  return (
    <>
      {/* the panel block two never had */}
      <CubiclePanel x={BX2} z={(BZ3 - HALF) / 2} ry={V} len={BZ3 + HALF} dark />

      {/* south edge, closing the near bay off the run down to the lobby door */}
      <CubiclePanel x={(BX2 + EX3) / 2} z={BZ3} ry={0} len={EX3 - BX2} dark />

      {/* the divider between the two bays, on block two's line */}
      <CubiclePanel x={(BX2 + EX3) / 2} z={DZ3} ry={0} len={EX3 - BX2} />

      {/* east panel, broken by the doorway into each bay */}
      {EAST3.map(([z0, z1]) => (
        <CubiclePanel key={z0} x={EX3} z={(z0 + z1) / 2} ry={V} len={z1 - z0} />
      ))}
    </>
  )
}

/** Workstations 5-8 in the wing. One bay is records storage rather than a desk. */
export function BlockTwo() {
  const people: Person[] = useMemo(
    () => [
      { name: 'DENISE OKAFOR', role: 'Service Desk', x: CL2 + 0.12, z: GAP2[0] - 1.3, ry: V },
      { name: 'RAY BUTLER', role: 'Network Operations', x: CL2 + 0.12, z: GAP2[1] + 1.3, ry: V },
      {
        name: 'RECORDS STORAGE',
        role: 'Overflow — see Chris before removing',
        x: CR2 - 0.12,
        z: GAP2[0] - 1.3,
        ry: -V,
      },
      { name: 'CHRIS LANE JONES', role: 'Linux Hacker', x: CR2 - 0.12, z: GAP2[1] + 1.3, ry: -V },
    ],
    [],
  )
  return (
    <>
      <CubicleBlock
        west={LX2}
        corridorL={CL2}
        corridorR={CR2}
        dividerZ={DZ2}
        southZ={BZ2}
        eastEdge={BX2}
        gap={GAP2}
        people={people}
        sign="WORKSTATIONS 5–8  ▲"
      />
      {/* the blank end panel you face coming from the storage door */}
      <FireDrill x={(CR2 + BX2) / 2} z={BZ2 + 0.12} ry={0} />
    </>
  )
}
