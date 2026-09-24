import * as THREE from 'three'

/*
  Lofting: a skin stretched over a stack of cross-sections.

  The building is boxes and cylinders because a building is. People are not:
  a torso built as a cylinder is a pipe with a head on it, and a jaw built as
  a cone under a ball is a bucket. A loft is the smallest tool that fixes
  that — say how wide and how deep the figure is at each height, front and
  back separately, and get one continuous surface through all of it. A chest,
  a jaw, a trouser leg and a head of hair are all the same call.

  No React and no DOM in here: scripts/build-avatar.mjs imports this file
  straight into Node, which strips the types and runs what is left. So keep
  it to erasable TypeScript — no enums, no parameter properties — and give
  relative imports their .ts extension.
*/

/** One cross-section, looking down on it. The figure faces -z. */
export interface Ring {
  /** Height. */
  y: number
  /** Half-width, along x. */
  w: number
  /** z of the front-most point: the negative one. */
  zf: number
  /** z of the back-most point. */
  zb: number
  /** z of the widest line across. The midpoint if left out. */
  c?: number
  /** Center offset on x. */
  x?: number
  /** Superellipse exponent of the front half: 2 is an ellipse, more is boxier, 1 is a diamond. */
  n?: number
  /** The same for the back half. As the front if left out. */
  nb?: number
  /** Tips the ring: the front comes down by this much and the back goes up. */
  tilt?: number
  /** A scoop out of the front only, the way a neckline dips. */
  dip?: number
}

export type FullRing = Required<Ring>

export interface LoftOptions {
  /** Facets round. */
  segs?: number
  /** Rings splined in between each authored pair, so a few rings give a curve and not a stack of cones. */
  smooth?: number
  cap?: 'both' | 'top' | 'bottom' | 'none'
  /**
   * Half-angle, radians, of a gap left open at the front — a jacket worn
   * open, hair round a face. A function gets the ring, so the gap can change
   * with height: that is a hairline. An open loft has no caps.
   */
  open?: number | ((ring: FullRing) => number)
  /**
   * Only the strip of the surface between two angles, [from, to] — 0 is the
   * front, a quarter turn is +x. A shirt front between lapels is a span that
   * narrows to the button; a lapel is the span beside it. No caps.
   */
  span?: (ring: FullRing) => [number, number]
  /** How far the two open edges are pulled toward the ring's middle, 0..1, so a shell's edge sinks into what it sits on. */
  tuck?: number
}

const fill = (r: Ring): FullRing => {
  const n = r.n ?? 2
  return {
    y: r.y,
    w: r.w,
    zf: r.zf,
    zb: r.zb,
    c: r.c ?? (r.zf + r.zb) / 2,
    x: r.x ?? 0,
    n,
    nb: r.nb ?? n,
    tilt: r.tilt ?? 0,
    dip: r.dip ?? 0,
  }
}

const KEYS = ['y', 'w', 'zf', 'zb', 'c', 'x', 'n', 'nb', 'tilt', 'dip'] as const

/** Catmull-Rom through four values. */
const spline = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 *
  (2 * p1 +
    (p2 - p0) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (3 * p1 - p0 - 3 * p2 + p3) * t * t * t)

/** The authored rings with `k` more splined in between each pair. */
export function smoothRings(rings: Ring[], k = 0): FullRing[] {
  const full = rings.map(fill)
  if (k <= 0 || full.length < 3) return full
  const out: FullRing[] = []
  for (let i = 0; i < full.length - 1; i++) {
    const p0 = full[Math.max(i - 1, 0)]
    const p1 = full[i]
    const p2 = full[i + 1]
    const p3 = full[Math.min(i + 2, full.length - 1)]
    for (let s = 0; s <= k; s++) {
      const t = s / (k + 1)
      const r = {} as FullRing
      for (const key of KEYS) r[key] = spline(p0[key], p1[key], p2[key], p3[key], t)
      // a spline overshoots; a width cannot be less than nothing, nor a front behind its back
      r.w = Math.max(r.w, 0)
      r.zf = Math.min(r.zf, r.c)
      r.zb = Math.max(r.zb, r.c)
      r.n = Math.max(r.n, 1)
      r.nb = Math.max(r.nb, 1)
      out.push(r)
    }
  }
  out.push(full[full.length - 1])
  return out
}

/** The ring at a height, straight-line between its neighbours. Clamped at the ends. */
export function ringAt(rings: FullRing[], y: number): FullRing {
  if (y <= rings[0].y) return rings[0]
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]
    const b = rings[i + 1]
    if (y > b.y) continue
    const t = (y - a.y) / (b.y - a.y || 1)
    const r = {} as FullRing
    for (const key of KEYS) r[key] = a[key] + (b[key] - a[key]) * t
    return r
  }
  return rings[rings.length - 1]
}

/** The rings between two heights, splined first, with a ring exactly at each end: the stretch of a body that a strip of cloth lies on. */
export function cutRings(rings: Ring[], y0: number, y1: number, smooth = 0): FullRing[] {
  const rs = smoothRings(rings, smooth)
  return [ringAt(rs, y0), ...rs.filter((r) => r.y > y0 + 1e-4 && r.y < y1 - 1e-4), ringAt(rs, y1)]
}

/** z of the front surface of a ring at x: where something on the face or the chest has to sit. */
export function frontZ(r: FullRing, x: number): number {
  const u = Math.min(Math.abs(x - r.x) / (r.w || 1), 1)
  return r.c + (r.zf - r.c) * Math.pow(1 - Math.pow(u, r.n), 1 / r.n)
}

/** The angle round a ring at which its front surface is `x` across: what a span wants, stated in feet. */
export function frontAngle(r: FullRing, x: number): number {
  const u = THREE.MathUtils.clamp((x - r.x) / (r.w || 1), -1, 1)
  return Math.sign(u) * Math.asin(Math.pow(Math.abs(u), r.n / 2))
}

/**
 * A point on the front of a loft at (x, y), pushed out along the surface by
 * `out`, and which way the surface faces there: where a pocket, a button or
 * an eye has to sit, and how far it has to turn to lie flat.
 */
export function surfaceAt(rings: FullRing[], x: number, y: number, out = 0) {
  const r = ringAt(rings, y)
  const e = 0.002
  const slope = (frontZ(r, x + e) - frontZ(r, x - e)) / (2 * e)
  const k = Math.hypot(slope, 1)
  const p: [number, number, number] = [x + (slope / k) * out, y, frontZ(r, x) - out / k]
  return { p, yaw: -Math.atan(slope) }
}

/** Every ring let out by `d` all round: the same shape a size up, for cloth over cloth. */
export function letOut(rings: Ring[], d: number): Ring[] {
  return rings.map((r) => ({ ...r, w: r.w + d, zf: r.zf - d, zb: r.zb + d, c: r.c ?? (r.zf + r.zb) / 2 }))
}

/** The same for the back. */
export function backZ(r: FullRing, x: number): number {
  const u = Math.min(Math.abs(x - r.x) / (r.w || 1), 1)
  return r.c + (r.zb - r.c) * Math.pow(1 - Math.pow(u, r.nb), 1 / r.nb)
}

/** A point on a ring. Angle 0 is the front, a quarter turn is +x, a half is the back. */
function ringPoint(r: FullRing, a: number): [number, number, number] {
  const s = Math.sin(a)
  const co = Math.cos(a)
  const front = co >= 0
  const n = front ? r.n : r.nb
  const x = r.x + r.w * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)
  const z = r.c + ((front ? r.zf : r.zb) - r.c) * Math.pow(Math.abs(co), 2 / n)
  const y = r.y - r.tilt * co - (front ? r.dip * co * co * co : 0)
  return [x, y, z]
}

/** A surface through the rings, bottom to top. Indexed, smooth normals; a material's flatShading still facets it. */
export function loftGeometry(rings: Ring[], o: LoftOptions = {}): THREE.BufferGeometry {
  const { segs = 16, smooth = 0, open, span, tuck = 0 } = o
  const opened = open !== undefined || span !== undefined
  const cap = opened ? 'none' : (o.cap ?? 'both')
  const rs = smoothRings(rings, smooth)
  const cols = opened ? segs + 1 : segs

  const pos: number[] = []
  for (const r of rs) {
    const gap = typeof open === 'function' ? open(r) : (open ?? 0)
    const [a0, a1] = span ? span(r) : opened ? [gap, Math.PI * 2 - gap] : [0, Math.PI * 2]
    for (let j = 0; j < cols; j++) {
      const a = a0 + ((a1 - a0) * j) / segs
      const p = ringPoint(r, a)
      if (opened && tuck && (j === 0 || j === segs)) {
        // no edge to sink where the two edges have met: that would crease the crown
        const k = tuck * Math.min(1, Math.abs(Math.PI * 2 - (a1 - a0)) / 0.3)
        p[0] += (r.x - p[0]) * k
        p[2] += (r.c - p[2]) * k
      }
      pos.push(p[0], p[1], p[2])
    }
  }

  const idx: number[] = []
  for (let i = 0; i < rs.length - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const j1 = opened ? j + 1 : (j + 1) % segs
      const a = i * cols + j
      const b = i * cols + j1
      const c = (i + 1) * cols + j1
      const d = (i + 1) * cols + j
      idx.push(a, d, c, a, c, b)
    }
  }
  // A cap gets its own copy of the rim, so a hem or a cuff ends in an edge
  // and the shading of the side does not bleed round onto the end.
  const lid = (r: FullRing, row: number, up: boolean) => {
    const rim = pos.length / 3
    for (let j = 0; j < segs; j++) pos.push(pos[(row * cols + j) * 3], pos[(row * cols + j) * 3 + 1], pos[(row * cols + j) * 3 + 2])
    const center = pos.length / 3
    pos.push(r.x, r.y, r.c)
    for (let j = 0; j < segs; j++) {
      const a = rim + j
      const b = rim + ((j + 1) % segs)
      if (up) idx.push(center, b, a)
      else idx.push(center, a, b)
    }
  }
  if (cap === 'both' || cap === 'bottom') lid(rs[0], 0, false)
  if (cap === 'both' || cap === 'top') lid(rs[rs.length - 1], rs.length - 1, true)

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * A limb: a loft of round sections run from a to b, already turned to lie
 * along that line. Radii are [across, front-to-back] pairs at fractions of
 * the length, so a sleeve can be oval and a thigh can taper to a knee.
 */
export function limbGeometry(
  a: [number, number, number],
  b: [number, number, number],
  radii: Array<[t: number, across: number, deep?: number]>,
  o: LoftOptions = {},
): THREE.BufferGeometry {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const d = B.clone().sub(A)
  const len = d.length()
  const g = loftGeometry(
    radii.map(([t, across, deep = across]) => ({ y: t * len, w: across, zf: -deep, zb: deep })),
    { segs: 10, ...o },
  )
  // The loft stands on y. Turn it onto the line keeping its front as near -z
  // as the line allows, so an oval section stays the right way round.
  const y = d.clone().normalize()
  const x = y.clone().cross(new THREE.Vector3(0, 0, 1))
  if (x.lengthSq() < 1e-6) x.set(1, 0, 0)
  x.normalize()
  const z = new THREE.Vector3().crossVectors(x, y)
  g.applyMatrix4(new THREE.Matrix4().makeBasis(x, y, z).setPosition(A))
  return g
}

/**
 * A strand: an oval section swept along a curve through the given points,
 * its width and depth changing as it goes and drawn in to a point wherever
 * they are small. A lock of hair, a strap, a cable. The section keeps its
 * flat side as near -z as the curve allows, like a limb's.
 */
export function strandGeometry(
  path: Array<[at: [number, number, number], across: number, deep: number]>,
  o: { segs?: number; steps?: number } = {},
): THREE.BufferGeometry {
  const { segs = 8, steps = 4 } = o
  const curve = new THREE.CatmullRomCurve3(path.map(([p]) => new THREE.Vector3(...p)))
  const n = (path.length - 1) * steps
  const pos: number[] = []
  const x = new THREE.Vector3()
  const z = new THREE.Vector3()
  const Z = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const p = curve.getPoint(u)
    const t = curve.getTangent(u)
    x.crossVectors(t, Z)
    if (x.lengthSq() < 1e-6) x.set(1, 0, 0)
    x.normalize()
    z.crossVectors(x, t)
    // the radii, straight-line between the authored points
    const f = u * (path.length - 1)
    const k = Math.min(Math.floor(f), path.length - 2)
    const across = path[k][1] + (path[k + 1][1] - path[k][1]) * (f - k)
    const deep = path[k][2] + (path[k + 1][2] - path[k][2]) * (f - k)
    for (let j = 0; j < segs; j++) {
      const a = (Math.PI * 2 * j) / segs
      pos.push(
        p.x + x.x * Math.sin(a) * across - z.x * Math.cos(a) * deep,
        p.y + x.y * Math.sin(a) * across - z.y * Math.cos(a) * deep,
        p.z + x.z * Math.sin(a) * across - z.z * Math.cos(a) * deep,
      )
    }
  }
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs
      const a = i * segs + j
      const b = i * segs + j1
      const c = (i + 1) * segs + j1
      const d = (i + 1) * segs + j
      idx.push(a, d, c, a, c, b)
    }
  }
  // closed at both ends with a fan
  for (const [row, flip] of [[0, true], [n, false]] as const) {
    const center = pos.length / 3
    const p = curve.getPoint(row / n)
    pos.push(p.x, p.y, p.z)
    for (let j = 0; j < segs; j++) {
      const a = row * segs + j
      const b = row * segs + ((j + 1) % segs)
      if (flip) idx.push(center, a, b)
      else idx.push(center, b, a)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}
