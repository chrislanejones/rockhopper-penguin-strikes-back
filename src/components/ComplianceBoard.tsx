import { useMemo } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { RX0, V } from '../scene/constants'
import { laborLawPosterTex, noticeTex } from '../textures/compliance'
import { Panel } from './props/primitives'

/** West wall, in the clear run just past the calendar. */
const WX = RX0 + 0.04
const CZ = 10.2

/**
 * The compliance board by the calendar.
 *
 * The all-in-one labour law poster, plus the notices that accumulate around
 * one over time. Three of them are real. The fourth is about a box of
 * passports, and it has been up long enough that nobody sees it any more.
 */
export function ComplianceBoard() {
  const backing = useMemo(() => M(0x8d8578, { roughness: 0.95 }), [])
  const frame = useMemo(() => M(0x9aa0a8, { roughness: 0.4, metalness: 0.6 }), [])

  const poster = useMemo(
    () => new THREE.MeshStandardMaterial({ map: laborLawPosterTex(), roughness: 0.75 }),
    [],
  )

  const evacuation = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: noticeTex({
          header: 'IN CASE OF FIRE',
          headerColour: '#8a1c1c',
          emphasis: 'USE STAIRS',
          lines: ['Do not use the elevator.', 'Assembly point: Parliament Green,', 'north lawn.'],
          footer: 'FLOOR WARDEN: R. BUTLER',
        }),
        roughness: 0.8,
      }),
    [],
  )

  const passports = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: noticeTex({
          header: 'NOTICE TO ALL STAFF',
          headerColour: '#0d3b66',
          emphasis: 'Box with Passports must go to Delaware',
          lines: ['Do not open. Do not re-label.', 'Do not send by media mail.', '', 'See Chris before moving.'],
          footer: 'POST CONSPICUOUSLY — DO NOT REMOVE',
        }),
        roughness: 0.8,
      }),
    [],
  )

  const workersComp = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: noticeTex({
          header: 'REPORT ALL INJURIES',
          headerColour: '#1b5e20',
          lines: [
            'Report any workplace injury to',
            'your supervisor immediately.',
            '',
            'Panel physician list available',
            'from Human Resources.',
          ],
          footer: 'ISLAND WORKERS’ COMPENSATION ACT',
        }),
        roughness: 0.8,
      }),
    [],
  )

  /** Drawing-pin, in the colours a drawer of them comes in. */
  const Pin = ({ y, z, colour }: { y: number; z: number; colour: number }) => (
    <mesh position={[WX + 0.1, y, z]} rotation={[0, 0, V]}>
      <cylinderGeometry args={[0.035, 0.035, 0.05, 10]} />
      <meshStandardMaterial color={colour} roughness={0.35} />
    </mesh>
  )

  /*
    Board and frame, in one place.

    The four rails used to come out of a table of [y, z, len, thick] read by a
    ternary that guessed which of the two was the long side. It guessed right
    for the stiles and wrong for the rails, so the top and bottom of the frame
    rendered as two 3.75 ft posts standing on the middle of the board — one of
    them up through the ceiling, the other down the front of the labour law
    poster, taking a strip out of the minimum wage column.

    Each rail now states its own box. The stiles are BW/2 + half a rail out
    from the centre line, so the frame sits around the board rather than on it.
  */
  const BW = 3.7
  const BH = 5.0
  const BY = 4.9
  const R = 0.09

  return (
    <>
      {/* backing board and its frame */}
      <mesh position={[WX - 0.02, BY, CZ]} rotation={[0, V, 0]} material={backing} receiveShadow>
        <planeGeometry args={[BW, BH]} />
      </mesh>
      {(
        [
          // stiles: full height, one either side
          [BY, CZ - (BW + R) / 2, BH + R * 2, R],
          [BY, CZ + (BW + R) / 2, BH + R * 2, R],
          // rails: full width, top and bottom
          [BY + (BH + R) / 2, CZ, R, BW],
          [BY - (BH + R) / 2, CZ, R, BW],
        ] as const
      ).map(([y, z, sy, sz], i) => (
        <mesh key={i} position={[WX, y, z]} material={frame}>
          <boxGeometry args={[R, sy, sz]} />
        </mesh>
      ))}

      {/* the all-in-one poster */}
      <Panel size={[2.2, 3.2]} material={poster} position={[WX + 0.06, 5.3, CZ - 0.7]} rotation={[0, V, 0]} />
      <Pin y={6.82} z={CZ - 0.7} colour={0xc8402e} />
      <Pin y={3.78} z={CZ - 0.7} colour={0xc8402e} />

      {/* the notices that collect around one */}
      <Panel size={[1.1, 1.42]} material={evacuation} position={[WX + 0.06, 6.32, CZ + 1.05]} rotation={[0, V, 0]} />
      <Pin y={6.96} z={CZ + 1.05} colour={0x3a6ea5} />

      <Panel size={[1.1, 1.42]} material={passports} position={[WX + 0.06, 4.76, CZ + 1.05]} rotation={[0, V + 0.03, 0]} />
      <Pin y={5.4} z={CZ + 1.05} colour={0xf2c53d} />

      <Panel size={[1.1, 1.42]} material={workersComp} position={[WX + 0.06, 3.2, CZ + 1.05]} rotation={[0, V - 0.02, 0]} />
      <Pin y={3.84} z={CZ + 1.05} colour={0x4d8a4a} />

      {/* an acrylic leaflet holder screwed to the frame, empty as always */}
      <mesh position={[WX + 0.12, 2.9, CZ - 1.3]} rotation={[0, V, 0]}>
        <boxGeometry args={[0.55, 0.5, 0.16]} />
        <meshPhysicalMaterial color={0xdfe6ea} transparent opacity={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[WX + 0.05, 2.98, CZ - 1.3]} rotation={[0, V, 0]} material={mat.white}>
        <boxGeometry args={[0.44, 0.56, 0.03]} />
      </mesh>
    </>
  )
}
