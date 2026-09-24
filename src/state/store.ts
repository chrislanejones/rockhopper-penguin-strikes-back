import { create } from 'zustand'
import type { FloorId } from '../scene/floors'

/**
 * Where the lift is in its cycle.
 *
 * idle → opening → open (waiting for her to step in) → closing → riding
 * (the car is dark and the floor changes under it) → arriving → open → closing → idle.
 */
export type LiftPhase = 'idle' | 'opening' | 'open' | 'closing' | 'riding' | 'arriving'

/**
 * The stops the car makes. B1 is not a floor of its own — it is the B2
 * scene's mezzanine, and the car serves it through an upper mouth in the
 * same shaft.
 */
export type Stop = FloorId | 'b1'

interface OfficeState {
  /** The floor she is on. Both are built; this is the one that is visible. */
  floor: FloorId
  setFloor: (floor: FloorId) => void

  /** The lift's cycle, and where it has been asked to go. */
  lift: { phase: LiftPhase; to: Stop | null }
  setLift: (phase: LiftPhase, to: Stop | null) => void

  /** Which mouth of the B2 shaft the car is at: the lobby floor or the mezzanine. */
  liftServe: 'lower' | 'upper'
  setLiftServe: (liftServe: 'lower' | 'upper') => void

  /** The screen goes black while the car is between floors. */
  blackout: boolean
  setBlackout: (v: boolean) => void
  /**
   * B2 is not built until the first ride down. `cold` is the state you boot
   * in; `building` from the moment the doors shut on a basement button;
   * `ready` once React has committed the whole floor.
   */
  b2: 'cold' | 'building' | 'ready'
  setB2: (b2: 'cold' | 'building' | 'ready') => void

  /** Pointer is locked and the start card is dismissed. */
  locked: boolean
  setLocked: (v: boolean) => void

  /**
   * Start-up. Building the floor, then compiling its shaders and uploading
   * its textures, is several seconds on a laptop; this is what the bar on
   * the start card is showing. `ready` is when it will let you in.
   */
  progress: number
  stage: string
  ready: boolean
  setProgress: (progress: number, stage: string) => void
  setReady: () => void

  /** Transient message along the bottom of the screen. */
  hint: string
  hintVisible: boolean
  /** Who is talking, when the strip is a line of dialogue rather than narration. */
  hintWho: string | null
  showHint: (text: string, ms?: number, who?: string) => void
  /** Take the strip down now; given `text`, only if that is still what it says. */
  clearHint: (text?: string) => void

  /** Storage-room door. */
  doorOpen: boolean
  toggleDoor: () => void

  /**
   * What the player is carrying, by id.
   *
   * Separate from `pickup.ts`, which is about holding one object in your
   * hands and putting it down again. This is the set of things you have
   * collected and keep — it survives walking away, and the HUD lists it.
   */
  inventory: string[]
  collect: (id: string) => void

  /**
   * What is in the player's hands right now, by label.
   *
   * The object itself lives in `pickup.ts`, outside React, because it moves
   * every frame. This is just its name, so the HUD can say what you have hold
   * of without the carry loop touching state sixty times a second.
   */
  holding: string | null
  setHolding: (label: string | null) => void

  /**
   * The watch.
   *
   * T brings her left wrist up and the dial fills the screen, the way 007's
   * does: the office stays where it is, the camera narrows onto the face, and
   * the arrow keys turn its pages. `page` indexes `WATCH_PAGES`.
   */
  watch: { open: boolean; page: number }
  toggleWatch: () => void
  /** The next page (+1) or the one before it (-1). Wraps both ways. */
  turnWatch: (by: number) => void
  closeWatch: () => void
}

/** Dial, status, calendar, shortcuts, rendezvous. The arrow keys walk this ring. */
export const WATCH_PAGES = 5
/** The lift camera: last, so it is one press left of the dial. */
export const RENDEZVOUS_PAGE = 4

let hintTimer: ReturnType<typeof setTimeout> | undefined

export const useOffice = create<OfficeState>((set, get) => ({
  floor: '23',
  setFloor: (floor) => set({ floor }),

  lift: { phase: 'idle', to: null },
  setLift: (phase, to) => set({ lift: { phase, to } }),

  liftServe: 'lower',
  setLiftServe: (liftServe) => set({ liftServe }),

  blackout: false,
  setBlackout: (blackout) => set({ blackout }),
  b2: 'cold',
  setB2: (b2) => set({ b2 }),

  locked: false,
  setLocked: (locked) => set({ locked }),

  progress: 0.04,
  stage: 'Building the floor',
  ready: false,
  setProgress: (progress, stage) => set({ progress, stage }),
  setReady: () => set({ ready: true, progress: 1, stage: 'Ready' }),

  hint: '',
  hintVisible: false,
  hintWho: null,
  showHint: (text, ms = 2200, who) => {
    set({ hint: text, hintVisible: true, hintWho: who ?? null })
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => set({ hintVisible: false }), ms)
  },
  clearHint: (text) => {
    if (text !== undefined && get().hint !== text) return
    clearTimeout(hintTimer)
    set({ hintVisible: false })
  },

  holding: null,
  setHolding: (holding) => set({ holding }),

  // It always comes up on the face. Looking at your watch to find out what
  // time it is and getting last week's calendar is nobody's idea of a watch.
  watch: { open: false, page: 0 },
  toggleWatch: () =>
    set((s) => ({ watch: { open: !s.watch.open, page: 0 } })),
  turnWatch: (by) =>
    set((s) => ({
      watch: { ...s.watch, page: (s.watch.page + by + WATCH_PAGES) % WATCH_PAGES },
    })),
  closeWatch: () => set((s) => (s.watch.open ? { watch: { ...s.watch, open: false } } : s)),

  inventory: [],
  collect: (id) =>
    set((s) => (s.inventory.includes(id) ? s : { inventory: [...s.inventory, id] })),

  doorOpen: false,
  toggleDoor: () => {
    const open = !get().doorOpen
    set({ doorOpen: open })
    get().showHint(
      open
        ? 'Storage room. Not the stairwell — that would be too easy.'
        : 'Storage door shut.',
    )
  },
}))

/** Read-only snapshot for per-frame code that must not subscribe. */
export const office = () => useOffice.getState()

/** Is this in the player's inventory? For click handlers, not for render. */
export const carrying = (id: string) => useOffice.getState().inventory.includes(id)

/**
 * Values read every frame by more than one system.
 *
 * Deliberately outside the store: the door angle changes on every frame while
 * it swings, and pushing that through React state would re-render the suite.
 */
export const live = {
  /** Current storage-door swing, radians. 0 shut, about -1.95 open. */
  doorAngle: 0,
  /** How far the lift doors are open, 0 shut to 1 wide. */
  liftDoors: 0,
  /** The stage traveler: 0 closed across the stage, 1 drawn open to the sides. */
  curtain: 0,
  /** Where the booth's buttons last asked it to go; the stage eases toward it. */
  curtainTarget: 0,
  /**
   * Frames of shadow-map redraw still owed. The sun never moves and nearly
   * nothing that casts does, so the map is redrawn only when something asks:
   * a door swinging, the lift leaves, a dart in flight, whatever is in your
   * hand. Walking costs no shadow passes at all — the camera is not a caster.
   */
  shadows: 2,
}

/** Something that casts a shadow moved: redraw the map on the next frames. */
export function stirShadows(frames = 2) {
  live.shadows = Math.max(live.shadows, frames)
}
