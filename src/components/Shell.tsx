import { useMemo } from 'react'
import * as THREE from 'three'
import { mat } from '../scene/materials'
import { HALF, LOBBY_DOOR, OP0, OP1, PWX, RCX, ROOM, RW, RX0, RX1, H } from '../scene/constants'
import { Box, Collider } from './props/primitives'

/**
 * Floor, walls, baseboards and the partition between the original suite and
 * the wing. The north wall is not here — it is glass, and lives in CurtainWall.
 */
export function Shell() {
  const wallGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  /** A flat painted wall. Scaled from a unit plane so one geometry serves all. */
  const Wall = ({
    x,
    z,
    ry,
    w,
  }: {
    x: number
    z: number
    ry: number
    w: number
  }) => (
    <mesh
      geometry={wallGeo}
      material={mat.wall}
      position={[x, H / 2, z]}
      rotation={[0, ry, 0]}
      scale={[w, H, 1]}
      receiveShadow
    />
  )

  // East wall comes in two runs, leaving a real opening for the closet door.
  const eastRuns: Array<[number, number]> = [
    [(-HALF + 10.3) / 2, 10.3 + HALF],
    [(13.7 + HALF) / 2, HALF - 13.7],
  ]
  // Same idea for the partition, which has a wide cased opening in it.
  const partitionRuns: Array<[number, number]> = [
    [(-HALF + OP0) / 2, OP0 + HALF],
    [(OP1 + HALF) / 2, HALF - OP1],
  ]

  return (
    <>
      <mesh
        position={[RCX, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={mat.carpet}
        receiveShadow
      >
        <planeGeometry args={[RW, ROOM]} />
      </mesh>

      {/* South wall, in two runs either side of the opening to the lift lobby */}
      {(
        [
          [(RX0 + LOBBY_DOOR.x0) / 2, LOBBY_DOOR.x0 - RX0],
          [(LOBBY_DOOR.x1 + RX1) / 2, RX1 - LOBBY_DOOR.x1],
        ] as const
      ).map(([cx, len], i) => (
        <group key={i}>
          <Wall x={cx} z={HALF} ry={Math.PI} w={len} />
          <Collider minX={cx - len / 2} maxX={cx + len / 2} minZ={HALF - 0.3} maxZ={HALF + 0.3} />
        </group>
      ))}
      {/* header over the opening — casts, so the sun stops at the lobby wall */}
      <Box
        size={[LOBBY_DOOR.x1 - LOBBY_DOOR.x0 + 0.6, H - 7.2, 0.6]}
        material={mat.wall}
        position={[(LOBBY_DOOR.x0 + LOBBY_DOOR.x1) / 2, 7.2 + (H - 7.2) / 2, HALF]}
      />
      {/* jambs */}
      {[LOBBY_DOOR.x0, LOBBY_DOOR.x1].map((x) => (
        <Box key={x} size={[0.3, 7.2, 0.7]} material={mat.dark} position={[x, 3.6, HALF]} />
      ))}

      <Wall x={RX0} z={0} ry={Math.PI / 2} w={ROOM} />

      {eastRuns.map(([cz, len], i) => (
        <group key={i}>
          <mesh
            geometry={wallGeo}
            material={mat.wall}
            position={[RX1, H / 2, cz]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[len, H, 1]}
            receiveShadow
          />
          <Collider minX={RX1 - 0.3} maxX={RX1 + 0.3} minZ={cz - len / 2} maxZ={cz + len / 2} />
        </group>
      ))}

      {partitionRuns.map(([cz, len], i) => (
        <group key={i}>
          <Box
            size={[0.5, H, len]}
            material={mat.wall}
            position={[PWX, H / 2, cz]}
            cast={false}
          />
          <Collider minX={PWX - 0.35} maxX={PWX + 0.35} minZ={cz - len / 2} maxZ={cz + len / 2} />
        </group>
      ))}

      {/* header and jambs framing the cased opening */}
      <Box
        size={[0.6, 1.1, OP1 - OP0 + 0.6]}
        material={mat.wall}
        position={[PWX, H - 0.55, (OP0 + OP1) / 2]}
        cast={false}
      />
      {/*
        Jamb casings, straddling the edge of the opening.

        They used to be pushed 0.15 ft back into the wall, which put their inner
        face on exactly the same plane as the end cap of the partition run — two
        coplanar quads, and both reveals came out striped from every angle in
        the suite. Centred on the edge instead, the casing buries the end cap
        and stands 0.15 ft proud into the opening, which is what a casing does.
      */}
      {[OP0, OP1].map((z) => (
        <Box
          key={z}
          size={[0.7, H - 1.1, 0.3]}
          material={mat.dark}
          position={[PWX, (H - 1.1) / 2, z]}
          cast={false}
        />
      ))}
      {/* head trim, hung just under the header and slightly proud of it */}
      <Box
        size={[0.66, 0.12, OP1 - OP0]}
        material={mat.dark}
        position={[PWX, H - 1.16, (OP0 + OP1) / 2]}
        cast={false}
      />

      {/* baseboards */}
      {(
        [
          // 0.11, not 0.1: at 0.1 its back sat on the plane the lobby paints its side of this wall on
          [RCX, HALF - 0.11, 0, RW],
          [RX0 + 0.1, 0, Math.PI / 2, ROOM],
          [RX1 - 0.1, 0, Math.PI / 2, ROOM],
          [PWX, (-HALF + OP0) / 2, Math.PI / 2, OP0 + HALF],
          [PWX, (OP1 + HALF) / 2, Math.PI / 2, HALF - OP1],
        ] as const
      ).map(([x, z, ry, w], i) => (
        <mesh key={i} position={[x, 0.2, z]} rotation={[0, ry, 0]} material={mat.dark}>
          <boxGeometry args={[w, 0.4, 0.2]} />
        </mesh>
      ))}

      {/*
        The underside of the slab above.

        Two feet up rather than six inches: over the records bay the tiles are
        out, and at half a foot the void behind them read as a black slot with
        no room for the duct and hangers that are actually up there.
      */}
      <mesh position={[RCX, H + 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, ROOM]} />
        <meshStandardMaterial color={0x14161a} roughness={0.85} />
      </mesh>
      {/*
        The plenum is closed at the perimeter.

        The walls stop at the ceiling, so raising the slab to 2.2 ft opened a
        band of daylight right round the floor plate — invisible until the
        tiles came out of the records bay, and then you could see sky through
        the hole. These four upstands take the void up to the slab.
      */}
      {(
        [
          [RCX, -HALF, RW, 0.3],
          [RCX, HALF, RW, 0.3],
          [RX0, 0, 0.3, ROOM],
          [RX1, 0, 0.3, ROOM],
        ] as const
      ).map(([cx, cz, sx, sz], i) => (
        <mesh key={i} position={[cx, H + 1.1, cz]}>
          <boxGeometry args={[sx, 2.2, sz]} />
          <meshStandardMaterial color={0x14161a} roughness={0.85} />
        </mesh>
      ))}
      {/* keeps the player off the west wall, which has no collider of its own */}
      <Collider minX={RX0 - 1} maxX={RX0} minZ={-HALF} maxZ={HALF} />
    </>
  )
}
