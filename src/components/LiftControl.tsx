import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CAR } from '../scene/constants'
import { warm } from '../lib/warm'
import { startTalk } from '../lib/talk'
import { live, office, stirShadows, type LiftPhase, type Stop } from '../state/store'
import { player } from './Player'

/** Seconds the open car waits, empty, before the doors give up. */
const WAIT = 6
/** The ride: how long the car is dark. */
const RIDE = 2.4
/** How far into the ride the floor changes underneath. */
const FLIP_AT = 0.7
/** Seconds the doors take to open or close. */
const DOOR_TIME = 1.2

/** Top to bottom: 23 over B1 over B2. */
const ORDER: Record<Stop, number> = { '23': 2, b1: 1, b2: 0 }

const ARRIVED: Record<Stop, string> = {
  '23': '23. Back where you started.',
  b1: 'B1. The balcony is across the bridge.',
  b2: 'B2. The theatre is through the lobby.',
}

/** Where she is standing counts as a stop: the mezzanine is B1. */
const stopUnderHer = (): Stop =>
  office().floor === '23' ? '23' : player.y > 4 ? 'b1' : 'b2'

/**
 * The lift's cycle, one step per frame.
 *
 * Lives outside either floor's elevator because every mouth of the shaft
 * draws the same car: this is the one thing that decides where the doors
 * are and which floor is outside them. A call only opens the doors — the
 * ride starts when she presses a button on the car panel. The floor changes
 * while the car is dark, and the shaders for the new floor's lights are
 * compiled in that dark too, so the first frame down there is a frame, not
 * a hitch. Riding to or from B1 also moves her eight feet in y, because B1
 * is the same scene one storey up.
 */
export function LiftControl() {
  const clock = useRef(0)
  const since = useRef(0)
  const flipped = useRef(false)
  const warmIn = useRef(-1)
  const warmed = useRef(false)
  const wasIn = useRef(false)
  const stopTalk = useRef<(() => void) | null>(null)

  useFrame((_, delta) => {
    const dt = Math.max(0, Math.min(delta, 0.05))
    clock.current += dt
    const s = office()
    const { phase, to } = s.lift

    // Doors: toward open in the phases that want them open, shut otherwise.
    const target = phase === 'opening' || phase === 'open' || phase === 'arriving' ? 1 : 0
    const step = Math.min(Math.abs(target - live.liftDoors), dt / DOOR_TIME)
    live.liftDoors += Math.sign(target - live.liftDoors) * step
    if (step > 0) stirShadows()

    const inCar =
      player.x > CAR.x0 && player.x < CAR.x1 && player.z > CAR.z0 + 0.4 && player.z < CAR.z1
    const elapsed = clock.current - since.current
    const go = (next: LiftPhase, dest: Stop | null) => {
      since.current = clock.current
      s.setLift(next, dest)
    }

    // The man by the buttons talks from the moment she steps in past the
    // open doors until she steps out or presses one. Arriving does not
    // count as stepping in: she was in the car the whole ride.
    if (inCar && !wasIn.current && (phase === 'opening' || phase === 'open')) {
      stopTalk.current = startTalk()
    } else if (stopTalk.current && (!inCar || phase === 'closing' || phase === 'riding')) {
      stopTalk.current()
      stopTalk.current = null
    }
    wasIn.current = inCar

    // A frame after the floor flipped, React has committed the visibility
    // change, and the compile sees the right lights.
    if (warmIn.current >= 0 && warmIn.current-- === 0) {
      warm()
      warmed.current = true
    }

    switch (phase) {
      case 'opening':
        if (live.liftDoors >= 0.999) go('open', null)
        break

      case 'open':
        // Hold while she is in the car reading the buttons; close a beat
        // after she leaves, or when it is clear nobody is coming.
        if (inCar) since.current = clock.current
        else if (elapsed > WAIT) go('closing', null)
        break

      case 'closing':
        if (live.liftDoors <= 0.001) {
          if (to && inCar) {
            go('riding', to)
            s.setBlackout(true)
            flipped.current = false
            warmed.current = false
            const down = ORDER[to] < ORDER[stopUnderHer()]
            // The first ride down builds the theatre in the dark. Say so,
            // because the dark lasts longer than a ride.
            if (to !== '23' && s.b2 === 'cold') {
              s.setB2('building')
              s.showHint('Going down. The theatre is being built on the way — a moment.', 6000)
            } else {
              s.showHint(down ? 'Going down.' : 'Going up.', 2000)
            }
          } else {
            // nothing pressed, or she pressed and stepped out: nobody rides
            go('idle', null)
          }
        }
        break

      case 'riding': {
        // Down is only possible once the floor exists; up needs nothing.
        const there = to === '23' || s.b2 === 'ready'
        if (!flipped.current && elapsed > FLIP_AT && to && there) {
          flipped.current = true
          s.setFloor(to === '23' ? '23' : 'b2')
          s.setLiftServe(to === 'b1' ? 'upper' : 'lower')
          // B1 is the same scene a storey up: the dark is where she gains it
          player.y = to === 'b1' ? 8 : 0
          // three frames on: React has committed the new floor's visibility by then
          warmIn.current = 3
        }
        // The dark ends when the ride is over AND the new floor is flipped
        // and compiled — on the first ride down that is whichever is later.
        if (elapsed > RIDE && flipped.current && warmed.current) {
          s.setBlackout(false)
          if (to) s.showHint(ARRIVED[to], 3200)
          go('arriving', null)
        }
        break
      }

      case 'arriving':
        if (live.liftDoors >= 0.999) go('open', null)
        break

      case 'idle':
        break
    }
  })

  return null
}
