import { useContext, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FloorContext, type FloorId } from '../scene/floors'

/** An axis-aligned footprint the player cannot walk through. */
export interface Collider {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  /** Which floor it is on. Both floors share a footprint; only one counts. */
  floor?: FloorId
  /**
   * Only blocks while the player is lower than this. The solid under a box
   * is a wall from the floor and nothing from the stair that lands on top.
   */
  below?: number
  /** Only blocks while the player is at least this high: a balcony parapet is nothing from the floor beneath. */
  above?: number
}

/**
 * Colliders and clickables live outside React on purpose.
 *
 * The player reads the collider list every frame and the raycast reads the
 * clickable list on every mousedown. Neither should cause a render, so they
 * are plain module-level arrays that components add to and remove from.
 */
export const colliders: Collider[] = []

export function addCollider(c: Collider): Collider {
  colliders.push(c)
  return c
}

export function removeCollider(c: Collider) {
  const i = colliders.indexOf(c)
  if (i >= 0) colliders.splice(i, 1)
}

/** Register a static footprint for the life of the component. */
export function useCollider(minX: number, maxX: number, minZ: number, maxZ: number) {
  const floor = useContext(FloorContext)
  const ref = useRef<Collider | null>(null)
  if (ref.current === null) ref.current = { minX, maxX, minZ, maxZ }
  const c = ref.current
  c.minX = minX
  c.maxX = maxX
  c.minZ = minZ
  c.maxZ = maxZ
  c.floor = floor
  useEffect(() => {
    addCollider(c)
    return () => removeCollider(c)
  }, [c])
  return c
}

/** Register a box footprint centred on x,z. */
export function useBoxCollider(x: number, z: number, w: number, d: number) {
  return useCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2)
}

// ---- clickables -------------------------------------------------------------

export type ClickHandler = () => void

/**
 * Objects the centre-screen crosshair can hit.
 *
 * R3F's own pointer events raycast through the mouse position, which is frozen
 * while the pointer is locked. This scene aims with the crosshair instead, so
 * it keeps its own list and raycasts straight down the camera axis.
 */
export const clickables: THREE.Object3D[] = []

export function addClickable(o: THREE.Object3D, onClick: ClickHandler) {
  o.userData.onClick = onClick
  clickables.push(o)
}

export function removeClickable(o: THREE.Object3D) {
  const i = clickables.indexOf(o)
  if (i >= 0) clickables.splice(i, 1)
  delete o.userData.onClick
}

/** Make the referenced object clickable while the component is mounted. */
export function useClickable(
  ref: React.RefObject<THREE.Object3D | null>,
  onClick: ClickHandler,
) {
  const handler = useRef(onClick)
  handler.current = onClick
  useEffect(() => {
    const o = ref.current
    if (!o) return
    addClickable(o, () => handler.current())
    return () => removeClickable(o)
  }, [ref])
}

// ---- openables --------------------------------------------------------------

/**
 * Things the space bar opens: doors, the fridge, the safe.
 *
 * A second list rather than a flag on the first, because the two verbs aim
 * the same way but mean different things. Click is for what you can pick up
 * and what you can press; space is for what swings.
 */
export const openables: THREE.Object3D[] = []

export function addOpenable(o: THREE.Object3D, onOpen: ClickHandler) {
  o.userData.onOpen = onOpen
  openables.push(o)
}

export function removeOpenable(o: THREE.Object3D) {
  const i = openables.indexOf(o)
  if (i >= 0) openables.splice(i, 1)
  delete o.userData.onOpen
}

/** Make the referenced object open on space while the component is mounted. */
export function useOpenable(
  ref: React.RefObject<THREE.Object3D | null>,
  onOpen: ClickHandler,
) {
  const handler = useRef(onOpen)
  handler.current = onOpen
  useEffect(() => {
    const o = ref.current
    if (!o) return
    addOpenable(o, () => handler.current())
    return () => removeOpenable(o)
  }, [ref])
}
