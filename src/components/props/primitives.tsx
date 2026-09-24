import { useContext, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { addCollider, removeCollider, type Collider as ColliderBox } from '../../lib/registry'
import { FloorContext } from '../../scene/floors'

/** Register a walk-blocking footprint. Renders nothing. */
export function Collider({ minX, maxX, minZ, maxZ, below, above }: ColliderBox) {
  const floor = useContext(FloorContext)
  const ref = useRef<ColliderBox | null>(null)
  ref.current ??= { minX, maxX, minZ, maxZ }
  const c = ref.current
  c.minX = minX
  c.maxX = maxX
  c.minZ = minZ
  c.maxZ = maxZ
  c.floor = floor
  c.below = below
  c.above = above
  useEffect(() => {
    addCollider(c)
    return () => removeCollider(c)
  }, [c])
  return null
}

/** Collider from a centre point and a footprint size. */
export function BoxCollider({
  x,
  z,
  w,
  d,
}: {
  x: number
  z: number
  w: number
  d: number
}) {
  return <Collider minX={x - w / 2} maxX={x + w / 2} minZ={z - d / 2} maxZ={z + d / 2} />
}

export interface BoxProps {
  size: [number, number, number]
  material: THREE.Material | THREE.Material[]
  position: [number, number, number]
  rotation?: [number, number, number]
  cast?: boolean
  receive?: boolean
  /** Also block the player, using the box footprint. */
  collide?: boolean
}

/**
 * The workhorse. Nearly every object in the suite is one of these.
 *
 * Mirrors the `box()` helper the original scene was written around, including
 * its default of casting a shadow unless told otherwise.
 */
export function Box({
  size,
  material,
  position,
  rotation,
  cast = true,
  receive = true,
  collide = false,
}: BoxProps) {
  const [w, , d] = size
  const [x, , z] = position
  return (
    <>
      <mesh
        position={position}
        rotation={rotation}
        material={material}
        castShadow={cast}
        receiveShadow={receive}
      >
        <boxGeometry args={size} />
      </mesh>
      {collide && <BoxCollider x={x} z={z} w={w} d={d} />}
    </>
  )
}

/** A flat picture — poster, sign, nameplate, screen. */
export function Panel({
  size,
  material,
  position,
  rotation,
}: {
  size: [number, number]
  material: THREE.Material
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <planeGeometry args={size} />
    </mesh>
  )
}
