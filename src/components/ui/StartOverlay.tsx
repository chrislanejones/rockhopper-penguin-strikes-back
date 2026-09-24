import type { ReactNode } from 'react'
import { Keycap } from 'keycap'
import { useOffice } from '../../state/store'

/**
 * One key on the card.
 *
 * `k` is what `event.key` reports, so a letter is lower case — you press W
 * unshifted — Space is a space, and Esc is "Escape". The cap dips while the
 * key is held, which is the whole point of drawing them as keys: press W
 * with the card up and you can see it is the right one. Mouse buttons have
 * no key event, so those caps never dip; they are still caps so the row
 * reads the same as the others.
 */
function Cap({ k, wide, children }: { k: string; wide?: boolean; children: ReactNode }) {
  return (
    <Keycap activeKey={k} className={wide ? 'wide' : undefined}>
      {children}
    </Keycap>
  )
}

/** A legend row: the keys, then what they do. */
function Row({ keys, children }: { keys: ReactNode; children: ReactNode }) {
  return (
    <>
      <div className="keys">{keys}</div>
      <div className="does">{children}</div>
    </>
  )
}

/**
 * The card you click to enter. Clicking asks for pointer lock; the lock change
 * event is what actually hides this, so a denied lock leaves the card up.
 *
 * It is a legend, not a paragraph: keys down the left, one line each on the
 * right, in the order you will want them.
 */
export function StartOverlay({ canvas }: { canvas: HTMLCanvasElement | null }) {
  const locked = useOffice((s) => s.locked)
  const ready = useOffice((s) => s.ready)
  const progress = useOffice((s) => s.progress)
  const stage = useOffice((s) => s.stage)
  if (locked) return null

  const pct = Math.round(progress * 100)

  return (
    <div
      className={ready ? 'start ready' : 'start'}
      onClick={() => ready && canvas?.requestPointerLock()}
    >
      <div className="card">
        <h1>IITS 2026</h1>

        <div className="legend">
          <Row
            keys={
              <>
                <Cap k="w">W</Cap>
                <Cap k="a">A</Cap>
                <Cap k="s">S</Cap>
                <Cap k="d">D</Cap>
              </>
            }
          >
            Walk
          </Row>
          <Row keys={<Cap k="mouse" wide>Mouse</Cap>}>Look</Row>
          <Row
            keys={
              <>
                <Cap k="q">Q</Cap>
                <span className="or">or</span>
                <Cap k="Shift" wide>Shift</Cap>
              </>
            }
          >
            Run
          </Row>

          <Row keys={<Cap k="click" wide>Click</Cap>}>Pick up, put down, fire the blaster</Row>
          <Row
            keys={
              <>
                <Cap k="Shift" wide>Shift</Cap>
                <span className="or">+</span>
                <Cap k="click" wide>Click</Cap>
              </>
            }
          >
            Throw, or drop the blaster
          </Row>
          <Row keys={<Cap k=" " wide>Space</Cap>}>Open what you are looking at, or jump</Row>
          <Row keys={<Cap k="click" wide>Click</Cap>}>Elevator and vending buttons</Row>
          <Row keys={<Cap k="t">T</Cap>}>Check your watch</Row>
          <Row
            keys={
              <>
                <Cap k="ArrowLeft">◀</Cap>
                <Cap k="ArrowRight">▶</Cap>
              </>
            }
          >
            Turn the watch's pages: time, keys, lift camera
          </Row>
          <Row keys={<Cap k="Escape" wide>Esc</Cap>}>Release the mouse</Row>
        </div>

        {ready ? (
          <small>Click anywhere to enter</small>
        ) : (
          <div className="load" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="load-bar">
              <div className="load-fill" style={{ width: `${pct}%` }} />
            </div>
            <small>
              {stage} &nbsp;·&nbsp; {pct}%
            </small>
          </div>
        )}
      </div>
    </div>
  )
}
