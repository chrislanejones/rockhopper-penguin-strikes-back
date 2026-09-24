import { Lobby } from './Lobby'
import { Theatre } from './Theatre'
import { Stage } from './Stage'
import { Speaker } from './Speaker'
import { Booth } from './Booth'
import { Tables } from './Tables'
import { Balcony } from './Balcony'
import { Boxes } from './Boxes'

/**
 * B2, in the order you would build it: the hall, the stage, the tables on
 * the floor, the balcony and the boxes on it, then the lobby you arrive
 * through.
 *
 * Same origin as the 23rd floor and the same lift, so nothing here has to
 * know it is underground except the lighting, which has no window to lean on.
 */
export function B2() {
  return (
    <>
      <Theatre />
      <Stage />
      <Speaker />
      <Tables />
      <Balcony />
      <Booth />
      <Boxes />
      <Lobby />
    </>
  )
}
