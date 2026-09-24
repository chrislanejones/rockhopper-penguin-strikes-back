import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { L } from '../scene/constants'
import { live, stirShadows, useOffice } from '../state/store'

/**
 * Daylight through the north glass, plus the fill that makes the room legible.
 *
 * The drop ceiling is solid, so almost none of the sun reaches the floor — it
 * only rakes in through the curtain wall. Everything else you can see is the
 * hemisphere and ambient terms doing the work of a hundred bounces, which is
 * why they are set far higher than a daylit exterior scene would want.
 */
export function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null)
  const gl = useThree((s) => s.gl)
  const frame = useRef(0)
  const floor = useOffice((s) => s.floor)
  const ready = useOffice((s) => s.ready)

  useEffect(() => {
    // The shadow frustum has to be told it changed, or it keeps the default box.
    sun.current?.shadow.camera.updateProjectionMatrix()
  }, [])

  /*
    The shadow pass draws every caster on the floor — six hundred of them —
    into the map, and by default it does so before every render, including
    the ones a mirror makes.

    It used to be redrawn on alternate frames regardless. But the sun is
    fixed and the camera casts nothing, so walking about never changes the
    map: only a caster moving does. Those few places call stirShadows(), and
    the pass runs only while a redraw is owed — still at most every other
    frame, so a swinging door does not double the cost of the frame.
  */
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    stirShadows()
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])
  // A new floor, or the floor finishing its build: everything in the map changed.
  useEffect(() => {
    stirShadows()
  }, [floor, ready])
  useFrame(() => {
    const due = live.shadows > 0 && frame.current++ % 2 === 0
    gl.shadowMap.needsUpdate = due
    if (due) live.shadows--
  })

  return (
    <>
      <ambientLight color={0xe8eef8} intensity={L(0.42)} />
      <hemisphereLight args={[0xdde7ff, 0x7d7468, L(0.95)]} />
      <directionalLight
        ref={sun}
        color={0xfff1dc}
        intensity={L(1.1)}
        position={[-20, 40, -60]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={220}
      />

      {/*
        Fake bounce. Point lights in a ceiling rake vertical surfaces almost
        edge-on, so partitions and walls come out near-black without global
        illumination. Two dim, shadowless directionals aimed across the room
        stand in for the light that would have bounced off the floor and the
        window wall — cheap, and the difference between "office" and "cave".
      */}
      <directionalLight
        color={0xdfe7f2}
        intensity={L(0.5)}
        position={[10, 6, -60]}
        castShadow={false}
      />
      <directionalLight
        color={0xf2ece0}
        intensity={L(0.32)}
        position={[-40, 4, 40]}
        castShadow={false}
      />
    </>
  )
}
