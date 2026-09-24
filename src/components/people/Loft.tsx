import { useMemo } from 'react'
import type * as THREE from 'three'
import { limbGeometry, loftGeometry, type LoftOptions, type Ring } from '../../lib/loft'

type V3 = [number, number, number]

/**
 * A lofted surface: a skin over a stack of cross-sections. See lib/loft.ts.
 *
 * `rings` wants to be a module-level constant (or memoized): the geometry is
 * rebuilt when its identity changes and not otherwise.
 */
export function Loft({
  rings,
  material,
  position,
  rotation,
  scale,
  ...o
}: LoftOptions & {
  rings: Ring[]
  material: THREE.Material
  position?: V3
  rotation?: V3
  scale?: V3
}) {
  const { segs, smooth, cap, open, span, tuck } = o
  // `open` and `span` are usually inline functions; they are read when the rings change
  const geometry = useMemo(() => loftGeometry(rings, { segs, smooth, cap, open, span, tuck }), [rings, segs, smooth, cap, tuck])
  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} scale={scale} />
}

/**
 * A sleeve or a trouser leg: a loft run from `a` to `b`. `radii` are
 * [fraction along, across, front-to-back] — see limbGeometry.
 */
export function Limb({
  a,
  b,
  radii,
  material,
  segs = 12,
  smooth = 0,
  cap = 'both',
}: {
  a: V3
  b: V3
  radii: Array<[number, number, number?]>
  material: THREE.Material
  segs?: number
  smooth?: number
  cap?: LoftOptions['cap']
}) {
  const geometry = useMemo(
    () => limbGeometry(a, b, radii, { segs, smooth, cap }),
    // the ends move with a pose; the section list is a constant
    [a[0], a[1], a[2], b[0], b[1], b[2], radii, segs, smooth, cap],
  )
  return <mesh geometry={geometry} material={material} />
}
