import type { ReactNode } from 'react'
import { FloorContext, type FloorId } from '../scene/floors'
import { useOffice } from '../state/store'

/**
 * One floor of the building.
 *
 * Every floor is built once and stays built; the one you are not on is just
 * not visible. three skips an invisible group entirely — no draw calls, and
 * its lights are not gathered — so this costs what one floor costs, and the
 * ride between them is instant rather than a rebuild.
 */
export function Floor({ id, children }: { id: FloorId; children: ReactNode }) {
  const here = useOffice((s) => s.floor) === id
  return (
    <FloorContext.Provider value={id}>
      <group visible={here}>{children}</group>
    </FloorContext.Provider>
  )
}
