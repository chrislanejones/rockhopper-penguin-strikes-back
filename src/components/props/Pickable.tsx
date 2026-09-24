import { useEffect, useRef, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useClickable } from '../../lib/registry'
import { getHeld, pickUp, putDown } from '../../lib/pickup'
import { useOffice } from '../../state/store'

/** How a thing sits in the hand. */
export type HoldStyle = 'palm' | 'grip'

/**
 * Wraps a desk toy, a mug, anything small enough to carry.
 *
 * Click it to lift it, click again to set it down on whatever is below. The
 * group is registered rather than the individual meshes, so the whole prop
 * comes with you instead of the one polygon you happened to hit.
 *
 * Most things are carried on an open palm. A `grip` item is held by a handle
 * instead — `gripAt` says where that handle is in the item's own frame, its
 * +X is treated as "forward" and kept along the view — and while it is in
 * hand a plain click calls `onUse` rather than putting it down; shift-click
 * drops it.
 */
export function Pickable({
  label,
  hold = 'palm',
  gripAt,
  onUse,
  children,
}: {
  label: string
  hold?: HoldStyle
  gripAt?: [number, number, number]
  onUse?: () => void
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const showHint = useOffice((s) => s.showHint)
  const setHolding = useOffice((s) => s.setHolding)
  const use = useRef(onUse)
  use.current = onUse

  useEffect(() => {
    const o = ref.current
    if (!o) return
    o.userData.hold = hold
    o.userData.gripAt = gripAt
    o.userData.onUse = onUse ? () => use.current?.() : undefined
    return () => {
      delete o.userData.hold
      delete o.userData.gripAt
      delete o.userData.onUse
    }
  }, [hold, gripAt, onUse])

  useClickable(ref, () => {
    const object = ref.current
    if (!object) return
    if (getHeld()?.object === object) {
      putDown(scene, camera)
      setHolding(null)
      showHint(`Put the ${label} down.`)
      return
    }
    if (getHeld()) {
      showHint('Your hands are full.')
      return
    }
    pickUp(object)
    setHolding(label)
    showHint(
      onUse
        ? `Picked up the ${label}. Click to use it, shift-click to drop it.`
        : `Picked up the ${label}. Click to set it down, shift-click to throw.`,
      2800,
    )
  })

  return <group ref={ref}>{children}</group>
}
