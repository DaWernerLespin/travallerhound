/**
 * Switches for features that are built but not finished.
 * Off = hidden or greyed out in the UI; the code stays in place.
 */
export const FEATURES = {
  /** Read a menu photo with the camera (needs OCR, not built yet). Off = shown greyed out. */
  menuPhoto: false,
  /** Upload a menu image or PDF (needs OCR, not built yet). Off = hidden. */
  menuUpload: false,
} as const;
