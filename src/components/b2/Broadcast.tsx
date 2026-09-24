import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M } from '../../scene/materials'
import { AVATAR_LAYER } from '../../scene/constants'
import { B2 } from '../../scene/b2'
import { drawWhole } from '../../lib/avatar'
import { office } from '../../state/store'
import { Collider } from '../props/primitives'
import { player } from '../Player'
import { BanquetChairs, type Chair } from './Tables'

const { stage, hall } = B2

/**
 * The layer the cameras see. Only what is put on it — the speaker, the
 * podium, the boards and the curtain behind him, and the lights that fall on
 * them — is drawn into the feed, so the second render is a few dozen meshes
 * rather than the hall. She is the exception: the feed camera also takes
 * the avatar's layer while the hall is the floor, so if she walks onto the
 * boards she is on every screen in the room, the way the mirror shows her.
 */
export const BROADCAST_LAYER = 2

/** Put an object and everything under it in front of the cameras. Use as a ref. */
export const onBroadcast = (o: THREE.Object3D | null) => {
  o?.traverse((c) => c.layers.enable(BROADCAST_LAYER))
}

/**
 * The programme feed: what the screens show. Made at module load so the
 * screen materials can take its texture before a frame has been rendered
 * into it — until then it is black, which is what a screen does before the
 * feed comes up.
 */
export const FEED = new THREE.WebGLRenderTarget(640, 360)

/** Where he stands, and where the cameras look: about his chest. */
const SUBJECT = new THREE.Vector3(stage.x0 + 7.5, stage.h + 4.6, stage.z1 - 2.4 - 1.5)

/**
 * Three camera risers: one centre back, in the aisle behind the last row of
 * tables, and one along each side wall under the balcony arms. Each is a
 * 24-inch platform with a step up the back, the camera on sticks at the
 * front of it and a chair behind for the operator. The lens is a seated
 * operator's eye off the deck; under the arms that leaves a foot to the
 * slab.
 */
const RIGS: Array<[number, number]> = [
  [13, 0.5],
  [hall.x0 + 8.5, -18.5],
  [hall.x1 - 8.5, -18.5],
]
const RISER = { w: 5, d: 5, h: 2 }
const STEP = { w: 2, d: 0.9 }
/** The lens height off the riser deck, and how far forward on it the sticks stand. */
const LENS = 3.9
const STICKS = 0.8
const LENS_Y = RISER.h + LENS
/** The shot: tight on him at the podium, opening up when someone else is on the boards. */
const FOV = 8
const FOV_MAX = 40

/** A cylinder from a to b, for legs, bars and cable. */
function bar(a: THREE.Vector3, b: THREE.Vector3) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return { len, quat, pos: [mid.x, mid.y, mid.z] as [number, number, number] }
}

interface RigMats {
  dark: THREE.Material
  steel: THREE.Material
  rubber: THREE.Material
  glass: THREE.Material
  tally: THREE.Material
  skirt: THREE.Material
  deck: THREE.Material
  monitor: THREE.Material
}

/** A head: the group that pans and tilts, and where its lens is. */
interface Head {
  g: THREE.Group
  x: number
  z: number
}

/**
 * One camera position: the riser, the sticks on it, the camera on those,
 * and the pan bars back to where the operator sits. The camera looks along
 * its own +Z; the head group's rotation is set every feed frame from
 * wherever the shot is, so all three follow the same subject.
 */
function CameraRig({
  x,
  z,
  m,
  onHead,
}: {
  x: number
  z: number
  m: RigMats
  onHead: (h: Head | null) => void
}) {
  const yaw = Math.atan2(SUBJECT.x - x, SUBJECT.z - z)
  const dist = Math.hypot(SUBJECT.x - x, SUBJECT.z - z)
  const pitch = Math.atan2(SUBJECT.y - LENS_Y, dist)
  /** Where the sticks stand on the deck, toward the stage. */
  const sx = Math.sin(yaw) * STICKS
  const sz = Math.cos(yaw) * STICKS

  /*
    The sticks: three legs from a hub under the head, splayed to rubber feet,
    a mid-level spreader tying them, and two pan bars from the head back and
    down toward the chair.
  */
  const sticks = useMemo(() => {
    const hub = new THREE.Vector3(0, LENS - 0.55, 0)
    const legs = [0, 1, 2].map((k) => {
      const a = (k * 2 * Math.PI) / 3 + Math.PI / 2
      const foot = new THREE.Vector3(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0)
      return { foot, ...bar(hub, foot) }
    })
    const ring = new THREE.Vector3(0, (LENS - 0.55) * 0.45, 0)
    const spreader = legs.map((l) => bar(ring, hub.clone().lerp(l.foot, 0.55)))
    const bars = [-1, 1].map((s) =>
      bar(new THREE.Vector3(s * 0.3, LENS - 0.28, -0.35), new THREE.Vector3(s * 0.55, LENS - 0.75, -1.35)),
    )
    const cable = bar(new THREE.Vector3(0.5, LENS - 0.95, -0.9), new THREE.Vector3(0.6, 0.02, -1.4))
    return { legs, spreader, bars, cable }
  }, [])

  return (
    <group position={[x, 0, z]}>
      {/* the riser: a black-skirted deck, carpet on top, two steps up the back */}
      <mesh position={[0, RISER.h / 2 - 0.05, 0]} material={m.skirt}>
        <boxGeometry args={[RISER.w, RISER.h - 0.1, RISER.d]} />
      </mesh>
      <mesh position={[0, RISER.h - 0.05, 0]} material={m.deck}>
        <boxGeometry args={[RISER.w + 0.1, 0.1, RISER.d + 0.1]} />
      </mesh>
      <mesh position={[0, (RISER.h * 2) / 6, RISER.d / 2 + STEP.d / 2]} material={m.skirt}>
        <boxGeometry args={[STEP.w, (RISER.h * 2) / 3, STEP.d]} />
      </mesh>
      <mesh position={[0, RISER.h / 6, RISER.d / 2 + STEP.d * 1.5]} material={m.skirt}>
        <boxGeometry args={[STEP.w, RISER.h / 3, STEP.d]} />
      </mesh>
      <Collider minX={x - RISER.w / 2} maxX={x + RISER.w / 2} minZ={z - RISER.d / 2} maxZ={z + RISER.d / 2} below={6} />
      <Collider
        minX={x - STEP.w / 2}
        maxX={x + STEP.w / 2}
        minZ={z + RISER.d / 2}
        maxZ={z + RISER.d / 2 + STEP.d * 2}
        below={6}
      />

      {/* on the deck: the sticks, turned to the stage */}
      <group position={[sx, RISER.h, sz]} rotation={[0, yaw, 0]}>
        {sticks.legs.map((l, i) => (
          <group key={i}>
            <mesh position={l.pos} quaternion={l.quat} material={m.dark}>
              <cylinderGeometry args={[0.035, 0.05, l.len, 8]} />
            </mesh>
            <mesh position={[l.foot.x, 0.04, l.foot.z]} material={m.rubber}>
              <cylinderGeometry args={[0.08, 0.1, 0.08, 10]} />
            </mesh>
          </group>
        ))}
        {sticks.spreader.map((s, i) => (
          <mesh key={i} position={s.pos} quaternion={s.quat} material={m.steel}>
            <cylinderGeometry args={[0.02, 0.02, s.len, 6]} />
          </mesh>
        ))}
        <mesh position={[0, (LENS - 0.55) * 0.45, 0]} material={m.dark}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 10]} />
        </mesh>
        {/* the fluid head: a bowl on the hub, the tilt plate over it */}
        <mesh position={[0, LENS - 0.5, 0]} material={m.dark}>
          <cylinderGeometry args={[0.16, 0.24, 0.22, 14]} />
        </mesh>
        <mesh position={[0, LENS - 0.35, 0]} material={m.dark}>
          <cylinderGeometry args={[0.24, 0.22, 0.12, 14]} />
        </mesh>
        {sticks.bars.map((b, i) => (
          <group key={i}>
            <mesh position={b.pos} quaternion={b.quat} material={m.steel}>
              <cylinderGeometry args={[0.02, 0.02, b.len, 6]} />
            </mesh>
            <mesh position={[(i ? 1 : -1) * 0.55, LENS - 0.75, -1.35]} quaternion={b.quat} material={m.rubber}>
              <cylinderGeometry args={[0.035, 0.035, 0.3, 8]} />
            </mesh>
          </group>
        ))}
        {/* the camera cable, looped off the back and down to the deck */}
        <mesh position={[0.5, LENS - 0.55, -0.55]} rotation={[0, Math.PI / 2, Math.PI]} material={m.rubber}>
          <torusGeometry args={[0.4, 0.02, 6, 16, Math.PI]} />
        </mesh>
        <mesh position={sticks.cable.pos} quaternion={sticks.cable.quat} material={m.rubber}>
          <cylinderGeometry args={[0.02, 0.02, sticks.cable.len, 6]} />
        </mesh>
      </group>

      {/*
        The head, and the camera on it: base plate, body, a box lens with a
        hood and glass, a studio viewfinder up top tilted back to the
        operator and showing the feed, a handle, a battery on the back, a
        tally on the front. Lens forward on +Z.
      */}
      <group
        ref={(g) => onHead(g ? { g, x: x + sx, z: z + sz } : null)}
        position={[sx, LENS_Y, sz]}
        rotation={[-pitch, yaw, 0, 'YXZ']}
      >
        <mesh position={[0, -0.34, 0]} material={m.dark}>
          <boxGeometry args={[0.5, 0.08, 1.2]} />
        </mesh>
        <mesh position={[0, 0, -0.1]} material={m.dark}>
          <boxGeometry args={[0.62, 0.6, 1.3]} />
        </mesh>
        <mesh position={[0, -0.02, 0.95]} material={m.dark}>
          <boxGeometry args={[0.5, 0.5, 0.9]} />
        </mesh>
        <mesh position={[0, -0.02, 1.55]} rotation={[Math.PI / 2, 0, 0]} material={m.dark}>
          <cylinderGeometry args={[0.32, 0.26, 0.35, 16]} />
        </mesh>
        <mesh position={[0, -0.02, 1.42]} material={m.glass}>
          <circleGeometry args={[0.22, 16]} />
        </mesh>
        <mesh position={[0, 0.42, 0.15]} material={m.dark}>
          <boxGeometry args={[0.1, 0.24, 0.6]} />
        </mesh>
        <mesh position={[0, -0.05, -0.85]} material={m.dark}>
          <boxGeometry args={[0.5, 0.4, 0.2]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.32, 0.1, -0.3]} material={m.steel}>
            <boxGeometry args={[0.02, 0.2, 0.5]} />
          </mesh>
        ))}
        <mesh position={[0, 0.47, -0.45]} material={m.dark}>
          <boxGeometry args={[0.08, 0.35, 0.08]} />
        </mesh>
        <group position={[0, 0.72, -0.5]} rotation={[0.35, 0, 0]}>
          <mesh material={m.dark}>
            <boxGeometry args={[0.72, 0.48, 0.12]} />
          </mesh>
          <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]} material={m.monitor}>
            <planeGeometry args={[0.62, 0.36]} />
          </mesh>
          <mesh position={[0, 0.2, 0.08]} material={m.tally}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
        </group>
        <mesh position={[0.22, 0.32, 0.55]} material={m.tally}>
          <sphereGeometry args={[0.045, 8, 6]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * The three cameras in the house, and the feed they cut to.
 *
 * All three are props; one camera does the actual work, from the centre
 * position, and every third frame it draws the broadcast layer into `FEED`
 * at 640 by 360. The screens in the hall show that. Off B2 nothing is
 * rendered and the screens hold their last frame.
 *
 * The shot is an operator's: on him at the podium, and if she walks onto
 * the boards it eases out to hold the two of them. The three heads turn
 * with it.
 */
export function Broadcast() {
  const m = useMemo<RigMats>(
    () => ({
      dark: M(0x15161a, { roughness: 0.6, metalness: 0.4 }),
      steel: M(0x3a3d44, { roughness: 0.3, metalness: 0.8 }),
      rubber: M(0x1c1c1e, { roughness: 0.95 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.05, metalness: 0.9 }),
      tally: new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff2020, emissiveIntensity: 3 }),
      skirt: M(0x0e0e10, { roughness: 1 }),
      deck: M(0x2a2a2e, { roughness: 0.95 }),
      monitor: new THREE.MeshBasicMaterial({ map: FEED.texture }),
    }),
    [],
  )
  const cam = useMemo(() => {
    // a long lens from the back of the house: head, shoulders and the podium plate
    const c = new THREE.PerspectiveCamera(FOV, 16 / 9, 1, 120)
    const [x, z] = RIGS[0]
    const yaw = Math.atan2(SUBJECT.x - x, SUBJECT.z - z)
    c.position.set(x + Math.sin(yaw) * STICKS, LENS_Y, z + Math.cos(yaw) * STICKS)
    c.lookAt(SUBJECT)
    c.layers.set(BROADCAST_LAYER)
    c.updateMatrixWorld()
    return c
  }, [])
  const tick = useRef(0)
  const root = useRef<THREE.Group>(null)
  const heads = useRef<Array<Head | null>>([])

  // the shot: where it is aimed and how wide, easing toward what it wants
  const aim = useRef(SUBJECT.clone())
  const fov = useRef(FOV)
  const v = useMemo(() => ({ want: new THREE.Vector3(), her: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), [])

  /** The operators' chairs, one behind each camera, facing the stage. */
  const chairs = useMemo<Chair[]>(
    () =>
      RIGS.map(([x, z]) => {
        const yaw = Math.atan2(SUBJECT.x - x, SUBJECT.z - z)
        return { x: x - Math.sin(yaw) * 1.4, z: z - Math.cos(yaw) * 1.4, ry: yaw + Math.PI }
      }),
    [],
  )

  /*
    The feed runs on both floors: the hall is dark and hidden while you are
    upstairs, but Chris has it on a monitor in the wing, so the camera still
    has to see it. Off B2 the floor's group is switched on for the length of
    this one render and switched straight back — the group is the `<Floor>`
    wrapper two parents up from here.
  */
  useFrame(({ gl, scene }, delta) => {
    if (tick.current++ % 3) return
    const off = office().floor !== 'b2'

    // The operator: on him, unless she has walked onto the boards, then on both.
    const onStage =
      !off &&
      player.y > stage.h - 0.5 &&
      player.x > stage.x0 &&
      player.x < stage.x1 &&
      player.z > stage.z0 &&
      player.z < stage.z1
    let wantFov = FOV
    if (onStage) {
      v.her.set(player.x, player.y + 4.4, player.z)
      v.want.addVectors(SUBJECT, v.her).multiplyScalar(0.5)
      // wide enough for both across a 16:9 frame: the angle between them from the lens, and a margin
      v.a.subVectors(SUBJECT, cam.position).normalize()
      v.b.subVectors(v.her, cam.position).normalize()
      const half = Math.tan(v.a.angleTo(v.b) / 2 + 0.06) / (16 / 9)
      wantFov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(half)), FOV, FOV_MAX)
    } else {
      v.want.copy(SUBJECT)
    }
    // an operator's pan: eased, a beat behind. This runs every third frame.
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 3 * 2.5)
    aim.current.lerp(v.want, k)
    fov.current += (wantFov - fov.current) * k
    cam.fov = fov.current
    cam.updateProjectionMatrix()
    cam.lookAt(aim.current)
    for (const h of heads.current) {
      if (!h) continue
      const yaw = Math.atan2(aim.current.x - h.x, aim.current.z - h.z)
      const pitch = Math.atan2(aim.current.y - LENS_Y, Math.hypot(aim.current.x - h.x, aim.current.z - h.z))
      h.g.rotation.set(-pitch, yaw, 0, 'YXZ')
    }

    let hidden: THREE.Object3D | null = null
    if (off) {
      for (let p = root.current?.parent ?? null; p; p = p.parent) {
        if (!p.visible) { hidden = p; break }
      }
      if (!hidden) return
      hidden.visible = true
    }
    // She is in the shot only while this is her floor: drawn whole, head and all, like the mirror does.
    if (off) cam.layers.disable(AVATAR_LAYER)
    else {
      cam.layers.enable(AVATAR_LAYER)
      drawWhole(true)
    }
    const was = gl.getRenderTarget()
    gl.setRenderTarget(FEED)
    gl.render(scene, cam)
    gl.setRenderTarget(was)
    if (!off) drawWhole(false)
    if (hidden) hidden.visible = false
  })

  return (
    <group ref={root}>
      {RIGS.map(([x, z], i) => (
        <CameraRig
          key={`${x}:${z}`}
          x={x}
          z={z}
          m={m}
          onHead={(h) => {
            heads.current[i] = h
          }}
        />
      ))}
      <BanquetChairs chairs={chairs} y={RISER.h} />
    </group>
  )
}
