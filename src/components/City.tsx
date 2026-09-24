import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
import { GROUND_Y } from '../scene/constants'
import { winTexture } from '../textures/outside'
import { inRiver, onGarageBlock, snapToBlock, underHighway } from '../scene/city'
import { WALKIE_TALKIE } from './WalkieTalkie'

const HAZE = new THREE.Color(0x9fb0bf)

/** Windows are on a 9 ft module, whatever the size of the tower. */
const WINDOW_FT = 9

/** Everything about one tower that has to stay fixed after the first frame. */
interface Tower {
  x: number
  z: number
  ry: number
  w: number
  d: number
  h: number
  tall: boolean
  glassy: boolean
  /** Rooftop plant offset and height. */
  mech: [number, number, number]
  antenna: [number, number, number] | null
  setback: boolean
  /** Body and roof, already faded toward the haze for the distance. */
  colour: THREE.Color
  roof: THREE.Color
}

/**
 * Generate the skyline once.
 *
 * Only the numbers are memoised. The towers themselves are `<Instance>`s
 * below, one per part, so the hierarchy is still plain JSX — it is just that
 * a hundred and thirty of them cost six draw calls rather than four hundred.
 */
function useTowers(): Tower[] {
  return useMemo(() => {
    const out: Tower[] = []
    for (let i = 0; i < 130; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 130 + Math.pow(Math.random(), 0.7) * 700
      const w = 25 + Math.random() * 55
      const d = 25 + Math.random() * 55
      // Put the tower on a block rather than in the middle of a street.
      const x = snapToBlock(Math.cos(a) * r, w)
      const z = snapToBlock(Math.sin(a) * r, d)

      // Nothing gets built in the Thames, under the expressway, or on a
      // block a garage has already taken.
      if (inRiver(x, z, Math.max(w, d))) continue
      if (underHighway(z, Math.max(w, d))) continue
      if (onGarageBlock(x, z, Math.max(w, d))) continue

      // Give the Walkie-Talkie room, and keep the sight line to it clear.
      if (Math.hypot(x - WALKIE_TALKIE.x, z - WALKIE_TALKIE.z) < 160) continue
      if (z < 0 && z > WALKIE_TALKIE.z - 40 && Math.abs(x) < 130) continue

      const tall = Math.random() < 0.12
      const h = tall ? 380 + Math.random() * 320 : 60 + Math.random() * 300
      const fade = Math.min(1, (r - 100) / 800)
      const glassy = Math.random() < 0.3

      // The window texture is shared now, so the tint that used to vary per
      // texture varies per tower instead.
      const tint = 0.82 + Math.random() * 0.18
      const colour = (glassy ? new THREE.Color(0x6f95b5) : new THREE.Color(0xffffff))
        .multiplyScalar(tint)
        .lerp(HAZE, fade * 0.85)

      out.push({
        x,
        z,
        ry: Math.random() * 0.8,
        w,
        d,
        h,
        tall,
        glassy,
        mech: [
          (Math.random() - 0.5) * w * 0.3,
          8 + Math.random() * 10,
          (Math.random() - 0.5) * d * 0.3,
        ],
        antenna: Math.random() < 0.5 ? [w * 0.3, 20 + Math.random() * 40, -d * 0.3] : null,
        setback: Math.random() < 0.35,
        colour,
        roof: new THREE.Color(0x5c6068).lerp(HAZE, fade * 0.85),
      })
    }
    return out
  }, [])
}

/**
 * Windows sized from the instance, not the texture.
 *
 * One box geometry serves every tower, scaled per instance, and a texture
 * repeat is per material — so with one material the windows would stretch
 * with the building. Instead the vertex shader reads the tower's size out of
 * its instance matrix and tiles the map on a fixed 9 ft module.
 */
function windowed(m: THREE.MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      /* glsl */ `
      #include <uv_vertex>
      #ifdef USE_INSTANCING
        vec3 towerSize = vec3(
          length(instanceMatrix[0].xyz),
          length(instanceMatrix[1].xyz),
          length(instanceMatrix[2].xyz)
        );
        vec2 face = abs(normal.x) > 0.5 ? position.zy * towerSize.zy
                  : abs(normal.z) > 0.5 ? position.xy * towerSize.xy
                  : position.xz * towerSize.xz;
        vMapUv = face / ${WINDOW_FT.toFixed(1)};
      #endif
      `,
    )
  }
  m.customProgramCacheKey = () => 'tower-windows'
  return m
}

/** A part's world position: its offset in the tower's frame, turned by the tower. */
function at(t: Tower, ox: number, oy: number, oz: number): [number, number, number] {
  const c = Math.cos(t.ry)
  const s = Math.sin(t.ry)
  return [t.x + ox * c + oz * s, GROUND_Y + oy, t.z - ox * s + oz * c]
}

export function City() {
  const towers = useTowers()

  const { box, mast, spire, bulb, stone, glass, roof, beacon } = useMemo(() => {
    const tex = winTexture()
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      mast: new THREE.CylinderGeometry(0.6, 1.2, 1, 6),
      spire: new THREE.ConeGeometry(1, 1, 8),
      bulb: new THREE.SphereGeometry(1.5, 8, 6),
      stone: windowed(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })),
      glass: windowed(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, metalness: 0.5 })),
      roof: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      beacon: new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff2020, emissiveIntensity: 3 }),
    }
  }, [])

  const stoneTowers = towers.filter((t) => !t.glassy)
  const glassTowers = towers.filter((t) => t.glassy)
  const masted = towers.filter((t) => t.antenna)
  const tallOnes = towers.filter((t) => t.tall)

  /** A tower's body and, if it has one, the wider base it steps back from. */
  const bodies = (list: Tower[]) =>
    list.map((t, i) => (
      <group key={i}>
        <Instance
          position={at(t, 0, t.h / 2, 0)}
          rotation={[0, t.ry, 0]}
          scale={[t.w, t.h, t.d]}
          color={t.colour}
        />
        {t.setback && (
          <Instance
            position={at(t, 0, t.h * 0.15, 0)}
            rotation={[0, t.ry, 0]}
            scale={[t.w * 1.5, t.h * 0.3, t.d * 1.5]}
            color={t.colour}
          />
        )}
      </group>
    ))

  return (
    <>
      <Instances geometry={box} material={stone} limit={stoneTowers.length * 2}>
        {bodies(stoneTowers)}
      </Instances>
      <Instances geometry={box} material={glass} limit={glassTowers.length * 2}>
        {bodies(glassTowers)}
      </Instances>

      {/* mechanical penthouses */}
      <Instances geometry={box} material={roof} limit={towers.length}>
        {towers.map((t, i) => (
          <Instance
            key={i}
            position={at(t, t.mech[0], t.h + 5, t.mech[2])}
            rotation={[0, t.ry, 0]}
            scale={[t.w * 0.4, t.mech[1], t.d * 0.4]}
            color={t.roof}
          />
        ))}
      </Instances>

      {/* antenna masts */}
      <Instances geometry={mast} material={roof} limit={masted.length}>
        {masted.map((t, i) => (
          <Instance
            key={i}
            position={at(t, t.antenna![0], t.h + 15, t.antenna![2])}
            scale={[1, t.antenna![1], 1]}
            color={t.roof}
          />
        ))}
      </Instances>

      {/* the tall ones: a spire, and a beacon on it */}
      <Instances geometry={spire} material={roof} limit={tallOnes.length}>
        {tallOnes.map((t, i) => (
          <Instance
            key={i}
            position={at(t, 0, t.h + 30, 0)}
            scale={[t.w * 0.25, 60, t.w * 0.25]}
            color={t.roof}
          />
        ))}
      </Instances>
      <Instances geometry={bulb} material={beacon} limit={tallOnes.length}>
        {tallOnes.map((t, i) => (
          <Instance key={i} position={at(t, 0, t.h + 61, 0)} />
        ))}
      </Instances>
    </>
  )
}
