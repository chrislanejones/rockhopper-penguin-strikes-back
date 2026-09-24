import { canvasTex, lazy } from '../lib/canvasTex'

/** One panel of the all-in-one poster: coloured header, then wall of body copy. */
interface Panel {
  title: string
  sub?: string
  colour: string
  /** Roughly how much text is crammed under the heading. */
  density: number
}

const PANELS: Panel[] = [
  { title: 'FEDERAL MINIMUM WAGE', sub: 'Fair Labor Standards Act', colour: '#1b5e20', density: 9 },
  { title: 'EQUAL EMPLOYMENT OPPORTUNITY', sub: 'IT IS THE LAW', colour: '#0d3b66', density: 10 },
  { title: 'JOB SAFETY AND HEALTH', sub: 'IT IS THE LAW — OSHA', colour: '#b8860b', density: 9 },
  { title: 'FAMILY AND MEDICAL LEAVE', sub: 'Employee Rights Under the FMLA', colour: '#4a148c', density: 10 },
  { title: 'EMPLOYEE POLYGRAPH PROTECTION', colour: '#37474f', density: 7 },
  { title: 'YOUR RIGHTS UNDER USERRA', sub: 'Uniformed Services Employment', colour: '#8a1c1c', density: 8 },
  { title: 'ISLAND MINIMUM WAGE', sub: 'Island Code § 40.1-28.10', colour: '#1b5e20', density: 7 },
  { title: "WORKERS' COMPENSATION", sub: 'Notice to Employees', colour: '#0d3b66', density: 8 },
  { title: 'UNEMPLOYMENT INSURANCE', sub: 'Island Employment Board', colour: '#37474f', density: 7 },
]

/**
 * The all-in-one federal and state compliance poster.
 *
 * Nobody reads one of these, so it is drawn the way you actually perceive it:
 * the headings are set as real type, and the body copy underneath is ruled
 * lines. Trying to letter nine panels of statute at this size would be
 * illegible anyway, and slower.
 */
export const laborLawPosterTex = lazy(() =>
  canvasTex(660, 960, (g, w, h) => {
    g.fillStyle = '#fdfcf7'
    g.fillRect(0, 0, w, h)

    // masthead
    g.fillStyle = '#0d3b66'
    g.fillRect(0, 0, w, 92)
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = 'bold 30px Helvetica, Arial, sans-serif'
    g.fillText('FEDERAL & ISLAND', w / 2, 40)
    g.font = 'bold 26px Helvetica, Arial, sans-serif'
    g.fillText('LABOR LAW NOTICES', w / 2, 72)
    g.fillStyle = '#c8102e'
    g.fillRect(0, 92, w, 8)
    g.fillStyle = '#333333'
    g.font = 'bold 13px Helvetica, Arial, sans-serif'
    g.fillText('EMPLOYERS MUST POST CONSPICUOUSLY WHERE EMPLOYEES CAN READILY SEE', w / 2, 118)

    // panel grid, three across
    const cols = 3
    const gx = 14
    const gy = 132
    const pw = (w - gx * 2 - 12 * (cols - 1)) / cols
    const ph = 244

    PANELS.forEach((p, i) => {
      const cx = gx + (i % cols) * (pw + 12)
      const cy = gy + Math.floor(i / cols) * (ph + 12)

      g.fillStyle = '#ffffff'
      g.fillRect(cx, cy, pw, ph)
      g.strokeStyle = '#c9c6bd'
      g.lineWidth = 1.5
      g.strokeRect(cx, cy, pw, ph)

      // Wrap the heading first: the bar has to be sized to the number of
      // lines, or a two-line title lands on top of its own subtitle.
      g.font = 'bold 13px Helvetica, Arial, sans-serif'
      const words = p.title.split(' ')
      let line = ''
      const lines: string[] = []
      words.forEach((word) => {
        const next = line ? line + ' ' + word : word
        if (g.measureText(next).width > pw - 16) {
          lines.push(line)
          line = word
        } else line = next
      })
      lines.push(line)
      const titleLines = lines.slice(0, 2)
      const headerH = 20 + titleLines.length * 14 + (p.sub ? 14 : 0)

      g.fillStyle = p.colour
      g.fillRect(cx, cy, pw, headerH)
      g.fillStyle = '#ffffff'
      g.textAlign = 'center'
      titleLines.forEach((l, k) => g.fillText(l, cx + pw / 2, cy + 17 + k * 14))
      if (p.sub) {
        g.font = 'italic 10px Helvetica, Arial, sans-serif'
        g.fillText(p.sub, cx + pw / 2, cy + headerH - 6)
      }

      // body: ruled lines standing in for statute nobody reads
      const bodyTop = cy + headerH + 12
      for (let k = 0; k < p.density; k++) {
        const y = bodyTop + k * 15
        if (y > cy + ph - 26) break
        g.fillStyle = k === 0 ? '#222222' : '#8b8b8b'
        const width = k === 0 ? pw - 30 : (pw - 24) * (0.55 + Math.random() * 0.42)
        g.fillRect(cx + 10, y, width, k === 0 ? 5 : 3.4)
      }

      // the bit everyone actually looks at
      if (p.title.includes('MINIMUM WAGE')) {
        g.fillStyle = p.colour
        g.textAlign = 'center'
        g.font = 'bold 30px Helvetica, Arial, sans-serif'
        g.fillText(p.title.startsWith('ISLAND') ? '$12.41' : '$7.25', cx + pw / 2, cy + ph - 30)
        g.font = '10px Helvetica, Arial, sans-serif'
        g.fillStyle = '#555555'
        g.fillText('PER HOUR', cx + pw / 2, cy + ph - 15)
      }
    })

    // footer
    g.fillStyle = '#555555'
    g.textAlign = 'left'
    g.font = '11px Helvetica, Arial, sans-serif'
    g.fillText('Rev. 01/2026  ·  Island Dept. of Labor and Industry', 16, h - 14)
    g.textAlign = 'right'
    g.fillText('Do not remove or deface', w - 16, h - 14)
  }),
)

/**
 * A single notice, typeset like the official ones around it.
 *
 * Same header bar, same all-caps, same "post conspicuously" register — which
 * is what makes an unofficial one funny rather than obviously fake.
 */
export function noticeTex(opts: {
  header: string
  headerColour?: string
  lines: string[]
  /** The one line that gets set big. */
  emphasis?: string
  footer?: string
}) {
  return canvasTex(440, 570, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#111111'
    g.lineWidth = 3
    g.strokeRect(10, 10, w - 20, h - 20)

    g.fillStyle = opts.headerColour ?? '#0d3b66'
    g.fillRect(10, 10, w - 20, 62)
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = 'bold 27px Helvetica, Arial, sans-serif'
    g.fillText(opts.header, w / 2, 51)

    let y = 118
    if (opts.emphasis) {
      g.fillStyle = '#111111'
      g.font = 'bold 30px Helvetica, Arial, sans-serif'
      // wrap the emphasis line
      const words = opts.emphasis.split(' ')
      let line = ''
      const lines: string[] = []
      words.forEach((word) => {
        const next = line ? line + ' ' + word : word
        if (g.measureText(next).width > w - 60) {
          lines.push(line)
          line = word
        } else line = next
      })
      lines.push(line)
      lines.forEach((l) => {
        g.fillText(l, w / 2, y)
        y += 38
      })
      y += 18
    }

    g.fillStyle = '#333333'
    g.font = '17px Helvetica, Arial, sans-serif'
    opts.lines.forEach((l) => {
      g.fillText(l, w / 2, y)
      y += 26
    })

    if (opts.footer) {
      g.fillStyle = '#8a1c1c'
      g.font = 'bold 14px Helvetica, Arial, sans-serif'
      g.fillText(opts.footer, w / 2, h - 32)
    }
  })
}
