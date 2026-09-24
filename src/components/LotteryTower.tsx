import { useMemo } from 'react'
import * as THREE from 'three'
import { M } from '../scene/materials'
import { GROUND_Y } from '../scene/constants'
import { lotteryFacade } from '../textures/outside'
import { lotterySignTex } from '../textures/island'

/**
 * The Island Lottery building — the nearest tower, straight out the glass.
 *
 * Its roof lands about 50 ft above this floor, so the sign is the one thing
 * out the window you can actually read from a desk.
 */
export const LOTTERY = { x: -10, z: -215, w: 90, d: 64, h: 300 } as const

export function LotteryTower() {
  const { x: LX, z: LZ, w: LW, d: LD, h: LH } = LOTTERY

  const logo = lotterySignTex()

  const { gm, gmD, dark } = useMemo(() => {
    const fac = lotteryFacade()
    fac.wrapS = fac.wrapT = THREE.RepeatWrapping
    fac.repeat.set(LW / 16, LH / 16)
    const facD = fac.clone()
    facD.needsUpdate = true
    facD.repeat.set(LD / 16, LH / 16)
    const g = new THREE.MeshStandardMaterial({
      map: fac,
      color: 0xdfeaf5,
      roughness: 0.2,
      metalness: 0.55,
    })
    const gd = g.clone()
    gd.map = facD
    return { gm: g, gmD: gd, dark: M(0x4a5560) }
  }, [LW, LD, LH])

  /** Illuminated box sign: the logo lights its own face. */
  const signMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: logo,
        emissiveMap: logo,
        emissive: 0xffffff,
        emissiveIntensity: 0.9,
        color: 0x222222,
      }),
    [logo],
  )
  const signSide = useMemo(() => M(0xffffff), [])
  const signW = LW * 0.5
  const signH = signW // the logo is square

  const towerMats = useMemo(
    () => [gmD, gmD, dark, dark, gm, gm],
    [gm, gmD, dark],
  )
  const signMats = useMemo(
    () => [signSide, signSide, signSide, signSide, signMat, signSide],
    [signMat, signSide],
  )

  const fins = useMemo(() => M(0x2c3a48), [])
  const crownMat = useMemo(() => M(0x2c3a48, { roughness: 0.4, metalness: 0.5 }), [])

  const Sign = ({
    position,
    rotation,
  }: {
    position: [number, number, number]
    rotation?: [number, number, number]
  }) => (
    <mesh position={position} rotation={rotation} material={signMats}>
      <boxGeometry args={[signW, signH, 3]} />
    </mesh>
  )

  return (
    <group position={[LX, GROUND_Y, LZ]}>
      <mesh position={[0, LH / 2, 0]} material={towerMats}>
        <boxGeometry args={[LW, LH, LD]} />
      </mesh>

      {/* podium and entrance canopy */}
      <mesh position={[0, 20, 0]} material={useMemo(() => M(0xb9b4a8, { roughness: 0.8 }), [])}>
        <boxGeometry args={[LW + 30, 40, LD + 30]} />
      </mesh>
      <mesh position={[0, 24, LD / 2 + 22]} material={useMemo(() => M(0xc8102e), [])}>
        <boxGeometry args={[50, 2, 18]} />
      </mesh>

      {/* corner fins */}
      {(
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const
      ).map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * LW) / 2, LH / 2 + 3, (sz * LD) / 2]} material={fins}>
          <boxGeometry args={[3, LH + 6, 3]} />
        </mesh>
      ))}

      {/* crown and its lit band */}
      <mesh position={[0, LH + 5, 0]} material={crownMat}>
        <boxGeometry args={[LW + 4, 10, LD + 4]} />
      </mesh>
      <mesh position={[0, LH + 10.5, 0]}>
        <boxGeometry args={[LW + 4.4, 2, LD + 4.4]} />
        <meshStandardMaterial color={0xffffff} emissive={0x7fd3ff} emissiveIntensity={1.4} />
      </mesh>

      {/* the sign, and a second copy facing east so it reads from the side */}
      <Sign position={[0, LH + 12 + signH / 2, LD / 2 - 6]} />
      <Sign position={[LW / 2 - 6, LH + 12 + signH / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[-signW * 0.4 + i * signW * 0.4, LH + 6, LD / 2 - 6]}
          material={fins}
        >
          <boxGeometry args={[1.2, 12, 1.2]} />
        </mesh>
      ))}

      <mesh position={[-LW * 0.2, LH + 16, -LD * 0.15]} material={useMemo(() => M(0x5c6068), [])}>
        <boxGeometry args={[LW * 0.35, 12, LD * 0.4]} />
      </mesh>
      <mesh position={[LW / 2 - 4, LH + 14, -LD / 2 + 4]}>
        <sphereGeometry args={[1.4, 8, 6]} />
        <meshStandardMaterial color={0} emissive={0xff2020} emissiveIntensity={3} />
      </mesh>
    </group>
  )
}
