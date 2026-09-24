/**
 * Builds public/models/office-woman.glb.
 *
 * The scene has no modeling tool behind it and no downloaded assets, so the
 * avatar is authored here the same way the rest of the office is: geometry in
 * code, flat colors, no textures. The difference is that this one is baked to
 * a .glb rather than rebuilt in JSX on every mount, because the player carries
 * it for the whole session and it wants a stable node hierarchy to hang the
 * held object off.
 *
 * Units are FEET, matching src/scene/constants.ts. The origin is the floor
 * between her feet and she faces -Z, which is where the camera looks at yaw 0.
 * Eye height is 5.6, the same number Player.tsx uses, so the camera sits
 * exactly behind her eyes.
 *
 * Rest pose: standing, arms straight down at her sides, every joint rotation
 * zero. The app poses the joint empties directly (no skinning):
 *
 *   OfficeWoman
 *   └─ Hips
 *      ├─ Leg_L/R → Knee_L/R → Ankle_L/R
 *      └─ Spine
 *         ├─ Neck → Head            (everything on her head lives under Head)
 *         └─ Shoulder_L/R → Elbow_L/R → Hand_L/R   (Hand_* is the wrist)
 *
 * The palm hangs below the wrist, so a carried object parented to Hand_R at
 * about (0, -0.25, 0) sits in her hand. Under each Hand_* are Finger_*_1..4
 * (knuckle → Finger_*_n_2 middle joint) and Thumb_*; those carry small rest
 * rotations (see the arms section) and the app adds a curl on top.
 *
 * Her body is lofted, not stacked: src/lib/loft.ts skins a surface over a
 * list of cross-sections, and src/lib/face.ts is the head all three people in
 * the building share. Node runs those .ts files as they are (it strips the
 * types), which wants Node 22.18 or later.
 *
 *   pnpm build:avatar
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'

/*
  GLTFExporter reads its own Blob back through FileReader to build the binary
  chunk. Node has Blob but not FileReader, so give it the one method it calls.
*/
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      this.onloadend?.()
    })
  }
}

const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
const { loftGeometry, limbGeometry, strandGeometry, letOut, cutRings, frontAngle, surfaceAt, smoothRings } = await import('../src/lib/loft.ts')
const { makeFace, hairGeometry } = await import('../src/lib/face.ts')

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../public/models/office-woman.glb')

/** She faces -Z, so anything on her front is at negative z. */
const F = -1

// ---- the figure, in feet ----------------------------------------------------
// Landmark heights from the floor. The one fixed number is EYE: the camera is
// there. Everything else is where it falls on a woman whose eyes are at 5.6 in
// a two-and-a-half-inch heel — about 5 ft 11 to the crown, shoulders at 4.86.
// (They were at 4.62, under the same head, which is where the long neck came from.)

const ANKLE = 0.28
const KNEE = 1.66
const HIP = 3.08
const WAIST = 3.72
const SHOULDER = 4.86
const NECK = 5.0
const HEAD = 5.16
const EYE = 5.6
/** Chin to crown. The eyes are halfway up a head, so this places the chin. */
const HEAD_H = 0.76
const CHIN = EYE - HEAD_H / 2

const HIP_X = 0.27
const SHOULDER_X = 0.52

const UPPER_ARM = 1.05
const FOREARM = 0.92
/** The forearm hangs a touch outboard of the elbow, so the hands clear the hips. */
const CARRY = 0.09
/** The trouser hem sits this far up, just clear of the shoe. */
const HEM_T = 0.38

// ---- palette ----------------------------------------------------------------
// Office clothes in the same register as the rest of the building: nothing
// saturated, nothing that reads as a costume. The blouse is a soft blue rather
// than white so she does not vanish against the cream walls in a mirror.

const M = (name, color, o = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness: 0.85, metalness: 0, ...o })

const skin = M('skin', 0xd9a684)
const shade = M('skinShade', 0xb07d5e)
const hair = M('hair', 0x3a2a1e, { roughness: 0.6, side: THREE.DoubleSide })
// A dusty-rose camisole under an open taupe suit, nude pumps: the low-poly
// figure Chris sent. The app flat-shades every one of these at load, so the
// facets read the way that render's do.
const blouse = M('camisole', 0xb86e72, { roughness: 0.55 })
const blazer = M('blazer', 0xa79b8b, { roughness: 0.8, side: THREE.DoubleSide })
// the lapel and the pocket flaps, a tone up, so they read on a jacket of the same cloth
const lapel = M('lapel', 0xb5a999, { roughness: 0.8, side: THREE.DoubleSide })
const trouser = M('trouser', 0xa79b8b, { roughness: 0.85 })
const shoe = M('shoe', 0xc9a58a, { roughness: 0.4 })
const badge = M('badge', 0xf2f0e8, { roughness: 0.7 })
const ink = M('badgeInk', 0x1c3d8f, { roughness: 0.7 })
const eye = M('eye', 0x5a3820, { roughness: 0.3 })
const pupil = M('pupil', 0x0d0a09, { roughness: 0.2 })
const lash = M('lash', 0x1c1411, { roughness: 0.6 })
const lipLine = M('lipLine', 0x7a3c38)
const sclera = M('sclera', 0xf1ede6, { roughness: 0.35 })
const lip = M('lip', 0xb0675e)
const gold = M('gold', 0xd4a33a, { roughness: 0.3, metalness: 0.8 })
const leather = M('leather', 0x2a221e, { roughness: 0.7 })
const steel = M('steel', 0x9a9da3, { roughness: 0.35, metalness: 0.7 })
const dial = M('dial', 0xe8e4da, { roughness: 0.5 })

// ---- helpers ----------------------------------------------------------------

/** A mesh at a spot, named so the app can find it later if it needs to. */
function part(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], name) {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(...position)
  m.rotation.set(...rotation)
  if (name) m.name = name
  return m
}

/** An empty used as a joint. Limb meshes hang off it, so rotating it swings them. */
function joint(name, position) {
  const o = new THREE.Object3D()
  o.name = name
  o.position.set(...position)
  return o
}

/** A box, which is as much rounding as this scene does. */
function slab(w, h, d, material, position, name) {
  return part(new THREE.BoxGeometry(w, h, d), material, position, [0, 0, 0], name)
}

/** A sphere, optionally squashed into an ellipsoid. */
function ball(r, material, position, scale = [1, 1, 1], ws = 10, hs = 8) {
  const m = part(new THREE.SphereGeometry(r, ws, hs), material, position)
  m.scale.set(...scale)
  return m
}

/**
 * A box laid from point a to point b, for straps, plackets and collar points
 * that have to lie along a surface. The lower point goes first so the box only
 * tilts a little and its -z face stays the front.
 */
function strut(a, b, w, d, material, name) {
  let A = new THREE.Vector3(...a)
  let B = new THREE.Vector3(...b)
  if (B.y < A.y) [A, B] = [B, A]
  const dir = B.clone().sub(A)
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, dir.length(), d), material)
  m.position.copy(A).add(B).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  if (name) m.name = name
  return m
}

const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

/**
 * A finger: a lathe that tapers from r0 at the base to r1 at a rounded tip,
 * hanging down from y=0. Open at the base, which sits inside the palm.
 */
function fingerGeo(len, r0, r1) {
  const pts = []
  for (let i = 0; i <= 3; i++) {
    const a = (i / 3) * (Math.PI / 2)
    pts.push(new THREE.Vector2(Math.sin(a) * r1, -len + r1 - Math.cos(a) * r1))
  }
  pts.push(new THREE.Vector2(r0, 0))
  return new THREE.LatheGeometry(pts, 6)
}

/** Rings stated in feet from the floor, moved into the frame of a joint at height `y0`. */
const under = (y0, rings) => rings.map((r) => ({ ...r, y: r.y - y0 }))

// Geometry shared between the two sides, so the exporter writes it once.
// Sections are [fraction along, across, front-to-back]; sides are kept few,
// because the app flat-shades her and the facets are the look.
const G = {
  // trousers: a thigh that tapers to the knee, then a straight leg to the hem
  thigh: limbGeometry([0, 0, 0], [0, -(HIP - KNEE), 0], [[0, 0.27, 0.29], [1, 0.2, 0.215]], { segs: 10 }),
  kneeCap: new THREE.SphereGeometry(0.203, 8, 6),
  shin: limbGeometry([0, 0, 0], [0, -(KNEE - HEM_T), 0], [[0, 0.2, 0.215], [0.4, 0.19, 0.205], [1, 0.18, 0.195]], { segs: 10 }),
  // A pump. The rings tilt — toe on the floor, heel seat two and a half
  // inches up — and the front is pinched past an ellipse, which is the point.
  shoe: loftGeometry(
    under(ANKLE, [
      { y: 0.1, tilt: 0.085, w: 0.125, zf: -0.64, zb: 0.12, c: -0.2, n: 1.55, nb: 2 },
      { y: 0.165, tilt: 0.09, w: 0.128, zf: -0.6, zb: 0.13, c: -0.2, n: 1.6, nb: 2 },
      { y: 0.2, tilt: 0.1, w: 0.112, zf: -0.4, zb: 0.125, c: -0.14, n: 1.8, nb: 2 },
    ]),
    { segs: 10 },
  ),
  // the foot in it: the instep rising out of the shoe to the ankle under the hem
  foot: loftGeometry(
    under(ANKLE, [
      { y: 0.17, tilt: 0.085, w: 0.098, zf: -0.34, zb: 0.1, c: -0.1 },
      { y: 0.3, tilt: 0.035, w: 0.085, zf: -0.13, zb: 0.1 },
      { y: 0.46, w: 0.075, zf: -0.08, zb: 0.088 },
    ]),
    { segs: 8 },
  ),
  heel: new THREE.CylinderGeometry(0.03, 0.02, 0.2, 6, 1),
  // jacket sleeves to the wrist, a cuff there
  shoulderCap: new THREE.SphereGeometry(0.148, 8, 6),
  upperArm: limbGeometry([0, -0.02, 0], [0, -UPPER_ARM, 0], [[0, 0.148, 0.155], [1, 0.122, 0.128]], { segs: 10 }),
  elbowCap: new THREE.SphereGeometry(0.125, 8, 6),
  cuff: new THREE.CylinderGeometry(0.1, 0.11, 0.12, 10, 1),
  wrist: new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10, 1),
  // the palm: a narrow capsule, 0.16 across, squashed to 0.05 thick below
  palm: new THREE.CapsuleGeometry(0.08, 0.13, 3, 10),
  // index, middle, ring, little: long and slender, about palm length, in two
  // segments (proximal cylinder, then a knuckle and a tapered distal) so the
  // app can curl them round a mug handle
  fingerLen: [
    [0.13, 0.11],
    [0.14, 0.12],
    [0.13, 0.115],
    [0.1, 0.09],
  ],
  proximal: [0.13, 0.14, 0.13, 0.1].map((l) => new THREE.CylinderGeometry(0.019, 0.021, l, 6, 1)),
  distal: [0.11, 0.12, 0.115, 0.09].map((l) => fingerGeo(l, 0.019, 0.016)),
  knuckle: new THREE.SphereGeometry(0.019, 6, 4),
  thumb: fingerGeo(0.2, 0.019, 0.015),
  button: new THREE.SphereGeometry(0.024, 6, 4),
}

// ---- build ------------------------------------------------------------------

const root = new THREE.Group()
root.name = 'OfficeWoman'

// Hips carry the legs and everything above them, so a walk cycle only has to
// touch this one node.
const hips = joint('Hips', [0, HIP, 0])
root.add(hips)

// --- legs
for (const side of [-1, 1]) {
  const tag = side > 0 ? 'R' : 'L'
  const leg = joint(`Leg_${tag}`, [side * HIP_X, 0, 0])
  leg.add(part(G.thigh, trouser))

  const knee = joint(`Knee_${tag}`, [0, -(HIP - KNEE), 0])
  knee.add(part(G.kneeCap, trouser))
  // the trouser leg, straight to its hem at the shoe
  knee.add(part(G.shin, trouser))

  const ankle = joint(`Ankle_${tag}`, [0, -(KNEE - ANKLE), 0])
  // A pump: a pointed toe on the floor, the foot rising out of it to the
  // ankle, and a spike heel standing under the back.
  ankle.add(part(G.foot, skin))
  ankle.add(part(G.shoe, shoe, [0, 0, 0], [0, 0, 0], `Shoe_${tag}`))
  ankle.add(part(G.heel, shoe, [0, 0.1 - ANKLE, 0.085]))

  knee.add(ankle)
  leg.add(knee)
  hips.add(leg)
}

// --- trousers, the seat of them: hung off the hips so it moves with them.
// One surface from where the legs part up to the waistband — hips wider than
// the waist, a seat behind, flat in front — and the legs come out of it on
// their own joints.
const SEAT = [
  { y: 2.7, w: 0.49, zf: -0.29, zb: 0.35, n: 2.3 },
  { y: 3.1, w: 0.55, zf: -0.325, zb: 0.425, n: 2.3 },
  { y: 3.45, w: 0.49, zf: -0.305, zb: 0.35, n: 2.2 },
  { y: WAIST + 0.06, w: 0.395, zf: -0.27, zb: 0.265 },
]
hips.add(part(loftGeometry(under(HIP, SEAT), { segs: 14, smooth: 1 }), trouser, [0, 0, 0], [0, 0, 0], 'Trousers'))
// the waistband
hips.add(part(loftGeometry(under(HIP, cutRings(letOut(SEAT, 0.008), WAIST - 0.06, WAIST + 0.06, 1)), { segs: 14, cap: 'none' }), trouser))

// --- spine and torso
const spine = joint('Spine', [0, WAIST - HIP, 0])
hips.add(spine)

/** World coordinates → Spine-local, so the torso can be laid out in feet from the floor. */
const S = (x, y, z) => [x, y - WAIST, z]

// Her, under the clothes, from the ribs to the base of the neck: what shows
// above the camisole's neckline and between the jacket's fronts. The shoulder
// line slopes down from the neck; it does not run level like a coat hanger.
const BODY = [
  { y: 4.25, w: 0.39, zf: -0.27, zb: 0.245 },
  { y: 4.55, w: 0.415, zf: -0.285, zb: 0.255 },
  { y: 4.8, w: 0.44, zf: -0.235, zb: 0.24 },
  { y: 4.93, w: 0.33, zf: -0.18, zb: 0.21 },
  { y: 5.04, w: 0.17, zf: -0.135, zb: 0.165 },
]
spine.add(part(loftGeometry(under(WAIST, BODY), { segs: 12, smooth: 1 }), skin))

// The camisole: in at the waist, out over the ribs and the bust, and a
// neckline that scoops in front — the top ring dips.
const CAMI = [
  { y: WAIST - 0.06, w: 0.37, zf: -0.262, zb: 0.252 },
  { y: 3.97, w: 0.385, zf: -0.285, zb: 0.262 },
  { y: 4.2, w: 0.415, zf: -0.35, zb: 0.272, n: 2.5 },
  { y: 4.36, w: 0.425, zf: -0.385, zb: 0.276, n: 2.6 },
  { y: 4.52, w: 0.43, zf: -0.325, zb: 0.272, n: 2.3, dip: 0.05 },
  { y: 4.63, w: 0.432, zf: -0.3, zb: 0.268, n: 2.2, dip: 0.13 },
]
spine.add(part(loftGeometry(under(WAIST, CAMI), { segs: 14, smooth: 1, cap: 'bottom' }), blouse, [0, 0, 0], [0, 0, 0], 'Torso'))
// The bust: one each side, most of each inside the camisole and running into
// the other, so it reads as a figure under cloth and not as two balls stuck on.
for (const side of [-1, 1]) {
  spine.add(ball(0.185, blouse, S(side * 0.145, 4.33, F * 0.25), [1.0, 0.95, 0.95], 12, 10))
}
// the line between, where the neckline ends
spine.add(slab(0.012, 0.08, 0.01, shade, S(0, 4.47, F * 0.322)))
// thin straps over the shoulders, where the jacket leaves them showing
for (const side of [-1, 1]) {
  spine.add(strut(S(side * 0.3, 4.56, F * 0.3), S(side * 0.27, 4.86, F * 0.2), 0.035, 0.012, blouse))
}

// The blazer, worn open: one shell round her from the hip to the collar, a
// size up from the body, its front left open the whole way down so the
// camisole shows — in at the waist, out over the seat, a padded shoulder.
// Notched lapels down the edges of the opening, a flap pocket at each hip,
// one button at the waist.
const JACKET = [
  { y: 3.0, w: 0.525, zf: -0.355, zb: 0.445, n: 2.4 },
  { y: 3.3, w: 0.515, zf: -0.35, zb: 0.425, n: 2.4 },
  { y: WAIST + 0.04, w: 0.43, zf: -0.315, zb: 0.31, n: 2.3 },
  { y: 4.33, w: 0.485, zf: -0.405, zb: 0.33, n: 2.4 },
  { y: 4.66, w: 0.53, zf: -0.355, zb: 0.325, n: 2.3 },
  { y: SHOULDER + 0.01, w: 0.535, zf: -0.275, zb: 0.3, n: 2.2 },
  { y: 4.97, w: 0.35, zf: -0.2, zb: 0.25 },
  { y: 5.05, w: 0.2, zf: -0.155, zb: 0.205 },
]
/** Half the width the jacket stands open at a height: widest over the hips, closing to the collar. */
const gape = (y) => {
  const stops = [[3.0, 0.3], [WAIST, 0.27], [4.33, 0.23], [4.75, 0.235], [4.97, 0.185], [5.05, 0.12]]
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, g0] = stops[i]
    const [y1, g1] = stops[i + 1]
    if (y <= y1) return g0 + ((g1 - g0) * Math.max(y - y0, 0)) / (y1 - y0)
  }
  return stops[stops.length - 1][1]
}
spine.add(
  part(
    loftGeometry(under(WAIST, JACKET), { segs: 16, smooth: 1, open: (r) => frontAngle(r, gape(r.y + WAIST)) }),
    blazer,
    [0, 0, 0],
    [0, 0, 0],
    'Jacket',
  ),
)
// lapels: a strip of the jacket's own surface along each edge of the opening,
// a little proud of it, wide at the chest and gone by the button; a notch,
// then the collar above it
const NOTCH = 4.7
const onJacket = (y0, y1, d, edges) =>
  loftGeometry(under(WAIST, cutRings(letOut(JACKET, d), y0, y1, 1)), {
    segs: 2,
    span: (r) => edges(r.y + WAIST).map((x) => frontAngle(r, x)),
  })
for (const side of [-1, 1]) {
  const lapelW = (y) => 0.17 * Math.sin((Math.PI / 2) * Math.min(1, (y - 3.78) / (NOTCH - 3.78)))
  const edge = (y, wide) => (side > 0 ? [gape(y) - 0.01, gape(y) + wide] : [-gape(y) - wide, -gape(y) + 0.01])
  spine.add(part(onJacket(3.78, NOTCH, 0.02, (y) => edge(y, lapelW(y))), lapel))
  spine.add(part(onJacket(NOTCH + 0.03, 5.03, 0.02, (y) => edge(y, 0.12)), lapel))
}
const jacketSkin = smoothRings(JACKET, 1)
for (const side of [-1, 1]) {
  const at = surfaceAt(jacketSkin, side * 0.41, 3.38, 0.012)
  spine.add(part(new THREE.BoxGeometry(0.26, 0.08, 0.02), lapel, S(...at.p), [0, at.yaw, 0]))
}
{
  const at = surfaceAt(jacketSkin, 0.31, 3.74, 0.016)
  spine.add(part(G.button, shade, S(...at.p)))
}

// --- the badge: on a steel clip over the waistband at her right hip, in the
// open front of the jacket, leaning out a little over the trousers. On Hips,
// so it rides with them. A plain card: the app paints the IITS badge onto
// it at load (lib/avatar.ts), since a texture cannot be drawn without a canvas.
const HB = (x, y, z) => [x, y - HIP, z]
hips.add(slab(0.1, 0.12, 0.03, steel, HB(0.13, WAIST, F * 0.285)))
const card = strut(HB(0.13, WAIST - 0.04, F * 0.3), HB(0.13, WAIST - 0.48, F * 0.375), 0.32, 0.012, badge, 'Badge')
hips.add(card)

// --- neck and head
const neck = joint('Neck', [0, NECK - WAIST, 0])
neck.add(
  part(
    loftGeometry(
      under(NECK, [
        { y: 4.96, w: 0.15, zf: -0.13, zb: 0.16 },
        { y: 5.17, w: 0.128, zf: -0.12, zb: 0.13 },
        { y: CHIN + 0.22, w: 0.134, zf: -0.125, zb: 0.14 },
      ]),
      { segs: 10, smooth: 1, cap: 'none' },
    ),
    skin,
  ),
)
spine.add(neck)
// a fine gold chain, lying on the collarbones and down to a small drop: it
// is what stops the throat and the chest reading as one long column of skin.
// A strand run along points taken off the body's own surface, so it lies on
// her; its ends go up under the hair and the collar.
{
  const bodySkin = smoothRings(BODY, 1)
  const REACH = 0.17
  const chain = []
  for (let i = -4; i <= 4; i++) {
    const x = (i / 4) * REACH
    const y = 4.8 + Math.pow(Math.abs(i) / 4, 1.6) * 0.2
    chain.push([S(...surfaceAt(bodySkin, x, y, 0.006).p), 0.0045, 0.0045])
  }
  spine.add(part(strandGeometry(chain, { segs: 4, steps: 2 }), gold))
  spine.add(ball(0.015, gold, S(...surfaceAt(bodySkin, 0, 4.775, 0.008).p), [1, 1.35, 0.6], 6, 4))
}

const head = joint('Head', [0, HEAD - NECK, 0])
neck.add(head)

// The head is the one all three people share (src/lib/face.ts): a skull
// lofted from chin to crown and a face laid on its surface. Hers is the soft
// end of it — a narrower jaw, bigger eyes with a lash line and a lift at the
// outer corner, a smaller nose, fuller lips, a smile, brows that arch. The
// eyes are halfway up it, which puts them at EYE exactly: where the camera is.
const face = makeFace({
  h: HEAD_H,
  soft: 1,
  segs: 16,
  smooth: 1,
  lid: 0.17,
  lash: 0.1,
  slant: 0.12,
  eye: 1.5,
  nose: 0.78,
  lips: 1.15,
  smile: 0.6,
  brow: [0.64, 0.018, 0.13],
  gaze: [0, 0],
})
const faceMats = { skin, shade, sclera, iris: eye, pupil, lip, lipLine, brow: hair, lash }
const skullAt = joint('Face', [0, CHIN - HEAD, F * 0.03])
head.add(skullAt)
for (const p of face.parts) {
  const m = part(p.geometry, faceMats[p.role], p.position, p.rotation, p.key === 'skull' ? 'Skull' : undefined)
  m.scale.set(...p.scale)
  skullAt.add(m)
}

// Hair, long and dark, parted in the middle: a shell over the skull with the
// face cut out of it — the hairline is a list of how much face is left bare
// at each height — that stops hugging the skull below the ear and falls,
// over the shoulders at the sides and down the back behind the jacket. All
// under Head, so it turns with her and is hidden from her own camera.
skullAt.add(
  part(
    hairGeometry(face, {
      from: 0.38,
      grow: [1.09, 1.07, 1.1],
      segs: 16,
      fall: [
        { y: -1.12, w: 0.28, zf: -0.2, zb: 0.5, c: 0.2 },
        { y: -0.95, w: 0.39, zf: -0.3, zb: 0.545, c: 0.12 },
        { y: -0.6, w: 0.43, zf: -0.34, zb: 0.525, c: 0.08 },
        { y: -0.25, w: 0.39, zf: -0.36, zb: 0.46, c: 0.05 },
        { y: 0.05, w: 0.35, zf: -0.37, zb: 0.405, c: 0.04 },
        { y: 0.3, w: 0.338, zf: -0.37, zb: 0.375, c: 0.03 },
      ],
      line: [
        [-1.12, 118],
        [-0.55, 110],
        [-0.3, 100],
        [0.0, 88],
        [0.2, 76],
        [0.38, 72],
        [0.5, 70],
        [0.62, 66],
        [0.74, 56],
        [0.84, 30],
        [0.9, 0],
      ],
    }),
    hair,
    [0, 0, 0],
    [0, 0, 0],
    'Hair',
  ),
)
// and a lock each side that comes forward of the shoulder instead: out from
// under the hair at the jaw, in to the collarbone, out again over the
// jacket's front and to a point at the bust. One strand swept along a curve,
// wider than it is deep — a straight piece read as a plank, and jointed
// pieces read as a string of sausages.
for (const side of [-1, 1]) {
  const H = (x, y, z) => [x, y - CHIN, z + 0.03]
  skullAt.add(
    part(
      strandGeometry(
        [
          [H(side * 0.255, 5.42, F * 0.03), 0.03, 0.03],
          [H(side * 0.29, 5.2, F * 0.1), 0.062, 0.042],
          [H(side * 0.268, 4.98, F * 0.2), 0.068, 0.042],
          [H(side * 0.315, 4.72, F * 0.33), 0.06, 0.036],
          [H(side * 0.295, 4.46, F * 0.41), 0.008, 0.008],
        ],
        { segs: 6, steps: 3 },
      ),
      hair,
    ),
  )
}

// --- arms
for (const side of [-1, 1]) {
  const tag = side > 0 ? 'R' : 'L'
  const shoulder = joint(`Shoulder_${tag}`, [side * SHOULDER_X, SHOULDER - WAIST, 0])
  // the sleeve head, set low enough that the shoulder line slopes down from
  // the neck and rounds over it, rather than rising into a puff
  // jacket shoulder and sleeve
  shoulder.add(part(G.shoulderCap, blazer, [-side * 0.02, -0.12, 0]))
  shoulder.add(part(G.upperArm, blazer))

  const elbow = joint(`Elbow_${tag}`, [0, -UPPER_ARM, 0])
  elbow.add(part(G.elbowCap, blazer))
  // sleeve to the wrist, leaning out by CARRY to meet the hand
  elbow.add(part(limbGeometry([0, 0, 0], [side * CARRY * 0.9, -(FOREARM - 0.1), 0], [[0, 0.122, 0.128], [1, 0.1, 0.105]], { segs: 10 }), blazer))

  // Hand_* is the wrist. Rest pose: palms facing forward (-z), thumbs to the
  // inside. The cuff lives here so the sleeve ends exactly at the wrist and
  // first person sees sleeve, cuff, hand.
  const hand = joint(`Hand_${tag}`, [side * CARRY, -FOREARM, 0])
  hand.add(part(G.cuff, blazer, [0, 0.04, 0]))
  hand.add(part(G.wrist, skin, [0, -0.04, F * 0.02]))
  // palm: 0.16 wide, 0.05 thick, front face at z ≈ -0.065 for a carried object
  const palm = part(G.palm, skin, [0, -0.17, F * 0.04], [0, 0, 0], `Palm_${tag}`)
  palm.scale.set(1, 1, 0.31)
  hand.add(palm)
  // Four fingers from the knuckle line, each a two-joint chain so the app can
  // curl them round whatever she is holding. Joint frames: the segment hangs
  // in -y from the joint, and a positive rotation about the joint's local +x
  // swings the tip toward -z, which is the palm's front. Rest rotations:
  //   Finger_*_i    (0.25, 0, ±fan)   fan = 0.07, 0.02, 0.02, 0.10 (index → little,
  //                                   positive toward the outer edge of the hand)
  //   Finger_*_i_2  (0.20, 0, 0)
  //   Thumb_*       (0.60, 0, -side * 0.25)
  // u runs from the thumb side (inner) to the outer edge.
  const REST_CURL = [0.25, 0.2]
  const fingers = [
    [0.06, 0.07],
    [0.02, 0.02],
    [-0.02, 0.02],
    [-0.06, 0.1],
  ]
  fingers.forEach(([u, fan], i) => {
    const x = -side * u
    const [lp] = G.fingerLen[i]
    const knuckle = joint(`Finger_${tag}_${i + 1}`, [x, -0.27, F * 0.04])
    knuckle.rotation.set(REST_CURL[0], 0, Math.sign(x) * fan)
    knuckle.add(part(G.proximal[i], skin, [0, -lp / 2, 0]))
    const mid = joint(`Finger_${tag}_${i + 1}_2`, [0, -lp, 0])
    mid.rotation.set(REST_CURL[1], 0, 0)
    mid.add(part(G.knuckle, skin))
    mid.add(part(G.distal[i], skin))
    knuckle.add(mid)
    hand.add(knuckle)
    if (side > 0 && i === 2) {
      // a thin ring on the right ring finger; it curls with the finger
      knuckle.add(part(new THREE.TorusGeometry(0.024, 0.006, 5, 10), gold, [0, -0.06, 0], [Math.PI / 2, 0, 0]))
    }
  })
  // thumb, finer than the fingers, set off to the inside and pointing down and
  // forward, which keeps it out of her hip when the arm hangs
  const thumb = joint(`Thumb_${tag}`, [-side * 0.06, -0.09, F * 0.055])
  thumb.rotation.set(0.6, 0, -side * 0.25)
  thumb.add(part(G.thumb, skin))
  hand.add(thumb)

  if (side < 0) {
    // Wristwatch, a child of Hand_L so the "check the watch" pose carries it:
    // a thin strap round the wrist just below the cuff, a steel case on the
    // back of the wrist (+z in the hand's frame; the palm faces -z) and a
    // lighter dial on top of it. 144 triangles.
    const WY = -0.05
    hand.add(part(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12, 1), leather, [0, WY, 0], [0, 0, 0], 'Watch_Strap'))
    hand.add(part(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 12, 1), steel, [0, WY, 0.095], [Math.PI / 2, 0, 0], 'Watch_Case'))
    hand.add(part(new THREE.CylinderGeometry(0.036, 0.036, 0.006, 12, 1), dial, [0, WY, 0.107], [Math.PI / 2, 0, 0], 'Watch_Dial'))
  }

  elbow.add(hand)
  shoulder.add(elbow)
  spine.add(shoulder)
}

// ---- export -----------------------------------------------------------------

root.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = true
    o.receiveShadow = true
    // Lathe and capsule normals are not unit length; the exporter would
    // otherwise renormalize them itself and say so, once per mesh.
    o.geometry.normalizeNormals()
  }
})

const box = new THREE.Box3().setFromObject(root)
const exporter = new GLTFExporter()

exporter.parse(
  root,
  (result) => {
    mkdirSync(dirname(OUT), { recursive: true })
    writeFileSync(OUT, Buffer.from(result))
    let meshes = 0
    let tris = 0
    root.traverse((o) => {
      if (!o.isMesh) return
      meshes++
      const g = o.geometry
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3
    })
    const size = Buffer.from(result).length
    console.log(`wrote ${OUT}`)
    console.log(
      `  ${meshes} meshes, ${Math.round(tris)} triangles, ${size.toLocaleString()} bytes`,
    )
    console.log(
      `  height ${box.max.y.toFixed(2)} ft, eye set at ${EYE} ft, ` +
        `width ${(box.max.x - box.min.x).toFixed(2)} ft`,
    )
  },
  (err) => {
    console.error('export failed:', err)
    process.exit(1)
  },
  { binary: true, onlyVisible: false },
)
