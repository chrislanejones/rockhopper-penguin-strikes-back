import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Suite } from './Suite'
import { Player, player } from './components/Player'
import { Avatar } from './components/Avatar'
import { Interaction } from './components/Interaction'
import { LiftControl } from './components/LiftControl'
import { Warmup } from './components/Warmup'
import { Hud } from './components/ui/Hud'
import { StartOverlay } from './components/ui/StartOverlay'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useOffice } from './state/store'

export function App() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  return (
    <>
      <ErrorBoundary>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        // One device pixel per CSS pixel. At 1.5 a 1707 x 932 window was
        // rendering 2561 x 1398 — 3.6 million pixels a frame, 2.25x what it
        // is now, and on an integrated GPU the frame is paid for per pixel.
        dpr={1}
        // `flat` turns off R3F's default ACES filmic tone mapping. ACES crushes
        // the midtones, which on a fluorescent-lit office reads as a room with
        // a lit ceiling and no light anywhere else.
        flat
        gl={{ antialias: true }}
        camera={{ fov: 70, near: 0.1, far: 2000, position: [3, 5.6, 13] }}
        onCreated={(state) => {
          setCanvas(state.gl.domElement)
          // Dev only — or `?hooks` on a production build — lets a console
          // session read draw calls and frame time, flip floors and move the player.
          if (import.meta.env.DEV || location.search.includes('hooks')) {
            Object.assign(window, { __r3f: state, __office: useOffice, __player: player })
          }
        }}
      >
        <Suspense fallback={null}>
          <Suite />
          <Avatar />
          {/* last inside the boundary: it runs once the floor above has built */}
          <Warmup />
        </Suspense>
        <Player />
        <Interaction />
        <LiftControl />
      </Canvas>
      </ErrorBoundary>
      <Hud />
      <StartOverlay canvas={canvas} />
    </>
  )
}
