import { canvasTex, lazy } from '../lib/canvasTex'

/** Sticky notes on a board, jittered so no two sit square. */
type Note = [column: number, text: string, colour: string]

export const kanbanTex = lazy(() =>
  canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#f7f7f5'
    g.fillRect(0, 0, w, h)
    const cols = ['TO DO', 'IN PROGRESS', 'DONE']
    g.strokeStyle = '#1c3d8f'
    g.lineWidth = 5
    cols.forEach((c, i) => {
      const x = (i * w) / 3
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, h)
      g.stroke()
      g.fillStyle = '#1c3d8f'
      g.font = 'bold 30px sans-serif'
      g.textAlign = 'center'
      g.fillText(c, x + w / 6, 48)
    })
    g.beginPath()
    g.moveTo(0, 68)
    g.lineTo(w, 68)
    g.stroke()

    const notes: Note[] = [
      [0, 'CMS migration', '#ffe066'],
      [0, 'Q3 landing page', '#ffe066'],
      [0, 'Fix nav on mobile', '#ff9fb0'],
      [0, 'Newsletter copy', '#a5e8a5'],
      [1, 'Analytics dashboard', '#ffe066'],
      [1, 'Brand refresh', '#a5e8a5'],
      [1, 'SSO rollout', '#9ecbff'],
      [2, 'Server patching', '#9ecbff'],
      [2, 'Trade show deck', '#a5e8a5'],
      [2, 'Coffee machine', '#ff9fb0'],
      [2, 'Elevator ticket #4471', '#ff9fb0'],
    ]
    const cnt = [0, 0, 0]
    notes.forEach(([c, t, col]) => {
      const x = (c * w) / 3 + 30 + (cnt[c] % 2) * 150
      const y = 90 + Math.floor(cnt[c] / 2) * 105
      cnt[c]++
      g.save()
      g.translate(x + 60, y + 45)
      g.rotate((Math.random() - 0.5) * 0.12)
      g.fillStyle = 'rgba(0,0,0,.15)'
      g.fillRect(-56, -41, 120, 95)
      g.fillStyle = col
      g.fillRect(-60, -45, 120, 95)
      g.fillStyle = '#222'
      g.font = '16px sans-serif'
      g.textAlign = 'center'
      let yy = -10
      let line = ''
      t.split(' ').forEach((wd) => {
        if ((line + ' ' + wd).length > 13) {
          g.fillText(line, 0, yy)
          yy += 20
          line = wd
        } else line = (line ? line + ' ' : '') + wd
      })
      g.fillText(line, 0, yy)
      g.restore()
    })
    g.fillStyle = '#d13c2e'
    g.font = 'italic 18px sans-serif'
    g.textAlign = 'left'
    g.fillText('DO NOT ERASE — Liz', 20, h - 16)
  }),
)

/** The wing's board: on-call rota, plus two things nobody has actioned. */
export const onCallTex = lazy(() =>
  canvasTex(1024, 512, (g, w) => {
    g.fillStyle = '#f7f7f5'
    g.fillRect(0, 0, w, 512)
    g.fillStyle = '#1c3d8f'
    g.font = 'bold 30px sans-serif'
    g.textAlign = 'left'
    g.fillText('FLOOR 23 — ON CALL', 24, 44)
    g.strokeStyle = '#1c3d8f'
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(0, 60)
    g.lineTo(w, 60)
    g.stroke()
    g.fillStyle = '#222'
    g.font = '24px sans-serif'
    ;['Mon  Ray', 'Tue  Denise', 'Wed  Ray', 'Thu  Marcus', 'Fri  Ava', 'Weekend  ¯\\_(ツ)_/¯'].forEach(
      (l, i) => g.fillText(l, 40, 110 + i * 54),
    )
    g.fillStyle = '#d13c2e'
    g.font = 'italic 20px sans-serif'
    g.fillText('HVAC ticket #4471 — still open', 420, 150)
    g.fillText('IITS boat pool: sign below', 420, 200)
  }),
)

/** Cubicle nameplate. */
export const nameplateTex = (name: string, role: string) =>
  canvasTex(220, 55, (g, w, h) => {
    g.fillStyle = '#2b2d31'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'
    g.font = 'bold 18px sans-serif'
    g.textAlign = 'left'
    g.fillText(name, 10, 24)
    g.fillStyle = '#b9c6d3'
    g.font = '13px sans-serif'
    g.fillText(role, 10, 44)
  })

/** Overhead corridor sign. */
export const corridorSignTex = (label: string) =>
  canvasTex(300, 70, (g, w) => {
    g.fillStyle = '#2b2d31'
    g.fillRect(0, 0, w, 70)
    g.fillStyle = '#fff'
    g.font = 'bold 22px sans-serif'
    g.textAlign = 'center'
    g.fillText(label, w / 2, 44)
  })

/** Engraved brass award plate. */
export const plaqueTex = (lines: string[]) =>
  canvasTex(170, 120, (gg, W) => {
    gg.fillStyle = '#d4a33a'
    gg.fillRect(0, 0, W, 120)
    gg.fillStyle = '#3a2a10'
    gg.font = 'bold 15px serif'
    gg.textAlign = 'center'
    lines.forEach((t, i) => gg.fillText(t, W / 2, 36 + i * 22))
  })

/** Elevator floor indicator. It always reads 23. */
const indicators = new Map<string, ReturnType<typeof canvasTex>>()

/** The panel over the lift doors. One per floor, made on first ask. */
export const floorIndicatorTex = (text = '▲ 23') => {
  let t = indicators.get(text)
  if (!t) {
    t = canvasTex(220, 60, (g, w) => {
      g.fillStyle = '#0a0c0e'
      g.fillRect(0, 0, w, 60)
      g.fillStyle = '#ff5a1f'
      g.font = 'bold 38px monospace'
      g.textAlign = 'center'
      g.fillText(text, w / 2, 45)
    })
    indicators.set(text, t)
  }
  return t
}

export const exitSignTex = lazy(() =>
  canvasTex(120, 45, (g, w, h) => {
    g.fillStyle = '#111'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ff3b3b'
    g.font = 'bold 30px sans-serif'
    g.textAlign = 'center'
    g.fillText('EXIT', w / 2, 34)
  }),
)

export const storageDoorSignTex = lazy(() =>
  canvasTex(140, 100, (g, w, h) => {
    g.fillStyle = '#f2f0ea'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#333'
    g.lineWidth = 2
    g.strokeRect(6, 6, w - 12, h - 12)
    g.fillStyle = '#222'
    g.font = 'bold 15px sans-serif'
    g.textAlign = 'center'
    g.fillText('STORAGE', w / 2, 42)
    g.fillText('ROOM 2301', w / 2, 62)
    g.font = '10px sans-serif'
    g.fillText('keep clear', w / 2, 82)
  }),
)

/** Brushed-aluminium building directory by the elevator. */
export const buildingPlaqueTex = lazy(() =>
  canvasTex(440, 190, (g, w, h) => {
    g.fillStyle = '#565c65'
    g.fillRect(0, 0, w, h)
    // Brushed finish, kept faint — at 2600 strokes it swallowed the engraving.
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`
      g.fillRect(Math.random() * w, Math.random() * h, 14, 1)
    }
    g.strokeStyle = '#cfd3d8'
    g.lineWidth = 2
    g.strokeRect(11, 11, w - 22, h - 22)
    g.textAlign = 'center'
    // Engraved letters: a dark bite under a bright fill reads as cut metal.
    const engrave = (text: string, y: number, font: string) => {
      g.font = font
      g.fillStyle = 'rgba(15,18,22,.85)'
      g.fillText(text, w / 2 + 1, y + 1)
      g.fillStyle = '#f4f6f9'
      g.fillText(text, w / 2, y)
    }
    engrave('WEB OFFICE', 60, 'bold 30px Georgia, serif')
    g.strokeStyle = '#8d939b'
    g.lineWidth = 1.5
    g.beginPath()
    g.moveTo(60, 80)
    g.lineTo(w - 60, 80)
    g.stroke()
    engrave('1821 Waterfall Road  ·  London', 110, '20px Georgia, serif')
    engrave('FLOOR 23  ·  SUITE 2300', 140, 'bold 21px Georgia, serif')
    g.font = '13px Helvetica, sans-serif'
    g.fillStyle = '#c9ced5'
    g.fillText('HVAC service request #4471 — open since March', w / 2, 168)
  }),
)


/** Note on the fridge. */
export const fridgeFlyerTex = lazy(() =>
  canvasTex(180, 240, (g, w) => {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, w, 240)
    g.fillStyle = '#222'
    g.font = 'bold 22px sans-serif'
    g.textAlign = 'center'
    g.fillText('LABEL', w / 2, 60)
    g.fillText('YOUR', w / 2, 95)
    g.fillText('FOOD', w / 2, 130)
    g.font = '14px sans-serif'
    g.fillText('this means you, Dax', w / 2, 190)
  }),
)

/** Yellow square, for the notes stuck to things. */
export const stickyTex = (lines: string[], colour = '#fff28a') =>
  canvasTex(120, 120, (g, w, h) => {
    g.fillStyle = colour
    g.fillRect(0, 0, w, h)
    // the strip of adhesive along the top, which is always a shade darker
    g.fillStyle = 'rgba(0,0,0,.05)'
    g.fillRect(0, 0, w, 16)
    g.fillStyle = '#2b2b2b'
    g.font = 'bold 15px "Segoe Print", "Comic Sans MS", cursive'
    g.textAlign = 'center'
    const y0 = 62 - ((lines.length - 1) * 20) / 2
    lines.forEach((t, i) => g.fillText(t, w / 2, y0 + i * 20))
  })

/** Parliament contractor badge. Expired in 2009; still worn. */
export const badgeTex = lazy(() =>
  canvasTex(120, 170, (g, w) => {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, w, 170)
    g.fillStyle = '#1c3d8f'
    g.fillRect(0, 0, w, 34)
    g.fillStyle = '#fff'
    g.font = 'bold 12px sans-serif'
    g.textAlign = 'center'
    g.fillText('PARLIAMENT', w / 2, 22)
    g.fillStyle = '#c8ccd4'
    g.fillRect(24, 44, 72, 64)
    g.fillStyle = '#8a8f98'
    g.beginPath()
    g.arc(60, 72, 17, 0, 7)
    g.fill()
    g.beginPath()
    g.arc(60, 120, 30, Math.PI, 0)
    g.fill()
    g.fillStyle = '#111'
    g.font = 'bold 11px sans-serif'
    g.fillText('CONTRACTOR', w / 2, 126)
    g.font = '10px sans-serif'
    g.fillText('EXP 03/2009', w / 2, 142)
    g.fillStyle = '#c8102e'
    g.font = 'bold 10px sans-serif'
    g.fillText('STILL WAITING', w / 2, 158)
  }),
)

/** Wallpaper Jordan is quietly selling out of her cubicle. */
export const nightGardenTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#1f3b34'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 22; i++) {
        g.fillStyle = i % 3 ? '#4f9b6b' : '#e9c46a'
        g.save()
        g.translate(Math.random() * w, Math.random() * h)
        g.rotate(Math.random() * 6)
        g.beginPath()
        g.ellipse(0, 0, 8, 26, 0, 0, 7)
        g.fill()
        g.restore()
      }
    },
    [5, 3],
  ),
)

export const wallpaperLabelTex = lazy(() =>
  canvasTex(220, 50, (g, w) => {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, w, 50)
    g.fillStyle = '#333'
    g.font = 'italic 17px serif'
    g.textAlign = 'center'
    g.fillText('Night Garden · $62/roll · ask Jordan', w / 2, 32)
  }),
)

/** A pretzel, drawn as three overlapping stroked loops. Good enough at any
 *  size you can read the box at. */
function drawPretzel(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  colour: string,
) {
  g.strokeStyle = colour
  g.lineWidth = 13 * s
  g.lineCap = 'round'
  g.beginPath()
  g.arc(cx, cy + 10 * s, 34 * s, 0.08 * Math.PI, 0.92 * Math.PI)
  g.stroke()
  g.beginPath()
  g.arc(cx - 22 * s, cy - 14 * s, 22 * s, 0, 7)
  g.stroke()
  g.beginPath()
  g.arc(cx + 22 * s, cy - 14 * s, 22 * s, 0, 7)
  g.stroke()
}

/**
 * Rockhopper Pretzels — the printed front of the carton.
 *
 * The three faces of the box are drawn separately because a single texture on
 * a BoxGeometry lands on all six sides, which puts the brand name on the top
 * flap and a mirror image of it on the back.
 */
export const pretzelBoxTex = lazy(() =>
  canvasTex(200, 300, (g, w, h) => {
    g.fillStyle = '#1c2d5a'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#d9a441'
    g.lineWidth = 3
    g.strokeRect(9, 9, w - 18, h - 18)

    g.fillStyle = '#152343'
    g.fillRect(0, 0, w, 24)
    g.fillRect(0, h - 42, w, 42)

    g.fillStyle = '#d9a441'
    g.font = 'bold 16px Georgia, serif'
    g.textAlign = 'center'
    g.fillText('ROCKHOPPER', w / 2, 50)
    g.fillStyle = '#f4ecd8'
    g.font = 'bold 32px Georgia, serif'
    g.fillText('PRETZELS', w / 2, 88)
    g.fillStyle = '#d9a441'
    g.fillRect(46, 104, w - 92, 2)

    drawPretzel(g, w / 2, 176, 1.15, '#c9902f')
    // salt
    g.fillStyle = '#f4ecd8'
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * 7
      const r = 26 + Math.random() * 34
      g.fillRect(w / 2 + Math.cos(a) * r, 176 + Math.sin(a) * r * 0.8, 3, 3)
    }

    g.fillStyle = '#f4ecd8'
    g.font = 'italic 14px Georgia, serif'
    g.fillText('HARD SOURDOUGH', w / 2, 246)
    g.font = 'bold 14px sans-serif'
    g.fillText('FAMILY SIZE', w / 2, h - 22)
    g.font = '10px sans-serif'
    g.fillText('NET WT 16 OZ (454 g)', w / 2, h - 8)
  }),
)

/** Narrow side panel of the same carton: brand, sideways, and a barcode. */
export const pretzelSideTex = lazy(() =>
  canvasTex(80, 300, (g, w, h) => {
    g.fillStyle = '#1c2d5a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#152343'
    g.fillRect(0, 0, w, 24)
    g.fillRect(0, h - 42, w, 42)

    g.save()
    g.translate(w / 2, 100)
    g.rotate(-Math.PI / 2)
    g.fillStyle = '#d9a441'
    g.font = 'bold 15px Georgia, serif'
    g.textAlign = 'center'
    g.fillText('ROCKHOPPER', 0, 6)
    g.restore()

    g.fillStyle = '#f4ecd8'
    g.fillRect(12, h - 118, w - 24, 62)
    g.fillStyle = '#111'
    for (let x = 16, i = 0; x < w - 16; i++) {
      const bw = 1 + (i % 3)
      g.fillRect(x, h - 112, bw, 48)
      x += bw + 2
    }
  }),
)

/** Back of the carton — the panel nobody reads, at the size nobody can read. */
export const pretzelBackTex = lazy(() =>
  canvasTex(200, 300, (g, w, h) => {
    g.fillStyle = '#e7ded0'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#1c2d5a'
    g.fillRect(0, 0, w, 20)
    g.fillStyle = '#111'
    g.font = 'bold 15px sans-serif'
    g.textAlign = 'left'
    g.fillText('Nutrition Facts', 14, 44)
    g.fillRect(14, 52, w - 28, 3)
    g.font = '9px sans-serif'
    const rows = [
      'Serving size  8 pretzels (30g)',
      'Calories  110',
      'Total Fat  1g',
      'Sodium  390mg',
      'Total Carbohydrate  23g',
      'Protein  3g',
    ]
    rows.forEach((r, i) => {
      g.fillText(r, 14, 72 + i * 15)
      g.fillStyle = '#b9b2a5'
      g.fillRect(14, 76 + i * 15, w - 28, 1)
      g.fillStyle = '#111'
    })
    g.font = '8px sans-serif'
    g.fillStyle = '#555'
    for (let i = 0; i < 7; i++) {
      g.fillRect(14, 176 + i * 9, w - 28 - (i % 3) * 22, 3)
    }
    g.fillStyle = '#1c2d5a'
    g.font = 'italic 10px Georgia, serif'
    g.fillText('Baked in London since 1972', 14, h - 22)
  }),
)

/**
 * The Corvette poster on the back panel of Marcus's cubicle.
 *
 * Drawn rather than photographed, like nearly everything else in the suite —
 * a side profile is a handful of curves and it keeps the download where it is.
 */
export const corvetteTex = lazy(() =>
  canvasTex(520, 360, (g, w, h) => {
    const road = 292

    // sunset behind it
    const sky = g.createLinearGradient(0, 0, 0, road)
    sky.addColorStop(0, '#16233f')
    sky.addColorStop(0.45, '#7a3352')
    sky.addColorStop(0.8, '#d2542a')
    sky.addColorStop(1, '#f2a44e')
    g.fillStyle = sky
    g.fillRect(0, 0, w, road)

    // Low and ahead of the car: centred behind it, the disc cleared the
    // roofline and read as a yellow rear window.
    g.fillStyle = '#ffd07a'
    g.beginPath()
    g.arc(118, 198, 62, 0, 7)
    g.fill()
    g.fillStyle = 'rgba(255,208,122,.28)'
    g.beginPath()
    g.arc(118, 198, 92, 0, 7)
    g.fill()

    // road
    g.fillStyle = '#231c22'
    g.fillRect(0, road, w, h - road)
    g.fillStyle = '#40333c'
    g.fillRect(0, road, w, 4)
    g.fillStyle = '#c9b48a'
    for (let i = 0; i < 5; i++) g.fillRect(26 + i * 108, h - 24, 60, 5)

    g.fillStyle = 'rgba(0,0,0,.35)'
    g.beginPath()
    g.ellipse(268, road + 4, 216, 12, 0, 0, 7)
    g.fill()

    // body
    const paint = g.createLinearGradient(0, 174, 0, 268)
    paint.addColorStop(0, '#e0392c')
    paint.addColorStop(0.55, '#b3211b')
    paint.addColorStop(1, '#6f1210')
    g.fillStyle = paint
    g.beginPath()
    g.moveTo(48, 266)
    g.quadraticCurveTo(44, 242, 72, 234)
    g.quadraticCurveTo(100, 226, 126, 226)
    g.quadraticCurveTo(152, 226, 168, 230)
    g.lineTo(192, 228)
    g.quadraticCurveTo(202, 226, 212, 212)
    g.quadraticCurveTo(242, 184, 282, 182)
    g.lineTo(328, 184)
    g.quadraticCurveTo(366, 188, 390, 210)
    g.quadraticCurveTo(410, 226, 438, 228)
    g.lineTo(470, 232)
    g.quadraticCurveTo(488, 236, 486, 256)
    g.lineTo(482, 266)
    g.closePath()
    g.fill()

    // greenhouse
    g.fillStyle = '#26333d'
    g.beginPath()
    g.moveTo(228, 213)
    g.quadraticCurveTo(252, 194, 284, 192)
    g.lineTo(324, 194)
    g.quadraticCurveTo(352, 198, 372, 212)
    g.closePath()
    g.fill()
    g.fillStyle = '#8f1a15'
    g.fillRect(300, 193, 7, 20)

    // side gills and the crease down the flank
    g.fillStyle = '#7d1512'
    for (let i = 0; i < 3; i++) g.fillRect(190 + i * 11, 234, 6, 20)
    g.fillStyle = 'rgba(255,190,170,.35)'
    g.fillRect(60, 244, 420, 3)

    // lamps
    g.fillStyle = '#ffe9b0'
    g.fillRect(46, 240, 10, 9)
    g.fillStyle = '#d63b25'
    g.fillRect(474, 240, 10, 9)

    // wheels, then a fender lip over each so they sit in an arch
    const arch = (cx: number) => {
      g.strokeStyle = '#8f1a15'
      g.lineWidth = 9
      g.beginPath()
      g.arc(cx, 256, 43, Math.PI, 2 * Math.PI)
      g.stroke()
    }
    ;[152, 392].forEach((cx) => {
      g.fillStyle = '#131316'
      g.beginPath()
      g.arc(cx, 256, 36, 0, 7)
      g.fill()
      g.fillStyle = '#c9ccd2'
      g.beginPath()
      g.arc(cx, 256, 20, 0, 7)
      g.fill()
      g.strokeStyle = '#131316'
      g.lineWidth = 3
      for (let k = 0; k < 5; k++) {
        const a = (k * Math.PI * 2) / 5
        g.beginPath()
        g.moveTo(cx, 256)
        g.lineTo(cx + Math.cos(a) * 19, 256 + Math.sin(a) * 19)
        g.stroke()
      }
      g.fillStyle = '#131316'
      g.beginPath()
      g.arc(cx, 256, 6, 0, 7)
      g.fill()
      arch(cx)
    })

    // type
    g.fillStyle = '#f4e9d4'
    g.textAlign = 'center'
    g.font = 'bold 50px Georgia, serif'
    g.fillText('CORVETTE', w / 2, 62)
    g.font = '17px Georgia, serif'
    g.fillText('S T I N G R A Y  ·  4 2 7', w / 2, 90)
    g.fillRect(168, 104, 184, 2)

    g.font = 'italic 13px Georgia, serif'
    g.textAlign = 'left'
    g.fillText('Chevrolet Motor Division', 26, h - 12)

    g.strokeStyle = '#f4e9d4'
    g.lineWidth = 5
    g.strokeRect(10, 10, w - 20, h - 20)
  }),
)

/** Plaid dog bed in the corner of Jordan's cubicle. The dog stays home. */
export const plaidTex = lazy(() =>
  canvasTex(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#7d5a44'
      g.fillRect(0, 0, w, h)
      g.fillStyle = 'rgba(230,200,150,.55)'
      for (let i = 0; i < w; i += 32) {
        g.fillRect(i, 0, 12, h)
        g.fillRect(0, i, w, 12)
      }
      g.fillStyle = 'rgba(60,30,20,.35)'
      for (let i = 16; i < w; i += 32) {
        g.fillRect(i, 0, 4, h)
        g.fillRect(0, i, w, 4)
      }
    },
    [2, 2],
  ),
)

/** Front graphic of the soda machine in the break room. */
export const sodaFrontTex = lazy(() =>
  canvasTex(240, 420, (g, w, h) => {
    const body = g.createLinearGradient(0, 0, 0, h)
    body.addColorStop(0, '#0f3f7a')
    body.addColorStop(1, '#0a2a55')
    g.fillStyle = body
    g.fillRect(0, 0, w, h)

    g.fillStyle = '#c8102e'
    g.fillRect(0, 40, w, 96)
    g.fillStyle = '#f4ecd8'
    g.font = 'bold 25px Georgia, serif'
    g.textAlign = 'center'
    g.fillText('ROCKINGHAM', w / 2, 76)
    g.font = 'bold 40px Georgia, serif'
    g.fillText('SODA', w / 2, 120)

    // a can, drawn big, because that is what these machines do
    g.fillStyle = '#c8102e'
    g.fillRect(w / 2 - 34, 176, 68, 118)
    g.fillStyle = '#9a0c23'
    g.fillRect(w / 2 - 34, 176, 12, 118)
    g.fillStyle = '#cfd4da'
    g.beginPath()
    g.ellipse(w / 2, 176, 34, 9, 0, 0, 7)
    g.fill()
    g.beginPath()
    g.ellipse(w / 2, 294, 34, 9, 0, 0, 7)
    g.fill()
    g.fillStyle = '#f4ecd8'
    g.font = 'bold 15px Georgia, serif'
    g.fillText('SODA', w / 2, 242)

    g.fillStyle = '#f4ecd8'
    g.font = 'bold 17px sans-serif'
    g.fillText('ICE COLD', w / 2, 330)
    g.font = '13px sans-serif'
    g.fillStyle = '#9fc0e8'
    g.fillText('$1.25  ·  EXACT CHANGE', w / 2, 352)
    g.fillStyle = '#0a2145'
    g.fillRect(20, 366, w - 40, 34)
    g.fillStyle = '#7f93ad'
    g.font = '11px sans-serif'
    g.fillText('OUT OF ORDER SINCE MARCH — DEPT. OF GENERAL SERVICES', w / 2, 387)
  }),
)

/**
 * The accessibility posters on Denise's panel.
 *
 * She runs the service desk and is the floor's a11y person, so her cubicle is
 * where the WCAG contrast card and the alt-text reminder live.
 */
export const a11yPosterTex = (kind: 'wcag' | 'alt' | 'ally') =>
  canvasTex(320, 420, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#d7dbe0'
    g.lineWidth = 3
    g.strokeRect(6, 6, w - 12, h - 12)

    if (kind === 'wcag') {
      g.fillStyle = '#0f4c81'
      g.fillRect(6, 6, w - 12, 74)
      g.fillStyle = '#ffffff'
      g.textAlign = 'center'
      g.font = 'bold 27px sans-serif'
      g.fillText('CONTRAST', w / 2, 42)
      g.font = '15px sans-serif'
      g.fillText('WCAG 2.1 · minimum ratios', w / 2, 66)

      const rows: Array<[string, string, string]> = [
        ['Body text', '4.5 : 1', '#111111'],
        ['Large text', '3 : 1', '#4a4a4a'],
        ['UI & icons', '3 : 1', '#6b6b6b'],
      ]
      rows.forEach(([label, ratio, col], i) => {
        const y = 108 + i * 74
        g.fillStyle = col
        g.fillRect(24, y, 84, 54)
        g.fillStyle = '#ffffff'
        g.font = 'bold 22px sans-serif'
        g.textAlign = 'center'
        g.fillText('Aa', 66, y + 36)
        g.fillStyle = '#111111'
        g.textAlign = 'left'
        g.font = 'bold 19px sans-serif'
        g.fillText(label, 124, y + 24)
        g.fillStyle = '#0f4c81'
        g.font = 'bold 25px sans-serif'
        g.fillText(ratio, 124, y + 50)
      })
      g.fillStyle = '#8a9099'
      g.font = '13px sans-serif'
      g.textAlign = 'center'
      g.fillText('Ask Denise before you ship it', w / 2, h - 26)
      return
    }

    if (kind === 'alt') {
      g.fillStyle = '#1c6b52'
      g.fillRect(6, 6, w - 12, 74)
      g.fillStyle = '#ffffff'
      g.textAlign = 'center'
      g.font = 'bold 30px sans-serif'
      g.fillText('ALT TEXT', w / 2, 44)
      g.font = '15px sans-serif'
      g.fillText('every image, every time', w / 2, 68)

      g.textAlign = 'left'
      const lines: Array<[string, string]> = [
        ['✓', 'Say what it shows'],
        ['✓', 'Keep it short'],
        ['✓', 'Skip "image of"'],
        ['✗', 'Never leave it empty'],
        ['✗', 'Never paste the filename'],
      ]
      lines.forEach(([mark, text], i) => {
        const y = 128 + i * 46
        g.fillStyle = mark === '✓' ? '#1c6b52' : '#b3261e'
        g.font = 'bold 26px sans-serif'
        g.fillText(mark, 28, y)
        g.fillStyle = '#111111'
        g.font = '17px sans-serif'
        g.fillText(text, 62, y)
      })
      g.fillStyle = '#8a9099'
      g.font = '13px sans-serif'
      g.textAlign = 'center'
      g.fillText('Parliament · Web Accessibility', w / 2, h - 26)
      return
    }

    /*
      The pledge card. The mark is the wheelchair, drawn rather than typed:
      a closed wheel, then the seated figure over it facing right — head,
      back, thigh, shin.

      It was a part-arc and two loose strokes before, with a head half again
      too big for the wheel, and it read as somebody doubled over a hoop.
      The order matters: the wheel goes down first and the figure over it.
    */
    g.fillStyle = '#0f4c81'
    g.fillRect(6, 6, w - 12, h - 12)
    g.strokeStyle = '#ffffff'
    g.fillStyle = '#ffffff'
    g.lineCap = 'round'
    g.lineJoin = 'round'

    // the wheel, closed
    g.lineWidth = 11
    g.beginPath()
    g.arc(w / 2 + 2, 228, 60, 0, Math.PI * 2)
    g.stroke()

    // head, clear of the wheel and of the back
    g.beginPath()
    g.arc(w / 2 - 44, 94, 25, 0, Math.PI * 2)
    g.fill()

    // back down to the hip, then the thigh forward to the knee
    g.lineWidth = 24
    g.beginPath()
    g.moveTo(w / 2 - 36, 130)
    g.lineTo(w / 2 - 20, 186)
    g.lineTo(w / 2 + 54, 194)
    g.stroke()

    // shin, and the footplate out past the rim where it belongs
    g.lineWidth = 18
    g.beginPath()
    g.moveTo(w / 2 + 54, 194)
    g.lineTo(w / 2 + 62, 250)
    g.lineTo(w / 2 + 84, 256)
    g.stroke()
    g.textAlign = 'center'
    g.font = 'bold 25px sans-serif'
    g.fillText('ACCESSIBLE', w / 2, 316)
    g.fillText('BY DEFAULT', w / 2, 346)
    g.font = '14px sans-serif'
    g.fillStyle = '#9fc0e8'
    g.fillText('Parliament of Inaccessible Island', w / 2, 382)
  })

/**
 * The copier's touch screen: a header, the state of the trays, and the four
 * buttons everybody presses in the same order. Ready, for once.
 */
export const copierScreenTex = lazy(() =>
  canvasTex(320, 240, (g, w, h) => {
    g.fillStyle = '#e9eef3'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#1f3f68'
    g.fillRect(0, 0, w, 40)
    g.fillStyle = '#ffffff'
    g.font = 'bold 17px sans-serif'
    g.textAlign = 'left'
    g.fillText('Ready to copy', 14, 27)
    g.font = '13px sans-serif'
    g.textAlign = 'right'
    g.fillText('100%', w - 14, 27)

    // the trays down the left, the buttons down the right
    const rows: Array<[string, string]> = [
      ['Tray 1', 'Letter · 480'],
      ['Tray 2', 'Legal · 120'],
      ['Toner', 'OK'],
    ]
    rows.forEach(([k, v], i) => {
      const y = 74 + i * 30
      g.fillStyle = '#4a5560'
      g.font = '13px sans-serif'
      g.textAlign = 'left'
      g.fillText(k, 14, y)
      g.fillStyle = '#111111'
      g.textAlign = 'right'
      g.fillText(v, 150, y)
    })
    g.fillStyle = '#c9d1da'
    g.fillRect(14, 172, 136, 1)
    g.fillStyle = '#6b7280'
    g.font = '11px sans-serif'
    g.textAlign = 'left'
    g.fillText('Web Office · Suite 2300', 14, 196)
    g.fillText('Counter 184,211', 14, 214)

    const keys: Array<[string, string]> = [
      ['Copy', '#2b7a4b'],
      ['Scan', '#1f3f68'],
      ['Fax', '#6b7280'],
      ['Print', '#6b7280'],
    ]
    keys.forEach(([label, col], i) => {
      const x = 170 + (i % 2) * 72
      const y = 58 + Math.floor(i / 2) * 82
      g.fillStyle = col
      g.fillRect(x, y, 64, 66)
      g.fillStyle = '#ffffff'
      g.font = 'bold 15px sans-serif'
      g.textAlign = 'center'
      g.fillText(label, x + 32, y + 39)
    })
  }),
)

/** Denise's master's, framed. Assistive technology, which explains a lot. */
export const diplomaTex = lazy(() =>
  canvasTex(420, 320, (g, w, h) => {
    g.fillStyle = '#f6f1e2'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(180,168,140,${Math.random() * 0.1})`
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    g.strokeStyle = '#8a7440'
    g.lineWidth = 2
    g.strokeRect(16, 16, w - 32, h - 32)
    g.lineWidth = 1
    g.strokeRect(22, 22, w - 44, h - 44)

    g.textAlign = 'center'
    g.fillStyle = '#2b2416'
    g.font = 'bold 17px Georgia, serif'
    g.fillText('UNIVERSITY OF THE SOUTH ATLANTIC', w / 2, 62)
    g.font = 'italic 12px Georgia, serif'
    g.fillStyle = '#6b5d3c'
    g.fillText('upon the recommendation of the faculty confers upon', w / 2, 86)

    g.fillStyle = '#1c2b52'
    g.font = 'bold 31px Georgia, serif'
    g.fillText('Denise Okafor', w / 2, 128)

    g.fillStyle = '#2b2416'
    g.font = 'bold 19px Georgia, serif'
    g.fillText('MASTER OF SCIENCE', w / 2, 168)
    g.font = '14px Georgia, serif'
    g.fillText('Assistive Technology & Accessible Design', w / 2, 192)

    g.fillStyle = '#6b5d3c'
    g.font = 'italic 11px Georgia, serif'
    g.fillText('with all the rights and privileges thereunto appertaining', w / 2, 218)
    g.fillText('given in London, for the Parliament of Inaccessible Island', w / 2, 234)

    // seal and two signatures
    g.fillStyle = '#9a2a2a'
    g.beginPath()
    g.arc(88, 262, 26, 0, 7)
    g.fill()
    g.fillStyle = '#c14a4a'
    g.beginPath()
    g.arc(88, 262, 19, 0, 7)
    g.fill()
    g.strokeStyle = '#4a4030'
    g.lineWidth = 1
    ;[190, 300].forEach((cx) => {
      g.beginPath()
      g.moveTo(cx - 62, 272)
      g.lineTo(cx + 62, 272)
      g.stroke()
      g.fillStyle = '#3a3220'
      g.font = 'italic 15px Georgia, serif'
      g.fillText('· · · · ·', cx, 268)
      g.fillStyle = '#6b5d3c'
      g.font = '9px Georgia, serif'
      g.fillText(cx === 190 ? 'Dean' : 'President', cx, 286)
    })
  }),
)

/** The dissertation, bound, sat on Denise's desk where she can reach it. */
export const thesisCoverTex = lazy(() =>
  canvasTex(200, 300, (g, w, h) => {
    g.fillStyle = '#1c3a5e'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#c9a227'
    g.lineWidth = 2
    g.strokeRect(12, 12, w - 24, h - 24)
    g.fillStyle = '#e8e2d0'
    g.textAlign = 'center'
    g.font = 'bold 13px Georgia, serif'
    ;[
      'HEARING AIDS AND',
      'THE PUBLIC SERVICE',
      'DESK',
    ].forEach((t, i) => g.fillText(t, w / 2, 62 + i * 20))
    g.fillStyle = '#c9a227'
    g.fillRect(48, 132, w - 96, 1)
    g.fillStyle = '#c3cbd8'
    g.font = 'italic 10px Georgia, serif'
    g.fillText('Telecoil, loop systems and', w / 2, 158)
    g.fillText('what a caller actually hears', w / 2, 174)
    g.fillStyle = '#e8e2d0'
    g.font = '11px Georgia, serif'
    g.fillText('D. OKAFOR', w / 2, 232)
    g.font = '9px Georgia, serif'
    g.fillStyle = '#9fb0c4'
    g.fillText('M.S. thesis · USAtl · 2021', w / 2, 250)
  }),
)

/**
 * Two WPA-style Island Parks Service posters in Priya's cubicle.
 *
 * Drawn rather than scanned: flat bands of colour and a stencil arrowhead,
 * which is the whole visual language of the originals and stays ours.
 */
export const npsPosterTex = (park: 'plateau' | 'nightingale') =>
  canvasTex(300, 440, (g, w, h) => {
    const shen = park === 'plateau'

    // sky, laid down in bands the way a screen print is
    const bands = shen
      ? ['#f2b56b', '#e8935a', '#d3714f', '#a8544a']
      : ['#bfe0e8', '#8ec3d4', '#5e9db8', '#3f7794']
    bands.forEach((c, i) => {
      g.fillStyle = c
      g.fillRect(0, 40 + i * 46, w, 46)
    })

    // sun or moon
    g.fillStyle = shen ? '#ffe6a8' : '#eef4f6'
    g.beginPath()
    g.arc(w / 2 + (shen ? 52 : -56), 128, shen ? 34 : 24, 0, 7)
    g.fill()

    // ridge lines, back to front, getting darker
    const ridges = shen
      ? ['#7c5a52', '#5c4144', '#3e2e34', '#2a2026']
      : ['#5d7f6a', '#44654f', '#2f4a3a', '#1f3227']
    ridges.forEach((c, i) => {
      const base = 190 + i * 42
      g.fillStyle = c
      g.beginPath()
      g.moveTo(0, base + 40)
      for (let x = 0; x <= w; x += 20) {
        const y =
          base -
          Math.sin(x / (46 + i * 13) + i * 1.7) * (26 - i * 4) -
          Math.sin(x / 17 + i) * 5
        g.lineTo(x, y)
      }
      g.lineTo(w, base + 60)
      g.lineTo(0, base + 60)
      g.closePath()
      g.fill()
    })

    // the arrowhead, stencilled
    g.fillStyle = '#3d2b17'
    g.beginPath()
    g.moveTo(w / 2 - 30, 352)
    g.lineTo(w / 2 + 30, 352)
    g.lineTo(w / 2 + 30, 386)
    g.lineTo(w / 2, 412)
    g.lineTo(w / 2 - 30, 386)
    g.closePath()
    g.fill()
    g.fillStyle = '#e8dcc0'
    g.font = 'bold 9px Georgia, serif'
    g.textAlign = 'center'
    g.fillText('IPS', w / 2, 372)

    // the type panel
    g.fillStyle = '#1c1811'
    g.fillRect(0, 0, w, 40)
    g.fillRect(0, h - 40, w, 40)
    g.fillStyle = '#f0e6cc'
    g.font = 'bold 21px Georgia, serif'
    g.fillText(shen ? 'THE PLATEAU' : 'NIGHTINGALE', w / 2, 28)
    g.font = '12px Georgia, serif'
    g.fillStyle = '#c9bb98'
    g.fillText(
      shen ? 'NATURE RESERVE · INACCESSIBLE' : 'ISLAND · TRISTAN GROUP',
      w / 2,
      h - 22,
    )
    g.font = 'italic 10px Georgia, serif'
    g.fillText('ISLAND PARKS SERVICE', w / 2, h - 8)
  })

/** The break-room dartboard. Bristle, wire spider, and the numbers ring. */
export const dartboardTex = lazy(() =>
  canvasTex(512, 512, (g, w, h) => {
    const cx = w / 2
    const cy = h / 2
    const R = 232

    g.fillStyle = '#151517'
    g.fillRect(0, 0, w, h)

    // number ring
    g.fillStyle = '#0d0d0f'
    g.beginPath()
    g.arc(cx, cy, R, 0, 7)
    g.fill()

    const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
    const seg = (Math.PI * 2) / 20
    const wedge = (r0: number, r1: number, i: number, colour: string) => {
      const a0 = -Math.PI / 2 - seg / 2 + i * seg
      g.fillStyle = colour
      g.beginPath()
      g.arc(cx, cy, r1, a0, a0 + seg)
      g.arc(cx, cy, r0, a0 + seg, a0, true)
      g.closePath()
      g.fill()
    }

    for (let i = 0; i < 20; i++) {
      const light = i % 2 === 0
      // singles
      wedge(28, 118, i, light ? '#e8dfc6' : '#1b1b1d')
      wedge(130, 186, i, light ? '#e8dfc6' : '#1b1b1d')
      // treble and double
      wedge(118, 130, i, light ? '#1f7a3d' : '#b8281e')
      wedge(186, 198, i, light ? '#1f7a3d' : '#b8281e')
    }

    // bull
    g.fillStyle = '#1f7a3d'
    g.beginPath()
    g.arc(cx, cy, 28, 0, 7)
    g.fill()
    g.fillStyle = '#b8281e'
    g.beginPath()
    g.arc(cx, cy, 12, 0, 7)
    g.fill()

    // the wire spider
    g.strokeStyle = '#b9bcc1'
    g.lineWidth = 2
    ;[28, 118, 130, 186, 198].forEach((r) => {
      g.beginPath()
      g.arc(cx, cy, r, 0, 7)
      g.stroke()
    })
    for (let i = 0; i < 20; i++) {
      const a = -Math.PI / 2 - seg / 2 + i * seg
      g.beginPath()
      g.moveTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28)
      g.lineTo(cx + Math.cos(a) * 198, cy + Math.sin(a) * 198)
      g.stroke()
    }

    // numbers
    g.fillStyle = '#f2efe6'
    g.font = 'bold 30px Georgia, serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    ORDER.forEach((n, i) => {
      const a = -Math.PI / 2 + i * seg
      g.fillText(String(n), cx + Math.cos(a) * 215, cy + Math.sin(a) * 215)
    })
    g.textBaseline = 'alphabetic'
  }),
)

/**
 * The squirrel taped over the bullseye.
 *
 * Nobody on the floor will say who put it there or what the squirrel did.
 */
export const squirrelPhotoTex = lazy(() =>
  canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f6f4ee'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#9fc0a8'
    g.fillRect(10, 10, w - 20, h - 46)
    // a bough
    g.strokeStyle = '#7a5a38'
    g.lineWidth = 13
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(14, 188)
    g.lineTo(w - 14, 172)
    g.stroke()

    const body = '#9a6b3c'
    const belly = '#e0cba8'
    // tail, drawn first so the body sits over it
    g.strokeStyle = body
    g.lineWidth = 34
    g.beginPath()
    g.moveTo(78, 168)
    g.quadraticCurveTo(28, 132, 52, 74)
    g.quadraticCurveTo(70, 40, 108, 52)
    g.stroke()

    // haunch and body
    g.fillStyle = body
    g.beginPath()
    g.ellipse(126, 146, 44, 36, -0.25, 0, 7)
    g.fill()
    g.beginPath()
    g.ellipse(160, 116, 30, 26, -0.35, 0, 7)
    g.fill()
    // head
    g.beginPath()
    g.ellipse(186, 92, 22, 19, -0.2, 0, 7)
    g.fill()
    // ear
    g.beginPath()
    g.ellipse(178, 72, 7, 11, -0.3, 0, 7)
    g.fill()
    // belly and paws
    g.fillStyle = belly
    g.beginPath()
    g.ellipse(158, 128, 17, 14, -0.3, 0, 7)
    g.fill()
    g.fillStyle = body
    g.beginPath()
    g.ellipse(186, 132, 8, 12, 0.3, 0, 7)
    g.fill()
    // eye
    g.fillStyle = '#151210'
    g.beginPath()
    g.arc(194, 88, 4, 0, 7)
    g.fill()
    // the nut, which is the point of the photograph
    g.fillStyle = '#c8a05a'
    g.beginPath()
    g.ellipse(196, 124, 8, 10, 0.4, 0, 7)
    g.fill()

    g.fillStyle = '#3a3630'
    g.font = 'italic 15px "Segoe Print", "Comic Sans MS", cursive'
    g.textAlign = 'center'
    g.fillText('he knows what he did', w / 2, h - 16)
  }),
)

/** Ray's I ♥ TEXAS pennant. Network operations, and he will tell you. */
export const texasTex = lazy(() =>
  canvasTex(420, 260, (g, w, h) => {
    g.fillStyle = '#f2ece0'
    g.fillRect(0, 0, w, h)
    // the pennant, a triangle off the left edge
    g.fillStyle = '#9c2320'
    g.beginPath()
    g.moveTo(0, 8)
    g.lineTo(w - 26, h / 2)
    g.lineTo(0, h - 8)
    g.closePath()
    g.fill()
    g.fillStyle = '#1c2b52'
    g.beginPath()
    g.moveTo(0, 8)
    g.lineTo(96, 8)
    g.lineTo(96, h - 8)
    g.lineTo(0, h - 8)
    g.closePath()
    g.fill()

    // the lone star
    g.fillStyle = '#f2ece0'
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 === 0 ? 40 : 17
      const px = 48 + Math.cos(a) * r
      const py = h / 2 + Math.sin(a) * r
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.closePath()
    g.fill()

    g.fillStyle = '#f2ece0'
    g.textAlign = 'left'
    g.font = 'bold 34px Georgia, serif'
    g.fillText('I', 122, h / 2 - 4)
    g.font = 'bold 40px Georgia, serif'
    g.fillText('♥', 146, h / 2 + 2)
    g.font = 'bold 40px Georgia, serif'
    g.fillText('TEXAS', 196, h / 2 + 2)
    g.font = 'italic 14px Georgia, serif'
    g.fillStyle = '#e8c9a8'
    g.fillText('and I will tell you about it', 124, h / 2 + 34)
  }),
)

/**
 * The leaving banner from Emily's send-off, still up in the records bay.
 *
 * The letters run on a curve because the banner sags between its two pieces
 * of tape, which is how every one of these ends up.
 */
export const farewellBannerTex = lazy(() =>
  canvasTex(720, 200, (g, w, h) => {
    // the paper, cut with a swallowtail at each end
    g.fillStyle = '#f4efe2'
    g.beginPath()
    g.moveTo(0, 14)
    g.lineTo(w, 6)
    g.lineTo(w, h - 6)
    g.lineTo(0, h - 14)
    g.closePath()
    g.fill()
    g.strokeStyle = '#c8c0ac'
    g.lineWidth = 2
    g.stroke()

    // bunting along the top edge
    const flags = ['#c8402e', '#f2c53d', '#3fa34d', '#2b63c9', '#e06fae']
    for (let i = 0; i < 16; i++) {
      const x = 18 + i * 44
      const y = 12 - (i / 16) * 6
      g.fillStyle = flags[i % 5]
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + 34, y - 1)
      g.lineTo(x + 17, y + 30)
      g.closePath()
      g.fill()
    }

    // the letters, on the sag
    const text = 'FAREWELL EMILY'
    g.font = 'bold 62px Georgia, serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const total = g.measureText(text).width
    let cursor = (w - total) / 2
    for (const ch of text) {
      const cw = g.measureText(ch).width
      const t = (cursor + cw / 2) / w
      const y = 118 + Math.sin(t * Math.PI) * 22
      g.save()
      g.translate(cursor + cw / 2, y)
      g.rotate(Math.cos(t * Math.PI) * -0.16)
      g.fillStyle = '#1c3a6b'
      g.fillText(ch, 0, 0)
      g.restore()
      cursor += cw
    }
    g.textBaseline = 'alphabetic'

    g.fillStyle = '#7a7268'
    g.font = 'italic 19px Georgia, serif'
    g.fillText('we will miss you  ·  the whole floor', w / 2, h - 22)
  }),
)

/** Lid of the pizza box that has been in the fridge since Tuesday. */
export const pizzaBoxTex = lazy(() =>
  canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9b08a'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = `rgba(140,116,80,${Math.random() * 0.14})`
      g.fillRect(Math.random() * w, Math.random() * h, 3, 2)
    }
    // the flutes of the corrugation, showing through
    g.fillStyle = 'rgba(120,98,66,.13)'
    for (let y = 6; y < h; y += 11) g.fillRect(0, y, w, 3)

    g.fillStyle = '#8c1d18'
    g.beginPath()
    g.arc(w / 2, 104, 62, 0, 7)
    g.fill()
    g.fillStyle = '#c9b08a'
    g.beginPath()
    g.arc(w / 2, 104, 50, 0, 7)
    g.fill()
    g.fillStyle = '#1f6b3a'
    g.font = 'bold 21px Georgia, serif'
    g.textAlign = 'center'
    g.fillText('BROAD ST.', w / 2, 96)
    g.fillText('PIZZA', w / 2, 122)

    g.fillStyle = '#5a4630'
    g.font = 'italic 14px Georgia, serif'
    g.fillText('hot and fresh  ·  804 555 0119', w / 2, 194)
    g.font = 'bold 12px sans-serif'
    g.fillStyle = '#8c1d18'
    g.fillText('DO NOT EAT — TOM', w / 2, 224)
  }),
)

/** Maker's plate on the safe. Nobody has the combination either. */
export const safePlateTex = lazy(() =>
  canvasTex(288, 104, (g, w, h) => {
    g.fillStyle = '#b9a45a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#9a8744'
    g.fillRect(0, 0, w, 5)
    g.fillRect(0, h - 5, w, 5)
    g.fillStyle = '#2b2410'
    g.textAlign = 'center'
    g.font = 'bold 25px Georgia, serif'
    g.fillText('MOSLER', w / 2, 40)
    g.font = '12px Georgia, serif'
    g.fillText('SAFE CO.  ·  HAMILTON, OHIO', w / 2, 62)
    g.font = 'italic 11px Georgia, serif'
    g.fillStyle = '#5a4a1e'
    g.fillText('Parliament property  ·  do not remove', w / 2, 84)
  }),
)

/** Cover of one of the passports in the safe. Generic, and deliberately so. */
export const passportTex = lazy(() =>
  canvasTex(200, 280, (g, w, h) => {
    g.fillStyle = '#1b2a4a'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    g.strokeStyle = '#c9a227'
    g.lineWidth = 2
    g.strokeRect(14, 14, w - 28, h - 28)

    // a plain wreath-and-star mark, not anybody's actual arms
    g.strokeStyle = '#c9a227'
    g.lineWidth = 3
    g.beginPath()
    g.arc(w / 2, 132, 34, 0.35, Math.PI - 0.35)
    g.stroke()
    g.beginPath()
    g.arc(w / 2, 132, 34, Math.PI + 0.35, -0.35)
    g.stroke()
    g.fillStyle = '#c9a227'
    g.beginPath()
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const r = i % 2 === 0 ? 17 : 7
      const px = w / 2 + Math.cos(a) * r
      const py = 128 + Math.sin(a) * r
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.closePath()
    g.fill()

    g.fillStyle = '#e8dfc0'
    g.textAlign = 'center'
    g.font = 'bold 21px Georgia, serif'
    g.fillText('PASSPORT', w / 2, 74)
    g.font = '11px Georgia, serif'
    g.fillStyle = '#9fb0c8'
    g.fillText('PROPERTY OF THE BEARER', w / 2, 206)
    g.fillText('DO NOT LAMINATE', w / 2, 224)
  }),
)

/** The five-dollar gas card, which is the whole treasure. */
export const gasCardTex = lazy(() =>
  canvasTex(320, 200, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#1f7a3d')
    bg.addColorStop(1, '#0f4c2a')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)

    g.fillStyle = '#f2c53d'
    g.fillRect(0, 0, w, 8)
    g.fillRect(0, h - 8, w, 8)

    g.fillStyle = '#f4efe2'
    g.textAlign = 'left'
    g.font = 'bold 17px Georgia, serif'
    g.fillText('PARLIAMENT FUEL', 20, 44)
    g.font = 'bold 54px Georgia, serif'
    g.fillStyle = '#f2c53d'
    g.fillText('$5', 20, 108)
    g.font = 'bold 17px Georgia, serif'
    g.fillStyle = '#f4efe2'
    g.fillText('GAS CARD', 82, 104)

    g.font = '11px sans-serif'
    g.fillStyle = '#bcd8c4'
    g.fillText('NO CASH VALUE  ·  EXPIRES 09/2019', 20, 136)
    g.fillText('4417 8802 5510 0031', 20, 154)

    // the magnetic stripe, on the front, which is not how cards work
    g.fillStyle = '#20241f'
    g.fillRect(180, 26, 118, 34)
    g.fillStyle = '#8fa696'
    g.font = 'italic 10px sans-serif'
    g.textAlign = 'right'
    g.fillText('scratch here', w - 22, 176)
  }),
)

/**
 * The cover of the almanac on James's desk. Weather, planting dates and the
 * moon, printed the same way every year since somebody's grandfather bought
 * the first one.
 */
export const almanacTex = lazy(() =>
  canvasTex(220, 290, (g, w, h) => {
    g.fillStyle = '#e6dcc0'
    g.fillRect(0, 0, w, h)
    // foxed paper
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(150,128,86,${Math.random() * 0.09})`
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    g.strokeStyle = '#7d2b1f'
    g.lineWidth = 4
    g.strokeRect(12, 12, w - 24, h - 24)
    g.textAlign = 'center'
    g.fillStyle = '#7d2b1f'
    g.font = 'bold 21px Georgia, serif'
    g.fillText("THE FARMERS'", w / 2, 62)
    g.font = 'bold 30px Georgia, serif'
    g.fillText('ALMANAC', w / 2, 94)
    g.fillStyle = '#3a2f1c'
    g.font = 'italic 13px Georgia, serif'
    g.fillText('2026', w / 2, 118)
    // a sun with rays, the way the cover always has
    g.fillStyle = '#c8922e'
    g.beginPath()
    g.arc(w / 2, 168, 26, 0, 7)
    g.fill()
    g.strokeStyle = '#c8922e'
    g.lineWidth = 3
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      g.beginPath()
      g.moveTo(w / 2 + Math.cos(a) * 32, 168 + Math.sin(a) * 32)
      g.lineTo(w / 2 + Math.cos(a) * 42, 168 + Math.sin(a) * 42)
      g.stroke()
    }
    g.fillStyle = '#3a2f1c'
    g.font = '12px Georgia, serif'
    g.fillText('WEATHER · PLANTING · TIDES', w / 2, 232)
    g.fillText('Established 1818', w / 2, 252)
  }),
)
