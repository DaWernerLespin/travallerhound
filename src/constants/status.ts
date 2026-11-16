import type { DishStatus } from '@/features/dish-rating/types';

import { colors } from './theme';

type StatusLook = { label: string; short: string; color: string; background: string };

/** 3 colours: red, orange (unclear + likely safe), green only when the staff confirmed. */
export const STATUS_LOOK: Record<DishStatus, StatusLook> = {
  unsafe: { label: 'Nicht sicher', short: 'Risiko', color: colors.red, background: colors.redSoft },
  undefined: { label: 'Unklar – bitte nachfragen', short: 'Unklar', color: colors.orangeText, background: colors.orangeSoft },
  likely_safe: { label: 'Wahrscheinlich sicher – nachfragen', short: 'Nachfragen', color: colors.orangeText, background: colors.orangeSoft },
  safe: { label: 'Sicher – vom Personal bestätigt', short: 'Sicher', color: colors.green, background: colors.greenSoft },
};

/** Shown while a dish is still being checked: everything starts red. */
export const SCANNING_LOOK: StatusLook = { label: 'Wird geprüft', short: 'Prüfe …', color: colors.red, background: colors.redSoft };
