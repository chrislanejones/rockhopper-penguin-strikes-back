import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { M, mat } from '../scene/materials'
import { BZ, CLO, CR, HALF, PH, RX0, SOUTH_WALL, V } from '../scene/constants'
import { calendarPaperTex, gatekeeperPlateTex, iitsPosterTex } from '../textures/calendar'
import { agreementPlateTex, blendenPlateTex } from '../textures/b2'
import {
  blendenHallTex, iitsBannerTex, parliamentHouseTex, steamerPosterTex,
} from '../textures/island'
import { buildingPlaqueTex } from '../textures/signage'
import { Panel } from './props/primitives'

/**
 * Wall calendar on the break-room wall by the fridge.
 *
 * The photograph is Parliament House, London, laid over the paper as
 * its own plane so it keeps its full resolution and its own aspect.
 */
export function Calendar() {
  const house = parliamentHouseTex()
  const paper = useMemo(
    () => new THREE.MeshStandardMaterial({ map: calendarPaperTex(), roughness: 0.8 }),
    [],
  )
  const photo = useMemo(
    () => new THREE.MeshStandardMaterial({ map: house, roughness: 0.55 }),
    [house],
  )

  const x = RX0 + 0.03
  const y = 5.2
  const z = 6.4
  // The paper is 1.5 x 2.2 ft; the photo well is the top 200/440 of it.
  const photoW = 1.5 * (276 / 300)
  const photoH = 2.2 * (200 / 440)
  const photoY = y + 2.2 / 2 - (12 / 440) * 2.2 - photoH / 2

  return (
    <>
      <Panel size={[1.5, 2.2]} material={paper} position={[x, y, z]} rotation={[0, V, 0]} />
      <Panel
        size={[photoW, photoH]}
        material={photo}
        position={[x + 0.012, photoY, z]}
        rotation={[0, V, 0]}
      />
      <mesh position={[RX0 + 0.05, 6.32, z]} material={mat.steel}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>
    </>
  )
}

/**
 * IITS 2026 poster, south wall, between the kanban board and the elevator.
 * The banner across the top is the symposium's own artwork.
 */
export function IitsPoster() {
  const banner = iitsBannerTex()
  const body = useMemo(
    () => new THREE.MeshStandardMaterial({ map: iitsPosterTex(), roughness: 0.7 }),
    [],
  )
  const bannerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: banner, roughness: 0.7 }),
    [banner],
  )

  const x = SOUTH_WALL.iits.x
  const y = 4.8
  const z = HALF - 0.04
  const pw = SOUTH_WALL.iits.w
  const ph = pw * (520 / 360)
  // The banner well is 320/360 of the width and 120/520 of the height.
  const bw = pw * (320 / 360)
  const bh = ph * (120 / 520)
  const by = y + ph / 2 - (22 / 520) * ph - bh / 2

  return (
    <>
      <Panel size={[pw, ph]} material={body} position={[x, y, z]} rotation={[0, Math.PI, 0]} />
      <Panel
        size={[bw, bh]}
        material={bannerMat}
        position={[x, by, z - 0.012]}
        rotation={[0, Math.PI, 0]}
      />
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as const
      ).map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[x + (sx * (pw - 0.28)) / 2, y + (sy * (ph - 0.3)) / 2, z - 0.03]}
          material={mat.steel}
        >
          <sphereGeometry args={[0.03, 6, 6]} />
        </mesh>
      ))}
    </>
  )
}

/**
 * The IITS banner, whole, on the outside of the workstations 1-4 block.
 *
 * The poster on the south wall uses this artwork as a 320 x 120 inset. This is
 * the same file at its own 3:1 aspect and nothing else — no poster body, no
 * frame, no pins. The blank south face of the east cubicle run is the only
 * clear panel on that side of the block: the Night Garden wallpaper is on the
 * bay face behind it, not this one.
 */
export function IitsBanner() {
  const banner = iitsBannerTex()
  const m = useMemo(
    () => new THREE.MeshStandardMaterial({ map: banner, roughness: 0.7 }),
    [banner],
  )

  const w = 9.0
  // The banner is drawn at exactly three to one.
  const h = w / 3

  return (
    <Panel
      size={[w, h]}
      material={m}
      // Panel half-thickness is 0.11, so 7.12 stands the banner just clear of
      // the fabric rather than fighting it for the same plane.
      position={[(CR + HALF) / 2, PH / 2 + 0.8, BZ + 0.12]}
    />
  )
}

/**
 * The old steamer poster, big, on the end wall of the storage room.
 *
 * The strip room ends in thirteen feet of blank plaster you walk straight at,
 * which is the one wall in the building worth a full-size poster. Whoever put
 * it up is as long gone as the steamship line.
 */
export function SteamerPoster() {
  const art = steamerPosterTex()
  const m = useMemo(
    () => new THREE.MeshStandardMaterial({ map: art, roughness: 0.85 }),
    [art],
  )
  const tape = useMemo(
    () => M(0xe9e3d2, { roughness: 0.9, transparent: true, opacity: 0.75 }),
    [],
  )

  const w = 5.2
  // 620 x 799.
  const h = w * (799 / 620)
  const x = (CLO.x0 + CLO.x1) / 2
  // Hung to read from the aisle, not from a ladder: at eye height the top
  // used to run up into the joists and the duct crossed the headline.
  const y = h / 2 + 0.8
  const z = CLO.z0 + 0.06

  return (
    <>
      <Panel size={[w, h]} material={m} position={[x, y, z]} />
      {(
        [
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ] as const
      ).map(([sy, sx], i) => (
        <Panel
          key={i}
          size={[0.5, 0.22]}
          material={tape}
          position={[x + (sx * (w - 0.4)) / 2, y + (sy * (h - 0.14)) / 2, z + 0.01]}
          rotation={[0, 0, sx * sy * 0.5]}
        />
      ))}
    </>
  )
}

/**
 * The Gatekeeper, framed, in the lift lobby: a rockhopper on the north
 * landing with a sign that says what the Parliament is for. Everyone waiting
 * for the lift has to look at him, and the badge doors are right there.
 */
export function GatekeeperPortrait({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const portrait = useTexture('/textures/gatekeeper.webp')
  portrait.colorSpace = THREE.SRGBColorSpace
  portrait.anisotropy = 8
  const canvasMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: portrait, roughness: 0.6 }),
    [portrait],
  )
  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: gatekeeperPlateTex(),
        roughness: 0.35,
        metalness: 0.6,
      }),
    [],
  )
  const gilt = useMemo(() => M(0xa9843c, { roughness: 0.35, metalness: 0.75 }), [])
  const giltInner = useMemo(() => M(0x7d6128, { roughness: 0.45, metalness: 0.7 }), [])
  const backing = useMemo(() => M(0x2a2118, { roughness: 0.9 }), [])

  // gatekeeper.webp is square, 720 x 720.
  const picW = 2.5
  const picH = 2.5

  /*
    Depths, front faces in order: moulding 0.06, lip 0.12, mount 0.145,
    portrait 0.155.

    Each layer's front face has to clear the one behind it. The first cut of
    this had the portrait plane at exactly the lip's front face and the brass
    plate 0.005 off the moulding, so both flickered against the frame from
    anywhere in the lobby. The plate now hangs clear below the frame instead of
    inside it, which is where a gallery plate goes anyway.
  */
  return (
    <group position={position} rotation={rotation}>
      {/* outer gilt moulding */}
      <mesh material={gilt} castShadow>
        <boxGeometry args={[picW + 0.42, picH + 0.42, 0.12]} />
      </mesh>
      {/* inner lip, proud of the moulding */}
      <mesh position={[0, 0, 0.08]} material={giltInner}>
        <boxGeometry args={[picW + 0.16, picH + 0.16, 0.08]} />
      </mesh>
      {/* mount board, a dark reveal around the print */}
      <mesh position={[0, 0, 0.135]} material={backing}>
        <boxGeometry args={[picW + 0.1, picH + 0.1, 0.02]} />
      </mesh>
      <Panel size={[picW, picH]} material={canvasMat} position={[0, 0, 0.155]} />

      {/* brass plate, hung under the frame */}
      <Panel
        size={[1.5, 0.4]}
        material={plateMat}
        position={[0, -(picH + 0.42) / 2 - 0.24, 0.03]}
      />
    </group>
  )
}

/**
 * The Blenden Hall on the rocks, framed like the Gatekeeper.
 *
 * A painting of the 1821 wreck, the ship heeled over under the cliffs, with an
 * engraved brass plate under the frame telling anyone waiting for dinner how
 * the island got its first people.
 */
export function BlendenHallPainting({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const photo = blendenHallTex()
  const photoMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: photo, roughness: 0.6 }),
    [photo],
  )
  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: blendenPlateTex(),
        roughness: 0.35,
        metalness: 0.6,
      }),
    [],
  )
  const gilt = useMemo(() => M(0xa9843c, { roughness: 0.35, metalness: 0.75 }), [])
  const giltInner = useMemo(() => M(0x7d6128, { roughness: 0.45, metalness: 0.7 }), [])
  const backing = useMemo(() => M(0x2a2118, { roughness: 0.9 }), [])

  const picW = 3.4
  // The painting is 706 x 600.
  const picH = picW * (600 / 706)

  // Same stacked depths as the Gatekeeper's frame; the plate hangs clear below.
  return (
    <group position={position} rotation={rotation}>
      <mesh material={gilt} castShadow>
        <boxGeometry args={[picW + 0.42, picH + 0.42, 0.12]} />
      </mesh>
      <mesh position={[0, 0, 0.08]} material={giltInner}>
        <boxGeometry args={[picW + 0.16, picH + 0.16, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.135]} material={backing}>
        <boxGeometry args={[picW + 0.1, picH + 0.1, 0.02]} />
      </mesh>
      <Panel size={[picW, picH]} material={photoMat} position={[0, 0, 0.155]} />
      <Panel
        size={[2.2, 1.05]}
        material={plateMat}
        position={[0, -(picH + 0.42) / 2 - 0.62, 0.03]}
      />
    </group>
  )
}

/**
 * The 1817 agreement: the handwritten page William Glass and the first
 * settlers of Tristan da Cunha signed to share everything equally. Framed like
 * the Blenden Hall and hung over it on the mezzanine, between the two pairs
 * of doors onto the balcony. The plate says what it is.
 */
export function AgreementPage({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const photo = useTexture('/textures/agreement-1817.webp')
  photo.colorSpace = THREE.SRGBColorSpace
  photo.anisotropy = 8
  const photoMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: photo, roughness: 0.6 }),
    [photo],
  )
  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: agreementPlateTex(),
        roughness: 0.35,
        metalness: 0.6,
      }),
    [],
  )
  const gilt = useMemo(() => M(0xa9843c, { roughness: 0.35, metalness: 0.75 }), [])
  const giltInner = useMemo(() => M(0x7d6128, { roughness: 0.45, metalness: 0.7 }), [])
  const backing = useMemo(() => M(0x2a2118, { roughness: 0.9 }), [])

  const picW = 2.4
  // agreement-1817.webp is 560 x 886: the page, cropped out of the binding.
  const picH = picW * (886 / 560)

  return (
    <group position={position} rotation={rotation}>
      <mesh material={gilt} castShadow>
        <boxGeometry args={[picW + 0.42, picH + 0.42, 0.12]} />
      </mesh>
      <mesh position={[0, 0, 0.08]} material={giltInner}>
        <boxGeometry args={[picW + 0.16, picH + 0.16, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.135]} material={backing}>
        <boxGeometry args={[picW + 0.1, picH + 0.1, 0.02]} />
      </mesh>
      <Panel size={[picW, picH]} material={photoMat} position={[0, 0, 0.155]} />
      <Panel
        size={[2.2, 1.05]}
        material={plateMat}
        position={[0, -(picH + 0.42) / 2 - 0.62, 0.03]}
      />
    </group>
  )
}

/** Brushed directory plate, hung in the lift lobby. */
export function BuildingPlaque({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const m = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: buildingPlaqueTex(),
        roughness: 0.45,
        metalness: 0.4,
      }),
    [],
  )
  const mount = useMemo(() => M(0x8d939b, { roughness: 0.35, metalness: 0.7 }), [])
  const w = 2.9
  const h = w * (190 / 440)

  return (
    <group position={position} rotation={rotation}>
      {/* The mount plate sits behind; the face stands proud of it so the two
          do not fight over the same depth. */}
      <mesh position={[0, 0, -0.04]} material={mount}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.08]} />
      </mesh>
      <Panel size={[w, h]} material={m} position={[0, 0, 0.02]} />
      {(
        [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1],
        ] as const
      ).map(([sx, sy], i) => (
        <mesh
          key={i}
          position={[(sx * (w + 0.06)) / 2, (sy * (h + 0.06)) / 2, 0.03]}
          material={mat.steel}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
      ))}
    </group>
  )
}
