import * as THREE from 'three'
import { canvasTex, lazy } from '../lib/canvasTex'
import { ROOM } from './constants'

/** Shorthand for the standard material this office is almost entirely made of. */
export const M = (
  color: THREE.ColorRepresentation,
  o: THREE.MeshStandardMaterialParameters = {},
) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o })

/**
 * Cubicle panel: the blue tackboard every office on the island was
 * fitted out in around 1994 — pinnable fibre, flecked light and dark, with
 * the odd fleck of oatmeal in it. Strokes at random angles rather than a
 * grid; a regular over-under weave read as gingham from across the room.
 *
 * Tiled a foot to a repeat, so it is board at a desk and tone at range.
 */
const panels = new Map<number, THREE.Texture>()
const panelTex = (base: number) => {
  let t = panels.get(base)
  if (!t) {
    const c = new THREE.Color(base)
    const tone = (m: number, a = 1) =>
      `rgba(${Math.min(255, c.r * 255 * m) | 0},${Math.min(255, c.g * 255 * m) | 0},${Math.min(255, c.b * 255 * m) | 0},${a})`
    t = canvasTex(
      128,
      128,
      (g, w, h) => {
        g.fillStyle = tone(1)
        g.fillRect(0, 0, w, h)
        g.lineCap = 'round'
        // the nub: short fibres at every angle, in four tones of the base
        for (let i = 0; i < 5200; i++) {
          const x = Math.random() * w
          const y = Math.random() * h
          const a = Math.random() * Math.PI
          const len = 1 + Math.random() * 2
          g.strokeStyle = tone(0.84 + Math.random() * 0.36, 0.45)
          g.lineWidth = 1
          g.beginPath()
          g.moveTo(x, y)
          g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
          g.stroke()
        }
        // slubs of undyed oatmeal, the thing that makes berber berber
        for (let i = 0; i < 420; i++) {
          const x = Math.random() * w
          const y = Math.random() * h
          const a = Math.random() * Math.PI
          g.strokeStyle = `rgba(226,219,201,${0.1 + Math.random() * 0.2})`
          g.lineWidth = 1
          g.beginPath()
          g.moveTo(x, y)
          g.lineTo(x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6)
          g.stroke()
        }
      },
      // the panels scale their own UVs, so one repeat is one foot of wall
      [1, 1],
    )
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    panels.set(base, t)
  }
  return t
}

/** Flecked commercial loop carpet, tiled across the whole floor plate. */
const carpetTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#5c6470'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 9000; i++) {
        g.fillStyle = `rgba(${(60 + Math.random() * 60) | 0},${(65 + Math.random() * 60) | 0},${(75 + Math.random() * 60) | 0},.5)`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
    },
    [ROOM / 4, ROOM / 4],
  ),
)

/**
 * The shared material palette.
 *
 * These are deliberately singletons: hundreds of meshes reference the same few
 * materials, which is what keeps the draw calls and the memory sane.
 */
export const mat = {
  get wall() {
    return cache('wall', () => M(0xe9e6dc))
  },
  get carpet() {
    return cache('carpet', () => M(0xffffff, { map: carpetTex(), roughness: 1 }))
  },
  get fabric() {
    return cache('fabric', () => M(0xffffff, { map: panelTex(0x6d7f96), roughness: 1 }))
  },
  get fabricDark() {
    return cache('fabricDark', () => M(0xffffff, { map: panelTex(0x4e5f76), roughness: 1 }))
  },
  get cap() {
    return cache('cap', () => M(0xbfb9ad))
  },
  get laminate() {
    return cache('laminate', () => M(0xd9cfbd, { roughness: 0.6 }))
  },
  get oak() {
    return cache('oak', () => M(0x8a6a42, { roughness: 0.7 }))
  },
  get steel() {
    return cache('steel', () => M(0x9a9da3, { roughness: 0.35, metalness: 0.7 }))
  },
  get dark() {
    return cache('dark', () => M(0x2b2d31, { roughness: 0.6 }))
  },
  get black() {
    return cache('black', () => M(0x111214, { roughness: 0.5 }))
  },
  get white() {
    return cache('white', () => M(0xf4f4f2, { roughness: 0.5 }))
  },
  get red() {
    return cache('red', () => M(0xc8402e))
  },
  get yellow() {
    return cache('yellow', () => M(0xf2c53d))
  },
  get blue() {
    return cache('blue', () => M(0x3a6ea5))
  },
  get green() {
    return cache('green', () => M(0x4d8a4a))
  },
  get gold() {
    return cache('gold', () => M(0xd4a33a, { roughness: 0.3, metalness: 0.8 }))
  },
  get plastic() {
    return cache('plastic', () => M(0x3d4149, { roughness: 0.4 }))
  },
  get screenOff() {
    return cache('screenOff', () => M(0x0c0e12, { roughness: 0.2 }))
  },
  get leaf() {
    return cache('leaf', () => M(0x3f7a3b, { roughness: 0.9 }))
  },
  get pot() {
    return cache('pot', () => M(0xb0623c))
  },
  get glass() {
    return cache(
      'glass',
      () =>
        new THREE.MeshPhysicalMaterial({
          color: 0xcfe6ef,
          transparent: true,
          opacity: 0.18,
          roughness: 0.05,
          metalness: 0,
          side: THREE.DoubleSide,
        }),
    )
  },
  /** Paper edge on every book and binder in the building. */
  get page() {
    return cache('page', () => M(0xd9cfba))
  },
}

const store = new Map<string, THREE.Material>()
function cache<T extends THREE.Material>(key: string, make: () => T): T {
  let m = store.get(key)
  if (!m) {
    m = make()
    store.set(key, m)
  }
  return m as T
}

/** Colour keys usable as `mat[name]` — handy for the "pick one of these" props. */
export type ColorKey = 'red' | 'blue' | 'black' | 'yellow' | 'green' | 'white'
