import * as THREE from 'three'

export type DrawFn = (g: CanvasRenderingContext2D, w: number, h: number) => void

/**
 * Draw a texture with the 2D canvas API.
 *
 * Almost every surface in this office is painted this way rather than shipped
 * as an image file — ceiling tiles, monitor screens, book spines, box labels.
 * It keeps the download tiny and lets the labels stay readable text.
 */
export function canvasTex(
  w: number,
  h: number,
  draw: DrawFn,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const t0 = performance.now()
  draw(c.getContext('2d')!, w, h)
  drawn.count++
  drawn.ms += performance.now() - t0
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

/** How many textures have been painted so far, and how long it took. */
export const drawn = { count: 0, ms: 0 }

/**
 * Build once, on first use, then hand back the same object forever.
 *
 * Textures here are expensive and many of them are randomised, so rebuilding
 * one on a re-render would both cost frames and visibly reshuffle the scene.
 */
export function lazy<T>(make: () => T): () => T {
  let v: T | undefined
  return () => (v ??= make())
}
