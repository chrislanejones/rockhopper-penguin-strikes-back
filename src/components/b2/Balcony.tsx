import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { candela } from '../../scene/constants'
import { B2, BOOTH_TONGUE, STAGE_AT } from '../../scene/b2'
import { theatreCarpetTex, velvetTex } from '../../textures/b2'
import { Box, BoxCollider, Collider } from '../props/primitives'
import { BanquetChairs, Votives } from './Tables'

const { hall, balcony: B } = B2
const W = hall.x1 - hall.x0
const CX = (hall.x0 + hall.x1) / 2
/** The inner edge of the back arm. */
const BACK_EDGE = hall.z1 - B.back
/** The inner edges of the two side arms. */
const WEST_EDGE = hall.x0 + B.arm
const EAST_EDGE = hall.x1 - B.arm
/** How long each side arm is. */
const ARM_LEN = BACK_EDGE - B.front
const SLAB = 0.8
const RAIL_H = 2.6
/** Parapet colliders only count once she is up there. */
const UP = B.y - 2

/** Where every table on the balcony stands. */
const TABLES = [
  ...B.backXs.map((x) => ({ x, z: BACK_EDGE + 5.5 })),
  ...B.armZs.map((z) => ({ x: hall.x0 + B.armInset, z })),
  ...B.armZs.map((z) => ({ x: hall.x1 - B.armInset, z })),
]

/** Three chairs a table, on the side away from the stage, so everyone faces it. */
const CHAIRS = TABLES.flatMap((t) => {
  const toStage = Math.atan2(STAGE_AT.z - t.z, STAGE_AT.x - t.x)
  return [-0.85, 0, 0.85].map((d) => {
    const a = toStage + Math.PI + d
    return {
      x: t.x + Math.cos(a) * (B.r + 0.9),
      z: t.z + Math.sin(a) * (B.r + 0.9),
      ry: Math.PI / 2 - a,
    }
  })
})

/** Columns under the inner edges, every twelve feet, and two under the tongue. */
const COLUMNS: Array<[number, number]> = [
  ...Array.from({ length: 8 }, (_, i) => [WEST_EDGE + 4 + i * 12, BACK_EDGE + 0.8] as [number, number]),
  ...[-29, -18, -7].map((z) => [WEST_EDGE - 0.8, z] as [number, number]),
  ...[-29, -18, -7].map((z) => [EAST_EDGE + 0.8, z] as [number, number]),
  [BOOTH_TONGUE.x0 + 1, BOOTH_TONGUE.z0 + 1.2],
  [BOOTH_TONGUE.x1 - 1, BOOTH_TONGUE.z0 + 1.2],
]

/**
 * The balcony: a U round the back and both sides of the hall, eight feet up.
 *
 * A slab on columns, so the floor runs under it and the doors come in
 * beneath; a velvet parapet with a gilt cap along every inner edge; the
 * same carpet as downstairs. Tables along all three arms, three chairs each
 * on the far side so nobody has their back to the stage. Lit from
 * underneath as well, or the walk under it would be a cave.
 */
export function Balcony() {
  const slab = useMemo(() => M(0x3a2a22, { roughness: 0.85 }), [])
  const carpet = useMemo(() => {
    const t = theatreCarpetTex().clone()
    t.needsUpdate = true
    t.repeat.set(W / 4, B.back / 4)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1 })
  }, [])
  const armCarpet = useMemo(() => {
    const t = theatreCarpetTex().clone()
    t.needsUpdate = true
    t.repeat.set(B.arm / 4, ARM_LEN / 4)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1 })
  }, [])
  const tongueCarpet = useMemo(() => {
    const t = theatreCarpetTex().clone()
    t.needsUpdate = true
    t.repeat.set((BOOTH_TONGUE.x1 - BOOTH_TONGUE.x0) / 4, (BACK_EDGE - BOOTH_TONGUE.z0) / 4)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1 })
  }, [])
  const velvet = useMemo(
    () => new THREE.MeshStandardMaterial({ map: velvetTex(), roughness: 0.95 }),
    [],
  )
  const gilt = useMemo(() => M(0xb8912e, { roughness: 0.35, metalness: 0.75 }), [])
  const column = useMemo(() => M(0xc9b895, { roughness: 0.85 }), [])
  // the same Parliament blue as the rounds on the floor
  const cloth = useMemo(() => M(0x0d2a66, { roughness: 0.95 }), [])
  const can = useMemo(() => M(0x2e2622, { roughness: 0.5, metalness: 0.4 }), [])
  const canLens = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xfff0d8,
        emissiveIntensity: 1.4,
        roughness: 0.4,
      }),
    [],
  )
  const geo = useMemo(
    () => ({
      table: new THREE.CylinderGeometry(B.r + 0.05, B.r, 2.45, 24),
    }),
    [],
  )

  /** A parapet run: velvet, a gilt cap, and a collider that only counts up top. */
  const Parapet = ({
    x,
    z,
    w,
    d,
  }: {
    x: number
    z: number
    w: number
    d: number
  }) => (
    <>
      <Box size={[w, RAIL_H, d]} material={velvet} position={[x, B.y + RAIL_H / 2, z]} cast={false} />
      <Box size={[w + 0.2, 0.14, d + 0.2]} material={gilt} position={[x, B.y + RAIL_H + 0.07, z]} cast={false} />
      <Collider minX={x - w / 2} maxX={x + w / 2} minZ={z - d / 2} maxZ={z + d / 2} above={UP} />
    </>
  )

  /** The lights under it, so the walk beneath is a walk and not a cave. */
  const under: Array<[number, number]> = [
    [-20, BACK_EDGE + 7],
    [13, BACK_EDGE + 7],
    [46, BACK_EDGE + 7],
    [hall.x0 + 9, -13],
    [hall.x1 - 9, -13],
  ]

  return (
    <>
      {/* the three slabs, and carpet on each */}
      <Box size={[W, SLAB, B.back]} material={slab} position={[CX, B.y - SLAB / 2, BACK_EDGE + B.back / 2]} cast={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, B.y + 0.004, BACK_EDGE + B.back / 2]} material={carpet}>
        <planeGeometry args={[W, B.back]} />
      </mesh>
      {[hall.x0 + B.arm / 2, hall.x1 - B.arm / 2].map((x) => (
        <group key={x}>
          <Box size={[B.arm, SLAB, ARM_LEN]} material={slab} position={[x, B.y - SLAB / 2, B.front + ARM_LEN / 2]} cast={false} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, B.y + 0.004, B.front + ARM_LEN / 2]} material={armCarpet}>
            <planeGeometry args={[B.arm, ARM_LEN]} />
          </mesh>
        </group>
      ))}

      {/* the tongue: the U's middle prong, out over the floor, carrying the booth */}
      <Box
        size={[BOOTH_TONGUE.x1 - BOOTH_TONGUE.x0 + 0.4, SLAB, BACK_EDGE - BOOTH_TONGUE.z0 + 0.2]}
        material={slab}
        position={[(BOOTH_TONGUE.x0 + BOOTH_TONGUE.x1) / 2, B.y - SLAB / 2, (BOOTH_TONGUE.z0 - 0.2 + BACK_EDGE) / 2]}
        cast={false}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(BOOTH_TONGUE.x0 + BOOTH_TONGUE.x1) / 2, B.y + 0.004, (BOOTH_TONGUE.z0 + BACK_EDGE) / 2]}
        material={tongueCarpet}
      >
        <planeGeometry args={[BOOTH_TONGUE.x1 - BOOTH_TONGUE.x0, BACK_EDGE - BOOTH_TONGUE.z0]} />
      </mesh>

      {/* the tongue's own edges: the same parapet, down both sides and across the tip, or the prong is a seven-foot drop */}
      <Parapet
        x={BOOTH_TONGUE.x0 - 0.15}
        z={(BOOTH_TONGUE.z0 + BACK_EDGE) / 2}
        w={0.3}
        d={BACK_EDGE - BOOTH_TONGUE.z0}
      />
      <Parapet
        x={BOOTH_TONGUE.x1 + 0.15}
        z={(BOOTH_TONGUE.z0 + BACK_EDGE) / 2}
        w={0.3}
        d={BACK_EDGE - BOOTH_TONGUE.z0}
      />

      {/* the parapet along every inner edge — parted where the tongue sets out — and across the end of each arm */}
      <Parapet
        x={(WEST_EDGE - 0.3 + BOOTH_TONGUE.x0) / 2}
        z={BACK_EDGE + 0.15}
        w={BOOTH_TONGUE.x0 - WEST_EDGE + 0.3}
        d={0.3}
      />
      <Parapet
        x={(BOOTH_TONGUE.x1 + EAST_EDGE + 0.3) / 2}
        z={BACK_EDGE + 0.15}
        w={EAST_EDGE + 0.3 - BOOTH_TONGUE.x1}
        d={0.3}
      />
      <Parapet x={WEST_EDGE - 0.15} z={B.front + ARM_LEN / 2} w={0.3} d={ARM_LEN} />
      <Parapet x={EAST_EDGE + 0.15} z={B.front + ARM_LEN / 2} w={0.3} d={ARM_LEN} />
      <Parapet x={hall.x0 + B.arm / 2} z={B.front + 0.15} w={B.arm} d={0.3} />
      <Parapet x={hall.x1 - B.arm / 2} z={B.front + 0.15} w={B.arm} d={0.3} />

      {/* columns under the inner edges */}
      {COLUMNS.map(([x, z]) => (
        <group key={`${x}:${z}`}>
          <mesh position={[x, (B.y - SLAB) / 2, z]} material={column}>
            <cylinderGeometry args={[0.55, 0.65, B.y - SLAB, 16]} />
          </mesh>
          <Box size={[1.6, 0.4, 1.6]} material={gilt} position={[x, B.y - SLAB - 0.2, z]} cast={false} />
          <BoxCollider x={x} z={z} w={1.4} d={1.4} />
        </group>
      ))}

      {/* two soft pools over the back arm's tables, standing in for their lamps now the house is dark */}
      {[-14, 40].map((x) => (
        <pointLight
          key={x}
          position={[x, B.y + 5.5, BACK_EDGE + 6]}
          color={0xffd9a0}
          intensity={candela(0.5, 7)}
          distance={26}
          decay={2}
        />
      ))}

      {/* lights on the underside */}
      {under.map(([x, z]) => (
        <group key={`${x}:${z}`}>
          <mesh position={[x, B.y - SLAB - 0.2, z]} material={can}>
            <cylinderGeometry args={[0.45, 0.45, 0.4, 16]} />
          </mesh>
          <mesh position={[x, B.y - SLAB - 0.41, z]} rotation={[Math.PI / 2, 0, 0]} material={canLens}>
            <circleGeometry args={[0.36, 16]} />
          </mesh>
          <pointLight
            position={[x, B.y - SLAB - 0.8, z]}
            color={0xfff0d8}
            intensity={candela(0.9, 7)}
            distance={30}
            decay={2}
          />
        </group>
      ))}

      {/* the tables up here, in five instanced draws */}
      <Instances geometry={geo.table} material={cloth} limit={TABLES.length}>
        {TABLES.map((t, i) => (
          <Instance key={i} position={[t.x, B.y + 1.225, t.z]} />
        ))}
      </Instances>
      <Votives at={TABLES.map((t) => [t.x, B.y + 2.75, t.z] as [number, number, number])} />
      <BanquetChairs chairs={CHAIRS} y={B.y} />
      {TABLES.map((t, i) => (
        <Collider
          key={i}
          minX={t.x - B.r - 0.15}
          maxX={t.x + B.r + 0.15}
          minZ={t.z - B.r - 0.15}
          maxZ={t.z + B.r + 0.15}
          above={UP}
        />
      ))}
      {CHAIRS.map((c, i) => (
        <Collider key={i} minX={c.x - 0.75} maxX={c.x + 0.75} minZ={c.z - 0.75} maxZ={c.z + 0.75} above={UP} />
      ))}
    </>
  )
}
