import { canvasTex, lazy } from '../lib/canvasTex'

/** A slab of lit and unlit office windows, tiled up a tower. */
export function winTexture() {
  return canvasTex(64, 128, (g, w, h) => {
    const tint = ['#3a4450', '#2f3a44', '#44515c'][(Math.random() * 3) | 0]
    g.fillStyle = tint
    g.fillRect(0, 0, w, h)
    for (let y = 3; y < h; y += 7) {
      for (let x = 3; x < w; x += 7) {
        const lit = Math.random()
        g.fillStyle = lit > 0.55 ? (Math.random() > 0.5 ? '#d6e0e8' : '#f1e4c0') : '#1e252c'
        g.fillRect(x, y, 4, 5)
      }
    }
  })
}

/** Soft blobs for the sprite clouds drifting past the glass. */
export const cloudTex = lazy(() =>
  canvasTex(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    for (let i = 0; i < 26; i++) {
      const r = 18 + Math.random() * 26
      const x = 30 + Math.random() * (w - 60)
      const y = 40 + Math.random() * (h - 70)
      const grd = g.createRadialGradient(x, y, 0, x, y, r)
      grd.addColorStop(0, 'rgba(255,255,255,.95)')
      grd.addColorStop(0.7, 'rgba(245,247,250,.55)')
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grd
      g.beginPath()
      g.arc(x, y, r, 0, 7)
      g.fill()
    }
  }),
)

/** Street grid seen from 250 feet up, with headlights in it. */
export const groundTex = lazy(() =>
  canvasTex(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = '#6d7680'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#3d444c'
      g.lineWidth = 6
      for (let i = 0; i <= 8; i++) {
        g.beginPath()
        g.moveTo(i * 64, 0)
        g.lineTo(i * 64, h)
        g.stroke()
        g.beginPath()
        g.moveTo(0, i * 64)
        g.lineTo(w, i * 64)
        g.stroke()
      }
      g.fillStyle = 'rgba(255,220,150,.5)'
      for (let i = 0; i < 400; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    },
    [14, 14],
  ),
)

/** Ribbon glazing for the Lottery tower — banded spandrel with lit floors. */
export const lotteryFacade = () =>
  canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8fb8d8'
    g.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = '#2c3a48'
      g.fillRect(0, y, w, 9)
      g.fillStyle = 'rgba(255,255,255,.35)'
      g.fillRect(0, y + 9, w, 2)
    }
    for (let x = 0; x < w; x += 64) {
      g.fillStyle = 'rgba(30,40,55,.45)'
      g.fillRect(x, 0, 3, h)
    }
    for (let y = 11; y < h; y += 32) {
      for (let x = 6; x < w; x += 64) {
        if (Math.random() > 0.55) {
          g.fillStyle = 'rgba(255,240,200,.35)'
          g.fillRect(x, y, 55, 20)
        }
      }
    }
  })

/** The sky: a plain vertical gradient, painted inside a very large sphere. */
export const SKY_VERT = /* glsl */ `
varying vec3 p;
void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
`

export const SKY_FRAG = /* glsl */ `
varying vec3 p;
void main(){
  float t = clamp(p.y/900., -1., 1.);
  vec3 top = vec3(.36,.58,.86), hor = vec3(.82,.87,.92), low = vec3(.62,.66,.70);
  vec3 c = t > 0. ? mix(hor, top, pow(t,.6)) : mix(hor, low, -t);
  gl_FragColor = vec4(c,1.);
}
`
