import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import { CAR, CLO, HALF, LIFT_BAY, LOBBY, RESTROOMS, RX0, RX1 } from '../scene/constants'
import { floorYB2, inBoundsB2 } from '../scene/b2'
import { colliders } from '../lib/registry'
import { heldStyle, stepThrown, updateHeld } from '../lib/pickup'
import { holdSocket, updateAvatar } from '../lib/avatar'
import { live, office, useOffice } from '../state/store'

/** Where the player is, in feet, plus where they are looking. */
const player = {
  x: 3,
  z: 13,
  /** Height of the floor under her: 0 except on B2's box stairs and boxes. */
  y: 0,
  yaw: 0,
  pitch: 0,
  /** Body radius used for collision. */
  r: 0.9,
  /** Eye height. */
  eye: 5.6,
}

const keys: Record<string, boolean> = {}

/**
 * The jump. Space with nothing to open under the crosshair calls this.
 *
 * Vertical speed, and whether she is on the floor to push off from. The
 * floor is a height map she eases toward every frame — that easing is the
 * climb up a stair — so while there is any upward speed the easing stands
 * aside and gravity has her, and she lands back on whatever the map says.
 * The same 30 ft/s² the thrown mugs fall at; 9.5 up is a hop of a foot and
 * a half, which clears nothing and is the point.
 */
const GRAVITY = 30
const JUMP = 9.5
let vy = 0
let grounded = true
export function jump() {
  if (!grounded) return
  vy = JUMP
  grounded = false
}

/**
 * The watch zoom: the degrees the lens closes to while her wrist is up.
 *
 * It is what makes a one-inch dial a thing you can read. Nothing moves — she
 * is not holding the watch any closer to her face — and the room it opens
 * back up to is whatever the Canvas built the camera at, read off the camera
 * on the first frame rather than assumed.
 */
const WATCH_FOV = 34

/**
 * Is this spot floor?
 *
 * The lift car is floor on every level — it is where you are while the level
 * changes. Past that, each floor has its own footprint.
 */
function inBounds(x: number, z: number) {
  const r = player.r
  if (x > CAR.x0 + r && x < CAR.x1 - r && z > CAR.z0 - r && z < CAR.z1 - r) return true
  return office().floor === 'b2' ? inBoundsB2(x, z, r) : inBounds23(x, z)
}

/**
 * The 23rd floor is not one rectangle.
 *
 * The suite is the main plate; the lift lobby hangs off its south wall and the
 * storage room off its east wall. A spot is in bounds if it falls inside any
 * of them, and the walls between are ordinary colliders.
 */
function inBounds23(x: number, z: number) {
  const r = player.r

  // the suite itself
  if (x > RX0 + r && x < RX1 - r && z > -HALF + r && z < HALF - r) return true

  // the lift lobby, through the opening in the south wall
  if (x > LOBBY.x0 + r && x < LOBBY.x1 - r && z > HALF - r && z < LOBBY.z1 - r) return true

  // and the lift bay bumped out of the middle of its south wall
  if (
    x > LIFT_BAY.x0 + r &&
    x < LIFT_BAY.x1 - r &&
    z > LOBBY.z1 - r &&
    z < LIFT_BAY.z1 - r
  ) {
    return true
  }

  // the restrooms: always floor, it is the shut door that is the collider
  for (const room of [RESTROOMS.women, RESTROOMS.men]) {
    if (x > room.x0 + r && x < room.x1 - r && z > room.z0 - r && z < room.z1 - r) return true
  }

  // the storage room, once its door has been opened
  if (
    live.doorAngle < -0.9 &&
    x > RX1 - r &&
    x < CLO.x1 - r &&
    z > CLO.z0 + r &&
    z < CLO.z1 - r
  ) {
    return true
  }

  return false
}

/** Does the player's body overlap a registered footprint at this spot? */
function hitsCollider(x: number, z: number) {
  const r = player.r
  const floor = office().floor
  for (const c of colliders) {
    // the other floor is right here too, just not visible
    if (c.floor && c.floor !== floor) continue
    // a wall from the floor, nothing from the stair that lands on top of it;
    // a parapet up there, nothing from the floor beneath it
    if (c.below !== undefined && player.y >= c.below) continue
    if (c.above !== undefined && player.y < c.above) continue
    if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) return true
  }
  return false
}

/**
 * Slide along walls: try each axis on its own rather than cancelling the move.
 *
 * If the player is already inside a footprint, colliders are ignored for that
 * step so they can walk back out. Colliders come and go — the safe door and
 * the fridge door each register one only while they are open — and one that
 * appears around you would otherwise refuse every direction and leave you
 * standing in it for good.
 */
function tryMove(dx: number, dz: number) {
  const stuck = hitsCollider(player.x, player.z)
  const blocked = (x: number, z: number) =>
    !inBounds(x, z) || (!stuck && hitsCollider(x, z))
  if (!blocked(player.x + dx, player.z)) player.x += dx
  if (!blocked(player.x, player.z + dz)) player.z += dz
}

export function Player() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const setLocked = useOffice((s) => s.setLocked)
  const bobT = useRef(0)
  /** What the Canvas set the field of view to, before the watch narrowed it. */
  const openFov = useRef(0)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const o = office()

      /*
        While the watch is up it has the keyboard. The arrows turn its pages,
        T or backspace puts the wrist down, and nothing else gets through —
        you are looking at your watch, not walking about with it.
      */
      if (o.watch.open) {
        // reload and the devtools are still the browser's
        if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
        if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') o.turnWatch(-1)
        else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') o.turnWatch(1)
        else if (e.code === 'KeyT' || e.code === 'Backspace' || e.code === 'Escape') {
          o.closeWatch()
        } else return
        // only the keys it actually answers to: an arrow would scroll, and
        // backspace, on an old enough browser, would leave the page
        e.preventDefault()
        return
      }

      // T brings it up, once she is actually in the room.
      if (e.code === 'KeyT' && !e.repeat && o.locked) {
        // Let go of everything on her behalf: a key held down through the
        // whole page-turning business would walk her into a wall.
        for (const k in keys) keys[k] = false
        o.toggleWatch()
        return
      }

      keys[e.code] = true
    }
    const up = (e: KeyboardEvent) => {
      keys[e.code] = false
    }
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return
      // the head stays where it was while she reads the dial
      if (office().watch.open) return
      player.yaw -= e.movementX * 0.0022
      player.pitch -= e.movementY * 0.0022
      player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch))
    }
    const lockChange = () => {
      const locked = document.pointerLockElement === gl.domElement
      setLocked(locked)
      // the mouse is back on the desktop: the wrist goes down with it
      if (!locked) office().closeWatch()
    }

    addEventListener('keydown', down)
    addEventListener('keyup', up)
    document.addEventListener('mousemove', move)
    document.addEventListener('pointerlockchange', lockChange)
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('pointerlockchange', lockChange)
    }
  }, [gl, setLocked])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    // Q runs too: Shift doubles as the throw modifier, so give speed its own key.
    const sp = (keys.ShiftLeft || keys.KeyQ ? 9 : 6) * dt

    let fx = 0
    let fz = 0
    if (keys.KeyW || keys.ArrowUp) fz -= 1
    if (keys.KeyS || keys.ArrowDown) fz += 1
    if (keys.KeyA || keys.ArrowLeft) fx -= 1
    if (keys.KeyD || keys.ArrowRight) fx += 1

    const moving = fx !== 0 || fz !== 0
    if (moving) {
      const l = Math.hypot(fx, fz)
      fx /= l
      fz /= l
      const s = Math.sin(player.yaw)
      const c = Math.cos(player.yaw)
      tryMove((fx * c + fz * s) * sp, (-fx * s + fz * c) * sp)
      bobT.current += dt
    }

    // Stairs are ramps in the height map; easing toward them is the climb.
    const floorY = office().floor === 'b2' ? floorYB2(player.x, player.z, player.y) : 0
    if (!grounded) {
      // in the air: gravity, then the floor catches her
      vy -= GRAVITY * dt
      player.y += vy * dt
      if (vy < 0 && player.y <= floorY) {
        player.y = floorY
        vy = 0
        grounded = true
      }
    } else {
      player.y += (floorY - player.y) * Math.min(1, dt * 14)
    }

    const bob = moving ? Math.sin(bobT.current * 11) * 0.06 : 0
    // the lens closes onto the dial while the watch is up, and opens again
    const cam = camera as THREE.PerspectiveCamera
    if (!openFov.current) openFov.current = cam.fov
    const fov = office().watch.open ? WATCH_FOV : openFov.current
    if (cam.fov !== fov) {
      cam.fov += (fov - cam.fov) * Math.min(1, dt * 9)
      if (Math.abs(fov - cam.fov) < 0.05) cam.fov = fov
      cam.updateProjectionMatrix()
    }

    camera.position.set(player.x, player.y + player.eye + bob, player.z)
    camera.rotation.set(0, 0, 0)
    camera.rotation.order = 'YXZ'
    camera.rotation.y = player.yaw
    camera.rotation.x = player.pitch

    // The body goes where the camera went, then whatever is in its hand
    // goes where the hand went, and whatever was thrown is still in the air.
    updateAvatar(
      { x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch,
        eye: player.eye, moving, phase: bobT.current, bob, holding: heldStyle(), watch: office().watch.open },
      dt,
    )
    updateHeld(camera, holdSocket())
    stepThrown(dt, scene, camera)
  })

  return null
}

export { player }
