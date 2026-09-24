import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useOffice } from '../state/store'
import { drawn } from '../lib/canvasTex'
import { setWarmer } from '../lib/warm'

/**
 * Compile every shader and upload every texture before the start card lets
 * you in.
 *
 * three does both lazily, the first time a thing is drawn. On this floor that
 * meant a hitch every time you turned a corner: 130-odd shader programs at
 * 50–200 ms each on an integrated GPU, and 350 canvas textures. It all
 * happens here instead, a slice at a time, and the bar on the start card is
 * reporting it.
 */
export function Warmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const setProgress = useOffice((s) => s.setProgress)
  const setReady = useOffice((s) => s.setReady)

  useEffect(() => {
    let cancelled = false
    // A frame, so the bar repaints. In a background tab frames do not come
    // and timers are held to once a second, so yield through a message port
    // instead and just get on with it.
    const frame = () =>
      new Promise<void>((r) => {
        if (document.visibilityState === 'hidden') {
          const ch = new MessageChannel()
          ch.port1.onmessage = () => r()
          ch.port2.postMessage(0)
        } else {
          requestAnimationFrame(() => r())
        }
        setTimeout(r, 1000)
      })

    ;(async () => {
      performance.mark('suite:built')

      // Everything drawable, and every texture any of it uses.
      const drawables: THREE.Object3D[] = []
      const textures = new Set<THREE.Texture>()
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
        if (!m) return
        drawables.push(o)
        for (const material of Array.isArray(m) ? m : [m]) {
          for (const v of Object.values(material)) {
            if ((v as THREE.Texture)?.isTexture) textures.add(v as THREE.Texture)
          }
        }
      })

      /*
        Shaders. `compile` takes an object tree to compile and a scene to
        take the lights from, so a holder whose children are a slice of the
        floor compiles that slice against the real lighting — without
        re-parenting anything — and the bar gets to move between slices.
      */
      const holder = new THREE.Object3D()
      const STEP = 120
      for (let i = 0; i < drawables.length; i += STEP) {
        if (cancelled) return
        holder.children = drawables.slice(i, i + STEP)
        gl.compile(holder, camera, scene)
        const done = Math.min(1, (i + STEP) / drawables.length)
        setProgress(0.1 + 0.55 * done, 'Compiling shaders')
        await frame()
      }
      holder.children = []
      performance.mark('suite:shaders')

      // Textures.
      const list = [...textures]
      for (let i = 0; i < list.length; i++) {
        if (cancelled) return
        gl.initTexture(list[i])
        if (i % 12 === 0) {
          setProgress(0.65 + 0.35 * (i / list.length), 'Uploading textures')
          await frame()
        }
      }

      if (cancelled) return
      performance.mark('suite:textures')
      setReady()

      // The lift calls this between floors: same compile, for the other
      // floor's lights, while the car is dark. Since B2 is built on the first
      // ride down, its textures are new to the GPU too, so they go up here —
      // initTexture is a no-op for anything already uploaded.
      setWarmer(() => {
        const all: THREE.Object3D[] = []
        const fresh = new Set<THREE.Texture>()
        scene.traverse((o) => {
          const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
          if (!m) return
          all.push(o)
          for (const material of Array.isArray(m) ? m : [m]) {
            for (const v of Object.values(material)) {
              if ((v as THREE.Texture)?.isTexture) fresh.add(v as THREE.Texture)
            }
          }
        })
        holder.children = all
        gl.compile(holder, camera, scene)
        holder.children = []
        for (const t of fresh) gl.initTexture(t)
      })

      // Where the seconds went, for whoever is tuning it next.
      const secs = (a: string, b: string) =>
        (performance.measure(`${a}→${b}`, `suite:${a}`, `suite:${b}`).duration / 1000).toFixed(1)
      console.info(
        `[suite] load: floor ${secs('start', 'built')}s (of which painting ${drawn.count} canvases ${(drawn.ms / 1000).toFixed(1)}s)` +
          ` · shaders ${secs('built', 'shaders')}s` +
          ` (${gl.info.programs?.length ?? '?'} programs) · textures ${secs('shaders', 'textures')}s (${list.length})` +
          ` · ${drawables.length} drawables`,
      )
    })()

    return () => {
      cancelled = true
      setWarmer(null)
    }
  }, [gl, scene, camera, setProgress, setReady])

  return null
}
