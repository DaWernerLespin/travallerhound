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

/** A menu entry that names a category, not a dish (e.g. "Accompagnements"). */
export type GenericTerm = {
  id: string;
  fr: string;
  /** German meaning, e.g. "Beilagen". */
  meaning: string;
  aliases: string[];
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
