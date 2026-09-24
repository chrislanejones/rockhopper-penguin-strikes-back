import { useMemo } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import {
  CLO, CLO_OLD, CLO_TURN, DOOR_Z0, DOOR_Z1, H, candela, closetToWorld,
} from '../scene/constants'
import { canvasTex } from '../lib/canvasTex'
import { boxedKeyboardTex } from '../textures/screens'
import { stickyTex } from '../textures/signage'
import { type Collider as ColliderBox } from '../lib/registry'
import { Box, Collider, Panel } from './props/primitives'
import { Skeleton } from './Skeleton'
import { Dvd } from './Dvd'

/**
 * The room itself: 13 ft across, the full 36 ft of the floor deep.
 *
 * These are the real room. Everything from `Rack` down is in the old room's
 * frame instead — see CLO_OLD — and gets turned into place at the bottom of
 * the file.
 */
const CW = CLO.x1 - CLO.x0
const CD = CLO.z1 - CLO.z0
const MX = (CLO.x0 + CLO.x1) / 2
const MZ = (CLO.z0 + CLO.z1) / 2

/**
 * A collider for something in the turned layout.
 *
 * Everything from `Rack` down to the DVD is placed in the old room's frame
 * (CLO_OLD) and rendered inside a group that turns it into the new one. The
 * meshes ride along with the group; colliders are registered in world space,
 * so theirs is done by hand.
 */
function TurnedCollider(b: ColliderBox) {
  return <Collider {...closetToWorld(b)} />
}

/** Shelf heights used throughout the room. */
const L4 = [1.2, 2.8, 4.4, 6.0]
const L3 = [1.3, 3.1, 4.9]

/**
 * The aisle, in the old frame.
 *
 * Racks line the two long walls, so the walk up the room is the strip through
 * the middle. Floor clutter goes hard against one wall or the other, never in
 * that strip.
 */
const EWASTE_Z = CLO_OLD.z0 + 2.7
const BIN_Z = CLO_OLD.z1 - 2.8

/** A run of wire shelving along X. */
function Rack({
  x0,
  x1,
  z,
  levels,
}: {
  x0: number
  x1: number
  z: number
  levels: number[]
}) {
  const postM = useMemo(() => M(0x9aa0a8, { roughness: 0.5, metalness: 0.5 }), [])
  const deckM = useMemo(() => M(0xb4b9c0, { roughness: 0.6, metalness: 0.3 }), [])
  return (
    <>
      {[x0, (x0 + x1) / 2, x1].map((x) => (
        <mesh key={x} position={[x, 3.7, z]} material={postM}>
          <boxGeometry args={[0.1, 7.4, 0.1]} />
        </mesh>
      ))}
      {levels.map((y) => (
        <mesh key={y} position={[(x0 + x1) / 2, y, z]} material={deckM} receiveShadow>
          <boxGeometry args={[x1 - x0 + 0.3, 0.08, 1.6]} />
        </mesh>
      ))}
      <TurnedCollider minX={x0 - 0.4} maxX={x1 + 0.4} minZ={z - 0.95} maxZ={z + 0.95} />
    </>
  )
}

/** Copy paper, by the ream and by the case. */
function Paper() {
  const reamMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: canvasTex(256, 128, (g, w, h) => {
          g.fillStyle = '#f2f0ea'
          g.fillRect(0, 0, w, h)
          g.fillStyle = '#1c4e9c'
          g.fillRect(0, 34, w, 58)
          g.fillStyle = '#fff'
          g.font = 'bold 22px sans-serif'
          g.textAlign = 'center'
          g.fillText('COPY PAPER', w / 2, 60)
          g.font = '14px sans-serif'
          g.fillText('8.5 x 11 · 500 SHEETS', w / 2, 82)
          g.fillStyle = '#c9c6be'
          g.fillRect(0, h - 16, w, 16)
        }),
        roughness: 0.6,
      }),
    [],
  )
  const caseMat = useMemo(() => M(0xc8b995, { roughness: 0.9 }), [])
  const caseLabel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: canvasTex(160, 70, (g, w) => {
          g.fillStyle = '#c8b995'
          g.fillRect(0, 0, w, 70)
          g.fillStyle = '#2b2b2b'
          g.font = 'bold 15px sans-serif'
          g.textAlign = 'center'
          g.fillText('10 REAMS', w / 2, 30)
          g.font = '12px sans-serif'
          g.fillText('LETTER · WHITE', w / 2, 50)
        }),
      }),
    [],
  )

  const reams = useMemo(() => {
    const out: Array<{ x: number; y: number; ry: number }> = []
    L4.slice(0, 2).forEach((y) => {
      for (let i = 0; i < 5; i++) {
        for (let k = 0; k < 3; k++) {
          out.push({
            x: CLO_OLD.x0 + 2.0 + i * 1.35,
            y: y + 0.24 + k * 0.4,
            ry: (Math.random() - 0.5) * 0.05,
          })
        }
      }
    })
    return out
  }, [])

  return (
    <>
      {reams.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.y, CLO_OLD.z0 + 1.0]}
          rotation={[0, r.ry, 0]}
          material={reamMat}
          castShadow
        >
          <boxGeometry args={[1.25, 0.38, 0.95]} />
        </mesh>
      ))}
      {L4.slice(2).map((y) =>
        Array.from({ length: 4 }, (_, i) => (
          <group key={`${y}-${i}`}>
            <mesh position={[CLO_OLD.x0 + 2.1 + i * 1.75, y + 0.6, CLO_OLD.z0 + 1.0]} material={caseMat}>
              <boxGeometry args={[1.6, 1.1, 1.3]} />
            </mesh>
            <mesh
              position={[CLO_OLD.x0 + 2.1 + i * 1.75, y + 0.6, CLO_OLD.z0 + 0.35]}
              rotation={[0, Math.PI, 0]}
              material={caseLabel}
            >
              <planeGeometry args={[1.1, 0.5]} />
            </mesh>
          </group>
        )),
      )}
    </>
  )
}

/** Keyboards, mice, headsets, webcams, docks, hubs, baggies of adapters. */
function Peripherals() {
  const kbMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: boxedKeyboardTex(), roughness: 0.6 }),
    [],
  )
  const kbBox = useMemo(() => M(0x3a3e44), [])
  const kbFaces = useMemo(
    () => [kbBox, kbBox, kbMat, kbBox, kbBox, kbBox],
    [kbBox, kbMat],
  )
  const binMat = useMemo(() => M(0x9aa3ad, { roughness: 0.7 }), [])
  const mouseMat = useMemo(() => M(0x24262b, { roughness: 0.4 }), [])
  const bandMat = useMemo(() => M(0x2b2d31, { roughness: 0.5 }), [])
  const cupMat = useMemo(() => M(0x2b2d31), [])
  const camMat = useMemo(() => M(0x1f2226, { roughness: 0.4 }), [])
  const lensMat = useMemo(() => M(0x0b0d10, { roughness: 0.1, metalness: 0.5 }), [])
  const dockMat = useMemo(() => M(0x2f3237, { roughness: 0.45 }), [])
  const hubMat = useMemo(() => M(0x54585e, { roughness: 0.4 }), [])
  const bagMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xdfe6ea,
        transparent: true,
        opacity: 0.55,
        roughness: 0.35,
      }),
    [],
  )

  const mice = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        x: CLO_OLD.x0 + 15.0 + Math.random() * 1.6,
        z: CLO_OLD.z0 + 0.6 + Math.random() * 0.8,
        ry: Math.random() * 3,
      })),
    [],
  )
  const hubs = useMemo(
    () => Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.3),
    [],
  )
  const bags = useMemo(() => Array.from({ length: 7 }, () => Math.random()), [])

  return (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={`kb${i}`}
          position={[
            CLO_OLD.x0 + 11.4 + (i % 2) * 2.2,
            L4[0] + 0.13 + Math.floor(i / 2) * 0.24,
            CLO_OLD.z0 + 1.0,
          ]}
          rotation={[0, (Math.random() - 0.5) * 0.06, 0]}
          material={kbFaces}
        >
          <boxGeometry args={[2.0, 0.22, 0.8]} />
        </mesh>
      ))}

      <mesh position={[CLO_OLD.x0 + 15.8, L4[0] + 0.45, CLO_OLD.z0 + 1.0]} material={binMat}>
        <boxGeometry args={[2.2, 0.9, 1.3]} />
      </mesh>
      {mice.map((m, i) => (
        <mesh
          key={`m${i}`}
          position={[m.x, L4[0] + 0.9, m.z]}
          rotation={[0, m.ry, 0]}
          scale={[0.8, 0.5, 1.15]}
          material={mouseMat}
        >
          <sphereGeometry args={[0.17, 12, 10]} />
        </mesh>
      ))}

      {/* headsets hooked over the rack upright */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={`hs${i}`}>
          <mesh
            position={[CLO_OLD.x0 + 10.3, L4[2] - 0.5 + i * 0.02, CLO_OLD.z0 + 0.5 + i * 0.4]}
            rotation={[0, Math.PI / 2, 0]}
            material={bandMat}
          >
            <torusGeometry args={[0.32, 0.05, 8, 20, Math.PI]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh
              key={s}
              position={[CLO_OLD.x0 + 10.3, L4[2] - 0.82, CLO_OLD.z0 + 0.5 + i * 0.4 + s * 0.3]}
              rotation={[Math.PI / 2, 0, Math.PI / 2]}
              material={cupMat}
            >
              <cylinderGeometry args={[0.17, 0.17, 0.12, 14]} />
            </mesh>
          ))}
        </group>
      ))}

      {Array.from({ length: 6 }, (_, i) => (
        <group key={`cam${i}`}>
          <mesh position={[CLO_OLD.x0 + 10.7 + i * 0.7, L4[1] + 0.2, CLO_OLD.z0 + 0.6]} material={camMat}>
            <boxGeometry args={[0.5, 0.35, 0.35]} />
          </mesh>
          <mesh
            position={[CLO_OLD.x0 + 10.7 + i * 0.7, L4[1] + 0.22, CLO_OLD.z0 + 0.42]}
            rotation={[0, Math.PI, 0]}
            material={lensMat}
          >
            <circleGeometry args={[0.09, 14]} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={`d${i}`}
          position={[
            CLO_OLD.x0 + 14.6 + (i % 2) * 1.3,
            L4[1] + 0.16 + Math.floor(i / 2) * 0.3,
            CLO_OLD.z0 + 1.2,
          ]}
          material={dockMat}
        >
          <boxGeometry args={[1.1, 0.28, 0.7]} />
        </mesh>
      ))}

      {hubs.map((ry, i) => (
        <mesh
          key={`h${i}`}
          position={[CLO_OLD.x0 + 10.6 + i * 0.55, L4[3] + 0.08, CLO_OLD.z0 + 1.3]}
          rotation={[0, ry, 0]}
          material={hubMat}
        >
          <boxGeometry args={[0.55, 0.12, 0.35]} />
        </mesh>
      ))}

      {bags.map((ry, i) => (
        <mesh
          key={`b${i}`}
          position={[
            CLO_OLD.x0 + 14.8 + (i % 3) * 0.85,
            L4[3] + 0.1 + Math.floor(i / 3) * 0.18,
            CLO_OLD.z0 + 0.6,
          ]}
          rotation={[0, ry, 0]}
          material={bagMat}
        >
          <boxGeometry args={[0.7, 0.16, 0.55]} />
        </mesh>
      ))}
    </>
  )
}

/** Desktops, monitors, laptops, printers, toner, and the e-waste pile. */
function Hardware() {
  const pcMat = useMemo(() => M(0x2f3237, { roughness: 0.5 }), [])
  const faceMat = useMemo(() => M(0x3a3e44), [])
  const monMat = useMemo(() => M(0x1a1b1e, { roughness: 0.4 }), [])
  const lapMat = useMemo(() => M(0x54585e, { roughness: 0.4 }), [])
  const prnMat = useMemo(() => M(0xd8d8d4, { roughness: 0.6 }), [])
  const prn2Mat = useMemo(() => M(0x3a3e44, { roughness: 0.5 }), [])
  const tonerMat = useMemo(() => M(0x1f2226, { roughness: 0.5 }), [])
  const crtMat = useMemo(() => M(0xcfc9b8, { roughness: 0.8 }), [])
  const binMat = useMemo(() => M(0x3f5f3f, { roughness: 0.8 }), [])
  const ledMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0, emissive: 0x3fd0ff, emissiveIntensity: 1.5 }),
    [],
  )
  const cableBlue = useMemo(() => M(0x2b63c9), [])

  const assetTag = (i: number) =>
    new THREE.MeshStandardMaterial({
      map: canvasTex(100, 40, (g, w) => {
        g.fillStyle = '#fff'
        g.fillRect(0, 0, w, 40)
        g.fillStyle = '#111'
        g.font = 'bold 13px monospace'
        g.textAlign = 'center'
        g.fillText('PII-' + (41200 + i * 7), w / 2, 27)
      }),
    })
  const tags = useMemo(() => Array.from({ length: 5 }, (_, i) => assetTag(i)), [])

  const cables = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: CLO_OLD.x0 + 13.8 + Math.random() * 1.4,
        y: 1.65 + i * 0.05,
        z: BIN_Z - 0.6 + Math.random() * 1.2,
        rx: Math.PI / 2 + (Math.random() - 0.5) * 0.4,
        rz: Math.random(),
        blue: i % 3 === 0,
      })),
    [],
  )
  const crts = useMemo(
    () => Array.from({ length: 5 }, () => (Math.random() - 0.5) * 0.5),
    [],
  )

  return (
    <>
      {/* desktops with their asset tags */}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={`pc${i}`}>
          <mesh position={[CLO_OLD.x0 + 2.6 + i * 1.5, L4[0] + 0.78, CLO_OLD.z1 - 1.0]} material={pcMat}>
            <boxGeometry args={[0.7, 1.5, 1.35]} />
          </mesh>
          <mesh
            position={[CLO_OLD.x0 + 2.6 + i * 1.5, L4[0] + 0.78, CLO_OLD.z1 - 1.68]}
            rotation={[0, Math.PI, 0]}
            material={faceMat}
          >
            <planeGeometry args={[0.6, 1.3]} />
          </mesh>
          <mesh
            position={[CLO_OLD.x0 + 2.6 + i * 1.5, L4[0] + 1.3, CLO_OLD.z1 - 1.69]}
            rotation={[0, Math.PI, 0]}
            material={ledMat}
          >
            <circleGeometry args={[0.04, 10]} />
          </mesh>
          <mesh
            position={[CLO_OLD.x0 + 2.6 + i * 1.5, L4[0] + 0.35, CLO_OLD.z1 - 1.69]}
            rotation={[0, Math.PI, 0]}
            material={tags[i]}
          >
            <planeGeometry args={[0.42, 0.17]} />
          </mesh>
        </group>
      ))}

      {/* monitors, filed on edge like records */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={`mo${i}`}
          position={[CLO_OLD.x0 + 2.4 + i * 0.24, L4[1] + 0.65, CLO_OLD.z1 - 1.0]}
          rotation={[0, 0, 0.03]}
          material={monMat}
        >
          <boxGeometry args={[0.16, 1.15, 1.9]} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={`mo2${i}`}
          position={[CLO_OLD.x0 + 5.6 + i * 0.24, L4[1] + 0.65, CLO_OLD.z1 - 1.0]}
          rotation={[0, 0, -0.03]}
          material={monMat}
        >
          <boxGeometry args={[0.16, 1.15, 1.9]} />
        </mesh>
      ))}

      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={`lap${i}`}
          position={[CLO_OLD.x0 + 8.2, L4[2] + 0.1 + i * 0.16, CLO_OLD.z1 - 1.0]}
          rotation={[0, (Math.random() - 0.5) * 0.1, 0]}
          material={lapMat}
        >
          <boxGeometry args={[1.5, 0.14, 1.05]} />
        </mesh>
      ))}

      <mesh position={[CLO_OLD.x0 + 12.4, L3[0] + 0.8, CLO_OLD.z1 - 1.0]} material={prnMat}>
        <boxGeometry args={[2.4, 1.5, 1.5]} />
      </mesh>
      <mesh position={[CLO_OLD.x0 + 15.2, L3[0] + 0.7, CLO_OLD.z1 - 1.0]} material={prn2Mat}>
        <boxGeometry args={[2.2, 1.3, 1.4]} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh
          key={`t${i}`}
          position={[
            CLO_OLD.x0 + 12.6 + (i % 2) * 1.9,
            L3[1] + 0.35 + Math.floor(i / 2) * 0.65,
            CLO_OLD.z1 - 1.0,
          ]}
          material={tonerMat}
        >
          <boxGeometry args={[1.5, 0.6, 0.7]} />
        </mesh>
      ))}

      {/*
        E-waste and the cable bin, shoved against the shelving.

        The middle of this room is the only way from the door to the back of
        it, so nothing stands in the middle of the old room — anything left there
        is something you have to squeeze past in the dark.
      */}
      {crts.map((ry, i) => (
        <group key={`crt${i}`}>
          <mesh position={[CLO_OLD.x0 + 3.0 + i * 2.0, 0.75, EWASTE_Z]} rotation={[0, ry, 0]} material={crtMat}>
            <boxGeometry args={[1.7, 1.5, 1.7]} />
          </mesh>
          <TurnedCollider
            minX={CLO_OLD.x0 + 2.1 + i * 2.0}
            maxX={CLO_OLD.x0 + 3.9 + i * 2.0}
            minZ={EWASTE_Z - 0.9}
            maxZ={EWASTE_Z + 0.9}
          />
        </group>
      ))}

      <mesh position={[CLO_OLD.x0 + 14.5, 0.8, BIN_Z]} material={binMat}>
        <boxGeometry args={[2.2, 1.6, 1.6]} />
      </mesh>
      <TurnedCollider minX={CLO_OLD.x0 + 13.3} maxX={CLO_OLD.x0 + 15.7} minZ={BIN_Z - 0.9} maxZ={BIN_Z + 0.9} />
      {cables.map((c, i) => (
        <mesh
          key={`c${i}`}
          position={[c.x, c.y, c.z]}
          rotation={[c.rx, 0, c.rz]}
          material={c.blue ? cableBlue : mat.black}
        >
          <torusGeometry args={[0.24, 0.045, 6, 16]} />
        </mesh>
      ))}
    </>
  )
}

/**
 * Storage Room 2301 — a proper store, not a broom cupboard.
 *
 * No drop ceiling in here: the deck, the joists and the duct are all exposed,
 * lit by strip fluorescents on chains.
 */
/**
 * The laptop shelf by the door: eleven machines nobody will sign for.
 *
 * Every one has a note on the lid in somebody's hand, and not one of the
 * notes is a fault code. This is what happens when a service desk runs out
 * of asset tags and starts using a marker.
 */
const LAPTOP_NOTES: Array<[string[], string]> = [
  [['stopped', 'working'], '#fff28a'],
  [['Windows', "Don't Use", 'Edition'], '#a8e8ff'],
  [['no charger', 'anywhere'], '#ffc0e0'],
  [['makes a noise'], '#fff28a'],
  [['boots. once.'], '#c8f0c0'],
  [['DO NOT WIPE', 'has the thing', 'on it'], '#ffc0e0'],
  [['battery is', 'a bit round'], '#fff28a'],
  [['fan sounds', 'like a moped'], '#a8e8ff'],
  [['asset tag?'], '#c8f0c0'],
  [['works but', 'nobody knows', 'the password'], '#fff28a'],
  [['this one is', 'fine actually'], '#a8e8ff'],
]

function DeadLaptops() {
  const lid = useMemo(() => M(0x54585e, { roughness: 0.4 }), [])
  const lidDark = useMemo(() => M(0x3d4147, { roughness: 0.45 }), [])
  const foot = useMemo(() => M(0x24262b, { roughness: 0.6 }), [])
  const notes = useMemo(
    () =>
      LAPTOP_NOTES.map(
        ([lines, colour]) =>
          new THREE.MeshStandardMaterial({ map: stickyTex(lines, colour), roughness: 0.9 }),
      ),
    [],
  )

  /** Stacked in threes along the shelf, with two stood on edge at the end. */
  const stacked = notes.slice(0, 9)
  const upright = notes.slice(9)

  return (
    <>
      {stacked.map((m, i) => {
        const col = Math.floor(i / 3)
        const k = i % 3
        const x = CLO_OLD.x1 + 3.4 + col * 3.6
        const y = L4[1] + 0.13 + k * 0.19
        const ry = (((i * 37) % 11) - 5) * 0.012
        return (
          <group key={i} position={[x, y, CLO_OLD.z0 + 1.0]} rotation={[0, ry, 0]}>
            <mesh material={k === 1 ? lidDark : lid} castShadow>
              <boxGeometry args={[2.1, 0.15, 1.45]} />
            </mesh>
            {/* the rubber feet, which is all you see of the underside */}
            {k === 0 &&
              (
                [
                  [-0.85, -0.55],
                  [0.85, -0.55],
                  [-0.85, 0.55],
                  [0.85, 0.55],
                ] as const
              ).map(([ox, oz], f) => (
                <mesh key={f} position={[ox, -0.09, oz]} material={foot}>
                  <boxGeometry args={[0.18, 0.03, 0.12]} />
                </mesh>
              ))}
            {/*
              Flat on the lid, and on the chest-height shelf rather than the
              one above it — a note at shoulder height is edge-on to you and
              may as well be blank.
            */}
            <Panel
              size={[0.78, 0.78]}
              material={m}
              position={[0.24, 0.081, -0.12]}
              rotation={[-Math.PI / 2, 0, ry * 6 + 0.14]}
            />
          </group>
        )
      })}

      {upright.map((m, i) => {
        const x = CLO_OLD.x1 + 12.0 + i * 0.42
        return (
          <group
            key={`u${i}`}
            position={[x, L4[1] + 0.78, CLO_OLD.z0 + 1.0]}
            rotation={[0, 0.06, i === 0 ? 0.05 : -0.04]}
          >
            <mesh material={i === 0 ? lid : lidDark} castShadow>
              <boxGeometry args={[0.15, 1.45, 2.1]} />
            </mesh>
            <Panel
              size={[0.72, 0.72]}
              material={m}
              position={[0.082, 0.15, 0.25]}
              rotation={[0, Math.PI / 2, 0.1]}
            />
          </group>
        )
      })}
    </>
  )
}

export function StorageCloset() {
  const floorMat = useMemo(() => M(0x6a6f78, { roughness: 1 }), [])
  /*
    The deck casts.

    This room has no windows and one door, but the slab over it was a plane
    with no shadow of its own, so the sun came straight down through it and
    lit the floor. Every surface that encloses the room now blocks the light
    it is supposed to be blocking.
  */
  const deckMat = useMemo(
    () => M(0x3a3d42, { roughness: 1, shadowSide: THREE.DoubleSide }),
    [],
  )
  const joistMat = useMemo(() => M(0x4a4e55), [])
  const ductMat = useMemo(() => M(0x9a9da3, { roughness: 0.5, metalness: 0.4 }), [])
  const cw = useMemo(
    () => M(0xd9d5cb, { roughness: 0.95, shadowSide: THREE.DoubleSide }),
    [],
  )
  const stripMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xf6f2e2,
        emissiveIntensity: 1.1,
        roughness: 0.4,
      }),
    [],
  )

  const WALL_H = H + 1.4

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[MX, 0.01, MZ]} material={floorMat} receiveShadow>
        <planeGeometry args={[CW, CD]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[MX, H + 1.2, MZ]} material={deckMat} castShadow>
        <planeGeometry args={[CW, CD]} />
      </mesh>
      {/* joists span the short way, every two feet up the room */}
      {Array.from({ length: CD / 2 }, (_, i) => (
        <mesh key={i} position={[MX, H + 0.9, CLO.z0 + 1 + i * 2]} material={joistMat}>
          <boxGeometry args={[CW, 0.5, 0.3]} />
        </mesh>
      ))}
      <mesh position={[CLO.x0 + 3.2, H + 0.1, MZ]} material={ductMat}>
        <boxGeometry args={[1.6, 1.1, CD - 2]} />
      </mesh>

      {/* walls: north, south, east, and the shared one with the door in it */}
      <Box size={[CW + 0.6, WALL_H, 0.3]} material={cw} position={[MX, WALL_H / 2, CLO.z0 - 0.15]} />
      <Box size={[CW + 0.6, WALL_H, 0.3]} material={cw} position={[MX, WALL_H / 2, CLO.z1 + 0.15]} />
      <Box size={[0.3, WALL_H, CD + 0.6]} material={cw} position={[CLO.x1 + 0.15, WALL_H / 2, MZ]} />
      {/*
        Full height to the deck, not to the suite's drop ceiling: this room
        has no lay-in ceiling, so a wall that stopped at 8 ft would leave a
        1.2 ft slot above it with daylight coming through.

        Stood clear of x = CLO.x0 rather than centred on it. The suite paints
        its own east elevation on exactly that plane, and two coplanar quads
        striped the whole shared wall from inside the store room.
      */}
      {(
        [
          [(CLO.z0 + DOOR_Z0) / 2, DOOR_Z0 - CLO.z0],
          [(DOOR_Z1 + CLO.z1) / 2, CLO.z1 - DOOR_Z1],
        ] as const
      ).map(([cz, len], i) => (
        <Box
          key={i}
          size={[0.3, WALL_H, len]}
          material={cw}
          position={[CLO.x0 + 0.2, WALL_H / 2, cz]}
        />
      ))}

      <Collider minX={CLO.x0 - 0.6} maxX={CLO.x1 + 0.6} minZ={CLO.z0 - 0.6} maxZ={CLO.z0} />
      <Collider minX={CLO.x0 - 0.6} maxX={CLO.x1 + 0.6} minZ={CLO.z1} maxZ={CLO.z1 + 0.6} />
      <Collider minX={CLO.x1} maxX={CLO.x1 + 0.6} minZ={CLO.z0} maxZ={CLO.z1} />
      <Collider minX={CLO.x0 - 0.4} maxX={CLO.x0 + 0.35} minZ={CLO.z0} maxZ={DOOR_Z0} />
      <Collider minX={CLO.x0 - 0.4} maxX={CLO.x0 + 0.35} minZ={DOOR_Z1} maxZ={CLO.z1} />

      {/* strip lights on chains, up the middle; three of the five are lit */}
      {[0, 1, 2, 3, 4].map((i) => {
        const z = CLO.z0 + 3.6 + i * 7.2
        return (
          <group key={i}>
            <mesh position={[MX, H - 0.2, z]} material={stripMat}>
              <boxGeometry args={[0.7, 0.2, 5]} />
            </mesh>
            {[-1, 1].map((sz) => (
              <mesh key={sz} position={[MX, H + 0.4, z + sz * 2.2]} material={mat.steel}>
                <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
              </mesh>
            ))}
            {i % 2 === 0 && (
              <pointLight position={[MX, H - 0.7, z]} color={0xfff2d8} intensity={candela(0.75)} distance={30} decay={2} />
            )}
          </group>
        )
      })}

      {/*
        The old room, turned into the north half of this one.

        Everything inside is in CLO_OLD's frame; the group does the quarter
        turn. The two racks past the old room's end are the south half — the
        stretch you walk up from the door — and they are mostly empty, which
        is how a store room looks by the door.
      */}
      <group position={[CLO_TURN.x, 0, CLO_TURN.z]} rotation={[0, CLO_TURN.ry, 0]}>
        <Rack x0={CLO_OLD.x0 + 1.4} x1={CLO_OLD.x0 + 8.6} z={CLO_OLD.z0 + 1.0} levels={L4} />
        <Rack x0={CLO_OLD.x0 + 10.2} x1={CLO_OLD.x1 - 1.2} z={CLO_OLD.z0 + 1.0} levels={L4} />
        <Rack x0={CLO_OLD.x0 + 2.0} x1={CLO_OLD.x0 + 9.2} z={CLO_OLD.z1 - 1.0} levels={L4} />
        <Rack x0={CLO_OLD.x0 + 11} x1={CLO_OLD.x1 - 1.4} z={CLO_OLD.z1 - 1.0} levels={L3} />
        <Rack x0={CLO_OLD.x1 + 1.5} x1={CLO_OLD.x1 + 14} z={CLO_OLD.z0 + 1.0} levels={L4} />

        <Paper />
        <Peripherals />
        <Hardware />
        <DeadLaptops />
        <Skeleton />

        {/*
          Somebody's DVD, stood face-out on the shelf.

          The cover is the +z face of the case, and the rack it sits on backs
          onto the wall — so it needs turning through PI to face the aisle
          instead of the plaster. Sat just below eye height, where you cannot
          miss it on the way past.
        */}
        <Dvd
          position={[CLO_OLD.x0 + 3.6, L4[2] + 0.42, CLO_OLD.z1 - 1.55]}
          rotation={[0, Math.PI + 0.34, 0]}
        />
      </group>
    </>
  )
}
