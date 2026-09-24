import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { clickables, openables } from '../lib/registry'
import { useOffice } from '../state/store'
import { getHeld, putDown, throwHeld } from '../lib/pickup'
import { reach } from '../lib/avatar'
import { jump } from './Player'

/**
 * Is the thing this object belongs to on show?
 *
 * Only the ancestors are checked, not the object itself: doors, the fridge,
 * the safe and the pocketable props all aim with an invisible box, and that
 * is fine. What is not fine is a can that has not dropped yet — its whole
 * group is hidden, parked at the origin.
 */
function shown(o: THREE.Object3D | null) {
  for (o = o?.parent ?? null; o; o = o.parent) if (!o.visible) return false
  return true
}

/**
 * Aiming is done with the crosshair, not the cursor.
 *
 * While the pointer is locked the mouse position stops updating, so R3F's own
 * pointer events would raycast at a stale spot. This fires a ray straight down
 * the middle of the screen instead, which is where the crosshair is.
 */
export function Interaction() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const centre = useMemo(() => new THREE.Vector2(0, 0), [])
  const ahead = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== el || e.button !== 0) return
      // her hands are busy holding her own wrist up
      if (useOffice.getState().watch.open) return

      /*
        Holding something? A click sets it down where you are looking, and
        shift-click throws it. Either way the click is spent on what is in
        your hands — you cannot open a door while carrying the duck.
      */
      if (getHeld()) {
        // Something with a trigger? Click pulls it; shift-click puts it down.
        const use = getHeld()!.object.userData.onUse as (() => void) | undefined
        if (use) {
          if (e.shiftKey) {
            putDown(scene, camera)
            useOffice.getState().setHolding(null)
          } else {
            use()
          }
          return
        }
        if (e.shiftKey) {
          // the arm goes out first, and the object leaves it
          camera.getWorldDirection(ahead)
          ahead.multiplyScalar(2.6).add(camera.position).setY(camera.position.y + 0.3)
          reach(ahead, false, 0.35)
          throwHeld(camera)
          useOffice.getState().showHint('Thrown.', 1400)
        } else {
          putDown(scene, camera)
        }
        // Either way your hands are empty now, and the HUD should say so.
        useOffice.getState().setHolding(null)
        return
      }

      ray.setFromCamera(centre, camera)
      ray.far = 9
      // Recursive, because a pickable prop registers its group, not its meshes.
      // The raycaster does not care about visibility; a can that has not
      // dropped yet is parked at the origin, and should not be pickable there.
      const hit = ray.intersectObjects(clickables, true).find((h) => shown(h.object))
      if (!hit) return
      reach(hit.point, false)
      // Walk up to whichever ancestor actually carries the handler.
      let o: THREE.Object3D | null = hit.object
      while (o && !o.userData.onClick) o = o.parent
      o?.userData.onClick?.()
    }
    /*
      Space opens whatever the crosshair is on, and is a jump when it is on
      nothing that opens.

      Same ray, different list: a door, the fridge and the safe are not things
      you pick up, and putting them on the same button as the mugs meant a
      click near a desk was a coin toss between carrying something and opening
      something.
    */
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || document.pointerLockElement !== el) return
      // the watch has the keyboard while it is up, jumping included
      if (useOffice.getState().watch.open) return
      e.preventDefault()
      if (e.repeat) return

      ray.setFromCamera(centre, camera)
      ray.far = 9
      const hit = ray.intersectObjects(openables, true).find((h) => shown(h.object))
      // Nothing to open: the same key is a jump.
      if (!hit) return jump()
      // The free hand goes to the handle, and the door swings as it gets there.
      reach(hit.point, getHeld() !== null)
      let o: THREE.Object3D | null = hit.object
      while (o && !o.userData.onOpen) o = o.parent
      o?.userData.onOpen?.()
    }

    el.addEventListener('mousedown', onDown)
    addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('mousedown', onDown)
      removeEventListener('keydown', onKey)
    }
  }, [camera, gl, scene, ray, centre])

  return null
}
