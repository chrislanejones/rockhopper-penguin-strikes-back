import * as THREE from 'three'
import { frontZ, loftGeometry, ringAt, smoothRings, surfaceAt, type FullRing, type Ring } from './loft.ts'

/*
  One head, three people.

  The player, the man in the lift and the speaker each had a face assembled
  by hand from balls and boxes, three different ways, and each had the same
  troubles: eyes stood out of the skull like a frog's, the jaw was a second
  ball or a bucket, the hair was a bowl. This is the one head they all get
  now. A skull lofted from chin to crown — narrow at the chin, out to the
  jaw's corner, in again at the temple, the jawline rising to the ear — and a
  face laid on its surface: eyes sunk into it with a lid over each, a wedge
  of a nose, two lips with a line between, brows that break at the arch.

  Everything is stated in head units — fractions of the chin-to-crown height —
  the way a drawing book states it (eyes at a half, nose at a third, mouth a
  third of what is left) and scaled by `h` on the way out. The origin is the
  bottom of the chin, on the vertical line through the ears; the face is -z.

  The result is a list of parts, not a scene: Head.tsx maps it into <mesh>
  elements and scripts/build-avatar.mjs maps it into the .glb, so nothing in
  here may touch React or the DOM. See the note in loft.ts about Node.
*/

type V3 = [number, number, number]

export type FaceRole =
  | 'skin'
  | 'shade'
  | 'sclera'
  | 'iris'
  | 'pupil'
  | 'lip'
  | 'lipLine'
  | 'brow'
  | 'lash'

export interface FacePart {
  key: string
  role: FaceRole
  geometry: THREE.BufferGeometry
  position: V3
  rotation: V3
  scale: V3
}

export interface FaceSpec {
  /** Chin to crown, feet. */
  h: number
  /** 0 is a man's jaw and brow, 1 a woman's. */
  soft: number
  /** Facets round the skull, and rings splined between the authored ones. */
  segs: number
  smooth: number
  /** How much of the eye the upper lid covers, 0..1. */
  lid: number
  /** The dark line under the upper lid: how thick, radians of the lid's arc. 0.05 is a man's, 0.12 is mascara. */
  lash: number
  /** How far the outer corner of the eye sits above the inner, radians. */
  slant: number
  /** Eye, nose and lip sizes, as multiples of the ordinary. */
  eye: number
  nose: number
  lips: number
  /** 0 a straight mouth, 1 a smile. */
  smile: number
  /** Brows: height and thickness in head units, and how steeply they climb to the arch, radians. */
  brow: [y: number, thick: number, arch: number]
  /** Where the eyes look, as fractions of the way to the corner and to the lid. */
  gaze: [number, number]
}

export interface Face {
  spec: FaceSpec
  /** The skull's rings, in feet, already splined. */
  rings: FullRing[]
  parts: FacePart[]
  /** A point on the front of the face at (x, y), pushed out along the surface by `out`, and which way the surface faces there. */
  at: (x: number, y: number, out?: number) => { p: V3; yaw: number }
}

/*
  The skull. Columns: height, half-width for him and for her, front for him
  and for her, back, tilt, squareness. The back of the lowest rings is still
  under the jaw — the neck fills in behind them — and they tilt, so the
  jawline climbs toward the ear instead of running level like a collar.
*/
// prettier-ignore
const SKULL: number[][] = [
  // y      wM     wF     zfM     zfF     zb     tilt   n
  [0.0,    0.085, 0.06,  -0.395, -0.385, -0.24,  0.0,   2.0],
  [0.045,  0.155, 0.125, -0.43,  -0.42,  -0.14,  0.02,  2.0],
  [0.13,   0.225, 0.2,   -0.44,  -0.43,  -0.01,  0.04,  2.2],
  [0.22,   0.265, 0.252, -0.435, -0.43,   0.11,  0.05,  2.3],
  [0.3,    0.29,  0.288, -0.435, -0.43,   0.22,  0.04,  2.3],
  [0.4,    0.31,  0.314, -0.44,  -0.435,  0.33,  0.02,  2.4],
  [0.5,    0.325, 0.33,  -0.425, -0.42,   0.4,   0.0,   2.4],
  [0.6,    0.335, 0.337, -0.455, -0.44,   0.425, 0.0,   2.3],
  [0.72,   0.335, 0.337, -0.435, -0.435,  0.43,  0.0,   2.2],
  [0.83,   0.31,  0.31,  -0.37,  -0.375,  0.405, 0.0,   2.0],
  [0.92,   0.245, 0.245, -0.26,  -0.265,  0.325, 0.0,   2.0],
  [0.975,  0.145, 0.145, -0.13,  -0.13,   0.2,   0.0,   2.0],
  [1.0,    0.02,  0.02,   0.01,   0.01,   0.05,  0.0,   2.0],
]

const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function skullRings(h: number, soft: number): Ring[] {
  return SKULL.map(([y, wM, wF, zfM, zfF, zb, tilt, n]) => ({
    y: y * h,
    w: mix(wM, wF, soft) * h,
    zf: mix(zfM, zfF, soft) * h,
    zb: zb * h,
    tilt: tilt * h,
    n,
    nb: 2,
  }))
}

const BALL = new THREE.SphereGeometry(1, 14, 10)

export function makeFace(spec: FaceSpec): Face {
  const { h, soft } = spec
  const rings = smoothRings(skullRings(h, soft), spec.smooth)

  const at: Face['at'] = (x, y, out = 0) => surfaceAt(rings, x, y, out)

  const parts: FacePart[] = []
  const add = (
    key: string,
    role: FaceRole,
    geometry: THREE.BufferGeometry,
    position: V3,
    scale: V3 = [1, 1, 1],
    rotation: V3 = [0, 0, 0],
  ) => parts.push({ key, role, geometry, position, rotation, scale })

  add('skull', 'skin', loftGeometry(skullRings(h, soft), { segs: spec.segs, smooth: spec.smooth }), [0, 0, 0])

  // ---- eyes: a white sunk most of the way into the face, an iris and pupil
  // on the front of it, a lid over the top and a rim under. The lid is the
  // difference between a person and a startled doll.
  const rx = 0.062 * h * spec.eye
  const ry = 0.037 * h * spec.eye
  const rz = 0.03 * h
  const ri = 0.033 * h * spec.eye
  const rp = 0.014 * h * spec.eye
  // A lid cut straight across is a bored eye: a flat top on a round bottom.
  // Real lids arch. So each lid is a cap of the eyeball whose pole is tipped
  // back, and from the front its edge is an arc — high over the iris, down to
  // the corners — and the two lids meet there in an almond. Tipped while it
  // is still a unit sphere, so it lies on the eyeball after the scale.
  const TIP = 0.6
  const lidTo = TIP + Math.acos(THREE.MathUtils.clamp((1 - 2 * spec.lid) / 1.32, -1, 1))
  const upperLid = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, lidTo).rotateX(TIP)
  const lashLine = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, lidTo + spec.lash).rotateX(TIP)
  const lowerLid = new THREE.SphereGeometry(1, 14, 5, 0, Math.PI * 2, Math.PI - 1.48, 1.48).rotateX(-0.5)
  for (const s of [-1, 1]) {
    const tag = s > 0 ? 'R' : 'L'
    const E = at(s * 0.135 * h, 0.5 * h, -rz * 0.6)
    const rot: V3 = [0, E.yaw, s * spec.slant]
    const [gx, gy] = spec.gaze
    // The white is turned to lie in the curve of the face, so more of it shows
    // on the outer side; an iris dead center on it would look at the nose.
    const look: V3 = [E.p[0] + (gx * 0.4 + s * 0.1) * rx, E.p[1] + gy * ry * 0.4, E.p[2]]
    add(`white${tag}`, 'sclera', BALL, E.p, [rx, ry, rz], rot)
    add(`iris${tag}`, 'iris', BALL, [look[0], look[1], look[2] - rz * 0.9], [ri, ri, ri * 0.4])
    add(`pupil${tag}`, 'pupil', BALL, [look[0], look[1], look[2] - rz * 0.9 - ri * 0.3], [rp, rp, rp * 0.4])
    // the light in the eye, up and to one side: without it the eye is a button
    add(
      `glint${tag}`,
      'sclera',
      BALL,
      [look[0] + ri * 0.38, look[1] + ri * 0.38, look[2] - rz * 0.9 - ri * 0.42],
      [rp * 0.42, rp * 0.42, rp * 0.2],
    )
    add(`lash${tag}`, 'lash', lashLine, E.p, [rx * 1.14, ry * 1.3, rz * 1.23], rot)
    add(`lid${tag}`, 'skin', upperLid, E.p, [rx * 1.16, ry * 1.32, rz * 1.25], rot)
    add(`rim${tag}`, 'skin', lowerLid, E.p, [rx * 1.12, ry * 1.3, rz * 1.08], rot)

    // ---- brow: up from the bridge to the arch, then the tail coming down
    const [by, thick, arch] = spec.brow
    const inner = at(s * 0.09 * h, by * h, 0.004 * h)
    add(`browIn${tag}`, 'brow', BALL, inner.p, [0.06 * h, thick * 0.62 * h, 0.014 * h], [0, inner.yaw, s * arch])
    const drop = 0.34
    const ax = 0.14 * h
    const ay = by * h + Math.sin(arch) * 0.05 * h
    const tail = at(s * (ax + Math.cos(drop) * 0.036 * h), ay - Math.sin(drop) * 0.036 * h, 0.003 * h)
    add(`browOut${tag}`, 'brow', BALL, tail.p, [0.05 * h, thick * 0.42 * h, 0.012 * h], [0, tail.yaw, -s * drop])

    // ---- ear: between the brow line and the nose, flared out at the back
    const we = ringAt(rings, 0.47 * h).w
    const earRot: V3 = [0, s * 0.32, -s * 0.08]
    add(`ear${tag}`, 'skin', BALL, [s * (we + 0.012 * h), 0.47 * h, 0.045 * h], [0.032 * h, 0.125 * h, 0.072 * h], earRot)
    add(`earIn${tag}`, 'shade', BALL, [s * (we + 0.037 * h), 0.475 * h, 0.035 * h], [0.012 * h, 0.075 * h, 0.038 * h], earRot)
  }

  // ---- nose: a wedge standing on the face from the brow to the tip, widest
  // at the wings, its back half buried. One loft, so the bridge runs into
  // the tip instead of a ball hung on the end of a stick.
  const N = spec.nose
  const face0 = (y: number) => frontZ(ringAt(rings, y * h), 0)
  const nose: Ring[] = [
    [0.335, 0.04, 0.03],
    [0.358, 0.07, 0.085],
    [0.392, 0.064, 0.108],
    [0.45, 0.038, 0.078],
    [0.53, 0.024, 0.042],
    [0.6, 0.027, 0.008],
  ].map(([y, w, out]) => ({
    y: y * h,
    w: w * h * N,
    zf: face0(y) - out * h * N,
    zb: face0(y) + 0.04 * h,
    c: face0(y),
    n: 1.5,
  }))
  add('nose', 'skin', loftGeometry(nose, { segs: 8, smooth: 1 }), [0, 0, 0])
  for (const s of [-1, 1]) {
    const wing = at(s * 0.052 * h * N, 0.357 * h, -0.01 * h)
    add(`wing${s}`, 'skin', BALL, wing.p, [0.028 * h * N, 0.022 * h * N, 0.03 * h * N])
  }

  // ---- mouth: the line first, then a lip above and a fuller one below it.
  // The line is an arc of a big circle; a smile is a smaller circle.
  const my = 0.236 * h
  const half = 0.094 * h
  const sag = (0.004 + 0.03 * spec.smile) * h
  const R = (half * half + sag * sag) / (2 * sag)
  const arc = 2 * Math.asin(half / R)
  const mz = face0(0.236)
  add(
    'mouth',
    'lipLine',
    new THREE.TorusGeometry(R, 0.0055 * h, 5, 12, arc),
    [0, my - sag + R, mz - 0.006 * h],
    [1, 1, 1],
    [0, 0, -Math.PI / 2 - arc / 2],
  )
  const ryU = 0.017 * h * spec.lips
  const ryL = 0.024 * h * spec.lips
  add('lipTop', 'lip', BALL, [0, my - sag * 0.6 + 0.004 * h + ryU, mz - 0.004 * h], [0.086 * h, ryU, 0.015 * h])
  add('lipLow', 'lip', BALL, [0, my - sag - 0.003 * h - ryL, mz - 0.004 * h], [0.07 * h, ryL, 0.019 * h])

  return { spec, rings, parts, at }
}

export interface HairSpec {
  /**
   * The hairline: [height in head units, degrees of face left bare either
   * side of the nose] pairs, low to high. Wide open at the nape, where only
   * the back of the neck has hair; closing past the ear, the sideburn and
   * the temple; shut over the crown.
   */
  line: Array<[number, number]>
  /** The lowest the hair hugs the skull, in head units; below that it is `fall` or nothing. */
  from: number
  /** How much bigger than the skull: across, up, front-to-back. */
  grow: V3
  /** Rings below the skull, in head units: hair that hangs. */
  fall?: Ring[]
  segs?: number
}

/** Hair as a shell over the skull: the same rings, a size up, with the hairline cut out of the front. */
export function hairGeometry(face: Face, hair: HairSpec): THREE.BufferGeometry {
  const { h } = face.spec
  const [sx, sy, sz] = hair.grow
  const cy = 0.5 * h
  const cz = 0.02 * h
  const from = hair.from * h
  const up = (y: number) => (y > cy ? cy + (y - cy) * sy : y)
  const down = (y: number) => (y > cy ? cy + (y - cy) / sy : y)

  const onSkull: Ring[] = face.rings
    .filter((r) => r.y >= from - 1e-6)
    .map((r) => ({
      ...r,
      y: up(r.y),
      w: r.w * sx,
      zf: cz + (r.zf - cz) * sz,
      zb: cz + (r.zb - cz) * sz,
      c: cz + (r.c - cz) * sz,
      tilt: 0,
    }))
  // What hangs is splined, so a few rings give a fall and not a stack of
  // collars — and splined through the lowest ring on the skull, so the fall
  // leaves the head without a shelf.
  const hangs: Ring[] = (hair.fall ?? []).map((r) => ({
    ...r,
    y: r.y * h,
    w: r.w * h,
    zf: r.zf * h,
    zb: r.zb * h,
    c: r.c === undefined ? undefined : r.c * h,
  }))
  const fall: Ring[] = hangs.length ? smoothRings([...hangs, onSkull[0]], 2).slice(0, -1) : []

  const bare = (y: number) => {
    const u = down(y) / h
    const L = hair.line
    if (u <= L[0][0]) return L[0][1]
    for (let i = 0; i < L.length - 1; i++) {
      if (u > L[i + 1][0]) continue
      const t = (u - L[i][0]) / (L[i + 1][0] - L[i][0] || 1)
      return mix(L[i][1], L[i + 1][1], t)
    }
    return L[L.length - 1][1]
  }

  return loftGeometry([...fall, ...onSkull], {
    segs: hair.segs ?? 20,
    open: (r) => THREE.MathUtils.degToRad(bare(r.y)),
    tuck: 0.07,
  })
}
