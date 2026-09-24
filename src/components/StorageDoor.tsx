import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { DOOR_Z0, DOOR_Z1, H, RX1 } from '../scene/constants'

/**
 * Wall infill above the door casing.
 *
 * Runs all the way to the storage room's exposed deck rather than to the
 * suite's drop ceiling, so there is no slot to see daylight through.
 */
const HEADER_TOP = H + 1.4
const HEADER_H = HEADER_TOP - 7.3
import { storageDoorSignTex } from '../textures/signage'
import { useOpenable } from '../lib/registry'
import { live, stirShadows, useOffice } from '../state/store'
import { Box, Panel } from './props/primitives'

/**
 * The storage-room door, hinged at the north jamb and swinging into the wing.
 *
 * The swing is eased toward its target every frame and the current angle is
 * published to `live`, because the player's collision test needs to know
 * whether the storage room counts as walkable yet.
 */
export function StorageDoor() {
  const pivot = useRef<THREE.Group>(null)
  const knob = useRef<THREE.Mesh>(null)
  const toggleDoor = useOffice((s) => s.toggleDoor)

  const leafMat = useMemo(() => M(0x5a4a3a, { roughness: 0.6 }), [])
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: storageDoorSignTex() }),
    [],
  )

  useOpenable(knob, toggleDoor)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = useOffice.getState().doorOpen ? -1.95 : 0
    const before = live.doorAngle
    live.doorAngle += (target - live.doorAngle) * Math.min(1, dt * 5)
    if (Math.abs(live.doorAngle - before) > 1e-4) stirShadows()
    if (pivot.current) pivot.current.rotation.y = live.doorAngle
  })

  const midZ = (DOOR_Z0 + DOOR_Z1) / 2

  return (
    <>
      <group ref={pivot} position={[RX1, 0, DOOR_Z0 + 0.1]}>
        <mesh position={[0, 3.5, 1.6]} material={leafMat} castShadow>
          <boxGeometry args={[0.12, 7, 3.2]} />
        </mesh>
        <mesh position={[-0.16, 3.3, 1.7]} material={mat.steel}>
          <boxGeometry args={[0.16, 0.16, 2.4]} />
        </mesh>
        <mesh position={[-0.02, 0.6, 1.6]} material={mat.steel}>
          <boxGeometry args={[0.14, 1.0, 3.0]} />
        </mesh>
        <Panel
          size={[1.1, 0.8]}
          material={signMat}
          position={[-0.07, 4.6, 1.6]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </group>

      {/* frame: jambs, head casing, and the wall above the opening */}
      <Box size={[0.1, 7.3, 0.25]} material={mat.dark} position={[RX1 - 0.05, 3.65, DOOR_Z0]} cast={false} />
      <Box size={[0.1, 7.3, 0.25]} material={mat.dark} position={[RX1 - 0.05, 3.65, DOOR_Z1]} cast={false} />
      <Box size={[0.35, 0.3, 3.7]} material={mat.dark} position={[RX1, 7.15, midZ]} cast={false} />
      {/* Storage is not a means of egress, so no exit sign — just infill
          closing the wall from the head casing up to the ceiling. */}
      <Box
        size={[0.5, HEADER_H, DOOR_Z1 - DOOR_Z0 + 0.5]}
        material={mat.wall}
        position={[RX1, 7.3 + HEADER_H / 2, midZ]}
        cast={false}
      />

      {/* invisible click target covering the whole leaf */}
      <mesh ref={knob} position={[RX1 - 0.25, 3.3, midZ]} visible={false}>
        <boxGeometry args={[0.5, 6.4, 3.2]} />
      </mesh>
    </>
  )
}
