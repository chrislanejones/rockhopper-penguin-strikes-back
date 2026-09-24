import { useMemo, type ReactNode } from 'react'
import type * as THREE from 'three'
import { hairGeometry, type Face, type FaceRole, type HairSpec } from '../../lib/face'

/**
 * A head: the skull and everything on the front of it, from lib/face.ts,
 * as ordinary meshes. The origin is the bottom of the chin and the face is
 * -z; put it in a group to turn it. Children go in the same frame — hair,
 * glasses — and `face.at(x, y)` says where the surface is for them.
 */
export function Head({
  face,
  mats,
  children,
}: {
  face: Face
  mats: Record<FaceRole, THREE.Material>
  children?: ReactNode
}) {
  return (
    <>
      {face.parts.map((p) => (
        <mesh
          key={p.key}
          geometry={p.geometry}
          material={mats[p.role]}
          position={p.position}
          rotation={p.rotation}
          scale={p.scale}
        />
      ))}
      {children}
    </>
  )
}

/** Hair over a Head's skull: the skull's own rings a size up, with the hairline cut out. */
export function Hair({ face, hair, material }: { face: Face; hair: HairSpec; material: THREE.Material }) {
  const geometry = useMemo(() => hairGeometry(face, hair), [face, hair])
  return <mesh geometry={geometry} material={material} />
}
