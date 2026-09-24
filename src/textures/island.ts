import { canvasTex, lazy } from '../lib/canvasTex'

/*
  The Parliament of Inaccessible Island: the agency that keeps the island and
  what grows on it. Inaccessible is the uninhabited one in the Tristan da Cunha
  group, a plateau on cliffs with one waterfall down the north face. It is
  part of a British Overseas Territory with no buildings on it, and nothing on
  Tristan is taller than a house, so the Parliament's tower is in London.
  Denstone Hall and the Rockhopper Building are made up; the island,
  its birds and the wreck of the MS Oliva are not.

  Everything here is painted, not photographed, so none of it is anyone
  else's artwork.
*/

const NAVY = '#0d2a66'
const GOLD = '#c8a44a'

/** The island in profile: sheer cliffs, a flat top, the waterfall on the face. */
function plateau(g: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, fill: string) {
  g.fillStyle = fill
  g.beginPath()
  g.moveTo(x, base)
  g.lineTo(x + w * 0.06, base - h * 0.82)
  g.lineTo(x + w * 0.16, base - h * 0.96)
  g.lineTo(x + w * 0.42, base - h)
  g.lineTo(x + w * 0.7, base - h * 0.97)
  g.lineTo(x + w * 0.9, base - h * 0.86)
  g.lineTo(x + w, base)
  g.closePath()
  g.fill()
}

/** The Parliament's roundel: the island over the sea, in a gold ring. */
export function emblem(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, ringText = true) {
  g.save()
  g.fillStyle = GOLD
  g.beginPath()
  g.arc(cx, cy, r, 0, 7)
  g.fill()
  const ri = ringText ? r * 0.74 : r * 0.9
  g.fillStyle = '#dce9f2'
  g.beginPath()
  g.arc(cx, cy, ri, 0, 7)
  g.fill()
  g.save()
  g.beginPath()
  g.arc(cx, cy, ri, 0, 7)
  g.clip()
  // sea
  g.fillStyle = '#2c5d8f'
  g.fillRect(cx - ri, cy + ri * 0.28, ri * 2, ri)
  g.fillStyle = 'rgba(255,255,255,.55)'
  for (let i = 0; i < 3; i++) g.fillRect(cx - ri, cy + ri * (0.42 + i * 0.16), ri * 2, ri * 0.03)
  // island
  plateau(g, cx - ri * 0.72, cy + ri * 0.3, ri * 1.44, ri * 0.72, '#2f5d3a')
  // the waterfall
  g.fillStyle = '#ffffff'
  g.fillRect(cx - ri * 0.08, cy - ri * 0.38, ri * 0.07, ri * 0.68)
  g.restore()
  if (ringText) {
    g.fillStyle = NAVY
    g.font = `bold ${Math.round(r * 0.16)}px Georgia, serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const text = 'PARLIAMENT · INACCESSIBLE ISLAND · '
    const step = (Math.PI * 2) / text.length
    for (let i = 0; i < text.length; i++) {
      g.save()
      g.translate(cx, cy)
      g.rotate(-Math.PI / 2 + i * step)
      g.translate(0, -r * 0.87)
      g.fillText(text[i], 0, 0)
      g.restore()
    }
  }
  g.restore()
}

/** The island's flag: the roundel low on a navy field, the way it hangs. */
export const islandFlagTex = lazy(() =>
  canvasTex(512, 768, (g, w, h) => {
    g.fillStyle = NAVY
    g.fillRect(0, 0, w, h)
    emblem(g, w / 2, h * 0.55, 150)
  }),
)

/** The Parliament's own flag, for the stage: gold mace on a green field. */
export const parliamentFlagTex = lazy(() =>
  canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = '#1f5c3a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = GOLD
    g.fillRect(0, h * 0.08, w, 6)
    g.fillRect(0, h * 0.92 - 6, w, 6)
    // the mace, upright
    const cx = w / 2
    g.fillRect(cx - 5, h * 0.3, 10, h * 0.42)
    g.beginPath()
    g.arc(cx, h * 0.28, 26, 0, 7)
    g.fill()
    g.fillRect(cx - 30, h * 0.2, 60, 8)
    g.fillRect(cx - 14, h * 0.72, 28, 10)
  }),
)

/** Face of the agency sign in the lift lobby, 800 x 232. */
export const parliamentSignTex = lazy(() =>
  canvasTex(800, 232, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    emblem(g, 120, h / 2, 96)
    g.textAlign = 'left'
    g.fillStyle = NAVY
    g.font = '30px Georgia, serif'
    g.fillText('PARLIAMENT OF', 242, 84)
    g.font = 'bold 46px Georgia, serif'
    g.fillText('INACCESSIBLE ISLAND', 240, 134)
    g.fillStyle = GOLD
    g.fillRect(242, 150, 520, 3)
    g.fillStyle = '#4a5568'
    g.font = 'italic 20px Georgia, serif'
    g.fillText('Keeping the island, and what grows on it', 242, 184)
  }),
)

/** The symposium banner, 3:1: the one art every IITS poster starts from. */
export const iitsBannerTex = lazy(() =>
  canvasTex(774, 258, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, 0)
    bg.addColorStop(0, '#07184a')
    bg.addColorStop(1, '#1a3f8f')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    // swell lines across the bottom
    g.strokeStyle = 'rgba(126,200,255,.35)'
    g.lineWidth = 3
    for (let k = 0; k < 4; k++) {
      g.beginPath()
      for (let x = 0; x <= w; x += 8) {
        const y = h - 26 - k * 14 + Math.sin(x / 38 + k) * 5
        if (x === 0) g.moveTo(x, y)
        else g.lineTo(x, y)
      }
      g.stroke()
    }
    emblem(g, 118, 112, 78, false)
    g.textAlign = 'left'
    g.fillStyle = '#ffffff'
    g.font = 'bold 118px sans-serif'
    g.fillText('IITS', 226, 148)
    g.fillStyle = '#f2c14e'
    g.font = 'bold 54px sans-serif'
    g.fillText('2026', 520, 148)
    g.fillStyle = '#c7d3ee'
    g.font = '22px sans-serif'
    g.fillText('Inaccessible Island Technology Symposium', 228, 190)
  }),
)

/**
 * The paper the loneliest-house mosaic is taped to, 540 x 385: blank where the
 * picture goes, the caption along the bottom.
 */
export const loneliestPaperTex = lazy(() =>
  canvasTex(540, 385, (g, w, h) => {
    g.fillStyle = '#f4f1e8'
    g.fillRect(0, 0, w, h)
    g.textAlign = 'center'
    g.fillStyle = '#1f2a36'
    g.font = 'bold 24px Georgia, serif'
    g.fillText('THE LONELIEST HOUSE IN THE WORLD', w / 2, 334)
    g.fillStyle = '#5a6470'
    g.font = 'italic 16px Georgia, serif'
    g.fillText('Elliðaey, Iceland. Still one more building than Inaccessible.', w / 2, 362)
  }),
)
