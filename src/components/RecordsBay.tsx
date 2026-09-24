import { useMemo } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { BX2, CR2 } from '../scene/constants'
import { canvasTex } from '../lib/canvasTex'
import { farewellBannerTex } from '../textures/signage'
import { Collider, Panel } from './props/primitives'
import { DeskFan } from './props/Furniture'

/** Banker's box lid label — what is in it, which box, and when it can go. */
function boxTex(label: string, n: number) {
  return canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = '#cfc2a6'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 600; i++) {
      g.fillStyle = `rgba(150,135,105,${Math.random() * 0.18})`
      g.fillRect(Math.random() * w, Math.random() * h, 3, 2)
    }
    g.fillStyle = '#fff'
    g.fillRect(30, 44, 196, 96)
    g.strokeStyle = '#8a7c5e'
    g.lineWidth = 2
    g.strokeRect(30, 44, 196, 96)
    g.fillStyle = '#222'
    g.font = 'bold 20px sans-serif'
    g.textAlign = 'center'
    g.fillText(label, 128, 76)
    g.font = '15px sans-serif'
    g.fillStyle = '#444'
    g.fillText('BOX ' + n + ' of 40', 128, 102)
    g.fillText(['FY22', 'FY23', 'FY24', 'FY25'][n % 4] + '  ·  RETAIN 7 YRS', 128, 126)
    // hand holes
    g.fillStyle = '#6b6b6b'
    g.fillRect(18, 150, 60, 10)
    g.fillRect(178, 150, 60, 10)
  })
}

/** Binder spine, filed on a steel shelf. */
function spineTex(label: string, i: number) {
  return canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = ['#2b4a7a', '#6b6b6b', '#7a2b2b', '#3f5f3f', '#4a3550'][i % 5]
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'
    g.fillRect(6, 40, w - 12, 150)
    g.fillStyle = '#222'
    g.font = '10px sans-serif'
    g.textAlign = 'center'
    g.save()
    g.translate(w / 2, 115)
    g.rotate(-Math.PI / 2)
    g.fillText(label, 0, 3)
    g.restore()
    g.fillStyle = 'rgba(0,0,0,.3)'
    g.fillRect(0, 18, w, 5)
    g.fillRect(0, h - 24, w, 5)
  })
}

const BOX_LABELS = [
  'RECORDS', 'CONTRACTS', 'ARCHIVE', 'FOIA',
  'SURPLUS IT', 'PERSONNEL', 'AUDIT', 'MOVE 2024',
]
const BINDER_LABELS = [
  'FY24 INVOICES', 'SEC-530', 'ITRM', 'RFP 2024-08', 'SERVER LOGS',
  'TRAINING', 'BCP/DR', 'SURPLUS', 'MOU FILES', 'ARCHIVE',
]

/**
 * The NE bay of the wing: no workstation, just overflow records.
 *
 * Everything hugs the window and east walls so the west third of the bay stays
 * a walking aisle. See Chris before removing any of it.
 */
export function RecordsBay() {
  const lidMat = useMemo(() => M(0xd8cdb6, { roughness: 0.95 }), [])
  const boxMats = useMemo(
    () =>
      BOX_LABELS.map(
        (label, i) =>
          new THREE.MeshStandardMaterial({ map: boxTex(label, i + 1), roughness: 0.9 }),
      ),
    [],
  )
  const binderMats = useMemo(
    () =>
      BINDER_LABELS.map(
        (l, i) => new THREE.MeshStandardMaterial({ map: spineTex(l, i), roughness: 0.55 }),
      ),
    [],
  )
  const shelfMat = useMemo(() => M(0x9aa0a8, { roughness: 0.6, metalness: 0.3 }), [])
  const banner = useMemo(
    () => new THREE.MeshStandardMaterial({ map: farewellBannerTex(), roughness: 0.9 }),
    [],
  )
  const tapeMat = useMemo(
    () => M(0xe9e3d2, { roughness: 0.9, transparent: true, opacity: 0.72 }),
    [],
  )
  const postM = useMemo(() => M(0x7c8087, { roughness: 0.5, metalness: 0.5 }), [])
  const railMat = useMemo(() => M(0x9aa0a8, { metalness: 0.6, roughness: 0.4 }), [])
  const fileMats = useMemo(
    () => [0xd9cfae, 0xe8dcc0, 0xcfc2a0].map((c) => M(c)),
    [],
  )
  const page = mat.page

  // stacks against the window wall and the east wall
  const stacks: Array<[number, number, number]> = useMemo(
    () => [
      [41.2, -16.9, 4], [43.4, -16.9, 3], [45.0, -16.9, 2],
      [44.8, -15.2, 3], [44.8, -13.6, 2], [44.8, -12.0, 3], [44.8, -10.4, 2],
      [41.4, -15.3, 2], [42.6, -8.6, 3],
    ],
    [],
  )
  const boxes = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; ry: number; mi: number }> = []
    let mi = 0
    stacks.forEach(([x, z, n]) => {
      for (let i = 0; i < n; i++) {
        out.push({ x, y: i * 1.14, z, ry: (Math.random() - 0.5) * 0.14, mi: mi++ })
      }
    })
    return out
  }, [stacks])

  const ux = 42.6
  const uz = -6.4
  const levels = [0.9, 2.4, 3.9, 5.4]

  /** How many binders stand on each shelf, and which one has toppled. */
  const shelvedBinders = useMemo(
    () =>
      levels.map((y, li) => {
        const count = li === 3 ? 9 : 14
        const out: Array<{ x: number; w: number; leaning: boolean; mi: number }> = []
        let off = -2.9
        for (let i = 0; i < count; i++) {
          const bw = 0.3 + Math.random() * 0.14
          if (off + bw > 2.9) break
          out.push({ x: ux + off + bw / 2, w: bw, leaning: i === count - 1, mi: (li * 3 + i) % 10 })
          off += bw + 0.02
        }
        return { y, li, binders: out }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <>
      {boxes.map((b, i) => (
        <group key={i}>
          <mesh
            position={[b.x, b.y + 0.5, b.z]}
            rotation={[0, b.ry, 0]}
            material={boxMats[b.mi % 8]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.0, 1.0, 1.25]} />
          </mesh>
          <mesh position={[b.x, b.y + 1.04, b.z]} rotation={[0, b.ry, 0]} material={lidMat}>
            <boxGeometry args={[2.06, 0.12, 1.31]} />
          </mesh>
        </group>
      ))}
      {stacks.map(([x, z], i) => (
        <Collider key={i} minX={x - 1.2} maxX={x + 1.2} minZ={z - 0.9} maxZ={z + 0.9} />
      ))}

      {/* one box open on top of a stack, files standing in it */}
      <mesh position={[41.2, 4 * 1.14 - 0.6, -16.9]} material={boxMats[3]}>
        <boxGeometry args={[2.0, 1.0, 1.25]} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={`f${i}`}
          position={[40.4 + i * 0.19, 4 * 1.14 + 0.05, -16.9]}
          rotation={[0, 0, (Math.random() - 0.5) * 0.06]}
          material={fileMats[i % 3]}
        >
          <boxGeometry args={[0.1, 0.85, 1.0]} />
        </mesh>
      ))}
      <mesh position={[39.9, 0.06, -12.4]} rotation={[0.02, 0.5, 0]} material={lidMat}>
        <boxGeometry args={[2.06, 0.12, 1.31]} />
      </mesh>

      {/*
        Emily's leaving banner, still up.

        It came down off the break-room wall the Monday after and got carried
        in here with everything else nobody could throw away.
      */}
      <Panel
        size={[5.4, 1.5]}
        material={banner}
        position={[CR2 + 0.13, 5.5, -13.2]}
        rotation={[0, Math.PI / 2, -0.02]}
      />
      {[-1, 1].map((s2) => (
        <Panel
          key={s2}
          size={[0.42, 0.2]}
          material={tapeMat}
          position={[CR2 + 0.15, 6.16 + s2 * 0.02, -13.2 - s2 * 2.5]}
          rotation={[0, Math.PI / 2, s2 * 0.5]}
        />
      ))}

      {/*
        The last desk fan on the floor.

        When facilities put a pedestal fan in every bay, this one had nowhere
        to go and nobody to cool, so it ended up on top of a stack of FY24
        invoices, still oscillating. Lid height of a three-box stack is
        2 * 1.14 + 1.1.
      */}
      <DeskFan x={43.4} y={2 * 1.14 + 1.1} z={-16.9} />

      {/* steel shelving on the divider side, packed with binders */}
      {(
        [
          [-3.0, -0.65],
          [3.0, -0.65],
          [-3.0, 0.65],
          [3.0, 0.65],
        ] as const
      ).map(([ox, oz], i) => (
        <mesh key={`p${i}`} position={[ux + ox, 3.2, uz + oz]} material={postM}>
          <boxGeometry args={[0.12, 6.4, 0.12]} />
        </mesh>
      ))}
      {levels.map((y) => (
        <mesh key={`sh${y}`} position={[ux, y, uz]} material={shelfMat} receiveShadow>
          <boxGeometry args={[6.2, 0.1, 1.5]} />
        </mesh>
      ))}
      <Collider minX={ux - 3.2} maxX={ux + 3.2} minZ={uz - 0.9} maxZ={uz + 0.9} />

      {shelvedBinders.map(({ y, li, binders }) => (
        <group key={y}>
          {binders.map((b, i) => (
            <mesh
              key={i}
              position={[b.x, y + 0.7, uz - 0.1]}
              rotation={[0, 0, b.leaning ? -0.25 : 0]}
              material={[page, page, page, page, page, binderMats[b.mi]]}
            >
              <boxGeometry args={[b.w, 1.3, 1.2]} />
            </mesh>
          ))}
          {/* a few laid flat on top of the standing ones */}
          {li === 2 &&
            Array.from({ length: 3 }, (_, i) => (
              <mesh
                key={`flat${i}`}
                position={[ux + 1.4, y + 1.5 + i * 0.31, uz - 0.1]}
                rotation={[0, (Math.random() - 0.5) * 0.15, 0]}
                material={[page, page, binderMats[i], page, page, page]}
              >
                <boxGeometry args={[1.25, 0.3, 1.15]} />
              </mesh>
            ))}
        </group>
      ))}

      {/* hand truck parked in the corner */}
      <group position={[45.0, 0, -8.9]} rotation={[0, -1.2, -0.12]}>
        {[-0.55, 0.55].map((ox) => (
          <group key={ox}>
            <mesh position={[ox, 2.1, 0]} material={railMat}>
              <boxGeometry args={[0.1, 4.2, 0.1]} />
            </mesh>
            <mesh position={[ox, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={mat.black}>
              <cylinderGeometry args={[0.4, 0.4, 0.18, 18]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.12, 0.45]} material={railMat}>
          <boxGeometry args={[1.2, 0.1, 0.9]} />
        </mesh>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={i} position={[0, 0.9 + i * 1.05, 0]} material={railMat}>
            <boxGeometry args={[1.2, 0.08, 0.08]} />
          </mesh>
        ))}
      </group>
      <Collider minX={BX2 - 2} maxX={BX2} minZ={-9.9} maxZ={-7.9} />
    </>
  )
}
