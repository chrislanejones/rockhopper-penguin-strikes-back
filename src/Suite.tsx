import { Lighting } from './components/Lighting'
import { Shell } from './components/Shell'
import { DropCeiling } from './components/DropCeiling'
import { CurtainWall } from './components/CurtainWall'
import { Outside } from './components/Outside'
import { LiftLobby } from './components/LiftLobby'
import { Restrooms } from './components/Restrooms'
import { KanbanBoard, OnCallBoard } from './components/Whiteboards'
import { BreakArea } from './components/BreakArea'
import { BlockOne, BlockThree, BlockTwo } from './components/Cubicles'
import { Workstations } from './components/Workstations'
import { RecordsBay } from './components/RecordsBay'
import { Bookcases } from './components/Bookcases'
import { StorageCloset } from './components/StorageCloset'
import { StorageDoor } from './components/StorageDoor'
import { SAFE_AT, Safe } from './components/Safe'
import { Flag } from './components/Flag'
import { WaterCooler, ParliamentSign } from './components/WingCommons'
import { Calendar, IitsBanner, IitsPoster, LoneliestHousePrint } from './components/WallArt'
import { ComplianceBoard } from './components/ComplianceBoard'
import { Darts } from './components/Darts'
import {
  CorvettePoster, FoamBlaster, PrinterStation, RecordWall,
  WallpaperSamples,
} from './components/Extras'
import { Suspense, useEffect } from 'react'
import { Floor } from './components/Floor'
import { useOffice } from './state/store'
import { B2 } from './components/b2/B2'

/**
 * Floor 23 of the Rockhopper Building, in the order you would build it:
 * shell first, then services, then the people and their things.
 */
export function Suite() {
  return (
    <>
    <Floor id="23">
      <Lighting />

      {/* shell and services */}
      <Shell />
      <DropCeiling />
      <CurtainWall />
      <Outside />

      {/* the lift lobby, through the opening in the south wall, and off it */}
      <LiftLobby />
      <Restrooms />

      {/* suite side of the south wall */}
      <ParliamentSign />
      <KanbanBoard />
      <IitsPoster />

      {/* the two cubicle blocks and everyone in them */}
      <BlockOne />
      <BlockTwo />
      <BlockThree />
      <Workstations />
      <IitsBanner />
      <CorvettePoster />
      <RecordWall />
      <WallpaperSamples />

      {/* west wall */}
      <BreakArea />
      <Calendar />
      <ComplianceBoard />
      <PrinterStation />
      <FoamBlaster />
      <Darts />

      {/* the wing */}
      <OnCallBoard />
      <WaterCooler />
      <Bookcases />
      <RecordsBay />
      <Flag />

      {/* storage room 2301 */}
      <StorageDoor />
      <StorageCloset />
      <LoneliestHousePrint />
      <Safe x={SAFE_AT.x} z={SAFE_AT.z} />
    </Floor>

    {/* the elevator's other stop, built in the dark on the first ride down */}
    <Floor id="b2">
      <LazyB2 />
    </Floor>
    </>
  )
}

/**
 * B2 exists from the first ride down, not from boot.
 *
 * Both floors used to build at once, and the theatre was half the load bar
 * for a floor you might never visit. Now the lift asks for it when the doors
 * shut on a basement button, and it builds while the car is dark. `Built`
 * is the last thing inside the boundary, so its effect runs once the whole
 * floor has committed — the same trick Warmup uses on boot — and the lift
 * waits for that before it flips the floor under her.
 */
function LazyB2() {
  const b2 = useOffice((s) => s.b2)
  if (b2 === 'cold') return null
  return (
    <Suspense fallback={null}>
      <B2 />
      <Built />
    </Suspense>
  )
}

function Built() {
  const setB2 = useOffice((s) => s.setB2)
  useEffect(() => {
    setB2('ready')
  }, [setB2])
  return null
}
