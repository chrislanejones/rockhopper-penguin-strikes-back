import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { registerRig, unregisterRig } from '../lib/avatar'
import { AVATAR_LAYER } from '../scene/constants'

const MODEL = '/models/office-woman.glb'

/**
 * The player, from the neck down.
 *
 * She is the one model file in the building. Everything else is built in JSX
 * because it is built once and stands still; she is posed every frame and
 * wants a stable set of named joints to do it with, so she is authored in
 * `scripts/build-avatar.mjs` and baked to a .glb that this loads.
 *
 * Posing happens in `lib/avatar.ts`, driven from the player's frame loop. This
 * component only puts her in the scene and hands the joints over.
 */
export function Avatar() {
  const { scene } = useGLTF(MODEL)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    registerRig(scene)
    camera.layers.enable(AVATAR_LAYER)
    return () => unregisterRig(scene)
  }, [scene, camera])

  return <primitive object={scene} />
}

useGLTF.preload(MODEL)
