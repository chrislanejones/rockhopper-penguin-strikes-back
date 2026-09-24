import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M } from '../scene/materials'
import { GROUND_Y } from '../scene/constants'
import { RIVER } from '../scene/city'
import { SKY_FRAG, SKY_VERT, cloudTex } from '../textures/outside'
import { City } from './City'
import { LotteryTower } from './LotteryTower'
import { Streets } from './Streets'
import { Infrastructure } from './Infrastructure'

/** Sprite clouds drifting west to east past the glass. */
function Clouds() {
  const group = useRef<THREE.Group>(null)
  const sprites = useMemo(() => {
    const tex = cloudTex()
    type S = { position: [number, number, number]; scale: [number, number, number]; v: number; tex: THREE.Texture }
    // the ones that drift past the glass, at about this floor's height
    const near: S[] = Array.from({ length: 40 }, () => {
      const a = Math.random() * Math.PI * 2
      const r = 180 + Math.random() * 500
      const sc = 80 + Math.random() * 140
      return {
        position: [Math.cos(a) * r, -40 + Math.random() * 120, Math.sin(a) * r],
        scale: [sc, sc * 0.5, 1],
        v: 0.4 + Math.random() * 0.6,
        tex,
      }
    })
    /*
      A bank round the horizon, low and big and slow, in two rows: from the
      glass, the grid stopped dead at 1,320 ft and you could see the edge of
      the ground it was drawn on. These sit over that edge, so the city fades
      into weather instead of ending. They drift the same way but barely.
    */
    const bank: S[] = Array.from({ length: 56 }, (_, i) => {
      const a = (i / 56) * Math.PI * 2 + Math.random() * 0.08
      const row = i % 2
      const r = (row ? 1180 : 1420) + Math.random() * 120
      const sc = 380 + Math.random() * 260
      return {
        position: [Math.cos(a) * r, -150 + row * 40 + Math.random() * 90, Math.sin(a) * r],
        scale: [sc, sc * 0.42, 1],
        v: 0.06 + Math.random() * 0.06,
        tex,
      }
    })
    return [...near, ...bank]
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = group.current
    if (!g) return
    g.children.forEach((c, i) => {
      c.position.x += sprites[i].v * dt * 6
      // the near ones wrap at the edge of the view; the bank wraps at its own ring
      const wrap = i < 40 ? 700 : 1600
      if (c.position.x > wrap) c.position.x = -wrap
    })
  })

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        // raycast opted out: a Sprite needs raycaster.camera set, and a cloud
        // 500 feet away is never what you meant to put your mug down on.
        <sprite key={i} position={s.position} scale={s.scale} raycast={() => null}>
          <spriteMaterial map={s.tex} transparent opacity={0.85} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

/** Sky, weather, skyline and the ground 250 feet down. */
export function Outside() {
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
      }),
    [],
  )
  const riverMat = useMemo(() => M(0x5f7f96, { roughness: 0.2, metalness: 0.3 }), [])

  return (
    <>
      <mesh material={skyMat}>
        <sphereGeometry args={[900, 32, 16]} />
      </mesh>

      <Clouds />
      <City />
      <LotteryTower />

      {/* street grid, blocks and traffic far below */}
      <Streets />

      {/* the Thames, cutting across the grid — sits over the streets it crosses */}
      <mesh
        rotation={[-Math.PI / 2, 0, RIVER.angle]}
        position={[RIVER.cx, GROUND_Y + 0.6, RIVER.cz]}
        material={riverMat}
      >
        <planeGeometry args={[RIVER.length, RIVER.halfWidth * 2]} />
      </mesh>

      {/* bridges, expressway, ramps and garages — after the water, so the
          crossings are drawn over the surface they cross */}
      <Infrastructure />

      {/* two haze layers, so distance reads as distance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -150, 0]}>
        <planeGeometry args={[2600, 2600]} />
        <meshBasicMaterial color={0x9fb0bf} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -60, 0]}>
        <planeGeometry args={[2600, 2600]} />
        <meshBasicMaterial color={0x9fb0bf} transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </>
  )
}
