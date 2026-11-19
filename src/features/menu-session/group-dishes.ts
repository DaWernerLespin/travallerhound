import type { DishRating, DishStatus } from '@/features/dish-rating/types';
import type { MenuItem } from '@/features/menu-input/types';

/** Safest first, like the former "Meine sichere Karte". */
const STATUS_RANK: Record<DishStatus, number> = { safe: 0, likely_safe: 1, undefined: 2, unsafe: 3 };

export type DishEntry = { item: MenuItem; number: number; status: DishStatus };
export type DishGroup = { title: string; entries: DishEntry[]; riskCount: number };

const NO_SECTION = 'Gerichte';

/**
 * Groups menu items by their menu section (in menu order) and sorts each group by risk, safest first.
 * `hideRisk` drops red dishes. `number` keeps the dish's position on the menu.
 */
export function groupDishes(items: MenuItem[], ratings: Record<string, DishRating>, hideRisk = false): DishGroup[] {
  const groups = new Map<string, DishGroup>();
  items.forEach((item, index) => {
    const status = ratings[item.id]?.status ?? 'undefined';
    const title = item.section ?? NO_SECTION;
    const group = groups.get(title) ?? { title, entries: [], riskCount: 0 };
    groups.set(title, group);
    if (status === 'unsafe') group.riskCount++;
    if (hideRisk && status === 'unsafe') return;
    group.entries.push({ item, number: index + 1, status });
  });
  for (const group of groups.values()) {
    group.entries.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.number - b.number);
  }
  return [...groups.values()].filter((group) => group.entries.length > 0);
}
