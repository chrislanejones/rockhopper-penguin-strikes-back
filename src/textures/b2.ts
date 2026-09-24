import { canvasTex, lazy } from '../lib/canvasTex'

/**
 * What the theatre screen shows: the event, and nothing else.
 *
 * Deep blue field, the word as large as the screen allows, the long name
 * under it for anyone who has not been told what IITS stands for.
 */
export const iitsScreenTex = lazy(() =>
  canvasTex(1024, 576, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#0d1f4a')
    bg.addColorStop(1, '#071230')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    // a soft glow behind the word
    const glow = g.createRadialGradient(w / 2, h * 0.45, 40, w / 2, h * 0.45, 420)
    glow.addColorStop(0, 'rgba(90,140,255,.28)')
    glow.addColorStop(1, 'rgba(90,140,255,0)')
    g.fillStyle = glow
    g.fillRect(0, 0, w, h)

    g.textAlign = 'center'
    g.fillStyle = '#ffffff'
    g.font = 'bold 230px sans-serif'
    g.fillText('IITS', w / 2, h * 0.58)
    g.fillStyle = '#f2c14e'
    g.font = 'bold 54px sans-serif'
    g.fillText('2026', w / 2, h * 0.58 + 78)
    g.fillStyle = '#c7d3ee'
    g.font = '30px sans-serif'
    g.fillText('Inaccessible Island Technology Symposium', w / 2, h - 52)
    // rule under the title, like every deck ever
    g.fillStyle = '#f2c14e'
    g.fillRect(w / 2 - 180, h * 0.58 + 100, 360, 4)
  }),
)

/** The poster in the lobby case: same event, portrait, with the room on it. */
export const iitsPosterTex = lazy(() =>
  canvasTex(300, 440, (g, w, h) => {
    g.fillStyle = '#0d1f4a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#f2c14e'
    g.fillRect(18, 18, w - 36, 4)
    g.fillRect(18, h - 22, w - 36, 4)
    g.textAlign = 'center'
    g.fillStyle = '#ffffff'
    g.font = 'bold 64px sans-serif'
    g.fillText('IITS', w / 2, 150)
    g.fillStyle = '#f2c14e'
    g.font = 'bold 30px sans-serif'
    g.fillText('2026', w / 2, 195)
    g.fillStyle = '#c7d3ee'
    g.font = '15px sans-serif'
    g.fillText('Inaccessible Island', w / 2, 250)
    g.fillText('Technology Symposium', w / 2, 272)
    g.fillStyle = '#ffffff'
    g.font = 'bold 20px sans-serif'
    g.fillText('B2 · GALA DINNER', w / 2, 340)
    g.fillStyle = '#c7d3ee'
    g.font = '15px sans-serif'
    g.fillText('Doors 6:30 · Dinner 7:00 · Programme 8:00', w / 2, 370)
    g.fillText('Find your table. Boxes by invitation.', w / 2, 392)
  }),
)

/** Hung in the lobby: which way to the hall. */
export const b2WayfindingTex = lazy(() =>
  canvasTex(560, 140, (g, w, h) => {
    g.fillStyle = '#1c1f24'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#f2c14e'
    g.fillRect(0, 0, 8, h)
    g.fillStyle = '#ffffff'
    g.font = 'bold 30px sans-serif'
    g.textAlign = 'left'
    g.fillText('DINNER  ▲   through either door', 30, 56)
    g.fillText('BALCONY  ◀ ▶   stairs at each end', 30, 106)
  }),
)

/** The floor's number, on the wall beside the lift. */
export const b2FloorSignTex = lazy(() =>
  canvasTex(120, 120, (g, w, h) => {
    g.fillStyle = '#1c1f24'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#f2c14e'
    g.lineWidth = 4
    g.strokeRect(6, 6, w - 12, h - 12)
    g.fillStyle = '#ffffff'
    g.font = 'bold 60px sans-serif'
    g.textAlign = 'center'
    g.fillText('B2', w / 2, 82)
  }),
)

/**
 * The printout taped under the call buttons on 23, because everyone asked.
 *
 * Office paper, a blue border from whichever template was nearest, and four
 * bits of tape.
 */
export const liftStickerTex = lazy(() =>
  canvasTex(300, 200, (g, w, h) => {
    g.fillStyle = '#f7f5ee'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#1d3b8a'
    g.lineWidth = 6
    g.strokeRect(10, 10, w - 20, h - 20)
    g.textAlign = 'center'
    g.fillStyle = '#1d3b8a'
    g.font = 'bold 52px sans-serif'
    g.fillText('IITS', w / 2, 78)
    g.fillStyle = '#222'
    g.font = '30px sans-serif'
    g.fillText('is on Floor B2', w / 2, 122)
    g.fillStyle = '#1d3b8a'
    g.font = 'bold 34px sans-serif'
    g.fillText('▼  press DOWN', w / 2, 168)
    // tape at the corners
    g.fillStyle = 'rgba(255,255,255,.55)'
    for (const [x, y, a] of [[18, 18, -0.7], [w - 18, 18, 0.7], [18, h - 18, 0.7], [w - 18, h - 18, -0.7]]) {
      g.save()
      g.translate(x, y)
      g.rotate(a)
      g.fillRect(-26, -8, 52, 16)
      g.restore()
    }
  }),
)

/**
 * Engraved brass plate under the Oliva photograph, in the same hand as the
 * one under the Gatekeeper.
 */
export const olivaPlateTex = lazy(() =>
  canvasTex(460, 220, (g, w, h) => {
    g.fillStyle = '#b08d3c'
    g.fillRect(0, 0, w, h)
    // brushed brass
    for (let i = 0; i < 2200; i++) {
      g.fillStyle = `rgba(255,240,200,${Math.random() * 0.07})`
      g.fillRect(Math.random() * w, Math.random() * h, 6, 1)
    }
    g.strokeStyle = '#6d5620'
    g.lineWidth = 2
    g.strokeRect(7, 7, w - 14, h - 14)

    g.fillStyle = '#3a2a10'
    g.textAlign = 'center'
    g.font = 'bold 30px Georgia, serif'
    g.fillText('THE MS OLIVA', w / 2, 48)
    g.font = 'italic 20px Georgia, serif'
    g.fillText('“Aground on Nightingale”', w / 2, 80)
    g.font = '16px Georgia, serif'
    g.fillText('Bulk carrier · Nightingale Island · 16 March 2011', w / 2, 110)
    g.font = '14px Georgia, serif'
    g.fillText('She broke up on the rocks and her fuel oil went into the sea.', w / 2, 144)
    g.fillText('Thousands of rockhoppers were oiled. Tristan washed them by hand.', w / 2, 164)
    g.fillText('Mosaic after a 2011 photograph by David E. Guggenheim', w / 2, 184)
  }),
)

/**
 * Taped inside the car, both mouths: where the event is, floor by floor.
 * Same office paper and tape as the printout on 23.
 */
export const liftIitsTagsTex = lazy(() =>
  canvasTex(300, 200, (g, w, h) => {
    g.fillStyle = '#f7f5ee'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#1d3b8a'
    g.lineWidth = 6
    g.strokeRect(10, 10, w - 20, h - 20)
    g.textAlign = 'center'
    g.fillStyle = '#1d3b8a'
    g.font = 'bold 46px sans-serif'
    g.fillText('IITS', w / 2, 66)
    g.fillStyle = '#222'
    g.font = 'bold 26px sans-serif'
    g.fillText('B1 · Balcony', w / 2, 116)
    g.fillText('B2 · Dinner & stage', w / 2, 154)
    // tape at the corners
    g.fillStyle = 'rgba(255,255,255,.55)'
    for (const [x, y, a] of [[18, 18, -0.7], [w - 18, 18, 0.7], [18, h - 18, 0.7], [w - 18, h - 18, -0.7]]) {
      g.save()
      g.translate(x, y)
      g.rotate(a)
      g.fillRect(-26, -8, 52, 16)
      g.restore()
    }
  }),
)

/** One row of the car's directory: what is stamped on the button, and where it goes. */
export interface LiftPlate {
  label: string
  name: string
  /** Masking tape and a marker rather than an engraved plate. */
  tape?: boolean
}

/** Shrink until it fits the width it has been given. */
function fitFont(g: CanvasRenderingContext2D, text: string, font: (px: number) => string, px: number, max: number) {
  let size = px
  do {
    g.font = font(size)
    size -= 1
  } while (g.measureText(text).width > max && size > 8)
}

/**
 * The numerals for one column of car buttons, on one transparent strip.
 *
 * Fifteen buttons used to mean fifteen little label planes. They are all the
 * same size on the same pitch, so they are one plane now, and the pucks
 * behind it light through the gaps between the digits.
 */
export const liftNumeralsTex = (rows: Array<LiftPlate | null>) =>
  canvasTex(96, rows.length * 96, (g, w, h) => {
    const rh = h / rows.length
    g.clearRect(0, 0, w, h)
    g.textAlign = 'center'
    rows.forEach((r, i) => {
      if (!r) return
      // rows run bottom to top; canvas y counts down
      const cy = (rows.length - 1 - i + 0.5) * rh
      fitFont(g, r.label, (px) => `bold ${px}px sans-serif`, 42, 64)
      // dark on the light puck: white numerals vanished against it, and
      // against the lit ceiling behind the top row
      g.fillStyle = '#1c1e22'
      g.fillText(r.label, w / 2, cy + 15)
    })
  })

/**
 * One column of the car's directory: engraved brass in a steel channel.
 *
 * Two rows are masking tape and a marker. Parliament ran out of brass
 * blanks the year Cybersecurity and Data Governance were stood up, and the
 * order has been pending ever since.
 */
export const liftPlateColumnTex = (rows: Array<LiftPlate | null>) =>
  canvasTex(384, rows.length * 120, (g, w, h) => {
    const rh = h / rows.length
    // the channel the plates drop into
    g.fillStyle = '#7f838a'
    g.fillRect(0, 0, w, h)

    const brassPlate = (y: number, ph: number) => {
      g.fillStyle = '#b08d3c'
      g.fillRect(6, y, w - 12, ph)
      // brushed, then a lit top edge and a shadowed bottom one
      for (let s = 0; s < 320; s++) {
        g.fillStyle = `rgba(255,240,200,${Math.random() * 0.07})`
        g.fillRect(6 + Math.random() * (w - 12), y + Math.random() * ph, 12, 1)
      }
      g.fillStyle = '#d9bd72'
      g.fillRect(6, y, w - 12, 2)
      g.fillStyle = '#6d5620'
      g.fillRect(6, y + ph - 2, w - 12, 2)
    }

    rows.forEach((r, i) => {
      const top = (rows.length - 1 - i) * rh
      const y = top + 10
      const ph = rh - 20

      // no floor here: a blank plate, so the row does not read as a hole
      if (!r) return brassPlate(y, ph)

      if (r.tape) {
        // a torn strip, stuck on a little out of true
        g.save()
        g.translate(w / 2, y + ph / 2)
        g.rotate(-0.02)
        g.fillStyle = '#ded0ac'
        g.fillRect(-w / 2 + 4, -ph / 2 + 4, w - 8, ph - 8)
        // the tape is not quite opaque, so the channel shows through the ends
        g.fillStyle = 'rgba(120,116,100,.18)'
        g.fillRect(-w / 2 + 4, -ph / 2 + 4, 12, ph - 8)
        g.fillRect(w / 2 - 16, -ph / 2 + 4, 12, ph - 8)
        g.fillStyle = '#1b2a5c'
        g.textAlign = 'left'
        fitFont(g, r.name, (px) => `italic bold ${px}px "Segoe Script", "Bradley Hand", cursive`, 40, w - 48)
        g.fillText(r.name, -w / 2 + 24, 14)
        g.restore()
        return
      }

      brassPlate(y, ph)
      g.textAlign = 'left'
      // engraved: the dark cut, with a hairline of light under it
      const cut = (text: string, x: number, cyy: number) => {
        g.fillStyle = 'rgba(255,238,190,.55)'
        g.fillText(text, x, cyy + 1)
        g.fillStyle = '#3a2a10'
        g.fillText(text, x, cyy)
      }
      fitFont(g, r.label, (px) => `bold ${px}px Georgia, serif`, 36, 66)
      cut(r.label, 20, y + ph / 2 + 12)
      fitFont(g, r.name.toUpperCase(), (px) => `${px}px Georgia, serif`, 30, w - 112)
      cut(r.name.toUpperCase(), 96, y + ph / 2 + 10)
    })
  })

/** The audio guy's desk: sixteen channel strips, knobs and faders. */
export const soundboardTex = lazy(() =>
  canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#22242a'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 16; i++) {
      const x = 16 + i * 31
      g.fillStyle = '#2e3138'
      g.fillRect(x, 12, 24, h - 24)
      for (let k = 0; k < 3; k++) {
        g.fillStyle = ['#c94f4f', '#4f8fc9', '#c9b44f'][k]
        g.beginPath()
        g.arc(x + 12, 30 + k * 26, 7, 0, 7)
        g.fill()
      }
      g.fillStyle = '#111'
      g.fillRect(x + 9, 118, 6, 110)
      g.fillStyle = '#e8e8e8'
      g.fillRect(x + 2, 150 + ((i * 37) % 60), 20, 12)
    }
  }),
)

/** The light guy's: a grid of bump buttons, some lit, and a row of faders. */
export const lightboardTex = lazy(() =>
  canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#1c1e24'
    g.fillRect(0, 0, w, h)
    const cols = ['#ffd23f', '#ff5a1f', '#4fc95f', '#4f8fc9', '#c94fd2', '#f2f0e8']
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 12; c++) {
        g.fillStyle = cols[(r * 12 + c) % 6]
        g.globalAlpha = (r * 12 + c) % 3 ? 0.3 : 1
        g.fillRect(18 + c * 40, 16 + r * 38, 28, 26)
      }
    }
    g.globalAlpha = 1
    for (let i = 0; i < 12; i++) {
      g.fillStyle = '#111'
      g.fillRect(21 + i * 40, 176, 6, 66)
      g.fillStyle = '#ddd'
      g.fillRect(14 + i * 40, 192 + ((i * 23) % 40), 20, 10)
    }
  }),
)

/** One big curtain button: the word on a coloured puck, readable across the booth. */
export const boothButtonTex = (label: string, bg: string) =>
  canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.fillStyle = bg
    g.beginPath()
    g.arc(w / 2, h / 2, 60, 0, 7)
    g.fill()
    g.strokeStyle = 'rgba(0,0,0,.35)'
    g.lineWidth = 6
    g.stroke()
    g.fillStyle = '#ffffff'
    g.font = 'bold 30px sans-serif'
    g.textAlign = 'center'
    g.fillText(label, w / 2, 75)
  })

/** The plate on the front of the podium. */
export const podiumPlateTex = lazy(() =>
  canvasTex(220, 90, (g, w, h) => {
    g.fillStyle = '#0d1f4a'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#f2c14e'
    g.lineWidth = 3
    g.strokeRect(5, 5, w - 10, h - 10)
    g.fillStyle = '#ffffff'
    g.font = 'bold 40px sans-serif'
    g.textAlign = 'center'
    g.fillText('IITS', w / 2, 58)
  }),
)

/**
 * Theatre carpet: a deep red field with a small gold lattice, the kind that
 * has been under those seats since the building opened.
 */
export const theatreCarpetTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#5a1418'
      g.fillRect(0, 0, w, h)
      // wear and tone
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${8 + Math.random() * 14 | 0},${10 + Math.random() * 14 | 0},.45)`
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
      // gold lattice on a 64px diamond grid
      g.strokeStyle = 'rgba(214,168,72,.55)'
      g.lineWidth = 2
      for (let x = -64; x <= w + 64; x += 64) {
        g.beginPath()
        g.moveTo(x, 0)
        g.lineTo(x + 64, 64)
        g.lineTo(x, 128)
        g.lineTo(x + 64, 192)
        g.lineTo(x, 256)
        g.stroke()
        g.beginPath()
        g.moveTo(x + 64, 0)
        g.lineTo(x, 64)
        g.lineTo(x + 64, 128)
        g.lineTo(x, 192)
        g.lineTo(x + 64, 256)
        g.stroke()
      }
      // a small medallion at each crossing
      g.fillStyle = 'rgba(214,168,72,.7)'
      for (let y = 0; y <= h; y += 64) {
        for (let x = 0; x <= w; x += 64) {
          g.beginPath()
          g.arc(x, y, 4, 0, 7)
          g.fill()
        }
      }
    },
    [15, 10],
  ),
)

/** Stage boards: wide planks, dark and worn at the front. */
export const stageFloorTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#5b3f2a'
      g.fillRect(0, 0, w, h)
      for (let y = 0; y < h; y += 32) {
        g.fillStyle = `rgb(${86 + Math.random() * 16 | 0},${60 + Math.random() * 12 | 0},${40 + Math.random() * 10 | 0})`
        g.fillRect(0, y, w, 30)
        g.fillStyle = 'rgba(0,0,0,.35)'
        g.fillRect(0, y + 30, w, 2)
      }
      for (let i = 0; i < 400; i++) {
        g.fillStyle = 'rgba(0,0,0,.12)'
        g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 30, 1)
      }
    },
    [10, 4],
  ),
)

/** Dark red velvet with a nap to it, for the curtains and the seats. */
export const velvetTex = lazy(() =>
  canvasTex(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#7a161d'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 2500; i++) {
        g.fillStyle = `rgba(${90 + Math.random() * 60 | 0},${14 + Math.random() * 16 | 0},${18 + Math.random() * 20 | 0},.5)`
        g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3)
      }
    },
    [2, 2],
  ),
)

/** A Greek key in gold on cream, for the fronts of the boxes. Repeats along its length. */
export const meanderTex = lazy(() =>
  canvasTex(
    128,
    64,
    (g, w, h) => {
      g.fillStyle = '#e6d9b8'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#b8912e'
      g.lineWidth = 5
      g.lineCap = 'square'
      // one key, twice across the tile
      for (const ox of [0, 64]) {
        g.beginPath()
        g.moveTo(ox + 6, 52)
        g.lineTo(ox + 6, 12)
        g.lineTo(ox + 52, 12)
        g.lineTo(ox + 52, 40)
        g.lineTo(ox + 22, 40)
        g.lineTo(ox + 22, 26)
        g.lineTo(ox + 38, 26)
        g.stroke()
      }
      g.fillStyle = '#b8912e'
      g.fillRect(0, 0, w, 3)
      g.fillRect(0, h - 3, w, 3)
    },
    [4, 1],
  ),
)

/** The exit sign, as the fire marshal wants it. */
export const exitTex = lazy(() =>
  canvasTex(120, 45, (g, w, h) => {
    g.fillStyle = '#111'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ff3b3b'
    g.font = 'bold 30px sans-serif'
    g.textAlign = 'center'
    g.fillText('EXIT', w / 2, 34)
  }),
)

/**
 * The lower third laid over the camera feed: a LIVE bug top left, and the
 * name strap bottom left. Transparent everywhere else, so it sits over the
 * picture as its own plane rather than being composited into the frame.
 */
export const lowerThirdTex = lazy(() =>
  canvasTex(640, 360, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    // LIVE
    g.fillStyle = '#c8102e'
    g.fillRect(24, 22, 74, 28)
    g.fillStyle = '#fff'
    g.font = 'bold 19px sans-serif'
    g.textAlign = 'left'
    g.fillText('● LIVE', 33, 43)
    // the strap: as wide as the longer of its two lines wants, plus a margin
    const name = 'Tom Rendell · Chief Technology Officer, Parliament of Inaccessible Island'
    g.font = '16px sans-serif'
    const strapW = Math.ceil(Math.max(g.measureText(name).width, 200) + 44)
    g.fillStyle = 'rgba(13,42,102,.92)'
    g.fillRect(24, h - 96, strapW, 68)
    g.fillStyle = '#ffd23f'
    g.fillRect(24, h - 96, strapW, 3)
    g.fillRect(24, h - 96, 6, 68)
    g.fillStyle = '#fff'
    g.font = 'bold 30px sans-serif'
    g.fillText('IITS', 44, h - 62)
    g.fillStyle = '#ffd23f'
    g.font = 'bold 15px sans-serif'
    g.fillText('2026', 124, h - 62)
    g.fillStyle = '#e6ecf7'
    g.font = '16px sans-serif'
    g.fillText(name, 44, h - 38)
  }),
)

/**
 * Engraved brass plate under the 1817 agreement on the mezzanine, in the
 * same hand as the Oliva's below it.
 */
export const agreementPlateTex = lazy(() =>
  canvasTex(460, 220, (g, w, h) => {
    g.fillStyle = '#b08d3c'
    g.fillRect(0, 0, w, h)
    // brushed brass
    for (let i = 0; i < 2200; i++) {
      g.fillStyle = `rgba(255,240,200,${Math.random() * 0.07})`
      g.fillRect(Math.random() * w, Math.random() * h, 6, 1)
    }
    g.strokeStyle = '#6d5620'
    g.lineWidth = 2
    g.strokeRect(7, 7, w - 14, h - 14)

    g.fillStyle = '#3a2a10'
    g.textAlign = 'center'
    g.font = 'bold 30px Georgia, serif'
    g.fillText('THE 1817 AGREEMENT', w / 2, 48)
    g.font = 'italic 20px Georgia, serif'
    g.fillText('“No member shall assume any superiority”', w / 2, 80)
    g.font = '16px Georgia, serif'
    g.fillText('Somerset Camp · Tristan da Cunha · 7 November 1817', w / 2, 110)
    g.font = '14px Georgia, serif'
    g.fillText('William Glass and the first settlers agreed to hold the stock,', w / 2, 144)
    g.fillText('the stores and the profit equally, and to share the work.', w / 2, 164)
    g.fillText('Every Parliament since has sat under a copy.', w / 2, 184)
  }),
)
