import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { M } from '../scene/materials'
import { canvasTex } from '../lib/canvasTex'
import { Pickable } from './props/Pickable'

/**
 * "Happy Feet", on a shelf in the storage room.
 *
 * The 2006 film about a penguin who cannot sing, which is as close as the
 * cinema has come to a rockhopper. The bottom half of the cover sleeve has
 * been torn off down to the case. Nobody has admitted to leaving it here.
 */

/** Drawn spine, since a poster has no spine art. Palette taken from the cover. */
function useSpineTexture() {
  return useMemo(() => {
    const W = 96
    const H = 724
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const g = c.getContext('2d')!

    g.fillStyle = '#1b5fa8'
    g.fillRect(0, 0, W, H)
    g.fillStyle = '#f2b233'
    g.fillRect(0, 24, W, 3)
    g.fillRect(0, H - 27, W, 3)

    g.save()
    g.translate(W / 2, H / 2)
    g.rotate(-Math.PI / 2)
    g.textAlign = 'center'
    g.fillStyle = '#ffffff'
    g.font = 'bold 40px sans-serif'
    g.fillText('HAPPY FEET', 0, 14)
    g.restore()

    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

export function Dvd({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const cover = useTexture('/textures/happy-feet-dvd.webp')
  cover.colorSpace = THREE.SRGBColorSpace
  cover.anisotropy = 8

  const spine = useSpineTexture()

  /** Plain back, so the case does not read as double-fronted. */
  const backTex = useMemo(
    () =>
      canvasTex(320, 460, (g, w, h) => {
        g.fillStyle = '#16508f'
        g.fillRect(0, 0, w, h)
        g.fillStyle = 'rgba(255,255,255,.85)'
        g.font = 'bold 22px sans-serif'
        g.textAlign = 'center'
        g.fillText('HAPPY FEET', w / 2, 46)
        // blurb and stills, standing in as blocks
        g.fillStyle = 'rgba(255,255,255,.35)'
        for (let i = 0; i < 6; i++) {
          g.fillRect(30, 78 + i * 16, (w - 60) * (i % 3 === 2 ? 0.6 : 0.94), 6)
        }
        for (let i = 0; i < 3; i++) g.fillRect(26 + i * 94, 196, 84, 62)
        g.fillStyle = '#ffffff'
        g.fillRect(w - 128, h - 62, 100, 38)
        g.fillStyle = '#111111'
        for (let i = 0; i < 28; i++) {
          g.fillRect(w - 123 + i * 3.4, h - 57, 1 + Math.random() * 2, 28)
        }
      }),
    [],
  )

  const materials = useMemo(() => {
    const shell = M(0x0f2f55, { roughness: 0.34 })
    const coverMat = new THREE.MeshStandardMaterial({ map: cover, roughness: 0.32 })
    const spineMat = new THREE.MeshStandardMaterial({ map: spine, roughness: 0.34 })
    const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.36 })
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    return [spineMat, shell, shell, shell, coverMat, backMat]
  }, [cover, spine, backTex])

  const standMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xdfe9ee,
        transparent: true,
        opacity: 0.4,
        roughness: 0.2,
      }),
    [],
  )

  return (
    <group position={position} rotation={rotation}>
      {/* Acrylic display stand — somebody put this out face-out on purpose. */}
      <mesh position={[0, -0.3, -0.12]} rotation={[-0.35, 0, 0]} material={standMat}>
        <boxGeometry args={[0.34, 0.3, 0.02]} />
      </mesh>
      <mesh position={[0, -0.32, 0.02]} material={standMat}>
        <boxGeometry args={[0.36, 0.03, 0.16]} />
      </mesh>
      <Pickable label="Happy Feet DVD">
        {/* Leans back on the stand, cover out. A standard case is
            7.5in x 5.3in x 0.6in, kept to real size — what makes it readable
            is the facing and where it is put, not scaling it up. */}
        <mesh position={[0, 0, 0]} rotation={[-0.12, 0, 0]} material={materials} castShadow>
          <boxGeometry args={[0.44, 0.62, 0.05]} />
        </mesh>
      </Pickable>
    </group>
  )
}
