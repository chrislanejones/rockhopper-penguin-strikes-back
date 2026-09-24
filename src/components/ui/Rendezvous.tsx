import { useEffect, useRef } from 'react'
import { useOffice } from '../../state/store'
import { LIFT_CAM_SIZE, liftCam } from '../LiftCam'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Page 5: the rendezvous. The lift camera's picture of the man by the
 * buttons (LiftCam.tsx paints it), stamped the way a security feed is. What
 * the two of them say to each other is said in the car (lib/talk.ts).
 */
export function Rendezvous({ now }: { now: Date }) {
  const floor = useOffice((s) => s.floor)
  const serve = useOffice((s) => s.liftServe)
  const riding = useOffice((s) => s.lift.phase === 'riding')
  const screen = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    liftCam.screen = screen.current
    return () => {
      liftCam.screen = null
    }
  }, [])

  const car = riding ? '· · ·' : floor === '23' ? '23' : serve === 'upper' ? 'B1' : 'B2'

  return (
    <div className="wfeed">
      <div className="wfeed-wait">ACQUIRING</div>
      <canvas ref={screen} width={LIFT_CAM_SIZE} height={LIFT_CAM_SIZE} />
      <span className="wfeed-tag rec">
        <i>●</i> REC
      </span>
      <span className="wfeed-tag cam">LIFT · CAM 2</span>
      <span className="wfeed-tag car">CAR ▸ {car}</span>
      <span className="wfeed-tag clock">
        {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
      </span>
    </div>
  )
}
