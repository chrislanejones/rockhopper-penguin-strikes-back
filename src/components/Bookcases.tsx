import { useMemo } from 'react'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { HALF } from '../scene/constants'
import { canvasTex } from '../lib/canvasTex'
import { Box, Collider } from './props/primitives'

/** Against the south wall of the wing, west of the on-call board. */
const SZ = HALF - 0.75
const CW = 2.3
const CH = 6.6
const CD = 1.2
const SHELVES = 5
/** Where the run of three cases sits. It stops where the whiteboard begins. */
const XS = [22.4, 24.8, 27.2]

type SpineKind = 'blue' | 'code' | 'acts' | 'binder' | 'misc'

/**
 * Book spines, drawn to type.
 *
 * The reference shelf is what a Parliament office actually keeps: Blue
 * Books, the Code of the Island, Acts of Parliament, and a run of policy binders.
 */
function spineTex(kind: SpineKind, n: number) {
  return canvasTex(64, 256, (g, w, h) => {
    if (kind === 'blue') {
      g.fillStyle = '#16386e'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#d4b45a'
      g.fillRect(4, 14, w - 8, 3)
      g.fillRect(4, h - 26, w - 8, 3)
      g.save()
      g.translate(w / 2, h / 2)
      g.rotate(-Math.PI / 2)
      g.textAlign = 'center'
      g.fillStyle = '#e8d9a8'
      g.font = 'bold 17px serif'
      g.fillText('ISLAND', -24, -4)
      g.font = 'bold 14px serif'
      g.fillText('BLUE BOOK  ' + n, -24, 14)
      g.restore()
      g.strokeStyle = '#d4b45a'
      g.lineWidth = 2
      g.strokeRect(6, 32, w - 12, h - 70)
    } else if (kind === 'code') {
      g.fillStyle = '#7a1c1c'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#d8c07a'
      g.fillRect(0, 40, w, 26)
      g.fillRect(0, h - 90, w, 20)
      g.save()
      g.translate(w / 2, h / 2)
      g.rotate(-Math.PI / 2)
      g.textAlign = 'center'
      g.fillStyle = '#f2e6bf'
      g.font = 'bold 15px serif'
      g.fillText('CODE OF THE ISLAND', 10, 5)
      g.fillStyle = '#3a1010'
      g.font = 'bold 16px serif'
      g.fillText('VOL ' + n, 118, -42)
      g.restore()
    } else if (kind === 'acts') {
      g.fillStyle = '#123d2a'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#cbb26a'
      g.fillRect(5, 20, w - 10, 2)
      g.fillRect(5, h - 30, w - 10, 2)
      g.save()
      g.translate(w / 2, h / 2)
      g.rotate(-Math.PI / 2)
      g.textAlign = 'center'
      g.fillStyle = '#e6dcb8'
      g.font = 'bold 13px serif'
      g.fillText('ACTS OF ASSEMBLY', 0, -2)
      g.font = '12px serif'
      g.fillText(String(1990 + n), 0, 16)
      g.restore()
    } else if (kind === 'binder') {
      const cols = ['#2b4a7a', '#6b6b6b', '#7a4a2b', '#3f5f3f']
      g.fillStyle = cols[n % 4]
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#fff'
      g.fillRect(6, 26, w - 12, 54)
      g.fillStyle = '#222'
      g.font = '9px sans-serif'
      g.textAlign = 'center'
      g.save()
      g.translate(w / 2, 54)
      g.rotate(-Math.PI / 2)
      g.fillText(['PII POLICY', 'SEC-530', 'IT STANDARDS', 'PII ARCH'][n % 4], 0, 3)
      g.restore()
      g.fillStyle = 'rgba(0,0,0,.25)'
      g.fillRect(0, h - 40, w, 6)
    } else {
      g.fillStyle = ['#3a3f4a', '#5c4433', '#2f4739', '#4a3550', '#6a5a3a'][n % 5]
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(255,255,255,.75)'
      g.save()
      g.translate(w / 2, h / 2)
      g.rotate(-Math.PI / 2)
      g.textAlign = 'center'
      g.font = '11px serif'
      g.fillText(
        [
          'ISLAND BUDGET',
          'ADMIN CODE',
          'APA HANDBOOK',
          'FOIA GUIDE',
          'PROCUREMENT MANUAL',
        ][n % 5],
        0,
        3,
      )
      g.restore()
    }
  })
}

interface Book {
  x: number
  y: number
  w: number
  h: number
  leaning: boolean
  key: string
}

/** What goes on which shelf of which case. */
function shelfPlan(caseIndex: number, rowIndex: number): [SpineKind, number, number, boolean] {
  if (caseIndex === 0) {
    if (rowIndex < 3) return ['blue', 8, 1994 + rowIndex * 16, false]
    if (rowIndex === 3) return ['acts', 7, rowIndex * 3, true]
    return ['misc', 6, rowIndex, false]
  }
  if (caseIndex === 1) return ['code', rowIndex < 4 ? 8 : 6, 1 + rowIndex * 8, rowIndex === 4]
  if (rowIndex < 2) return ['binder', 5, rowIndex, false]
  if (rowIndex === 2) return ['misc', 7, rowIndex, true]
  return ['acts', 7, rowIndex * 4, false]
}

/** Open-front carcass. A solid box would hide the books. */
function Bookcase({ x }: { x: number }) {
  const caseMat = useMemo(() => M(0x6d5030, { roughness: 0.75 }), [])
  const backMat = useMemo(() => M(0x4d3a24, { roughness: 0.9 }), [])
  const shelfMat = useMemo(() => M(0x7d5c38), [])
  const trimMat = useMemo(() => M(0x5a4227), [])
  const shelfY = useMemo(
    () => Array.from({ length: SHELVES }, (_, i) => 0.6 + i * ((CH - 1.0) / SHELVES)),
    [],
  )

  return (
    <>
      <Box size={[0.09, CH, CD]} material={caseMat} position={[x - CW / 2, CH / 2, SZ]} cast={false} />
      <Box size={[0.09, CH, CD]} material={caseMat} position={[x + CW / 2, CH / 2, SZ]} cast={false} />
      <Box size={[CW, 0.1, CD]} material={caseMat} position={[x, CH - 0.05, SZ]} cast={false} />
      <Box size={[CW, 0.1, CD]} material={caseMat} position={[x, 0.55, SZ]} cast={false} />
      <Box size={[CW - 0.1, CH - 0.3, 0.06]} material={backMat} position={[x, CH / 2, SZ + CD / 2 - 0.05]} cast={false} />
      {shelfY.map((y) => (
        <Box key={y} size={[CW - 0.16, 0.09, CD - 0.1]} material={shelfMat} position={[x, y, SZ]} cast={false} />
      ))}
      <Box size={[CW + 0.16, 0.16, CD + 0.12]} material={trimMat} position={[x, CH + 0.06, SZ]} cast={false} />
      <Box size={[CW + 0.08, 0.4, CD + 0.06]} material={trimMat} position={[x, 0.2, SZ]} cast={false} />
      <Collider minX={x - CW / 2 - 0.1} maxX={x + CW / 2 + 0.1} minZ={SZ - CD / 2} maxZ={SZ + CD / 2} />
    </>
  )
}

/**
 * The reference run in the wing: three cases of Parliament books, a Blue
 * Book left open on top, and a step stool nobody puts back.
 */
export function Bookcases() {
  const page = mat.page
  const shelfY = useMemo(
    () => Array.from({ length: SHELVES }, (_, i) => 0.6 + i * ((CH - 1.0) / SHELVES)),
    [],
  )

  /** Materials are cached per kind+number, because many spines repeat. */
  const spineMats = useMemo(() => {
    const store = new Map<string, THREE.MeshStandardMaterial>()
    return (kind: SpineKind, n: number) => {
      const k = kind + n
      let m = store.get(k)
      if (!m) {
        m = new THREE.MeshStandardMaterial({ map: spineTex(kind, n), roughness: 0.8 })
        store.set(k, m)
      }
      return m
    }
  }, [])

  /*
    Clear height between one shelf and the next.

    Books used to be up to 1.35 ft on a 1.12 ft shelf pitch, so the tall ones
    grew straight through the shelf above them. Nothing is taller than the
    hole it stands in now.
  */
  const CLEAR = (CH - 1.0) / SHELVES - 0.09 - 0.05

  const shelves = useMemo(() => {
    const out: Array<{ books: Book[]; mats: THREE.Material[][] }> = []
    XS.forEach((x, ci) => {
      shelfY.forEach((y, ri) => {
        const [kind, count, startN, lean] = shelfPlan(ci, ri)
        const books: Book[] = []
        const mats: THREE.Material[][] = []
        let off = -CW / 2 + 0.2
        for (let i = 0; i < count; i++) {
          const bw =
            kind === 'code' || kind === 'blue'
              ? 0.26 + Math.random() * 0.06
              : 0.2 + Math.random() * 0.14
          const bh = Math.min(
            CLEAR,
            kind === 'binder' ? 1.35 : 1.05 + Math.random() * 0.18,
          )
          if (off + bw > CW / 2 - 0.2) break
          books.push({
            x: x + off + bw / 2,
            y: y + bh / 2 + 0.09,
            w: bw,
            h: bh,
            leaning: lean && i === count - 1,
            key: `${ci}:${ri}:${i}`,
          })
          const spine = spineMats(kind, startN + i)
          mats.push([page, page, page, page, page, spine])
          off += bw + 0.012
        }
        out.push({ books, mats })
      })
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfY, spineMats, page])

  const openBookMat = useMemo(() => {
    const pageTex = canvasTex(200, 140, (g, w, h) => {
      g.fillStyle = '#f4efe0'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#d8d2c0'
      g.fillRect(w / 2 - 1, 0, 2, h)
      g.fillStyle = '#555'
      for (let y = 14; y < h - 8; y += 9) {
        g.fillRect(12, y, w / 2 - 26, 3)
        g.fillRect(w / 2 + 12, y, w / 2 - 26, 3)
      }
      g.fillStyle = '#16386e'
      g.fillRect(12, 8, 60, 4)
    })
    const cream = M(0xf0ead8)
    const cover = M(0x16386e)
    const spread = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 })
    return [cream, cream, spread, cream, cover, cream]
  }, [])

  const stoolTop = useMemo(() => M(0x8a8f96, { roughness: 0.5 }), [])

  return (
    <>
      {XS.map((x) => (
        <Bookcase key={x} x={x} />
      ))}

      {shelves.map(({ books, mats }, si) => (
        <group key={si}>
          {/*
            The leaner tips about its bottom edge, not its middle. Rotating
            the mesh in place swung its foot out through the shelf and its
            head through the book beside it.
          */}
          {/*
            No shadows from the books: a six-material box is six draws in the
            shadow pass, and a shelf's worth of them was a fifth of it, for
            shadows that fall inside the case where the case already is.
          */}
          {books.map((b, bi) => (
            <group
              key={b.key}
              position={[b.x + b.w / 2, b.y - b.h / 2, SZ - 0.14]}
              rotation={[0, 0, b.leaning ? -0.2 : 0]}
            >
              <mesh position={[-b.w / 2, b.h / 2, 0]} material={mats[bi]}>
                <boxGeometry args={[b.w, b.h, CD - 0.36]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* a Blue Book left open on top of the middle case */}
      <mesh position={[XS[1], CH + 0.22, SZ - 0.05]} rotation={[0, 0.12, 0]} material={openBookMat}>
        <boxGeometry args={[1.7, 0.12, CD - 0.3]} />
      </mesh>

      {/* step stool at the end of the run */}
      <group position={[XS[0] - 2.1, 0, SZ - 0.4]}>
        <mesh position={[0, 1.15, 0]} material={stoolTop}>
          <boxGeometry args={[1.3, 0.12, 1.0]} />
        </mesh>
        <mesh position={[0, 0.6, -0.5]} material={stoolTop}>
          <boxGeometry args={[1.3, 0.12, 0.7]} />
        </mesh>
        {(
          [
            [-0.55, -0.75],
            [0.55, -0.75],
            [-0.55, 0.35],
            [0.55, 0.35],
          ] as const
        ).map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.58, lz]} material={mat.steel}>
            <boxGeometry args={[0.08, 1.15, 0.08]} />
          </mesh>
        ))}
      </group>
      <Collider minX={XS[0] - 2.8} maxX={XS[0] - 1.4} minZ={SZ - 1.4} maxZ={SZ + 0.2} />
    </>
  )
}
