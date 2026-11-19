import { ALLERGENS, type Ingredient, type RiskLevel } from '@/features/dish-db/types';

import type { RatingInput } from './types';

export type IngredientEntry = {
  key: string;
  label: string;
  /** Worst risk of the ingredient for peanut or lupin; 'unknown' = not in our database. */
  level: RiskLevel | 'unknown';
  /** Named on the menu (otherwise only typical for the dish). */
  onMenu: boolean;
};

const RANK = { contains: 0, unknown: 1, hidden: 2, none: 3 } as const;

/** One list of all ingredients of a dish (menu + typical recipe), risky ones first. */
export function dishIngredients(input: RatingInput): IngredientEntry[] {
  const entries = new Map<string, IngredientEntry>();
  const add = (ingredient: Ingredient, onMenu: boolean) => {
    const existing = entries.get(ingredient.id);
    if (existing) {
      existing.onMenu ||= onMenu;
      return;
    }
    entries.set(ingredient.id, { key: ingredient.id, label: ingredient.de, level: worstRisk(ingredient), onMenu });
  };
  input.menuIngredients.forEach((ingredient) => add(ingredient, true));
  input.nameIngredients.forEach((ingredient) => add(ingredient, true));
  input.dbIngredients.forEach((ingredient) => add(ingredient, false));
  input.unknownMenuItems.forEach((label) =>
    entries.set(`unknown-${label}`, { key: `unknown-${label}`, label, level: 'unknown', onMenu: true }),
  );
  return [...entries.values()].sort((a, b) => RANK[a.level] - RANK[b.level]);
}

function worstRisk(ingredient: Ingredient): RiskLevel {
  const levels = ALLERGENS.map((allergen) => ingredient.risk[allergen]);
  if (levels.includes('contains')) return 'contains';
  if (levels.includes('hidden')) return 'hidden';
  return 'none';
}
