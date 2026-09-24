import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { useClickable } from '../../lib/registry'
import { useOffice } from '../../state/store'

/**
 * Something you pick up and keep, rather than carry in your hands.
 *
 * `Pickable` is the other one: it lifts a mug or the duck, holds it in front
 * of the camera, and sets it down again. This takes the object out of the
 * world for good and puts its id in the inventory, where the HUD can show it
 * and a lock can ask for it.
 */
export function Collectable({
  id,
  label,
  hint,
  reach = 0.55,
  children,
}: {
  id: string
  /** Shown in the inventory strip. */
  label: string
  /** Said once, when you take it. */
  hint?: string
  /**
   * Size of the invisible box you actually have to hit, in feet.
   *
   * A key is three inches of brass and a crosshair is one pixel. Without
   * something bigger than the geometry to aim at, finding it is one thing and
   * picking it up is another.
   */
  reach?: number
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const collect = useOffice((s) => s.collect)
  const showHint = useOffice((s) => s.showHint)
  const held = useOffice((s) => s.inventory.includes(id))

  useClickable(ref, () => {
    collect(id)
    showHint(hint ?? `Picked up the ${label}.`, 3000)
  })

  // Once it is yours it is not on the floor any more.
  return (
    <group ref={ref} visible={!held}>
      {!held && (
        <>
          {children}
          <mesh visible={false}>
            <boxGeometry args={[reach, reach, reach]} />
          </mesh>
        </>
      )}
    </group>
  )
}
