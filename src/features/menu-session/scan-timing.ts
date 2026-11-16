/** Timing of the "everything starts red" scan animation on the analysis screen. */

const SECONDS_PER_DISH = 0.35;
const MIN_SECONDS = 4;
const MAX_SECONDS = 9;

export function scanDuration(dishCount: number): number {
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, dishCount * SECONDS_PER_DISH));
}

/** Second at which dish `index` gets its rating (dishes resolve top to bottom). */
export function revealAt(index: number, dishCount: number): number {
  return ((index + 1) / dishCount) * scanDuration(dishCount);
}

/** Which check label to show while the dish is still being scanned. */
export function checkIndex(elapsed: number, checkCount: number): number {
  return Math.floor(elapsed / 0.6) % Math.max(1, checkCount);
}
