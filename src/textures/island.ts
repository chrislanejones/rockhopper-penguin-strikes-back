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

/** The Island Lottery's box sign, square, lit from inside. */
export const lotterySignTex = lazy(() =>
  canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#c8102e'
    g.beginPath()
    g.arc(w / 2, h * 0.4, 150, 0, 7)
    g.fill()
    // a star in the ball
    g.fillStyle = '#ffd23f'
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 44 : 110
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const x = w / 2 + Math.cos(a) * r
      const y = h * 0.4 + Math.sin(a) * r
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.fill()
    g.fillStyle = NAVY
    g.textAlign = 'center'
    g.font = 'bold 58px sans-serif'
    g.fillText('ISLAND', w / 2, h * 0.84)
    g.font = 'bold 46px sans-serif'
    g.fillText('LOTTERY', w / 2, h * 0.95)
  }),
)

/** Old steamship-line poster for the storage-room wall. 620 x 799. */
export const steamerPosterTex = lazy(() =>
  canvasTex(620, 799, (g, w, h) => {
    g.fillStyle = '#efe2c2'
    g.fillRect(0, 0, w, h)
    // sunset sky
    const sky = g.createLinearGradient(0, 120, 0, 520)
    sky.addColorStop(0, '#e98a3c')
    sky.addColorStop(1, '#f6d58e')
    g.fillStyle = sky
    g.fillRect(30, 130, w - 60, 400)
    g.fillStyle = '#fbe9b5'
    g.beginPath()
    g.arc(w * 0.7, 420, 70, 0, 7)
    g.fill()
    // island on the horizon
    plateau(g, 60, 470, 300, 130, '#5a3b3b')
    // sea
    g.fillStyle = '#1f4f6e'
    g.fillRect(30, 470, w - 60, 200)
    g.fillStyle = 'rgba(251,233,181,.5)'
    for (let i = 0; i < 6; i++) g.fillRect(w * 0.55, 486 + i * 22, 140 - i * 16, 4)
    // the steamer
    g.fillStyle = '#1b1b1b'
    g.beginPath()
    g.moveTo(170, 580)
    g.lineTo(470, 580)
    g.lineTo(440, 620)
    g.lineTo(190, 620)
    g.fill()
    g.fillStyle = '#f2ead6'
    g.fillRect(230, 548, 180, 32)
    g.fillStyle = '#c8102e'
    g.fillRect(290, 500, 30, 48)
    g.fillRect(340, 500, 30, 48)
    g.fillStyle = '#1b1b1b'
    g.fillRect(290, 500, 30, 10)
    g.fillRect(340, 500, 30, 10)
    // lettering
    g.textAlign = 'center'
    g.fillStyle = '#7a1f1f'
    g.font = 'bold 34px Georgia, serif'
    g.fillText('VISIT', w / 2, 62)
    g.font = 'bold 50px Georgia, serif'
    g.fillText('INACCESSIBLE', w / 2, 112)
    g.fillStyle = '#1f3b57'
    g.font = 'bold 44px Georgia, serif'
    g.fillText('BY STEAMER', w / 2, 718)
    g.font = 'italic 22px Georgia, serif'
    g.fillText('from Cape Town, twelve days, weather permitting', w / 2, 752)
    g.font = '14px Georgia, serif'
    g.fillText('Landing not guaranteed', w / 2, 778)
    // age
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(110,80,40,${Math.random() * 0.08})`
      g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 2)
    }
  }),
)
