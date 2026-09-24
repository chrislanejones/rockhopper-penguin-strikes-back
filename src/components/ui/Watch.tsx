import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RENDEZVOUS_PAGE, useOffice, WATCH_PAGES } from '../../state/store'
import { Rendezvous } from './Rendezvous'

/**
 * The watch, filling the screen.
 *
 * T brings her left wrist up (`lib/avatar.ts` does the arm) and the camera
 * narrows onto the dial; this is what you read once it gets there. It is the
 * GoldenEye watch: a black case with a ring of coloured segments round a green
 * screen, a page at a time, arrow keys to turn them and a button to get out.
 * The case is 007's; what is on the glass is a smartwatch: round on every
 * page, a face first that takes all of it, then square cards in the middle.
 *
 * Nothing here is 3D. The dial is a DOM overlay drawn over the frozen office,
 * because the screen is small text and small text on a 0.9 inch cylinder in
 * the corner of the view is a smudge. The zoom sells it: the FOV closes from
 * 70 to 34 while this scales up out of the bottom of the frame, so the office
 * behind the case is the same office, a foot away.
 */

/** Pages, in the order the arrow keys walk them. Must match `WATCH_PAGES`. */
const PAGES = ['WATCH FACE', 'STATUS', 'CALENDAR', 'SHORTCUTS', 'RENDEZVOUS'] as const

/**
 * The day the building is on: Wednesday 16 September 2026, day one of IITS.
 * The same date the wall calendar in the break room is turned to, and the
 * reason there is a gala in B2 and nobody upstairs.
 *
 * The *time* is your own clock. A watch that tells you the wrong time is a
 * bracelet.
 */
const SCENE_DATE = 'WED 16 SEP 2026'
/** The day of the month on its own, for the date window and the calendar. */
const SCENE_DAY = 16

/** September 2026 starts on a Tuesday, so day d sits at grid slot d + 1. */
const MONTH_OFFSET = 2
const DAYS_IN_MONTH = 30

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The ring of segments round the case.
 *
 * Left half warm, top down: red through orange to yellow. Right half cold:
 * blue going to navy and then to nearly nothing. Two gaps, at 12 and at 6,
 * for the pushers and the stem.
 */
function bezelTicks() {
  const N = 40
  const out: { key: number; rot: number; fill: string }[] = []
  for (let i = 0; i < N; i++) {
    // degrees clockwise from 12, which is where the first segment would sit
    const rot = i * (360 / N)
    // how far round from the top, either way: 0 at 12, 180 at 6
    const from12 = rot <= 180 ? rot : 360 - rot
    // the gaps: straight up and straight down
    if (from12 < 11 || from12 > 169) continue
    const t = from12 / 180
    out.push({
      key: i,
      rot,
      fill:
        rot > 180
          ? `hsl(${8 + t * 44} 92% ${46 + t * 9}%)`
          : `hsl(${226 - t * 10} ${72 - t * 34}% ${44 - t * 31}%)`,
    })
  }
  return out
}

/** One key and what it does, for the shortcuts page. */
function Key({ k, children }: { k: string; children: ReactNode }) {
  return (
    <>
      <span className="wkey">{k}</span>
      <span className="wdoes">{children}</span>
    </>
  )
}

/**
 * The minute track: sixty ticks, longer at the hours, longest at the
 * quarters. `r` is how far in from the center the tick stops, in dial units.
 */
const TRACK = Array.from({ length: 60 }, (_, i) => ({
  i,
  cls: i % 15 === 0 ? 'wq' : i % 5 === 0 ? 'wh' : 'wm',
  r: i % 15 === 0 ? 78 : i % 5 === 0 ? 82 : 89,
}))

/**
 * The numerals, sat on a ring inside the track. Eleven of them: the 3 gives
 * its place to the date window, the way it does on any watch with one.
 */
const NUMERALS = Array.from({ length: 12 }, (_, i) => {
  const a = ((i + 1) * Math.PI) / 6
  return { n: i + 1, x: 100 + 68 * Math.sin(a), y: 100 - 68 * Math.cos(a) }
}).filter((d) => d.n !== 3)

/**
 * Page 1: the dial, the whole screen of it, off your own clock. Above the 6,
 * where a real watch says where it was made, this one says which clock it
 * keeps, and under that how to get to the other pages.
 */
function Dial({ now }: { now: Date }) {
  const sec = now.getSeconds()
  const min = now.getMinutes()
  // the hands, in degrees from 12
  const hour = ((now.getHours() % 12) + min / 60) * 30
  const minute = (min + sec / 60) * 6
  const second = sec * 6

  return (
    <svg className="wdial" viewBox="0 0 200 200" aria-hidden="true">
      {TRACK.map((t) => (
        <line
          key={t.i}
          x1="100"
          y1="7"
          x2="100"
          y2={100 - t.r}
          className={t.cls}
          transform={`rotate(${t.i * 6} 100 100)`}
        />
      ))}
      {NUMERALS.map((d) => (
        <text key={d.n} x={d.x} y={d.y} className="wnum">
          {d.n}
        </text>
      ))}

      {/* the date window, where the 3 would be */}
      <rect x="152" y="91.5" width="23" height="17" rx="2" className="wdate-win" />
      <text x="163.5" y="100" className="wdate-day">
        {SCENE_DAY}
      </text>

      <text x="100" y="137" className="wzone">
        ISLAND TIME ZONE
      </text>
      <text x="100" y="147" className="whint">
        PRESS LEFT AND RIGHT ARROWS
      </text>

      {/* the hands go over the words, as they do on any watch with words on it */}
      <line
        x1="100"
        y1="112"
        x2="100"
        y2="54"
        className="whand hr"
        transform={`rotate(${hour} 100 100)`}
      />
      <line
        x1="100"
        y1="112"
        x2="100"
        y2="20"
        className="whand mn"
        transform={`rotate(${minute} 100 100)`}
      />
      <line
        x1="100"
        y1="118"
        x2="100"
        y2="14"
        className="wsec"
        transform={`rotate(${second} 100 100)`}
      />
      <circle cx="100" cy="100" r="4" className="wpin" />
    </svg>
  )
}

/** Page 2: the time in figures, the date, and where you are up to. */
function Status({ now }: { now: Date }) {
  const floor = useOffice((s) => s.floor)
  const holding = useOffice((s) => s.holding)
  const inventory = useOffice((s) => s.inventory)

  const h = now.getHours()
  const hr12 = h % 12 || 12
  const sec = now.getSeconds()
  const min = now.getMinutes()

  const key = inventory.includes('safe-key')
  const card = inventory.includes('gas-card')

  return (
    <div className="wstat">
      <div className="wread">
        <div className="wtime">
          {hr12}:{pad(min)}
          <span className="wsecs">:{pad(sec)}</span>
          <span className="wmer">{h < 12 ? 'AM' : 'PM'}</span>
        </div>
        <div className="wdate">{SCENE_DATE}</div>
      </div>

      <div className="wwhere">
        {floor === 'b2' ? 'B2 · BALLROOM LEVEL' : '23RD FLOOR · SUITE 2300'} · 1111 E BROAD
      </div>

      <div className="wstatus">
        <div className="wstatus-title">
          MISSION STATUS: {key && card ? 'COMPLETE' : 'INCOMPLETE'}
        </div>
        <div className={key ? 'wobj done' : 'wobj'}>
          {key ? '▣' : '▢'} RECOVER THE 2301 KEY
        </div>
        <div className={card ? 'wobj done' : 'wobj'}>
          {card ? '▣' : '▢'} OPEN THE SAFE IN STORAGE
        </div>
        <div className="wobj hands">
          ▸ HANDS: {(holding ?? 'empty').toUpperCase()}
        </div>
      </div>
    </div>
  )
}

/** Page 3: September, and what is on downstairs. */
function Calendar() {
  const floor = useOffice((s) => s.floor)

  return (
    <div className="wcal">
      <div className="wmonth">SEPTEMBER 2026</div>
      <div className="wgrid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span className="wdow" key={i}>
            {d}
          </span>
        ))}
        {Array.from({ length: MONTH_OFFSET }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
          const d = i + 1
          const cls = d === SCENE_DAY ? 'wday today' : d === SCENE_DAY + 1 ? 'wday next' : 'wday'
          return (
            <span className={cls} key={d}>
              {d}
            </span>
          )
        })}
      </div>

      <div className="wevents">
        <div className="wevent">
          <span className="wwhen">16 SEP 08:00</span>
          <span className="wwhat">IITS DAY ONE · DENSTONE HALL</span>
        </div>
        <div className="wevent now">
          <span className="wwhen">16 SEP 18:30</span>
          <span className="wwhat">
            AWARDS GALA · B2 BALLROOM
            <em>{floor === 'b2' ? ' ◂ HERE' : ' ◂ NOW'}</em>
          </span>
        </div>
        <div className="wevent">
          <span className="wwhen">17 SEP 09:00</span>
          <span className="wwhat">IITS DAY TWO · KEYNOTE 09:30</span>
        </div>
      </div>
    </div>
  )
}

/** Page 4: every key, because this is where you will look for them. */
function Shortcuts() {
  return (
    <div className="wkeys">
      <Key k="W A S D">Walk · Q or SHIFT runs</Key>
      <Key k="MOUSE">Look · the crosshair aims</Key>
      <Key k="CLICK">Pick up, set down, press</Key>
      <Key k="SHIFT+CLICK">Throw what you hold</Key>
      <Key k="SPACE">Open a door, or jump</Key>
      <Key k="T">This watch, up and down</Key>
      <Key k="◀ ▶">Turn these pages</Key>
      <Key k="ESC">Release the mouse</Key>
    </div>
  )
}

export function Watch() {
  const open = useOffice((s) => s.watch.open)
  const page = useOffice((s) => s.watch.page)
  const turnWatch = useOffice((s) => s.turnWatch)
  const toggleWatch = useOffice((s) => s.toggleWatch)

  const ticks = useMemo(bezelTicks, [])
  const [now, setNow] = useState(() => new Date())
  /** Which of the three pads is lit: the key you are holding presses it. */
  const [lit, setLit] = useState<string | null>(null)

  // The clock only ticks while you are looking at it.
  useEffect(() => {
    if (!open) return
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [open])

  // The pads light under the key that works them. Player.tsx owns what the
  // keys *do* while the watch is up; this is only the lamp.
  useEffect(() => {
    if (!open) {
      setLit(null)
      return
    }
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') setLit('left')
      else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') setLit('right')
      else if (e.code === 'KeyT' || e.code === 'Backspace') setLit('exit')
    }
    const up = () => setLit(null)
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
    }
  }, [open])

  return (
    <div className={open ? 'watch up' : 'watch'} aria-hidden={!open}>
      <div className="watch-case">
        <svg className="watch-bezel" viewBox="0 0 400 400" aria-hidden="true">
          <defs>
            <radialGradient id="wcase" cx="0.38" cy="0.3" r="0.85">
              <stop offset="0" stopColor="#2b3038" />
              <stop offset="0.65" stopColor="#16191e" />
              <stop offset="1" stopColor="#05070a" />
            </radialGradient>
          </defs>
          {/* the strap, running off the top and bottom of the frame */}
          <rect x="128" y="-70" width="144" height="120" rx="14" className="wstrap" />
          <rect x="128" y="350" width="144" height="120" rx="14" className="wstrap" />
          {/* the two pushers at 12 and the stem at 6 */}
          <rect x="166" y="2" width="26" height="16" rx="4" className="wpush" />
          <rect x="208" y="2" width="26" height="16" rx="4" className="wpush" />
          <rect x="186" y="382" width="28" height="16" rx="4" className="wpush" />
          <circle cx="200" cy="200" r="196" fill="url(#wcase)" />
          <circle cx="200" cy="200" r="196" className="wcase-edge" />
          {ticks.map((t) => (
            <rect
              key={t.key}
              x="195"
              y="22"
              width="10"
              height="36"
              rx="2"
              fill={t.fill}
              transform={`rotate(${t.rot} 200 200)`}
            />
          ))}
          <circle cx="200" cy="200" r="142" className="wscreen-well" />
        </svg>

        {/*
          The glass is round on every page. The dial has all of it; the other
          pages are a square card in the middle, with the page's name in the
          sliver of glass above the card and the dots in the sliver below.
        */}
        <div
          className={
            page === 0 ? 'watch-screen face' : page === RENDEZVOUS_PAGE ? 'watch-screen feed' : 'watch-screen'
          }
        >
          <div className="wtop">
            {PAGES[page]} · {page + 1}/{WATCH_PAGES}
          </div>

          <div className="wpanel">
            {page === 0 && <Dial now={now} />}
            {page === 1 && <Status now={now} />}
            {page === 2 && <Calendar />}
            {page === 3 && <Shortcuts />}
            {page === RENDEZVOUS_PAGE && <Rendezvous now={now} />}
          </div>

          <div className="wbot">
            <div className="wdots">
              {PAGES.map((_, i) => (
                <span className={i === page ? 'wdot on' : 'wdot'} key={i} />
              ))}
            </div>
            <span className="wmodel">PH-Q WATCH v2.3</span>
          </div>

          {/* the glass: scanlines and a highlight across the corner */}
          <div className="wscan" />
          <div className="wglass" />
        </div>

        <button
          className={lit === 'left' ? 'wpad left on' : 'wpad left'}
          onClick={() => turnWatch(-1)}
          tabIndex={-1}
        >
          ◀
        </button>
        <button
          className={lit === 'right' ? 'wpad right on' : 'wpad right'}
          onClick={() => turnWatch(1)}
          tabIndex={-1}
        >
          ▶
        </button>
        <button
          className={lit === 'exit' ? 'wpad exit on' : 'wpad exit'}
          onClick={() => toggleWatch()}
          tabIndex={-1}
        >
          EXIT <b>T</b>
        </button>
      </div>
    </div>
  )
}
