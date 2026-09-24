import * as THREE from 'three'
import { stirShadows } from '../state/store'

/** The thing currently in the player's hands, if any. */
interface Held {
  object: THREE.Object3D
  /** Rotation it had when picked up, so setting it down looks deliberate. */
  quaternion: THREE.Quaternion
  /**
   * The point that sits on the palm, in the object's own frame.
   *
   * A Pickable registers its wrapper group, and that group's origin is
   * wherever the author left it — for a desk mug it is the corner of the
   * workstation, two feet from the mug. Move the origin to the hand and the
   * mug floats two feet from the hand. So the thing carried, put down and
   * thrown is the middle of the object's base, measured once when it is
   * picked up.
   */
  grip: THREE.Vector3
}

let held: Held | null = null

export const getHeld = () => held

/** How the held thing sits in the hand, for the body to shape itself to. */
export const heldStyle = (): null | 'palm' | 'grip' =>
  held ? ((held.object.userData.hold as 'palm' | 'grip' | undefined) ?? 'palm') : null

const bounds = new THREE.Box3()
const gripPoint = new THREE.Vector3()
const origin = new THREE.Vector3()
const parentQ = new THREE.Quaternion()

/** Where the hand takes hold, in the object's own frame. */
function measureGrip(object: THREE.Object3D) {
  // a handle, if the prop named one; otherwise the middle of the base
  const at = object.userData.gripAt as [number, number, number] | undefined
  if (at) return new THREE.Vector3(...at)
  bounds.setFromObject(object)
  gripPoint.set(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.min.y,
    (bounds.min.z + bounds.max.z) / 2,
  )
  return object.worldToLocal(gripPoint).clone()
}

/**
 * Where the grip point is in the world, given the object's current rotation.
 *
 * Built from the parent's world rotation and the object's own quaternion
 * rather than read off matrixWorld, which is a frame stale while the object
 * is being moved and would make a spinning throw wobble.
 */
function gripWorld(object: THREE.Object3D, grip: THREE.Vector3, out: THREE.Vector3) {
  if (object.parent) object.parent.getWorldQuaternion(parentQ)
  else parentQ.identity()
  parentQ.multiply(object.quaternion)
  object.getWorldPosition(origin)
  return out.copy(grip).applyQuaternion(parentQ).add(origin)
}

/** Pick an object up. Returns false if the player's hands are already full. */
export function pickUp(object: THREE.Object3D) {
  if (held) return false
  held = { object, quaternion: object.quaternion.clone(), grip: measureGrip(object) }
  return true
}

const down = new THREE.Vector3(0, -1, 0)
const worldPos = new THREE.Vector3()
const raycaster = new THREE.Raycaster()

/**
 * Put the held object down on whatever is underneath it.
 *
 * Rather than dropping things through the floor, this casts straight down and
 * rests the object on the first surface it finds — a desk top, a shelf, or the
 * carpet.
 */
export function putDown(scene: THREE.Scene, camera?: THREE.Camera) {
  if (!held) return
  const { object, grip } = held
  // Rest the base, not the origin: put the rotation back first so the
  // offset between them is the one it will have once it is down.
  object.quaternion.copy(held.quaternion)
  gripWorld(object, grip, worldPos)

  // Sprites raycast against the camera, so it has to be set even though we
  // only care about solid surfaces.
  if (camera) raycaster.camera = camera
  raycaster.set(worldPos, down)
  raycaster.far = 12
  const hits = raycaster.intersectObjects(scene.children, true)
  // Ignore the object in hand and anything hanging off it.
  const surface = hits.find((h) => {
    let o: THREE.Object3D | null = h.object
    while (o) {
      if (o === object) return false
      // the other floor is mounted right here, hidden; its desks are not desks
      if (!o.visible) return false
      o = o.parent
    }
    return true
  })

  if (surface && object.parent) {
    // the origin goes wherever puts the base on the surface
    const restingPoint = surface.point.clone()
    restingPoint.y += 0.02
    object.getWorldPosition(origin)
    restingPoint.add(origin).sub(worldPos)
    object.parent.worldToLocal(restingPoint)
    object.position.copy(restingPoint)
  }
  held = null
}

const target = new THREE.Vector3()
const forward = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const aimX = new THREE.Vector3()
const aimY = new THREE.Vector3()
const aimZ = new THREE.Vector3()
const aimBasis = new THREE.Matrix4()
const aimQ = new THREE.Quaternion()

/**
 * Keep the held object in hand. Called every frame.
 *
 * With a body in the scene the object goes to the palm; without one — the
 * model still loading — it floats out in front of the camera as it always did.
 * The object is never reparented: it stays a child of whatever desk it came
 * off, and only its position is written, so putting it down and throwing it
 * need no special cases.
 */
export function updateHeld(camera: THREE.Camera, anchor: THREE.Object3D | null = null) {
  // whatever is in your hand casts, and it goes where the camera goes
  if (held) stirShadows()
  if (!held) return
  const { object, grip } = held

  /*
    A gripped thing points where you look: its +X goes along the camera axis
    and its +Y stays up. Stated in the world and taken into the parent's frame,
    since the object's own quaternion is relative to whatever desk it came off.
  */
  if (object.userData.hold === 'grip' && anchor) {
    camera.getWorldDirection(aimX)
    aimZ.crossVectors(aimX, UP).normalize()
    aimY.crossVectors(aimZ, aimX)
    aimBasis.makeBasis(aimX, aimY, aimZ)
    aimQ.setFromRotationMatrix(aimBasis)
    if (object.parent) object.parent.getWorldQuaternion(parentQ)
    else parentQ.identity()
    aimQ.premultiply(parentQ.invert())
    object.quaternion.slerp(aimQ, 0.35)
  }

  if (anchor) {
    anchor.getWorldPosition(target)
  } else {
    camera.getWorldDirection(forward)
    target.copy(camera.position).addScaledVector(forward, 2.4)
    target.y -= 0.45
  }
  // that is where the base goes; the origin goes its offset away from it
  gripWorld(object, grip, worldPos)
  object.getWorldPosition(origin)
  target.add(origin).sub(worldPos)
  if (object.parent) object.parent.worldToLocal(target)
  object.position.lerp(target, 0.35)
}

/**
 * Something in the air.
 *
 * Position is kept in world space and written back through the parent every
 * frame, because a thrown mug is still a child of the desk it came off and
 * its own `position` means nothing without that conversion.
 */
interface Thrown {
  object: THREE.Object3D
  /** World position of the base, the same point the hand was holding. */
  p: THREE.Vector3
  v: THREE.Vector3
  spin: THREE.Vector3
  grip: THREE.Vector3
}

const inFlight: Thrown[] = []
const scratch = new THREE.Vector3()
const from = new THREE.Vector3()
/** This step's travel, its direction, and the normal of whatever it met. */
const step = new THREE.Vector3()
const heading = new THREE.Vector3()
const normal = new THREE.Vector3()

/** Is `o` the object itself, or hanging off it? */
function partOf(o: THREE.Object3D | null, root: THREE.Object3D) {
  while (o) {
    if (o === root) return true
    o = o.parent
  }
  return false
}

/**
 * Throw whatever is in hand along the camera axis.
 *
 * Returns false if your hands were empty, so the caller can fall through to
 * whatever a plain click would have done.
 */
export function throwHeld(camera: THREE.Camera) {
  if (!held) return false
  const { object, grip } = held
  gripWorld(object, grip, scratch)
  camera.getWorldDirection(forward)
  inFlight.push({
    object,
    grip,
    p: scratch.clone(),
    // a little lift on it, or a throw reads as a shove
    v: forward.clone().multiplyScalar(17).setY(forward.y * 17 + 3.4),
    spin: new THREE.Vector3(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 22,
    ),
  })
  held = null
  return true
}

/**
 * Fly everything that is in the air, and rest it where it lands.
 *
 * The surface is found by casting straight down from the object each frame,
 * the same way putting something down works — so a thrown mug comes to rest
 * on a desk if it clears one, and on the carpet if it does not.
 */
/** Is it, and everything above it, visible? The hidden floor's carpet is not a floor. */
function onShow(o: THREE.Object3D | null) {
  for (; o; o = o.parent) if (!o.visible) return false
  return true
}

export function stepThrown(dt: number, scene: THREE.Scene, camera: THREE.Camera) {
  if (!inFlight.length) return
  stirShadows()
  raycaster.camera = camera
  for (let i = inFlight.length - 1; i >= 0; i--) {
    const f = inFlight[i]
    const wasY = f.p.y
    f.v.y -= 30 * dt

    /*
      Sideways first: a swept ray along this step's travel, so a mug thrown
      at the glass meets the glass. The only ray used to be the one straight
      down for the floor, and a throw at the window sailed through it and
      landed on the city sixty feet below. Whatever it hits — glass, wall,
      partition, the fridge — it bounces off, losing most of its speed.
    */
    step.copy(f.v).multiplyScalar(dt)
    const travel = step.length()
    if (travel > 1e-4) {
      heading.copy(step).divideScalar(travel)
      raycaster.set(f.p, heading)
      raycaster.far = travel + 0.3
      const wall = raycaster
        .intersectObjects(scene.children, true)
        .find((h) => !partOf(h.object, f.object) && onShow(h.object))
      if (wall) {
        const n = wall.face
          ? normal.copy(wall.face.normal).transformDirection(wall.object.matrixWorld)
          : normal.copy(heading).negate()
        // back off the surface, then reflect and damp
        f.p.copy(wall.point).addScaledVector(n, 0.3)
        f.v.addScaledVector(n, -2 * f.v.dot(n)).multiplyScalar(0.35)
        f.spin.multiplyScalar(0.7)
        step.copy(f.v).multiplyScalar(dt)
      }
    }
    f.p.add(step)
    f.object.rotation.x += f.spin.x * dt
    f.object.rotation.y += f.spin.y * dt
    f.object.rotation.z += f.spin.z * dt

    /*
      Swept, not sampled.

      The ray starts where the object was at the top of the step, not where it
      is now, and reaches far enough to cover the whole descent. Cast from the
      new position instead and a fast fall steps straight past the carpet in
      one frame — the floor is then behind the ray, the next thing under it is
      the city 60 ft down, and the mug follows it.
    */
    from.set(f.p.x, Math.max(wasY, f.p.y) + 0.1, f.p.z)
    raycaster.set(from, down)
    raycaster.far = Math.max(0.6, wasY - f.p.y + 1.2)
    const hit = raycaster
      .intersectObjects(scene.children, true)
      .find((h) => !partOf(h.object, f.object) && onShow(h.object))
    // And a hard backstop, so nothing can end up under the slab whatever the
    // ray did or did not find.
    const restY = Math.max(hit ? hit.point.y + 0.05 : 0.05, 0.05)

    if (f.p.y <= restY) {
      f.p.y = restY
      if (f.v.y < -3.2) {
        f.v.y = -f.v.y * 0.28
        f.v.x *= 0.55
        f.v.z *= 0.55
        f.spin.multiplyScalar(0.6)
      } else {
        place(f)
        inFlight.splice(i, 1)
        continue
      }
    }
    place(f)
  }
}

/** Write a flying object's origin from where its base is. */
function place(f: Thrown) {
  gripWorld(f.object, f.grip, scratch)
  f.object.getWorldPosition(origin)
  scratch.sub(origin).negate().add(f.p)
  if (f.object.parent) f.object.parent.worldToLocal(scratch)
  f.object.position.copy(scratch)
}
