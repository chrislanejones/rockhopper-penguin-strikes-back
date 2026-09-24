/**
 * A hook for the lift to pull between floors.
 *
 * Shader programs are keyed on the lights in view, and each floor has its
 * own. `Warmup` compiles everything for the floor you start on and hands the
 * routine over here; the lift calls it again while the car is dark, so the
 * first frame on the new floor is not the frame that compiles for it.
 */
let warmer: (() => void) | null = null

export function setWarmer(fn: (() => void) | null) {
  warmer = fn
}

export function warm() {
  warmer?.()
}
