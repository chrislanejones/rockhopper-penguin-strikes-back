import { useMemo } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { CLO_OLD, closetToWorld } from '../scene/constants'
import { badgeTex, stickyTex } from '../textures/signage'
import { Collider, Panel } from './props/primitives'

// In the old room's frame — see CLO_OLD. Turned into place by StorageCloset.
const SKX = CLO_OLD.x1 - 2.6
const SKZ = CLO_OLD.z0 + 2.4

/**
 * One arm or leg: upper bone, joint, lower bone, then a hand or a foot.
 *
 * Returns nothing clever — the anatomy is approximate and only has to read as
 * a teaching skeleton from six feet away.
 */
function Limb({
  x,
  yTop,
  len1,
  len2,
  rot,
  foot,
  bone,
}: {
  x: number
  yTop: number
  len1: number
  len2: number
  rot: number
  foot: boolean
  bone: THREE.Material
}) {
  const jointX = x + Math.sin(-rot) * len1
  const lowerX = jointX + Math.sin(-rot * 0.4) * (len2 / 2)
  const endX = lowerX + Math.sin(-rot * 0.4) * (len2 / 2)
  const endY = yTop - len1 - len2

  return (
    <>
      <mesh position={[x, yTop - len1 / 2, 0]} rotation={[0, 0, rot]} material={bone}>
        <cylinderGeometry args={[0.075, 0.065, len1, 10]} />
      </mesh>
      <mesh position={[jointX, yTop - len1, 0]} material={bone}>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
      <mesh position={[lowerX, yTop - len1 - len2 / 2, 0]} rotation={[0, 0, rot * 0.4]} material={bone}>
        <cylinderGeometry args={[0.06, 0.05, len2, 10]} />
      </mesh>
      {foot ? (
        <mesh position={[endX, endY - 0.05, 0.12]} material={bone}>
          <boxGeometry args={[0.2, 0.1, 0.45]} />
        </mesh>
      ) : (
        <group position={[endX, endY, 0]}>
          {Array.from({ length: 4 }, (_, f) => (
            <mesh key={f} position={[-0.06 + f * 0.045, -0.14, 0]} material={bone}>
              <cylinderGeometry args={[0.022, 0.018, 0.28, 6]} />
            </mesh>
          ))}
        </group>
      )}
    </>
  )
}

/**
 * The teaching skeleton in the far corner of the storage room.
 *
 * Wears a Parliament contractor badge that expired in 2009 and a paper crown
 * from somebody's birthday. Nobody remembers which department it came from.
 */
export function Skeleton() {
  const bone = useMemo(() => M(0xe8e2d0, { roughness: 0.8 }), [])
  const socket = useMemo(() => M(0x14161a), [])
  const baseMat = useMemo(() => M(0x2b2d31), [])
  const lanyardMat = useMemo(() => M(0x1c3d8f), [])
  const crownMat = useMemo(
    () => M(0xd4a33a, { side: THREE.DoubleSide, roughness: 0.7 }),
    [],
  )
  const badgeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: badgeTex(), side: THREE.DoubleSide }),
    [],
  )
  const noteMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: stickyTex(['ticket #4471', 'waiting on', 'facilities']),
      }),
    [],
  )

  return (
    <>
      <group position={[SKX, 0, SKZ]} rotation={[0, -0.7, 0]}>
        {/* stand */}
        <mesh position={[0, 0.06, 0]} material={baseMat}>
          <cylinderGeometry args={[0.85, 0.95, 0.12, 20]} />
        </mesh>
        <mesh position={[0, 3.1, 0]} material={mat.steel}>
          <cylinderGeometry args={[0.06, 0.06, 6.2, 10]} />
        </mesh>
        <mesh position={[0, 6.1, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={mat.steel}>
          <torusGeometry args={[0.12, 0.02, 6, 14]} />
        </mesh>

        <group position={[0, 0, 0.34]}>
          {/* skull */}
          <mesh position={[0, 5.5, 0]} scale={[1, 1.08, 0.95]} material={bone}>
            <sphereGeometry args={[0.36, 18, 14]} />
          </mesh>
          <mesh position={[0, 5.17, 0.06]} rotation={[0.12, 0, 0]} material={bone}>
            <boxGeometry args={[0.42, 0.16, 0.34]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.14, 5.55, 0.29]} material={socket}>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
          ))}
          <mesh position={[0, 5.38, 0.32]} rotation={[Math.PI / 2, 0, 0]} material={socket}>
            <coneGeometry args={[0.06, 0.14, 3]} />
          </mesh>

          {/* spine */}
          {Array.from({ length: 14 }, (_, i) => (
            <mesh
              key={i}
              position={[0, 5.05 - i * 0.19, -0.02 + Math.sin(i * 0.4) * 0.03]}
              material={bone}
            >
              <cylinderGeometry args={[0.1 - i * 0.002, 0.1, 0.13, 10]} />
            </mesh>
          ))}

          {/* rib cage */}
          <group position={[0, 4.3, 0]}>
            <mesh position={[0, -0.25, 0.42]} material={bone}>
              <boxGeometry args={[0.12, 1.1, 0.06]} />
            </mesh>
            {Array.from({ length: 9 }, (_, i) => {
              const r = 0.52 - i * 0.018
              const y = -i * 0.19
              return [-1, 1].map((s) => (
                <mesh
                  key={`${i}:${s}`}
                  position={[0, y, 0.1]}
                  rotation={[Math.PI / 2, 0, s > 0 ? -0.15 : Math.PI + 0.15]}
                  scale={[1, 1, 0.7]}
                  material={bone}
                >
                  <torusGeometry args={[r, 0.035, 6, 18, Math.PI * 0.95]} />
                </mesh>
              ))
            })}
          </group>

          <mesh position={[0, 2.45, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.6]} material={bone}>
            <torusGeometry args={[0.34, 0.11, 8, 16]} />
          </mesh>

          {/* shoulders, arms and legs */}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.5, 4.35, 0]} material={bone}>
                <sphereGeometry args={[0.12, 10, 8]} />
              </mesh>
              <mesh position={[s * 0.26, 4.4, 0.12]} rotation={[0, 0, Math.PI / 2]} material={bone}>
                <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
              </mesh>
              <Limb x={s * 0.5} yTop={4.3} len1={1.25} len2={1.15} rot={s * 0.12} foot={false} bone={bone} />
              <Limb x={s * 0.24} yTop={2.35} len1={1.35} len2={1.2} rot={s * 0.06} foot bone={bone} />
            </group>
          ))}

          {/* Parliament badge on a lanyard */}
          <mesh position={[0, 4.85, 0.06]} rotation={[1.35, 0, 0]} material={lanyardMat}>
            <torusGeometry args={[0.3, 0.02, 6, 20]} />
          </mesh>
          <mesh position={[0, 4.5, 0.28]} material={lanyardMat}>
            <boxGeometry args={[0.05, 0.7, 0.02]} />
          </mesh>
          <Panel size={[0.52, 0.75]} material={badgeMat} position={[0, 4.05, 0.3]} />

          {/* a paper crown from somebody's birthday */}
          <mesh position={[0, 5.92, 0]} rotation={[0, 0, 0.12]} material={crownMat}>
            <cylinderGeometry args={[0.34, 0.36, 0.3, 16, 1, true]} />
          </mesh>
        </group>
      </group>

      {/* the note taped to the mast */}
      <Panel
        size={[0.75, 0.75]}
        material={noteMat}
        position={[SKX - 0.55, 4.2, SKZ + 0.15]}
        rotation={[0, -0.7, 0]}
      />
      <Collider {...closetToWorld({ minX: SKX - 1.1, maxX: SKX + 1.1, minZ: SKZ - 1.1, maxZ: SKZ + 1.1 })} />
    </>
  )
}
