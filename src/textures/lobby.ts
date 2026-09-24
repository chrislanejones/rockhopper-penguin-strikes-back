import { canvasTex, lazy } from '../lib/canvasTex'

/** Restroom door sign: pictogram, word, and the braille strip below it. */
export function restroomSignTex(which: 'MEN' | 'WOMEN') {
  return canvasTex(180, 240, (g, w, h) => {
    g.fillStyle = '#1c3d8f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#f4f6f9'
    g.fillRect(8, 8, w - 16, h - 16)

    g.fillStyle = '#14213d'
    const cx = w / 2
    // head
    g.beginPath()
    g.arc(cx, 62, 17, 0, 7)
    g.fill()
    if (which === 'MEN') {
      // torso and legs
      g.fillRect(cx - 22, 86, 44, 52)
      g.fillRect(cx - 18, 138, 14, 42)
      g.fillRect(cx + 4, 138, 14, 42)
    } else {
      // a-line dress
      g.beginPath()
      g.moveTo(cx - 12, 86)
      g.lineTo(cx + 12, 86)
      g.lineTo(cx + 32, 150)
      g.lineTo(cx - 32, 150)
      g.closePath()
      g.fill()
      g.fillRect(cx - 16, 150, 12, 30)
      g.fillRect(cx + 4, 150, 12, 30)
    }

    g.fillStyle = '#14213d'
    g.font = 'bold 22px sans-serif'
    g.textAlign = 'center'
    g.fillText(which, cx, 208)

    // braille
    g.fillStyle = '#6b7280'
    for (let i = 0; i < 12; i++) {
      g.beginPath()
      g.arc(cx - 34 + (i % 6) * 14, 222 + Math.floor(i / 6) * 7, 2, 0, 7)
      g.fill()
    }
  })
}

/** Badge-only door sign. Whatever is behind it, you are not on the list. */
export function secureSignTex(title: string, sub: string) {
  return canvasTex(200, 140, (g, w, h) => {
    g.fillStyle = '#f2f0ea'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#8a1c1c'
    g.fillRect(0, 0, w, 34)
    g.fillStyle = '#fff'
    g.font = 'bold 15px sans-serif'
    g.textAlign = 'center'
    g.fillText('BADGE REQUIRED', w / 2, 23)

    g.fillStyle = '#222'
    g.font = 'bold 17px sans-serif'
    g.fillText(title, w / 2, 66)
    g.font = '12px sans-serif'
    g.fillStyle = '#555'
    g.fillText(sub, w / 2, 88)
    g.font = '10px sans-serif'
    g.fillStyle = '#8a1c1c'
    g.fillText('No tailgating · Report lost badges', w / 2, 116)

    g.strokeStyle = '#c8c4ba'
    g.lineWidth = 2
    g.strokeRect(5, 5, w - 10, h - 10)
  })
}

/** Terrazzo, the floor every government lift lobby in London is made of. */
export const terrazzoTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#c9c4b6'
      g.fillRect(0, 0, w, h)
      const chips = ['#8a8478', '#6f6a60', '#e6e2d6', '#a8a294', '#5c5850', '#b9a98c']
      for (let i = 0; i < 1600; i++) {
        g.fillStyle = chips[(Math.random() * chips.length) | 0]
        g.save()
        g.translate(Math.random() * w, Math.random() * h)
        g.rotate(Math.random() * 6)
        const s = 1.5 + Math.random() * 4
        g.fillRect(-s / 2, -s / 2, s, s * (0.5 + Math.random()))
        g.restore()
      }
      // brass divider strips on a 128px grid
      g.fillStyle = 'rgba(176,141,60,.65)'
      g.fillRect(126, 0, 3, h)
      g.fillRect(0, 126, w, 3)
    },
    [6, 8],
  ),
)

/** Directional sign hung from the lobby ceiling. */
/**
 * The hung sign inside the suite opening, one face per direction of travel.
 *
 * The two faces cannot share a texture now that the lobby is asymmetric:
 * walking out of the suite, the restrooms are on your left and the lift is
 * straight on; walking back from the lift, the suite is straight on and the
 * restrooms are on your right.
 */
export const wayfindingTex = (facing: 'leaving' | 'returning') =>
  canvasTex(420, 110, (g, w, h) => {
    g.fillStyle = '#14213d'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#c8a03a'
    g.lineWidth = 2
    g.strokeRect(6, 6, w - 12, h - 12)

    const leaving = facing === 'leaving'
    g.fillStyle = '#f4f6f9'
    g.textAlign = 'left'
    g.font = 'bold 21px sans-serif'
    g.fillText(leaving ? '▲  ELEVATOR' : '▲  SUITE 2300', 24, 44)
    g.font = '15px sans-serif'
    g.fillStyle = '#c9d2e2'
    g.fillText(leaving ? '◀  RESTROOMS' : 'RESTROOMS  ▶', 24, 74)
    g.textAlign = 'right'
    g.fillStyle = '#f4f6f9'
    g.font = 'bold 21px sans-serif'
    g.fillText(leaving ? 'FLOOR 23' : 'ELEVATOR  ▼', w - 24, 44)
    g.font = '15px sans-serif'
    g.fillStyle = '#c9d2e2'
    g.fillText(leaving ? 'WEB OFFICE' : 'FLOOR 23', w - 24, 74)
  })

/** The brass plate under the wagon by the window. Nobody has ever queried it. */
export const wagonPlateTex = lazy(() =>
  canvasTex(420, 150, (g, w, h) => {
    g.fillStyle = '#b08d3c'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#9a7a30'
    g.fillRect(0, 0, w, 6)
    g.fillRect(0, h - 6, w, 6)
    g.fillStyle = '#3a2c10'
    g.textAlign = 'center'
    g.font = 'bold 21px Georgia, serif'
    g.fillText('THE BRITISH FOOD CART', w / 2, 46)
    g.font = 'italic 16px Georgia, serif'
    g.fillText('fish & chips  ·  pies  ·  tea', w / 2, 78)
    g.font = '13px Georgia, serif'
    g.fillText('Serving the island since 1938', w / 2, 106)
    g.font = '12px Georgia, serif'
    g.fillStyle = '#5a4718'
    g.fillText('Please do not sit in the cart', w / 2, 130)
  }),
)

/** Weathered cotton duck for the wagon bonnet: seams, and two centuries of it. */
export const wagonCanvasTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#e9e3d2'
      g.fillRect(0, 0, w, h)
      // woven tooth
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = `rgba(150,140,116,${Math.random() * 0.13})`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 1)
      }
      // panel seams, which is how a bonnet is actually made
      g.fillStyle = 'rgba(139,127,100,.5)'
      for (let x = 42; x < w; x += 64) g.fillRect(x, 0, 2, h)
      g.fillStyle = 'rgba(255,255,255,.45)'
      for (let x = 42; x < w; x += 64) g.fillRect(x + 3, 0, 1, h)
      // damp stains along the bottom
      for (let i = 0; i < 14; i++) {
        const cx = Math.random() * w
        const cy = h - Math.random() * 70
        const r = 10 + Math.random() * 26
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, 'rgba(146,128,94,.24)')
        grad.addColorStop(1, 'rgba(146,128,94,0)')
        g.fillStyle = grad
        g.beginPath()
        g.arc(cx, cy, r, 0, 7)
        g.fill()
      }
    },
    [3, 1],
  ),
)

/** Restroom floor: one-foot ceramic tiles, grey grout, a two-by-two swatch. */
export const restroomTileTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#9a9a96'
      g.fillRect(0, 0, w, h)
      const t = w / 2
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const shade = 226 - ((i + j) % 2) * 4 - ((Math.random() * 6) | 0)
          g.fillStyle = `rgb(${shade},${shade - 2},${shade - 8})`
          g.fillRect(i * t + 3, j * t + 3, t - 6, t - 6)
        }
      }
      for (let i = 0; i < 400; i++) {
        g.fillStyle = `rgba(120,115,105,${Math.random() * 0.12})`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
    },
    [1, 1],
  ),
)

/** The wainscot: four-inch tiles in a pale green, the colour every restroom was. */
export const wallTileTex = lazy(() =>
  canvasTex(
    256,
    128,
    (g, w, h) => {
      g.fillStyle = '#b9bdb4'
      g.fillRect(0, 0, w, h)
      const t = 32
      for (let i = 0; i < w / t; i++) {
        for (let j = 0; j < h / t; j++) {
          const shade = 206 + ((Math.random() * 8) | 0)
          g.fillStyle = `rgb(${shade - 10},${shade + 4},${shade - 4})`
          g.fillRect(i * t + 2, j * t + 2, t - 4, t - 4)
        }
      }
    },
    [1, 1],
  ),
)

/** The notice over the sinks that nobody has ever needed telling. */
export const washHandsTex = lazy(() =>
  canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#f4f2ea'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#1c3d8f'
    g.lineWidth = 6
    g.strokeRect(6, 6, w - 12, h - 12)
    g.fillStyle = '#1c3d8f'
    g.textAlign = 'center'
    g.font = 'bold 30px sans-serif'
    g.fillText('EMPLOYEES', w / 2, 52)
    g.fillText('MUST WASH', w / 2, 86)
    g.fillText('HANDS', w / 2, 120)
    g.font = '13px sans-serif'
    g.fillStyle = '#555'
    g.fillText('before returning to work', w / 2, 144)
  }),
)
