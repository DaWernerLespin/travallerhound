import type { DishStatus } from '@/features/dish-rating/types';

import { colors } from './theme';

type StatusLook = { label: string; short: string; color: string; background: string };

/** Red = risk, orange = unclear, light green = likely safe (still ask), strong green only when the staff confirmed. */
export const STATUS_LOOK: Record<DishStatus, StatusLook> = {
  unsafe: { label: 'Nicht sicher', short: 'Risiko', color: colors.red, background: colors.redSoft },
  undefined: { label: 'Unklar, bitte nachfragen', short: 'Unklar', color: colors.orangeText, background: colors.orangeSoft },
  likely_safe: { label: 'Wahrscheinlich sicher, bitte nachfragen', short: 'Nachfragen', color: colors.lightGreenText, background: colors.lightGreenSoft },
  safe: { label: 'Sicher, vom Personal bestätigt', short: 'Sicher', color: colors.green, background: colors.greenSoft },
};

/** Shown while a dish is still being checked: everything starts red. */
export const SCANNING_LOOK: StatusLook = { label: 'Wird geprüft', short: 'Prüfe …', color: colors.red, background: colors.redSoft };
