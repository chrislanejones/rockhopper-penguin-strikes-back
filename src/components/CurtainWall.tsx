import { mat } from '../scene/materials'
import { H, NZ, RCX, RW, RX0, RX1 } from '../scene/constants'
import { Box, Collider } from './props/primitives'

/**
 * The north elevation: knee wall, sill, mullions on 8 ft centres, transom bar,
 * and a single sheet of glass from 2.4 ft up to the header.
 */
export function CurtainWall() {
  const mullions: number[] = []
  for (let x = RX0; x <= RX1 + 0.01; x += 8) mullions.push(x)
  // The plate is 76 ft, not a multiple of 8, so the run ends short: cap it.
  if (RX1 - mullions[mullions.length - 1] > 0.5) mullions.push(RX1)

  return (
    <>
      <Box size={[RW, 2.4, 0.6]} material={mat.wall} position={[RCX, 1.2, NZ + 0.3]} />
      <Box size={[RW, 0.15, 1]} material={mat.laminate} position={[RCX, 2.45, NZ + 0.5]} />
      <Box size={[RW, 0.7, 0.6]} material={mat.wall} position={[RCX, H - 0.35, NZ + 0.3]} />

      {mullions.map((x) => (
        <Box
          key={x}
          size={[0.25, H, 0.5]}
          material={mat.dark}
          position={[x, H / 2, NZ + 0.25]}
          cast={false}
        />
      ))}

      <Box
        size={[RW, 0.12, 0.5]}
        material={mat.dark}
        position={[RCX, 5.2, NZ + 0.25]}
        cast={false}
      />

      <mesh position={[RCX, 5.0, NZ + 0.25]} material={mat.glass}>
        <planeGeometry args={[RW, 5.2]} />
      </mesh>

      <Collider minX={RX0} maxX={RX1} minZ={NZ - 1} maxZ={NZ + 1.1} />
    </>
  )
}
