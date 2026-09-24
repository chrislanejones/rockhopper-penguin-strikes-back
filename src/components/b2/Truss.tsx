import { useEffect, useMemo, useRef } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { B2, B2_CX } from '../../scene/b2'
import { candela } from '../../scene/constants'
import { onBroadcast } from './Broadcast'
import { SPEAKER_AT } from './Speaker'

const { stage, hall } = B2

/** The downstage run: five feet out from the proscenium, as the single line was. */
const TZ0 = stage.z1 + 5
/**
 * The spread to the second run, out over the tables.
 *
 * Three whole bays plus one section, so the spine between the two is three
 * clean bays and butts onto the chords of each rather than through them.
 */
const SPREAD = 3 * 4 + 1
const TZ1 = TZ0 + SPREAD
/** Centre line of the box section. */
const TY = hall.h - 4.6
/** A one-foot box section in four-foot bays. */
const SEC = 1.0
const BAY = 4
/** Eight feet of overhang past the proscenium each side — it was four. */
const BAYS = Math.round((stage.x1 - stage.x0 + 16) / BAY)
const LEN = BAYS * BAY
const X0 = B2_CX - LEN / 2
/** The spine, less a section at each end where it meets a run. */
const SPINE = SPREAD - SEC
const SPINE_BAYS = SPINE / BAY
/** A diagonal spans one bay corner to corner. */
const DIAG = Math.hypot(BAY, SEC)
const LEAN = Math.atan2(SEC, BAY)

/**
 * How far a can is tilted off straight down, toward the stage.
 *
 * The far run is thirteen feet further from the boards, so its cans lie
 * flatter to reach the same spot; the spine's point straight down at the
 * tables under it.
 */
const TILT_NEAR = 0.96
const TILT_FAR = 1.18

interface Run {
  /** Centre of the run. */
  x: number
  z: number
  len: number
  bays: number
  alongX: boolean
  /** Cans under it, and which way they lean. */
  cans: number
  tilt: number
}

/**
 * The H: two runs across the house, and the spine that joins them at the
 * middle. In plan it is the letter, stood over the first three rows of
 * tables.
 */
const RUNS: Run[] = [
  { x: B2_CX, z: TZ0, len: LEN, bays: BAYS, alongX: true, cans: 12, tilt: TILT_NEAR },
  { x: B2_CX, z: TZ1, len: LEN, bays: BAYS, alongX: true, cans: 12, tilt: TILT_FAR },
  { x: B2_CX, z: (TZ0 + TZ1) / 2, len: SPINE, bays: SPINE_BAYS, alongX: false, cans: 3, tilt: 0 },
]

/** A point in a run's own frame — along it, then across it — put into the hall. */
function at(r: Run, along: number, across: number): [number, number] {
  return r.alongX ? [r.x + along, r.z + across] : [r.x + across, r.z + along]
}

/** Where the runs hang from the slab: three drops each, at the quarter points. */
const HANGERS = [0.25, 0.5, 0.75].flatMap((t) =>
  [TZ0, TZ1].map((z) => [X0 + LEN * t, z] as [number, number]),
)

/**
 * A cabinet hang at each corner of the H: two boxes on a strap, the lower
 * one angled down into the room, grille toward the house.
 */
const HANGS = [X0 + 2.2, X0 + LEN - 2.2].flatMap((x) =>
  [TZ0, TZ1].map((z) => [x, z] as [number, number]),
)

type V3 = [number, number, number]
interface Member {
  p: V3
  rot?: V3
  s?: V3
}

/**
 * Every stick of the rig, laid out once.
 *
 * Aluminium truss is four chords with a ring of posts at every bay and one
 * diagonal per face per bay, leaning the other way each bay along. The
 * three runs share one list per kind of member, so the whole H is still one
 * instanced draw per kind — a dozen for the lot, as the single line was.
 */
function useMembers() {
  return useMemo(() => {
    const chords: Member[] = []
    const posts: Member[] = []
    const ties: Member[] = []
    const diags: Member[] = []
    const cans: Array<Member & { tilt: number }> = []

    for (const r of RUNS) {
      const ry = r.alongX ? 0 : Math.PI / 2

      for (const sy of [-1, 1]) {
        for (const sx of [-1, 1]) {
          const [x, z] = at(r, 0, (sx * SEC) / 2)
          chords.push({ p: [x, TY + (sy * SEC) / 2, z], rot: [0, ry, 0], s: [r.len, 0.1, 0.1] })
        }
      }

      for (let i = 0; i <= r.bays; i++) {
        const along = -r.len / 2 + i * BAY
        for (const s of [-1, 1]) {
          const [x, z] = at(r, along, (s * SEC) / 2)
          posts.push({ p: [x, TY, z] })
        }
        for (const sy of [-1, 1]) {
          const [x, z] = at(r, along, 0)
          ties.push({ p: [x, TY + (sy * SEC) / 2, z], rot: [0, ry, 0] })
        }
      }

      for (let i = 0; i < r.bays; i++) {
        const along = -r.len / 2 + (i + 0.5) * BAY
        const lean = (i % 2 ? 1 : -1) * LEAN
        // the two side faces: a diagonal tilted in the vertical plane
        for (const s of [-1, 1]) {
          const [x, z] = at(r, along, (s * SEC) / 2)
          diags.push({ p: [x, TY, z], rot: [0, ry, s * lean] })
        }
        // top and bottom: tilted in the horizontal plane
        for (const sy of [-1, 1]) {
          const [x, z] = at(r, along, 0)
          diags.push({ p: [x, TY + (sy * SEC) / 2, z], rot: [0, ry + sy * lean, 0] })
        }
      }

      for (let i = 0; i < r.cans; i++) {
        const along = -r.len / 2 + (r.len * (i + 0.5)) / r.cans
        const [x, z] = at(r, along, 0)
        cans.push({ p: [x, 0, z], tilt: r.tilt })
      }
    }
    return { chords, posts, ties, diags, cans }
  }, [])
}

/**
 * The followspot: the one real light on the rig.
 *
 * The wash inside the proscenium is three point lights twenty feet up, and
 * the podium is at the edge of their throw — he read as a man in a dim
 * room. This is a spot on the near run, a tight warm cone on his chest,
 * and it is on the broadcast layer so the cameras see him lit too.
 */
const SPOT_FROM: [number, number, number] = [X0 + LEN * 0.42, TY - SEC / 2 - 0.45, TZ0]
const SPOT_AT: [number, number, number] = [SPEAKER_AT[0], SPEAKER_AT[1] + 4.2, SPEAKER_AT[2]]

export function Truss() {
  const spot = useRef<THREE.SpotLight | null>(null)
  useEffect(() => {
    const l = spot.current
    if (!l) return
    // the target is not in the scene, so its matrix is set by hand, once
    l.target.position.set(...SPOT_AT)
    l.target.updateMatrixWorld()
  }, [])
  const alu = useMemo(() => M(0xb9bcc1, { roughness: 0.35, metalness: 0.8 }), [])
  const black = useMemo(() => M(0x141416, { roughness: 0.7, metalness: 0.3 }), [])
  const grille = useMemo(() => M(0x2b2b2e, { roughness: 0.85 }), [])
  /*
    The cans are emissive glass, not lights: the stage wash already lights
    the boards, and a spotlight is a shader permutation for every material
    in the hall. Twenty-seven of them is a lot of glass, so each burns a
    little less than the eight did.
  */
  const lens = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xfff2cc,
        emissive: 0xffd9a0,
        emissiveIntensity: 2.2,
        roughness: 0.4,
      }),
    [],
  )
  const geo = useMemo(
    () => ({
      unit: new THREE.BoxGeometry(1, 1, 1),
      post: new THREE.BoxGeometry(0.08, SEC, 0.08),
      tie: new THREE.BoxGeometry(0.08, 0.08, SEC),
      diag: new THREE.BoxGeometry(DIAG, 0.06, 0.06),
      hanger: new THREE.BoxGeometry(0.15, hall.h - (TY + SEC / 2), 0.15),
      yoke: new THREE.BoxGeometry(0.1, 0.5, 0.1),
      can: new THREE.CylinderGeometry(0.34, 0.3, 0.9, 14),
      glass: new THREE.CircleGeometry(0.3, 14),
      cab: new THREE.BoxGeometry(1.6, 2.6, 1.4),
      strap: new THREE.BoxGeometry(0.1, 0.5, 0.1),
    }),
    [],
  )
  const m = useMembers()

  /*
    A can hangs from a yoke under the bottom chord. Its glass is on the near
    end of the barrel, so it sits where the tilted barrel's -Y lands.
  */
  const canY = TY - SEC / 2 - 0.5
  const glassOff = (tilt: number): [number, number] => [-0.45 * Math.cos(tilt), -0.45 * Math.sin(tilt)]

  return (
    <>
      <Instances geometry={geo.unit} material={alu} limit={m.chords.length}>
        {m.chords.map((c, i) => (
          <Instance key={i} position={c.p} rotation={c.rot} scale={c.s} />
        ))}
      </Instances>
      <Instances geometry={geo.post} material={alu} limit={m.posts.length}>
        {m.posts.map((c, i) => (
          <Instance key={i} position={c.p} />
        ))}
      </Instances>
      <Instances geometry={geo.tie} material={alu} limit={m.ties.length}>
        {m.ties.map((c, i) => (
          <Instance key={i} position={c.p} rotation={c.rot} />
        ))}
      </Instances>
      <Instances geometry={geo.diag} material={alu} limit={m.diags.length}>
        {m.diags.map((c, i) => (
          <Instance key={i} position={c.p} rotation={c.rot} />
        ))}
      </Instances>

      {/* hung from the slab on six steel drops */}
      <Instances geometry={geo.hanger} material={black} limit={HANGERS.length}>
        {HANGERS.map(([x, z], i) => (
          <Instance key={i} position={[x, (TY + SEC / 2 + hall.h) / 2, z]} />
        ))}
      </Instances>

      {/* the cans: yoke, barrel, glass */}
      <Instances geometry={geo.yoke} material={black} limit={m.cans.length}>
        {m.cans.map((c, i) => (
          <Instance key={i} position={[c.p[0], TY - SEC / 2 - 0.25, c.p[2]]} />
        ))}
      </Instances>
      <Instances geometry={geo.can} material={black} limit={m.cans.length}>
        {m.cans.map((c, i) => (
          <Instance key={i} position={[c.p[0], canY, c.p[2]]} rotation={[c.tilt, 0, 0]} />
        ))}
      </Instances>
      <Instances geometry={geo.glass} material={lens} limit={m.cans.length}>
        {m.cans.map((c, i) => {
          const [dy, dz] = glassOff(c.tilt)
          return (
            <Instance
              key={i}
              position={[c.p[0], canY + dy, c.p[2] + dz]}
              rotation={[c.tilt - Math.PI / 2, 0, 0]}
            />
          )
        })}
      </Instances>

      <spotLight
        ref={(l) => {
          spot.current = l
          onBroadcast(l)
        }}
        position={SPOT_FROM}
        color={0xfff3dc}
        intensity={candela(2.6, 21)}
        distance={48}
        angle={0.3}
        penumbra={0.5}
        decay={2}
      />

      {/* the four corner hangs: a strap, two cabinets, two grilles */}
      <Instances geometry={geo.strap} material={black} limit={HANGS.length}>
        {HANGS.map(([x, z], i) => (
          <Instance key={i} position={[x, TY - SEC / 2 - 0.25, z]} />
        ))}
      </Instances>
      <Instances geometry={geo.cab} material={black} limit={HANGS.length * 2}>
        {HANGS.flatMap(([x, z], i) => [
          <Instance key={`${i}:a`} position={[x, TY - SEC / 2 - 1.8, z]} />,
          <Instance key={`${i}:b`} position={[x, TY - SEC / 2 - 4.3, z + 0.25]} rotation={[0.22, 0, 0]} />,
        ])}
      </Instances>
      <Instances geometry={geo.cab} material={grille} limit={HANGS.length * 2}>
        {HANGS.flatMap(([x, z], i) => [
          <Instance key={`${i}:a`} position={[x, TY - SEC / 2 - 1.8, z + 0.02]} scale={[0.86, 0.9, 1]} />,
          <Instance
            key={`${i}:b`}
            position={[x, TY - SEC / 2 - 4.3, z + 0.27]}
            rotation={[0.22, 0, 0]}
            scale={[0.86, 0.9, 1]}
          />,
        ])}
      </Instances>
    </>
  )
}
