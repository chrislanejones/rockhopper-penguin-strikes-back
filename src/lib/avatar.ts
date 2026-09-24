import * as THREE from 'three'
import { AVATAR_LAYER } from '../scene/constants'
import { canvasTex, lazy } from './canvasTex'

/**
 * Her conference badge. The model ships a blank card; this is painted on it
 * at load, because the model is built in Node and Node has no canvas.
 */
const badgeTex = lazy(() =>
  canvasTex(128, 180, (g, w, h) => {
    g.fillStyle = '#f4f2ec'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#1c3d8f'
    g.fillRect(0, 0, w, 36)
    g.fillStyle = '#fff'
    g.font = 'bold 20px sans-serif'
    g.textAlign = 'left'
    g.fillText('IITS', 8, 26)
    g.fillStyle = '#ffd23f'
    g.font = 'bold 10px sans-serif'
    g.fillText('2026', 58, 26)
    // photo
    g.fillStyle = '#d8d3c8'
    g.fillRect(10, 48, 44, 54)
    g.fillStyle = '#c99b76'
    g.beginPath()
    g.arc(32, 68, 11, 0, 7)
    g.fill()
    g.fillRect(18, 82, 28, 20)
    g.fillStyle = '#2d6e74'
    g.fillRect(18, 84, 28, 18)
    // name and line
    g.fillStyle = '#1a1a1a'
    g.font = 'bold 11px sans-serif'
    g.fillText('ATTENDEE', 62, 62)
    g.fillStyle = '#555'
    g.font = '9px sans-serif'
    g.fillText('Fiscal Services', 62, 78)
    g.fillText('Suite 2310', 62, 92)
    g.fillStyle = '#1c3d8f'
    g.fillRect(10, 118, w - 20, 2)
    g.fillStyle = '#333'
    g.font = '9px sans-serif'
    g.fillText('Sept 16–17 · London', 10, 138)
    // barcode
    for (let x = 10; x < w - 10; x += 3) {
      g.fillStyle = '#222'
      g.fillRect(x, 150, (x * 7) % 3 ? 1 : 2, 20)
    }
  }),
)

/**
 * The player's body, driven every frame from Player.tsx.
 *
 * Lives outside React for the same reason the colliders do: the pose changes
 * sixty times a second and none of it should cause a render. Avatar.tsx loads
 * the model and hands the joints over here; Player.tsx calls `updateAvatar`
 * once per frame, after it has settled where the camera is, so the body never
 * runs a frame behind the view.
 *
 * The rig is a plain node hierarchy, not a skinned mesh — the limbs are
 * cylinders hung off empties, and posing is a matter of rotating the empties.
 * Arms are aimed with two-bone IK at a target point; nothing else needs more
 * than a sine wave.
 */

export interface Rig {
  root: THREE.Object3D
  hips: THREE.Object3D
  spine: THREE.Object3D
  head: THREE.Object3D
  /** [left, right] */
  shoulder: THREE.Object3D[]
  elbow: THREE.Object3D[]
  hand: THREE.Object3D[]
  leg: THREE.Object3D[]
  knee: THREE.Object3D[]
  /** Upper arm and forearm lengths, read off the model rather than assumed. */
  upper: number
  fore: number
  /** Where a carried object sits: an empty in the right palm. */
  socket: THREE.Object3D
  /** Materials on everything below the neck, which comes and goes from view. */
  body: THREE.Material[]
  /** The head's own copies, which the main camera never draws. */
  headMats: THREE.Material[]
  /** Finger joints per side, each with the rest bend the model shipped with. */
  fingers: Knuckle[][]
}

/** One posable joint in a hand and how far it was bent at rest. */
interface Knuckle {
  joint: THREE.Object3D
  rest: number
  /** 0 base knuckle, 1 middle knuckle, 2 thumb. */
  kind: 0 | 1 | 2
}

let rig: Rig | null = null

export const L = 0
export const R = 1

const need = (root: THREE.Object3D, name: string) => {
  const o = root.getObjectByName(name)
  if (!o) throw new Error(`avatar: model has no node named ${name}`)
  return o
}

/**
 * Take a loaded model and find the joints in it.
 *
 * Also sorts out what is drawn. The whole body goes on AVATAR_LAYER so the
 * raycasters — which only look at layer 0 — never hit her: a mug put down
 * would otherwise land on her own shoe, and the crosshair could catch her
 * sleeve. The head is never drawn by the main camera, because from inside a
 * skull the view is the inside of a skull; it gets its own copies of the
 * materials with colour and depth writes off. It still casts a shadow that
 * way, which a layer trick would not give — three's shadow pass filters by
 * the viewing camera's layers. A mirror would turn the writes back on for
 * its own pass.
 */
export function registerRig(root: THREE.Object3D) {
  const pair = (name: string) => [need(root, `${name}_L`), need(root, `${name}_R`)]
  const elbow = pair('Elbow')
  const hand = pair('Hand')

  const socket = new THREE.Object3D()
  socket.name = 'HoldSocket'
  socket.position.set(0, -0.19, -0.06)
  hand[R].add(socket)

  rig = {
    body: [],
    headMats: [],
    fingers: [[], []],
    root,
    hips: need(root, 'Hips'),
    spine: need(root, 'Spine'),
    head: need(root, 'Head'),
    shoulder: pair('Shoulder'),
    elbow,
    hand,
    leg: pair('Leg'),
    knee: pair('Knee'),
    upper: elbow[R].position.length(),
    fore: hand[R].position.length(),
    socket,
  }

  const neck = need(root, 'Neck')
  const headMeshes = new Set<THREE.Object3D>()
  neck.traverse((o) => headMeshes.add(o))
  const body = new Set<THREE.Material>()
  root.traverse((o) => {
    o.layers.set(AVATAR_LAYER)
    if (!(o instanceof THREE.Mesh)) return
    o.castShadow = true
    o.receiveShadow = true
    o.frustumCulled = false
    if (o.name === 'Badge') {
      o.material = new THREE.MeshStandardMaterial({ map: badgeTex(), roughness: 0.6 })
    }
    // flat-shaded: she is a low-poly figure and the facets are the look,
    // the way the reference render has them
    const mat = o.material as THREE.MeshStandardMaterial
    if (!mat.flatShading) {
      mat.flatShading = true
      mat.needsUpdate = true
    }
    if (headMeshes.has(o)) {
      // the head's own copies: never drawn, always casting
      const m = (o.material as THREE.Material).clone()
      m.colorWrite = false
      m.depthWrite = false
      o.material = m
      rig!.headMats.push(m)
    } else {
      body.add(o.material as THREE.Material)
    }
  })
  rig.body = [...body]

  /*
    Fingers are optional: a model without them still works, it just cannot
    close its hand. Each knuckle's rest bend is remembered so the curl is
    added to the pose the model shipped with, not put in place of it.
  */
  for (const side of [L, R]) {
    const tag = side === R ? 'R' : 'L'
    const list: Knuckle[] = []
    for (let i = 1; i <= 4; i++) {
      const base = root.getObjectByName(`Finger_${tag}_${i}`)
      const mid = root.getObjectByName(`Finger_${tag}_${i}_2`)
      if (base) list.push({ joint: base, rest: base.rotation.x, kind: 0 })
      if (mid) list.push({ joint: mid, rest: mid.rotation.x, kind: 1 })
    }
    const thumb = root.getObjectByName(`Thumb_${tag}`)
    if (thumb) list.push({ joint: thumb, rest: thumb.rotation.x, kind: 2 })
    rig.fingers[side] = list
  }
  shown = false

  return rig
}

let shown = false

/**
 * Show or hide the body without touching `visible`.
 *
 * Hidden means the materials stop writing colour and depth. The shadow pass
 * uses its own depth material and ignores both, so she has a shadow on the
 * carpet whether or not you can see her arms, and the pose keeps being
 * computed so that shadow walks.
 */
function show(r: Rig, on: boolean) {
  if (on === shown) return
  shown = on
  for (const m of r.body) {
    m.colorWrite = on
    m.depthWrite = on
  }
}

/**
 * Draw all of her, head included, for one pass — or put it back.
 *
 * A mirror calls this either side of its own render: from the far side of
 * the glass she is a whole person, and the reasons for hiding her (the
 * camera is inside her skull; idle arms clutter the view) do not apply.
 */
export function drawWhole(on: boolean) {
  const r = rig
  if (!r) return
  for (const m of r.body) {
    m.colorWrite = on || shown
    m.depthWrite = on || shown
  }
  for (const m of r.headMats) {
    m.colorWrite = on
    m.depthWrite = on
  }
}

export function unregisterRig(root: THREE.Object3D) {
  if (rig?.root === root) rig = null
}

/** Where a carried object should be this frame, or null if there is no body yet. */
export const holdSocket = () => rig?.socket ?? null

// ---- reaching ---------------------------------------------------------------

interface Reach {
  hand: number
  point: THREE.Vector3
  /** Seconds left before the arm comes back. */
  left: number
}

let reaching: Reach | null = null

/**
 * Put a hand out to a point in the world for a moment.
 *
 * Space on a door, click on a mug, a throw: each is a reach. The right hand
 * does it unless it is holding something, in which case the left does.
 */
export function reach(point: THREE.Vector3, holdingSomething: boolean, seconds = 0.45) {
  reaching = { hand: holdingSomething ? L : R, point: point.clone(), left: seconds }
}

// ---- per-frame --------------------------------------------------------------

export type Holding = null | 'palm' | 'grip'

export interface Stance {
  x: number
  /** Height of the floor she is standing on. */
  y: number
  z: number
  yaw: number
  pitch: number
  eye: number
  /** Walking this frame. */
  moving: boolean
  /** Running time of the walk cycle, seconds. */
  phase: number
  /** Vertical bob applied to the camera this frame. */
  bob: number
  /** What the right hand has, and how. */
  holding: Holding
  /** T is down: the left wrist comes up so she can read the watch. */
  watch: boolean
}

const DOWN = new THREE.Vector3(0, -1, 0)
const fwd = new THREE.Vector3()
const right = new THREE.Vector3()
const up = new THREE.Vector3()
const eye = new THREE.Vector3()
const want = new THREE.Vector3()
const cur = [new THREE.Vector3(), new THREE.Vector3()]
let primed = false

/*
  The carry position is stated in a frame hung off the eye: x to the right, y
  up, z forward. It follows the yaw fully and the pitch by half, which is what
  a hand does — look down and yours drops into view rather than staying pinned
  to the horizon, but it does not swing through the floor.

  There is no idle position. An arm with nothing to do hangs at her side, which
  is the rest pose of the model, and gets there by relaxing the joints rather
  than by aiming at a point.
*/
const CARRY: [number, number, number] = [0.4, -0.62, 1.45]
/** Held by a handle: closer to the middle, a little higher, like aiming. */
const CARRY_GRIP: [number, number, number] = [0.3, -0.5, 1.35]
/** Wrist up and across, back of the hand to the face. */
const WATCH: [number, number, number] = [-0.28, -0.42, 1.15]

/** Recoil: seconds left of the hand being pushed back. */
let kickT = 0
export function kick() {
  kickT = 0.11
}

/**
 * The body only draws while it is doing something.
 *
 * Arms in the corner of the view the whole time read as somebody forever
 * checking her watch. So: nothing until she reaches for something, and the
 * arm goes back out of frame before it stops drawing.
 */
const LINGER = 0.55
let linger = 0

function frameFrom(s: Stance) {
  const p = s.pitch * 0.5
  fwd.set(-Math.sin(s.yaw) * Math.cos(p), Math.sin(p), -Math.cos(s.yaw) * Math.cos(p))
  right.set(Math.cos(s.yaw), 0, -Math.sin(s.yaw))
  up.crossVectors(right, fwd)
  eye.set(s.x, s.y + s.eye + s.bob, s.z)
}

function viewPoint(out: THREE.Vector3, [x, y, z]: [number, number, number]) {
  return out.copy(eye).addScaledVector(right, x).addScaledVector(up, y).addScaledVector(fwd, z)
}

const S = new THREE.Vector3()
const T = new THREE.Vector3()
const dir = new THREE.Vector3()
const pole = new THREE.Vector3()
const perp = new THREE.Vector3()
const upperDir = new THREE.Vector3()
const E = new THREE.Vector3()
const foreDir = new THREE.Vector3()
const inv = new THREE.Quaternion()
const worldQ = new THREE.Quaternion()
const wantQ = new THREE.Quaternion()
const basis = new THREE.Matrix4()
const ax = new THREE.Vector3()
const ay = new THREE.Vector3()
const az = new THREE.Vector3()
const fingers = new THREE.Vector3()
const flat = new THREE.Vector3()
const IDENTITY = new THREE.Quaternion()

/**
 * How far a hand closes, [base knuckle, middle knuckle, thumb], radians.
 *
 * Open to reach, half-closed round the side of whatever sits on the palm,
 * a fist round a handle, and a little bend when there is nothing to do —
 * a hand held perfectly flat looks like a paddle.
 */
const CURL = {
  hang: [0.2, 0.25, 0.1],
  reach: [0.05, 0.05, 0.0],
  palm: [0.75, 0.85, 0.45],
  grip: [1.35, 1.15, 0.85],
  watch: [0.35, 0.4, 0.15],
} as const

function curlHand(r: Rig, side: number, to: readonly [number, number, number], dt: number) {
  const k = ease(dt, 10)
  for (const f of r.fingers[side]) {
    const want = f.rest + to[f.kind]
    f.joint.rotation.x += (want - f.joint.rotation.x) * k
  }
}

/**
 * Turn the hand palm-up at the wrist, so what she carries sits on it.
 *
 * The palm hangs off the wrist along -Y with its front face on -Z. Wanted:
 * fingers level and pointing ahead, a little inward, and that front face
 * turned to the sky. Stated as a world basis, then taken back into the
 * elbow's frame, which is the one the wrist joint rotates in.
 */
function palmUp(r: Rig, side: number) {
  flat.set(-Math.sin(r.root.rotation.y), 0, -Math.cos(r.root.rotation.y))
  fingers.copy(flat).addScaledVector(right, side === R ? -0.45 : 0.45).normalize()
  // the palm tips inward a little, so the fingers curl up the near side of
  // whatever is on it instead of the thing balancing on a flat tray
  az.set(0, -1, 0).addScaledVector(right, side === R ? -0.35 : 0.35).normalize()
  wristTo(r, side, fingers, az)
}

/**
 * Wrapped round a handle: fingers down, palm to the front.
 *
 * The hand sits behind the grip with the fingers curling forward round it.
 */
function gripWrist(r: Rig, side: number) {
  fingers.set(0, -1, 0).addScaledVector(fwd, -0.25).normalize()
  az.copy(fwd).negate()
  wristTo(r, side, fingers, az)
}

/** Back of the wrist to the face: fingers across the body, palm away. */
function watchWrist(r: Rig, side: number) {
  fingers.copy(right).multiplyScalar(side === L ? 1 : -1).addScaledVector(up, 0.35).normalize()
  az.copy(fwd).negate()
  wristTo(r, side, fingers, az)
}

/**
 * Turn a wrist so the fingers point along `f` and the hand's local +Z points
 * along `z` (the back of the hand; the palm is -Z). Stated as a world basis,
 * then taken back into the elbow's frame, which is the one the wrist joint
 * rotates in.
 */
function wristTo(r: Rig, side: number, f: THREE.Vector3, z: THREE.Vector3) {
  ay.copy(f).negate()
  // keep the basis orthogonal whatever was passed in
  ax.crossVectors(ay, z).normalize()
  az.crossVectors(ax, ay).normalize()
  basis.makeBasis(ax, ay, az)
  wantQ.setFromRotationMatrix(basis)
  r.elbow[side].updateWorldMatrix(true, false)
  r.elbow[side].getWorldQuaternion(worldQ)
  wantQ.premultiply(worldQ.invert())
}

/**
 * Two-bone IK, solved in the spine's frame.
 *
 * The elbow angle comes straight from the cosine rule. Which way the elbow
 * points is the only free choice, and it goes toward a pole below and outside
 * the shoulder — elbows down, the way arms hang, rather than flapping out
 * sideways like a bird.
 */
function aimArm(r: Rig, side: number, targetWorld: THREE.Vector3) {
  const a = r.upper
  const b = r.fore
  const shoulder = r.shoulder[side]
  S.copy(shoulder.position)
  T.copy(targetWorld)
  r.spine.worldToLocal(T)

  dir.subVectors(T, S)
  const d = THREE.MathUtils.clamp(dir.length(), Math.abs(a - b) + 0.02, a + b - 0.02)
  dir.normalize()

  const cosA = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)
  const A = Math.acos(cosA)

  const sx = side === R ? 1 : -1
  pole.set(sx * 0.7, -1, 0.25)
  perp.copy(pole).addScaledVector(dir, -dir.dot(pole))
  if (perp.lengthSq() < 1e-4) perp.set(sx, 0, 0)
  perp.normalize()

  upperDir.copy(dir).multiplyScalar(cosA).addScaledVector(perp, Math.sin(A))
  shoulder.quaternion.setFromUnitVectors(DOWN, upperDir)

  E.copy(S).addScaledVector(upperDir, a)
  foreDir.subVectors(T, E).normalize()
  inv.copy(shoulder.quaternion).invert()
  foreDir.applyQuaternion(inv)
  r.elbow[side].quaternion.setFromUnitVectors(DOWN, foreDir)
}

const ease = (dt: number, k: number) => 1 - Math.exp(-dt * k)

/** Called once a frame by the player, after the camera has been placed. */
export function updateAvatar(s: Stance, dt: number) {
  const r = rig
  if (!r) return
  const holdingSomething = s.holding !== null

  r.root.position.set(s.x, s.y + s.bob, s.z)
  r.root.rotation.y = s.yaw
  // the head follows the look, which matters only to the mirror
  r.head.rotation.x = s.pitch * 0.6

  linger = holdingSomething || reaching || s.watch ? LINGER : Math.max(0, linger - dt)
  show(r, linger > 0)
  r.root.updateMatrixWorld(true)

  frameFrom(s)

  // legs: a swing per step, knees bending on the back-swing
  const sw = s.moving ? Math.sin(s.phase * 5.5) : 0
  const k = ease(dt, 10)
  for (const side of [L, R]) {
    const sign = side === L ? 1 : -1
    r.leg[side].rotation.x += (sw * sign * 0.42 - r.leg[side].rotation.x) * k
    const bend = -Math.max(0, -sw * sign) * 0.7
    r.knee[side].rotation.x += (bend - r.knee[side].rotation.x) * k
  }

  // arms: where each hand wants to be, then ease the actual target toward it
  if (reaching) {
    reaching.left -= dt
    if (reaching.left <= 0) reaching = null
  }
  kickT = Math.max(0, kickT - dt)
  for (const side of [L, R]) {
    const hand = r.hand[side]
    const isReach = reaching !== null && reaching.hand === side
    const isCarry = side === R && holdingSomething
    const isWatch = side === L && s.watch && !isReach
    const busy = isReach || isCarry || isWatch

    if (!busy) {
      // hang: ease every joint back to the rest pose, and keep the target
      // where the hand actually is so the next reach starts from there
      r.shoulder[side].quaternion.slerp(IDENTITY, ease(dt, 7))
      r.elbow[side].quaternion.slerp(IDENTITY, ease(dt, 7))
      hand.quaternion.slerp(IDENTITY, ease(dt, 8))
      curlHand(r, side, CURL.hang, dt)
      hand.updateWorldMatrix(true, false)
      hand.getWorldPosition(cur[side])
      continue
    }

    if (isReach) want.copy(reaching!.point)
    else if (isWatch) viewPoint(want, WATCH)
    else viewPoint(want, s.holding === 'grip' ? CARRY_GRIP : CARRY)
    // recoil: the hand comes back toward the shoulder and settles again
    if (isCarry && kickT > 0) want.addScaledVector(fwd, -0.22 * (kickT / 0.11))
    if (!primed) cur[side].copy(want)
    cur[side].lerp(want, ease(dt, isReach || kickT > 0 ? 14 : 9))
    aimArm(r, side, cur[side])

    // the wrist: shaped to what the hand is doing, otherwise in line with the arm
    if (isCarry && !isReach) {
      if (s.holding === 'grip') gripWrist(r, side)
      else palmUp(r, side)
      hand.quaternion.slerp(wantQ, ease(dt, 12))
      curlHand(r, side, s.holding === 'grip' ? CURL.grip : CURL.palm, dt)
    } else if (isWatch) {
      watchWrist(r, side)
      hand.quaternion.slerp(wantQ, ease(dt, 10))
      curlHand(r, side, CURL.watch, dt)
    } else {
      hand.quaternion.slerp(IDENTITY, ease(dt, 8))
      curlHand(r, side, CURL.reach, dt)
    }
  }
  primed = true

  r.root.updateMatrixWorld(true)
}
