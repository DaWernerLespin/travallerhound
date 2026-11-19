import type { MenuItem } from './types';

/** German line under the French dish name. */
export function germanLabel(item: MenuItem): string {
  if (item.generic) return `Oberbegriff: ${item.generic.meaning}`;
  return item.match?.dish.de ?? 'Unbekanntes Gericht';
}
