import { canvasTex } from '../lib/canvasTex'

/**
 * The paper part of the wall calendar: month grid, caption and spiral holes.
 *
 * The photograph itself is a separate plane laid over the top half, so the
 * painted Parliament House can sit there at full resolution instead of being
 * redrawn into this canvas.
 */
export const calendarPaperTex = () =>
  canvasTex(300, 440, (g, w, h) => {
    g.fillStyle = '#fbfaf6'
    g.fillRect(0, 0, w, h)

    // the well the photo drops into
    g.fillStyle = '#e7e3d8'
    g.fillRect(12, 12, w - 24, 200)

    g.fillStyle = '#1a2a44'
    g.font = 'bold 12px sans-serif'
    g.textAlign = 'left'
    g.fillText('PARLIAMENT HOUSE · LONDON', 16, 232)
    g.fillStyle = '#666'
    g.font = '10px sans-serif'
    g.fillText('Built from the island’s own stone, 1938', 16, 246)

    /*
      September 2026. The 1st falls on a Tuesday, so day d sits at grid slot
      d + 1, and the month closes on the 30th — five rows, not six.

      This is the week the building is actually in: IITS runs the 16th and
      the 17th, which is why there is a gala downstairs and nobody upstairs.
    */
    g.fillStyle = '#1a2a44'
    g.font = 'bold 22px sans-serif'
    g.fillText('SEPTEMBER', 16, 278)
    g.font = '22px sans-serif'
    g.fillText('2026', 145, 278)

    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    g.font = 'bold 11px sans-serif'
    g.textAlign = 'center'
    days.forEach((d, i) => g.fillText(d, 30 + i * 40, 298))

    g.strokeStyle = '#d0cdc4'
    g.lineWidth = 1
    g.font = '12px sans-serif'
    for (let d = 1; d <= 30; d++) {
      const idx = d + 1
      const col = idx % 7
      const row = Math.floor(idx / 7)
      const x = 30 + col * 40
      const y = 318 + row * 24
      if (d === 16) {
        // today, filled
        g.fillStyle = '#c8102e'
        g.beginPath()
        g.arc(x, y - 4, 10, 0, 7)
        g.fill()
        g.fillStyle = '#fff'
      } else if (d === 17) {
        // day two, ringed
        g.strokeStyle = '#c8102e'
        g.lineWidth = 2
        g.beginPath()
        g.arc(x, y - 4, 10, 0, 7)
        g.stroke()
        g.fillStyle = '#c8102e'
      } else {
        g.fillStyle = col === 0 || col === 6 ? '#999' : '#222'
      }
      g.fillText(String(d), x, y)
    }

    g.fillStyle = '#c8102e'
    g.font = 'italic 9px sans-serif'
    g.textAlign = 'left'
    g.fillText('Sept 16–17: IITS, Denstone Hall', 16, h - 14)

    // spiral binding
    for (let i = 0; i < 9; i++) {
      g.fillStyle = '#333'
      g.beginPath()
      g.arc(30 + i * 30, 6, 3, 0, 7)
      g.fill()
    }
  })

/** Poster body for IITS. The banner artwork sits over the top of it. */
export const iitsPosterTex = () =>
  canvasTex(360, 520, (g, w, h) => {
    g.fillStyle = '#0d2a66'
    g.fillRect(0, 0, w, h)

    // where the banner goes
    g.fillStyle = '#07184a'
    g.fillRect(20, 22, w - 40, 120)

    g.fillStyle = '#e6ecf7'
    g.font = '14px sans-serif'
    g.textAlign = 'center'
    g.fillText('Inaccessible Island', w / 2, 178)
    g.fillText('Technology Symposium', w / 2, 198)

    g.fillStyle = '#fff'
    g.fillRect(40, 226, w - 80, 2)
    g.font = 'bold 22px sans-serif'
    g.fillText('SEPTEMBER 16–17', w / 2, 264)
    g.font = '15px sans-serif'
    g.fillStyle = '#e6ecf7'
    g.fillText('Denstone Hall', w / 2, 292)
    g.fillText('12 Harbor Street · London', w / 2, 312)

    g.fillStyle = '#ffd23f'
    g.font = 'bold 14px sans-serif'
    g.fillText('Keynotes · Island Technology Awards', w / 2, 350)
    g.fillStyle = '#e6ecf7'
    g.font = '13px sans-serif'
    g.fillText('Everyone on the island · Hosted by Parliament', w / 2, 372)

    // stripe motif above the footer
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i % 2 ? '#c8102e' : '#1a3f8f'
      g.fillRect(0, 396 + i * 7, w, 4)
    }

    g.fillStyle = '#c8102e'
    g.fillRect(0, h - 78, w, 78)
    g.fillStyle = '#fff'
    // Two lines: the single-line version overran the poster edge.
    g.font = 'bold 15px sans-serif'
    g.fillText('Free · bring your own boat', w / 2, h - 54)
    g.font = '12px sans-serif'
    g.fillText('Register at iits.parliament.ii', w / 2, h - 36)
    g.font = '10px sans-serif'
    g.fillText('Landing depends on the swell.', w / 2, h - 20)
    g.fillText('Check the harbor board the night before.', w / 2, h - 8)
  })

/** Engraved brass plate under the Gatekeeper. */
export const gatekeeperPlateTex = () =>
  canvasTex(420, 130, (g, w, h) => {
    g.fillStyle = '#b08d3c'
    g.fillRect(0, 0, w, h)
    // brushed brass
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = `rgba(255,240,200,${Math.random() * 0.07})`
      g.fillRect(Math.random() * w, Math.random() * h, 6, 1)
    }
    g.strokeStyle = '#6d5620'
    g.lineWidth = 2
    g.strokeRect(7, 7, w - 14, h - 14)

    g.fillStyle = '#3a2a10'
    g.textAlign = 'center'
    g.font = 'bold 25px Georgia, serif'
    g.fillText('THE GATEKEEPER', w / 2, 44)
    g.font = 'italic 18px Georgia, serif'
    g.fillText('“You Shall Not Pass”', w / 2, 70)
    g.font = '15px Georgia, serif'
    g.fillText('Warden of the north landing', w / 2, 94)
    g.font = '13px Georgia, serif'
    g.fillText('Rockhopper penguin  ·  Inaccessible Island', w / 2, 114)
  })
