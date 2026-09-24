import { useMemo } from 'react'
import * as THREE from 'three'
import { mat } from '../scene/materials'
import { HALF } from '../scene/constants'
import { kanbanTex, onCallTex } from '../textures/signage'
import { Box, Panel } from './props/primitives'
import { MarkerTray } from './props/Furniture'

/** Kanban board on the south wall of the main suite. DO NOT ERASE — Liz. */
export function KanbanBoard() {
  const board = useMemo(
    () => new THREE.MeshStandardMaterial({ map: kanbanTex(), roughness: 0.35 }),
    [],
  )
  return (
    <>
      <Panel
        size={[10, 5]}
        material={board}
        position={[-8, 4.6, HALF - 0.15]}
        rotation={[0, Math.PI, 0]}
      />
      <Box
        size={[10.3, 5.3, 0.12]}
        material={mat.steel}
        position={[-8, 4.6, HALF - 0.08]}
        cast={false}
      />
      <MarkerTray x={-8} z={HALF - 0.25} />
    </>
  )
}

/** The wing's board: on-call rota, an open HVAC ticket, a carpool nobody signed. */
export function OnCallBoard() {
  const board = useMemo(
    () => new THREE.MeshStandardMaterial({ map: onCallTex(), roughness: 0.35 }),
    [],
  )
  return (
    <>
      <Panel
        size={[9, 4.5]}
        material={board}
        position={[34, 4.6, HALF - 0.15]}
        rotation={[0, Math.PI, 0]}
      />
      <Box
        size={[9.3, 4.8, 0.12]}
        material={mat.steel}
        position={[34, 4.6, HALF - 0.08]}
        cast={false}
      />
    </>
  )
}
