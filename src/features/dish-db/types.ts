export type Allergen = 'peanut' | 'lupin';

export const ALLERGENS: readonly Allergen[] = ['peanut', 'lupin'];

/** none = not expected, hidden = possible but not stated (country-specific), contains = present. */
export type RiskLevel = 'none' | 'hidden' | 'contains';

export type Ingredient = {
  id: string;
  fr: string;
  de: string;
  /** Extra French spellings/forms used for matching (normalised on load). */
  aliases: string[];
  risk: Record<Allergen, RiskLevel>;
  /** German explanation shown when risk is hidden/contains. */
  note?: string;
};

export type Dish = {
  id: string;
  fr: string;
  de: string;
  aliases: string[];
  /** Short German description. */
  description: string;
  ingredientIds: string[];
};
