import { useMemo } from 'react'
import * as THREE from 'three'
import { mat } from '../scene/materials'
import { RX1 } from '../scene/constants'
import { islandFlagTex } from '../textures/island'
import { Collider } from './props/primitives'

/** The 23rd floor's flag, beside the exit door. */
const FX = RX1 - 1.3
const FZ = 14.6

/** The pole, foot to finial. */
const POLE = 7.5
/** Where the cloth is gathered to the pole, just under the cord. */
const HOIST = 7.3
/** How far the cloth falls from there. */
const DROP = 5.4

/**
 * An indoor flag has no wind to open it, so rather than a rectangle this is
 * a cone deformed into the hang a flag actually takes: gathered tight under
 * the cord, fullest about two-thirds of the way down, then falling near
 * straight to a hem that dips between the folds. The hoist is stitched down
 * one side of the pole, so the cloth bellies away from it as it drops
 * instead of hanging centred on it like a lampshade.
 */
function useFlagGeometry() {
  return useMemo(() => {
    const R = 0.62
    const geo = new THREE.ConeGeometry(R, DROP, 48, 22, true, Math.PI * 0.1, Math.PI * 1.8)
    const pa = geo.attributes.position
    const uv = geo.attributes.uv
    const v = new THREE.Vector3()
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i)
      // 0 at the hoist, 1 at the hem
      const t = Math.min(1, Math.max(0, (DROP / 2 - v.y) / DROP))
      // the cone's own angle, from its UVs: at the apex every vertex sits on
      // the axis and atan2 would put them all in one place
      const th = Math.PI * 0.1 + uv.getX(i) * Math.PI * 1.8
      const body = Math.pow(Math.min(1, t * 1.5), 0.6) * (1 - 0.18 * t)
      const fold = Math.sin(th * 7) * 0.12 + Math.sin(th * 13 + 1.2) * 0.05
      const r = R * (0.1 + 0.9 * body) * (1 + fold * t) + 0.04
      pa.setX(i, Math.sin(th) * r + 0.22 * t)
      pa.setZ(i, Math.cos(th) * r)
      pa.setY(i, v.y - Math.pow(t, 2.2) * 0.3 + Math.sin(th * 7) * t * 0.16)
    }
    geo.computeVertexNormals()
    return geo
  }, [])
}

/**
 * A flag on a floor stand: weighted base, pole, ball and spear, the cloth
 * gathered under a cord with a tassel.
 *
 * Defaults to the island's flag by the suite's exit door. `ry` turns the
 * stand: the middle of the cloth — where the seal is — faces local -Z, so
 * ry = π/2 shows it to the west and ry = π to the south.
 */
export function Flag({
  x = FX,
  z = FZ,
  tex,
  ry = Math.PI / 2,
}: {
  x?: number
  z?: number
  tex?: THREE.Texture
  ry?: number
} = {}) {
  const geometry = useFlagGeometry()
  const cloth = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex ?? islandFlagTex(),
        side: THREE.DoubleSide,
        roughness: 0.95,
      }),
    [tex],
  )

  return (
    <>
      <mesh position={[x, 0.06, z]} material={mat.gold}>
        <cylinderGeometry args={[0.55, 0.65, 0.12, 24]} />
      </mesh>
      <mesh position={[x, POLE / 2 + 0.1, z]} material={mat.gold}>
        <cylinderGeometry args={[0.035, 0.045, POLE - 0.1, 12]} />
      </mesh>
      <mesh position={[x, POLE + 0.1, z]} material={mat.gold}>
        <sphereGeometry args={[0.09, 10, 8]} />
      </mesh>
      <mesh position={[x, POLE + 0.35, z]} material={mat.gold}>
        <coneGeometry args={[0.07, 0.35, 8]} />
      </mesh>

      <mesh
        geometry={geometry}
        material={cloth}
        position={[x, HOIST - DROP / 2, z]}
        rotation={[0, ry, 0]}
        castShadow
      />

      {/* cord and tassel where the flag gathers at the top */}
      <mesh position={[x, HOIST + 0.05, z]} rotation={[Math.PI / 2, 0, 0]} material={mat.gold}>
        <torusGeometry args={[0.12, 0.02, 6, 16]} />
      </mesh>
      <group position={[x, 0, z]} rotation={[0, ry, 0]}>
        <mesh position={[0.28, HOIST - 0.4, 0]} rotation={[0, 0, 0.25]} material={mat.gold}>
          <coneGeometry args={[0.09, 0.4, 10]} />
        </mesh>
        <mesh position={[0.2, HOIST, 0]} rotation={[0, 0, 0.5]} material={mat.gold}>
          <cylinderGeometry args={[0.015, 0.015, 0.9, 6]} />
        </mesh>
      </group>

      <Collider minX={x - 0.7} maxX={x + 0.7} minZ={z - 0.7} maxZ={z + 0.7} />
    </>
  )
}
