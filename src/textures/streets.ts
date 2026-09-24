import { canvasTex, lazy } from '../lib/canvasTex'

/** Asphalt with a dashed centre line and solid edge lines. Tiles along the road. */
export const roadTex = lazy(() =>
  canvasTex(
    64,
    256,
    (g, w, h) => {
      g.fillStyle = '#3c4046'
      g.fillRect(0, 0, w, h)
      // wear and patching
      for (let i = 0; i < 500; i++) {
        g.fillStyle = `rgba(${90 + Math.random() * 40},${92 + Math.random() * 40},${98 + Math.random() * 40},${Math.random() * 0.16})`
        g.fillRect(Math.random() * w, Math.random() * h, 3, 2)
      }
      // edge lines
      g.fillStyle = 'rgba(230,232,236,.55)'
      g.fillRect(5, 0, 2, h)
      g.fillRect(w - 7, 0, 2, h)
      // dashed centre
      g.fillStyle = 'rgba(240,206,90,.8)'
      for (let y = 0; y < h; y += 34) g.fillRect(w / 2 - 1.5, y, 3, 18)
    },
    [1, 8],
  ),
)

/** City blocks seen from above: rooftops, yards, parking. */
export const blocksTex = lazy(() =>
  canvasTex(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#5f6a63'
      g.fillRect(0, 0, w, h)
      // rooftops
      for (let i = 0; i < 26; i++) {
        const bw = 24 + Math.random() * 60
        const bh = 24 + Math.random() * 60
        const x = Math.random() * (w - bw)
        const y = Math.random() * (h - bh)
        g.fillStyle = ['#6d7078', '#7a6f63', '#5b6068', '#736a5e'][(Math.random() * 4) | 0]
        g.fillRect(x, y, bw, bh)
        g.fillStyle = 'rgba(0,0,0,.22)'
        g.fillRect(x, y + bh - 5, bw, 5)
        // roof plant
        g.fillStyle = 'rgba(200,205,210,.35)'
        g.fillRect(x + bw * 0.3, y + bh * 0.3, 10, 8)
      }
      // parking lots
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * (w - 60)
        const y = Math.random() * (h - 40)
        g.fillStyle = '#4a4e54'
        g.fillRect(x, y, 60, 40)
        g.fillStyle = 'rgba(255,255,255,.25)'
        for (let k = 0; k < 6; k++) g.fillRect(x + 6 + k * 9, y + 5, 1, 12)
      }
      // trees
      for (let i = 0; i < 60; i++) {
        g.fillStyle = `rgba(${40 + Math.random() * 30},${90 + Math.random() * 40},${45 + Math.random() * 30},.85)`
        g.beginPath()
        g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 0, 7)
        g.fill()
      }
    },
    [10, 10],
  ),
)
