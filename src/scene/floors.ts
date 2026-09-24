import { createContext } from 'react'

/** The two stops the elevator makes. */
export type FloorId = '23' | 'b2'

/**
 * Which floor a component is being built on.
 *
 * Both floors are mounted at once, on the same footprint, and only one is
 * visible. Anything that registers itself outside the scene graph — a
 * collider, mostly — reads this so the floor you are not on cannot stop you
 * walking.
 */
export const FloorContext = createContext<FloorId>('23')

/** What the indicator over the doors says. */
export const FLOOR_LABEL: Record<FloorId, string> = { '23': '23', b2: 'B2' }
