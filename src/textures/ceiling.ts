import { canvasTex, lazy } from '../lib/canvasTex'

/** Mineral fibre speckle, with a water stain on roughly one tile in five. */
export function plainTile(seed: number) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#efece4'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(150,142,126,${0.05 + Math.random() * 0.16})`
      g.beginPath()
      g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7)
      g.fill()
    }
    if (seed > 0.78) {
      const cx = Math.random() * w
      const cy = Math.random() * h
      const gr = g.createRadialGradient(cx, cy, 4, cx, cy, 40 + Math.random() * 40)
      gr.addColorStop(0, 'rgba(150,120,70,.45)')
      gr.addColorStop(1, 'rgba(150,120,70,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
    }
  })
}

/** A tile that has given up: stained, split, and missing a corner. */
export const crackTile = () =>
  canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#e6e1d5'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = `rgba(150,142,126,${0.05 + Math.random() * 0.16})`
      g.beginPath()
      g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7)
      g.fill()
    }
    const gr = g.createRadialGradient(140, 60, 10, 140, 60, 90)
    gr.addColorStop(0, 'rgba(140,105,55,.55)')
    gr.addColorStop(1, 'rgba(140,105,55,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(60,52,40,.75)'
    g.lineWidth = 2.2
    let x = 40 + Math.random() * 40
    let y = 10
    g.beginPath()
    g.moveTo(x, y)
    for (let i = 0; i < 7; i++) {
      x += 18 + Math.random() * 22
      y += 12 + Math.random() * 10
      g.lineTo(x, y)
    }
    g.stroke()
    g.lineWidth = 1.4
    g.beginPath()
    g.moveTo(x - 50, y - 30)
    g.lineTo(x - 90, y + 20)
    g.lineTo(x - 140, y + 8)
    g.stroke()
    // the corner that fell out
    g.fillStyle = 'rgba(45,40,32,.9)'
    g.beginPath()
    g.moveTo(200, 96)
    g.lineTo(236, 104)
    g.lineTo(226, 124)
    g.lineTo(196, 116)
    g.closePath()
    g.fill()
  })

/** Stamped-steel supply diffuser, grubby round the edges. */
export const diffTex = lazy(() =>
  canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#dcd8cf'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 5; i++) {
      const inset = 8 + i * 22
      g.fillStyle = i % 2 ? '#c3bfb5' : '#e8e4dc'
      g.fillRect(inset, inset, w - inset * 2, h - inset * 2)
      g.fillStyle = 'rgba(0,0,0,.3)'
      g.fillRect(inset, inset, w - inset * 2, 6)
      g.fillRect(inset, inset, 6, h - inset * 2)
    }
    g.fillStyle = '#2a2a2a'
    g.fillRect(116, 116, 24, 24)
    for (let i = 0; i < 1100; i++) {
      const a = Math.random() * 7
      const r = 40 + Math.random() * 100
      g.fillStyle = `rgba(40,35,30,${0.06 + Math.random() * 0.2})`
      g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3 + Math.random() * 4, 2)
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle = 'rgba(50,45,40,.24)'
      g.fillRect(8 + i * 3, 8, 6, 240)
      g.fillRect(8, 8 + i * 3, 240, 6)
    }
  }),
)

/** The dirty halo a supply diffuser leaves on the tile around it. */
export const dustTex = lazy(() =>
  canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#efece4'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = `rgba(150,142,126,${0.05 + Math.random() * 0.14})`
      g.beginPath()
      g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7)
      g.fill()
    }
    const gr = g.createRadialGradient(128, 64, 10, 128, 64, 110)
    gr.addColorStop(0, 'rgba(60,50,40,.5)')
    gr.addColorStop(0.55, 'rgba(60,50,40,.22)')
    gr.addColorStop(1, 'rgba(60,50,40,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(35,30,24,${Math.random() * 0.3})`
      g.fillRect(Math.random() * w, Math.random() * h, 3, 2)
    }
  }),
)

/** Label under a wireless access point. */
export const apTag = (n: number) =>
  canvasTex(100, 28, (g, w) => {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, w, 28)
    g.fillStyle = '#333'
    g.font = 'bold 11px monospace'
    g.textAlign = 'center'
    g.fillText('AP-23-' + n, w / 2, 19)
  })

/** Perforated face of a flush ceiling speaker. */
export const speakerGrilleTex = lazy(() =>
  canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e8e7e0'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#8f8d85'
    for (let y = 6; y < h - 4; y += 7) {
      for (let x = 6 + ((y / 7) % 2) * 3.5; x < w - 4; x += 7) {
        g.beginPath()
        g.arc(x, y, 1.7, 0, 7)
        g.fill()
      }
    }
  }),
)
