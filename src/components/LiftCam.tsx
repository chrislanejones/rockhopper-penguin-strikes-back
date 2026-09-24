import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M } from '../scene/materials'
import { AVATAR_LAYER, CAR, EL } from '../scene/constants'
import type { FloorId } from '../scene/floors'
import { drawWhole } from '../lib/avatar'
import { office, RENDEZVOUS_PAGE, type Stop } from '../state/store'
import { PASSENGER_AT } from './Passenger'

/**
 * The lift's camera, and the picture it sends to her watch.
 *
 * A smoked dome in the ceiling corner over the doors, the kind every lift has
 * and nobody looks at, aimed across the car at the man by the buttons. It is
 * the watch's fifth page: while that page is up, the camera in whichever car
 * she can see draws the car into a small target every third frame, the
 * pixels come back without stalling the frame, and they are painted in the
 * watch's own green onto a canvas the page hands over in `liftCam.screen`.
 */

/** The picture's side, in pixels. Square, like the card it fills. */
export const LIFT_CAM_SIZE = 320

/** Where the page puts the canvas it wants painted. Nothing is drawn while this is empty. */
export const liftCam = { screen: null as HTMLCanvasElement | null }

/** The dome, in the car: the far corner from the panel, over the doors, on the ceiling at 7.6. */
const DOME: [number, number, number] = [EL - 2.95, 7.55, CAR.z0 + 0.5]
/** What it is aimed at, off the car floor: his tie, so the head sits in the top third. */
const AIM: [number, number, number] = [PASSENGER_AT[0] - 0.2, 4.35, PASSENGER_AT[2]]
/** A wide lift-camera lens: him from the knees up, his finger on the panel, the case. */
const FOV = 40

const TARGET = new THREE.WebGLRenderTarget(LIFT_CAM_SIZE, LIFT_CAM_SIZE)
const PIXELS = new Uint8Array(LIFT_CAM_SIZE * LIFT_CAM_SIZE * 4)
let picture: ImageData | null = null
let reading = false
let tick = 0

/**
 * Linear light in, the watch's green out: a phosphor ramp from the dark of
 * the glass to the LCD green to nearly white, display gamma folded in, so the
 * paint loop is one lookup a pixel.
 */
const RAMP = (() => {
  const dark = [4, 30, 13]
  const lcd = [140, 255, 174]
  const hot = [232, 255, 240]
  const out = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const v = Math.pow(i / 255, 1 / 2.2)
    const [a, b, t] = v < 0.8 ? [dark, lcd, v / 0.8] : [lcd, hot, (v - 0.8) / 0.2]
    for (let c = 0; c < 3; c++) out[i * 3 + c] = a[c] + (b[c] - a[c]) * t
  }
  return out
})()

function paint(screen: HTMLCanvasElement) {
  const g = screen.getContext('2d')
  if (!g) return
  picture ??= g.createImageData(LIFT_CAM_SIZE, LIFT_CAM_SIZE)
  const d = picture.data
  const row = LIFT_CAM_SIZE * 4
  for (let y = 0; y < LIFT_CAM_SIZE; y++) {
    // the target's rows come back bottom first
    let i = (LIFT_CAM_SIZE - 1 - y) * row
    let o = y * row
    for (let x = 0; x < LIFT_CAM_SIZE; x++, i += 4, o += 4) {
      const l = (0.2126 * PIXELS[i] + 0.7152 * PIXELS[i + 1] + 0.0722 * PIXELS[i + 2]) | 0
      d[o] = RAMP[l * 3]
      d[o + 1] = RAMP[l * 3 + 1]
      d[o + 2] = RAMP[l * 3 + 2]
      d[o + 3] = 255
    }
  }
  g.putImageData(picture, 0, 0)
}

/**
 * The dome, and the camera in it. One in every car; only the one in the car
 * she can see renders — this floor's, and on B2 the mouth the car is at.
 */
export function CarCamera({ floor, base, stop }: { floor: FloorId; base: number; stop: Stop }) {
  const cam = useRef<THREE.PerspectiveCamera>(null)
  const plate = useMemo(() => M(0xd6d7d9, { roughness: 0.6 }), [])
  const smoke = useMemo(() => M(0x121418, { roughness: 0.08, metalness: 0.6 }), [])

  useLayoutEffect(() => {
    const c = cam.current
    if (!c) return
    c.layers.enable(AVATAR_LAYER)
    c.updateWorldMatrix(true, false)
    c.lookAt(AIM[0], base + AIM[1], AIM[2])
  }, [base])

  useFrame(({ gl, scene }) => {
    const o = office()
    const screen = liftCam.screen
    const c = cam.current
    if (!screen || !c || !o.watch.open || o.watch.page !== RENDEZVOUS_PAGE) return
    if (o.floor !== floor) return
    if (floor === 'b2' && (stop === 'b1') !== (o.liftServe === 'upper')) return
    if (reading || tick++ % 3) return

    // She is a whole person from up there, if she is in the car with him.
    drawWhole(true)
    // this pass uses the sun's map as it stands; redrawing it is the main frame's job
    const owed = gl.shadowMap.needsUpdate
    gl.shadowMap.needsUpdate = false
    const was = gl.getRenderTarget()
    gl.setRenderTarget(TARGET)
    gl.render(scene, c)
    gl.setRenderTarget(was)
    gl.shadowMap.needsUpdate = owed
    drawWhole(false)

    reading = true
    gl.readRenderTargetPixelsAsync(TARGET, 0, 0, LIFT_CAM_SIZE, LIFT_CAM_SIZE, PIXELS)
      .then(() => {
        if (liftCam.screen) paint(liftCam.screen)
      })
      .finally(() => {
        reading = false
      })
  })

  return (
    <group position={[DOME[0], base + DOME[1], DOME[2]]}>
      {/* the mounting ring, sunk a hair into the ceiling so the two never share a plane */}
      <mesh position={[0, 0.03, 0]} material={plate}>
        <cylinderGeometry args={[0.26, 0.26, 0.06, 20]} />
      </mesh>
      <mesh material={smoke}>
        <sphereGeometry args={[0.2, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      {/* inside the glass: near is past the dome, so it never sees its own shell */}
      <perspectiveCamera ref={cam} args={[FOV, 1, 0.3, 14]} position={[0, -0.1, 0]} />
    </group>
  )
}
