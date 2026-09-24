import { canvasTex, lazy } from '../lib/canvasTex'

/**
 * What is actually on a screen in this building.
 *
 * Two people run a terminal. Everybody else has Outlook open, or a browser
 * with four tabs and a service portal in the front one.
 */
export type ScreenSpec =
  | { kind: 'outlook'; folder: string; unread: number; mail: MailRow[] }
  | { kind: 'chrome'; tabs: string[]; url: string; page: PageSpec }
  | { kind: 'terminal'; title: string; lines: string[] }

export interface MailRow {
  from: string
  subject: string
  time: string
  unread?: boolean
  flagged?: boolean
}

export interface PageSpec {
  /** Masthead colour, usually the agency blue. */
  brand: string
  title: string
  subtitle?: string
  rows: string[]
}

const UI = {
  chrome: '#dee1e6',
  chromeDark: '#bcc0c4',
  page: '#ffffff',
  ink: '#202124',
  muted: '#5f6368',
  accent: '#0f6cbd',
  line: '#e3e5e8',
}

/** Rounded rectangle, because every piece of modern UI chrome is one. */
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.lineTo(x + w - r, y)
  g.quadraticCurveTo(x + w, y, x + w, y + r)
  g.lineTo(x + w, y + h - r)
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  g.lineTo(x + r, y + h)
  g.quadraticCurveTo(x, y + h, x, y + h - r)
  g.lineTo(x, y + r)
  g.quadraticCurveTo(x, y, x + r, y)
  g.closePath()
}

/** Clip a string to a pixel width, with an ellipsis. */
function clip(g: CanvasRenderingContext2D, text: string, max: number) {
  if (g.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && g.measureText(t + '…').width > max) t = t.slice(0, -1)
  return t + '…'
}

/** Outlook, in the only state anyone ever sees it: too many unread. */
function drawOutlook(g: CanvasRenderingContext2D, W: number, H: number, spec: Extract<ScreenSpec, { kind: 'outlook' }>) {
  g.fillStyle = '#faf9f8'
  g.fillRect(0, 0, W, H)

  // title bar and search
  g.fillStyle = '#0f4c81'
  g.fillRect(0, 0, W, H * 0.09)
  g.fillStyle = '#ffffff'
  g.font = `bold ${Math.round(H * 0.042)}px Segoe UI, sans-serif`
  g.textAlign = 'left'
  g.fillText('Outlook', W * 0.02, H * 0.062)
  g.fillStyle = 'rgba(255,255,255,.22)'
  rr(g, W * 0.28, H * 0.017, W * 0.44, H * 0.055, H * 0.026)
  g.fill()
  g.fillStyle = 'rgba(255,255,255,.75)'
  g.font = `${Math.round(H * 0.032)}px Segoe UI, sans-serif`
  g.fillText('Search', W * 0.30, H * 0.058)

  // ribbon
  g.fillStyle = '#f3f2f1'
  g.fillRect(0, H * 0.09, W, H * 0.08)
  g.fillStyle = UI.muted
  g.font = `${Math.round(H * 0.032)}px Segoe UI, sans-serif`
  ;['New mail', 'Delete', 'Archive', 'Move', 'Reply', 'Reply all'].forEach((t, i) =>
    g.fillText(t, W * 0.02 + i * W * 0.115, H * 0.142),
  )

  const top = H * 0.17
  // folder pane
  g.fillStyle = '#f3f2f1'
  g.fillRect(0, top, W * 0.19, H - top)
  const folders = ['Inbox', 'Drafts', 'Sent Items', 'Deleted', 'Archive', 'Tickets']
  folders.forEach((f, i) => {
    const y = top + H * 0.06 + i * H * 0.075
    const active = f === spec.folder
    if (active) {
      g.fillStyle = '#e1dfdd'
      g.fillRect(0, y - H * 0.045, W * 0.19, H * 0.068)
      g.fillStyle = UI.accent
      g.fillRect(0, y - H * 0.045, W * 0.006, H * 0.068)
    }
    g.fillStyle = active ? '#1b1a19' : UI.muted
    g.font = `${active ? 'bold ' : ''}${Math.round(H * 0.034)}px Segoe UI, sans-serif`
    g.fillText(f, W * 0.025, y)
    if (f === 'Inbox') {
      g.fillStyle = UI.accent
      g.font = `bold ${Math.round(H * 0.03)}px Segoe UI, sans-serif`
      g.textAlign = 'right'
      g.fillText(String(spec.unread), W * 0.175, y)
      g.textAlign = 'left'
    }
  })

  // message list
  const lx = W * 0.19
  const lw = W * 0.36
  g.fillStyle = '#ffffff'
  g.fillRect(lx, top, lw, H - top)
  spec.mail.forEach((m, i) => {
    const y = top + i * H * 0.108
    if (y + H * 0.1 > H) return
    if (i === 0) {
      g.fillStyle = '#eff6fc'
      g.fillRect(lx, y, lw, H * 0.105)
    }
    if (m.unread) {
      g.fillStyle = UI.accent
      g.fillRect(lx, y + H * 0.012, W * 0.005, H * 0.08)
    }
    g.fillStyle = m.unread ? '#1b1a19' : UI.muted
    g.font = `${m.unread ? 'bold ' : ''}${Math.round(H * 0.032)}px Segoe UI, sans-serif`
    g.fillText(clip(g, m.from, lw * 0.62), lx + W * 0.018, y + H * 0.042)
    g.fillStyle = UI.muted
    g.font = `${Math.round(H * 0.028)}px Segoe UI, sans-serif`
    g.textAlign = 'right'
    g.fillText(m.time, lx + lw - W * 0.012, y + H * 0.042)
    g.textAlign = 'left'
    g.fillStyle = m.unread ? '#323130' : '#8a8886'
    g.font = `${Math.round(H * 0.029)}px Segoe UI, sans-serif`
    g.fillText(clip(g, m.subject, lw * 0.9), lx + W * 0.018, y + H * 0.082)
    if (m.flagged) {
      g.fillStyle = '#d13438'
      g.beginPath()
      g.arc(lx + lw - W * 0.02, y + H * 0.075, H * 0.012, 0, 7)
      g.fill()
    }
    g.strokeStyle = UI.line
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(lx, y + H * 0.105)
    g.lineTo(lx + lw, y + H * 0.105)
    g.stroke()
  })

  // reading pane
  const rx = lx + lw
  g.fillStyle = '#ffffff'
  g.fillRect(rx, top, W - rx, H - top)
  g.strokeStyle = UI.line
  g.beginPath()
  g.moveTo(rx, top)
  g.lineTo(rx, H)
  g.stroke()
  const first = spec.mail[0]
  if (first) {
    g.fillStyle = '#1b1a19'
    g.font = `bold ${Math.round(H * 0.038)}px Segoe UI, sans-serif`
    g.fillText(clip(g, first.subject, W - rx - W * 0.04), rx + W * 0.02, top + H * 0.07)
    g.fillStyle = UI.accent
    g.beginPath()
    g.arc(rx + W * 0.035, top + H * 0.135, H * 0.026, 0, 7)
    g.fill()
    g.fillStyle = UI.muted
    g.font = `${Math.round(H * 0.03)}px Segoe UI, sans-serif`
    g.fillText(clip(g, first.from, W - rx - W * 0.09), rx + W * 0.065, top + H * 0.145)
    g.fillStyle = '#d0d0d0'
    for (let i = 0; i < 6; i++) {
      const w = (W - rx - W * 0.05) * (i % 3 === 2 ? 0.55 : 0.9)
      g.fillRect(rx + W * 0.02, top + H * 0.2 + i * H * 0.055, w, H * 0.016)
    }
  }
}

/** A browser with four tabs, which is the true number of tabs. */
function drawChrome(g: CanvasRenderingContext2D, W: number, H: number, spec: Extract<ScreenSpec, { kind: 'chrome' }>) {
  g.fillStyle = UI.chrome
  g.fillRect(0, 0, W, H)

  // tab strip
  const tabH = H * 0.085
  let tx = W * 0.012
  spec.tabs.forEach((t, i) => {
    const tw = W * 0.2
    g.fillStyle = i === 0 ? UI.page : UI.chromeDark
    rr(g, tx, H * 0.018, tw, tabH, 8)
    g.fill()
    g.fillStyle = i === 0 ? UI.ink : UI.muted
    g.font = `${Math.round(H * 0.028)}px Segoe UI, sans-serif`
    g.textAlign = 'left'
    g.fillText(clip(g, t, tw - W * 0.03), tx + W * 0.016, H * 0.018 + tabH * 0.65)
    tx += tw + W * 0.006
  })

  // omnibox
  const oy = H * 0.018 + tabH + H * 0.014
  const oh = H * 0.062
  g.fillStyle = UI.chrome
  g.fillRect(0, oy - H * 0.008, W, oh + H * 0.02)
  g.fillStyle = '#ffffff'
  rr(g, W * 0.075, oy, W * 0.9, oh, oh / 2)
  g.fill()
  g.fillStyle = UI.muted
  g.font = `${Math.round(H * 0.03)}px Segoe UI, sans-serif`
  g.fillText('🔒  ' + spec.url, W * 0.095, oy + oh * 0.68)
  // back / forward / reload
  ;[W * 0.02, W * 0.04, W * 0.06].forEach((x) => {
    g.strokeStyle = UI.muted
    g.lineWidth = 1.6
    g.beginPath()
    g.arc(x, oy + oh / 2, H * 0.014, 0, 7)
    g.stroke()
  })

  // page
  const py = oy + oh + H * 0.016
  g.fillStyle = UI.page
  g.fillRect(0, py, W, H - py)
  g.fillStyle = spec.page.brand
  g.fillRect(0, py, W, H * 0.11)
  g.fillStyle = '#ffffff'
  g.font = `bold ${Math.round(H * 0.042)}px Segoe UI, sans-serif`
  g.fillText(clip(g, spec.page.title, W * 0.94), W * 0.03, py + H * 0.072)
  if (spec.page.subtitle) {
    g.fillStyle = 'rgba(255,255,255,.75)'
    g.font = `${Math.round(H * 0.028)}px Segoe UI, sans-serif`
    g.textAlign = 'right'
    g.fillText(spec.page.subtitle, W * 0.97, py + H * 0.072)
    g.textAlign = 'left'
  }
  spec.page.rows.forEach((r, i) => {
    const y = py + H * 0.16 + i * H * 0.082
    if (y > H - H * 0.02) return
    g.fillStyle = i % 2 ? '#f7f8fa' : '#ffffff'
    g.fillRect(W * 0.03, y - H * 0.05, W * 0.94, H * 0.072)
    g.fillStyle = UI.ink
    g.font = `${Math.round(H * 0.032)}px Segoe UI, sans-serif`
    g.fillText(clip(g, r, W * 0.9), W * 0.045, y)
  })
}

/** For the two people on this floor who live in a terminal. */
function drawTerminal(g: CanvasRenderingContext2D, W: number, H: number, spec: Extract<ScreenSpec, { kind: 'terminal' }>) {
  const grd = g.createLinearGradient(0, 0, W, H)
  grd.addColorStop(0, '#1e3a5f')
  grd.addColorStop(1, '#0b1626')
  g.fillStyle = grd
  g.fillRect(0, 0, W, H)

  const wx = W * 0.04
  const wy = H * 0.07
  const ww = W - wx * 2
  const wh = H - wy - H * 0.14
  g.fillStyle = 'rgba(0,0,0,.35)'
  g.fillRect(wx + 4, wy + 6, ww, wh)
  g.fillStyle = '#1b1f27'
  g.fillRect(wx, wy, ww, wh)
  g.fillStyle = '#2a2f3a'
  g.fillRect(wx, wy, ww, H * 0.075)
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    g.fillStyle = c
    g.beginPath()
    g.arc(wx + W * 0.028 + i * W * 0.032, wy + H * 0.037, H * 0.015, 0, 7)
    g.fill()
  })
  g.fillStyle = '#c8cdd6'
  g.font = `${Math.round(H * 0.032)}px Segoe UI, sans-serif`
  g.textAlign = 'left'
  g.fillText(spec.title, wx + W * 0.14, wy + H * 0.048)

  g.font = `${Math.round(H * 0.034)}px ui-monospace, monospace`
  spec.lines.forEach((l, i) => {
    g.fillStyle = i === 0 ? '#8fd0ff' : '#d6dbe4'
    g.fillText(l, wx + W * 0.025, wy + H * 0.13 + i * H * 0.055)
  })
  const last = spec.lines[spec.lines.length - 1] ?? ''
  g.fillStyle = '#8fd0ff'
  g.fillRect(
    wx + W * 0.025 + g.measureText(last).width + 3,
    wy + H * 0.098 + (spec.lines.length - 1) * H * 0.055,
    W * 0.011,
    H * 0.04,
  )

  g.fillStyle = '#0a0d14'
  g.fillRect(0, H - H * 0.085, W, H * 0.085)
  g.fillStyle = '#4a9eff'
  g.fillRect(W * 0.016, H - H * 0.068, W * 0.028, H * 0.05)
  for (let i = 0; i < 5; i++) {
    g.fillStyle = '#2b3140'
    g.fillRect(W * 0.062 + i * W * 0.053, H - H * 0.068, W * 0.04, H * 0.05)
  }
  g.fillStyle = '#e8ecf2'
  g.font = `${Math.round(H * 0.03)}px Segoe UI, sans-serif`
  g.textAlign = 'right'
  g.fillText('2:47 PM   Thu 27', W - W * 0.02, H - H * 0.028)
}

/** Render one screen. Texture size follows the monitor's aspect. */
export function screenTexture(spec: ScreenSpec, wide?: boolean) {
  const W = wide ? 800 : 720
  const H = wide ? 400 : 422
  return canvasTex(W, H, (g) => {
    if (spec.kind === 'outlook') drawOutlook(g, W, H, spec)
    else if (spec.kind === 'chrome') drawChrome(g, W, H, spec)
    else drawTerminal(g, W, H, spec)
  })
}

/** Keycaps, viewed from directly above. */
export const keyboardTex = lazy(() =>
  canvasTex(300, 110, (gg, W) => {
    gg.fillStyle = '#2c2f36'
    gg.fillRect(0, 0, W, 110)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 15; c++) {
        const kw = r === 4 && c > 3 && c < 10 ? 0 : 16
        if (!kw) continue
        gg.fillStyle = '#41454f'
        gg.fillRect(8 + c * 19, 8 + r * 20, kw, 15)
        gg.fillStyle = '#5a5f6b'
        gg.fillRect(8 + c * 19, 8 + r * 20, kw, 2)
      }
    }
    gg.fillStyle = '#41454f'
    gg.fillRect(8 + 4 * 19, 8 + 4 * 20, 110, 15)
  }),
)

/** Boxed spare keyboards on the storage shelf — fewer rows, no detail wasted. */
export const boxedKeyboardTex = lazy(() =>
  canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#2c2f36'
    g.fillRect(0, 0, w, h)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 16; c++) {
        g.fillStyle = '#41454f'
        g.fillRect(6 + c * 15, 8 + r * 20, 12, 15)
      }
    }
  }),
)

/**
 * The staff-update deck looping on the break-room TV.
 *
 * Six slides on a seven-second rotation, which is exactly long enough to read
 * four of them and never the one you wanted.
 */
export type Slide = (g: CanvasRenderingContext2D, w: number, h: number) => void

const bullets = (g: CanvasRenderingContext2D, lines: string[], top = 110, step = 40) => {
  g.fillStyle = '#222'
  g.font = '20px sans-serif'
  lines.forEach((t, i) => g.fillText(t, 30, top + i * step))
}

const chrome = (g: CanvasRenderingContext2D, w: number, h: number, title: string) => {
  g.fillStyle = '#f7f7f5'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#0d2a66'
  g.fillRect(0, 0, w, 60)
  g.fillStyle = '#fff'
  g.font = 'bold 26px sans-serif'
  g.textAlign = 'left'
  g.fillText(title, 24, 40)
}

export const slides: Slide[] = [
  (g, w, h) => {
    g.fillStyle = '#0d2a66'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#c8102e'
    g.fillRect(0, h - 40, w, 40)
    g.fillStyle = '#fff'
    g.font = 'bold 40px sans-serif'
    g.textAlign = 'center'
    g.fillText('Parliament of Inaccessible Island', w / 2, 150)
    g.font = '24px sans-serif'
    g.fillText('Staff Update  ·  September 2026', w / 2, 200)
    g.font = '16px sans-serif'
    g.fillStyle = '#ffd23f'
    g.fillText('Office of the Speaker  ·  Winter session recap', w / 2, 250)
  },
  (g, w, h) => {
    chrome(g, w, h, '2026 winter session at a glance')
    bullets(g, [
      '• 60-day session; 41 bills sent to the Speaker',
      '• Quorum reached on 38 of 60 days (weather)',
      '• 36 passed  ·  4 returned with amendments',
      '• One bill lost overboard, reintroduced in April',
      '• Final readings completed by the May supply ship',
    ])
  },
  (g, w, h) => {
    chrome(g, w, h, 'Passed — the plateau package')
    bullets(g, [
      '• No boots on the plateau without a wash-down',
      '• Rail nesting season: north paths closed Oct–Jan',
      '• Rat checks on every landing, every boat',
      '• Wild celery may be picked, not dug',
      '• Survey of the phylica woods, again',
    ])
  },
  (g, w, h) => {
    chrome(g, w, h, 'Passed May 15 — harbor and landing bills')
    bullets(
      g,
      [
        '• New lifting gear on the Waterfall landing',
        '• Landing fees waived for rescue craft',
        '• HB 26 / SB 62: the rope ladder is to be replaced,',
        '   not repainted',
        '• Swell readings posted at the harbor twice daily',
        '• Penguin right of way on the beach, formalized',
      ],
      105,
      36,
    )
  },
  (g, w, h) => {
    chrome(g, w, h, 'Returned with amendments / vetoed')
    bullets(g, [
      '• A second waterfall',
      '• Paid leave for bad-landing days',
      '• A bridge to Nightingale',
      '• An airstrip (proposed start never)',
      '• Goats vetoed',
    ])
    g.fillStyle = '#666'
    g.font = '14px sans-serif'
    g.fillText('Details: speaker.parliament.ii/newsroom', 30, h - 20)
  },
  (g, w, h) => {
    chrome(g, w, h, 'IT reminders')
    bullets(g, [
      '• New rules took effect July 1',
      '• IITS: Sept 16–17, Denstone Hall',
      '• Island Technology Award winners announced at IITS',
      '• Change your PII password before it expires',
      '• IT support: help.parliament.ii',
    ])
  },
]

/**
 * The Weather Channel, or near enough: London's local forecast on a loop.
 *
 * Drawn fresh every second so the clock ticks and the crawl moves. `t` is
 * seconds since the TV came on.
 */
export function drawWeather(g: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // sky gradient behind everything
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#0b2a6b')
  sky.addColorStop(1, '#1d5db0')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)

  // header bar
  g.fillStyle = '#071a44'
  g.fillRect(0, 0, w, 44)
  g.fillStyle = '#ffffff'
  g.font = 'bold 20px sans-serif'
  g.textAlign = 'left'
  g.fillText('LOCAL ON THE 8s', 16, 30)
  g.textAlign = 'right'
  g.font = '16px sans-serif'
  const clock = new Date(Date.now())
  const hh = clock.getHours() % 12 || 12
  const mm = String(clock.getMinutes()).padStart(2, '0')
  const ss = String(clock.getSeconds()).padStart(2, '0')
  g.fillText(`LONDON   ${hh}:${mm}:${ss} ${clock.getHours() < 12 ? 'AM' : 'PM'}`, w - 16, 29)

  // current conditions, left
  g.textAlign = 'left'
  g.fillStyle = '#ffffff'
  g.font = 'bold 84px sans-serif'
  g.fillText('58°', 24, 150)
  g.font = '20px sans-serif'
  g.fillText('Squally showers', 26, 180)
  g.fillStyle = '#cfe0ff'
  g.font = '15px sans-serif'
  g.fillText('Feels like 49°   ·   Humidity 88%   ·   Wind W 31 mph', 26, 206)

  // a sun and a cloud, because it is that kind of channel
  g.fillStyle = '#ffd23f'
  g.beginPath()
  g.arc(w - 150, 120, 42, 0, 7)
  g.fill()
  g.fillStyle = '#f4f6fa'
  for (const [dx, dy, r] of [
    [-40, 20, 30],
    [-5, 10, 38],
    [30, 22, 28],
  ]) {
    g.beginPath()
    g.arc(w - 150 + dx, 130 + dy, r, 0, 7)
    g.fill()
  }
  g.fillRect(w - 190, 140, 90, 30)

  // five-day strip
  const days = [
    ['FRI', '59', '51', '#7fb3ff'],
    ['SAT', '61', '52', '#cfd6e0'],
    ['SUN', '57', '50', '#7fb3ff'],
    ['MON', '60', '53', '#cfd6e0'],
    ['TUE', '63', '54', '#ffd23f'],
  ]
  const y0 = 232
  g.fillStyle = 'rgba(0,0,0,.28)'
  g.fillRect(0, y0 - 14, w, 100)
  days.forEach(([d, hi, lo, c], i) => {
    const cx = 64 + i * ((w - 128) / 4)
    g.textAlign = 'center'
    g.fillStyle = '#ffffff'
    g.font = 'bold 15px sans-serif'
    g.fillText(d, cx, y0 + 8)
    g.fillStyle = c
    g.beginPath()
    g.arc(cx, y0 + 38, 13, 0, 7)
    g.fill()
    g.fillStyle = '#ffffff'
    g.font = 'bold 18px sans-serif'
    g.fillText(`${hi}°`, cx - 14, y0 + 76)
    g.fillStyle = '#cfe0ff'
    g.font = '15px sans-serif'
    g.fillText(`${lo}°`, cx + 16, y0 + 76)
  })

  // the crawl along the bottom
  g.fillStyle = '#c8102e'
  g.fillRect(0, h - 26, w, 26)
  g.fillStyle = '#ffffff'
  g.font = 'bold 14px sans-serif'
  g.textAlign = 'left'
  const crawl =
    'WIND WARNING IN EFFECT UNTIL 8 PM   ·   AIR QUALITY: GOOD   ·   ' +
    'THAMES: 4.1 M AT TOWER PIER   ·   TONIGHT: SHOWERS, LOW 51   ·   '
  const cw = g.measureText(crawl).width
  const off = (t * 60) % cw
  g.fillText(crawl + crawl, 8 - off, h - 8)
}
