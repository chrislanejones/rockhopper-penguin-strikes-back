import { RENDEZVOUS_PAGE, useOffice } from '../../state/store'
import { Watch } from './Watch'

/** What each collectable looks like in the corner, and what it is called. */
const ITEMS: Record<string, { glyph: string; name: string }> = {
  'safe-key': { glyph: '🔑', name: 'Small brass key' },
  'gas-card': { glyph: '⛽', name: '£5 fuel card' },
}

export function Hud() {
  const hint = useOffice((s) => s.hint)
  const visible = useOffice((s) => s.hintVisible)
  const who = useOffice((s) => s.hintWho)
  // the one page of the watch that talks: the strip comes up over the case for it
  const talking = useOffice((s) => s.watch.open && s.watch.page === RENDEZVOUS_PAGE)
  const inventory = useOffice((s) => s.inventory)
  const holding = useOffice((s) => s.holding)
  const blackout = useOffice((s) => s.blackout)
  const watch = useOffice((s) => s.watch.open)

  // The strip is up whenever you have anything — in your hands or your pocket.
  // The watch covers the screen and lists it all itself, so while that is up
  // the corners are cleared: no crosshair to aim with, nothing to carry with.
  const show = !watch && (holding !== null || inventory.length > 0)

  return (
    <div className="hud">
      {!watch && <div className="crosshair" />}
      <div className={visible && (!watch || talking) ? (talking ? 'hint show over' : 'hint show') : 'hint'}>
        {who && (
          <b className="hint-who" data-who={who}>
            {who}
          </b>
        )}
        {hint}
      </div>

      {show && (
        <div className="inventory">
          <div className="inventory-title">Carrying</div>
          {holding && (
            <div className="item in-hand">
              <span className="item-glyph">✋</span>
              <span className="item-name">{holding}</span>
              <span className="item-note">in hand</span>
            </div>
          )}
          {inventory.map((id) => {
            const item = ITEMS[id] ?? { glyph: '❔', name: id }
            return (
              <div className="item" key={id}>
                <span className="item-glyph">{item.glyph}</span>
                <span className="item-name">{item.name}</span>
              </div>
            )
          })}
        </div>
      )}

      <Watch />

      {/* the lift between floors */}
      <div className={blackout ? 'blackout on' : 'blackout'} />
    </div>
  )
}
