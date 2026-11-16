import type { Allergen, Dish, Ingredient, RiskLevel } from '@/features/dish-db/types';

export type DishStatus = 'unsafe' | 'undefined' | 'likely_safe' | 'safe';

/** Where a piece of evidence comes from – shown to the user for transparency. */
export type FindingSource = 'db' | 'menu' | 'name' | 'staff';

export type Finding = {
  source: FindingSource;
  level: RiskLevel | 'unknown';
  allergen?: Allergen;
  ingredient?: Ingredient;
  /** German text for the detail screen. */
  text: string;
};

/** What the staff answered. `unasked` = no answer yet. */
export type StaffAnswer = 'unasked' | 'absent' | 'present' | 'unknown';

export type StaffVerdict = {
  peanut: StaffAnswer;
  lupin: StaffAnswer;
  /** absent = no cross-contamination, present = contamination possible. */
  crossContamination: StaffAnswer;
  /** Answers to ingredient-specific questions (e.g. "fries fried in peanut oil?"). */
  ingredients: Record<string, StaffAnswer>;
};

export const EMPTY_VERDICT: StaffVerdict = {
  peanut: 'unasked',
  lupin: 'unasked',
  crossContamination: 'unasked',
  ingredients: {},
};

/** Everything the rating needs about one dish on the menu. */
export type RatingInput = {
  dbDish?: Dish;
  /** Resolved ingredients of dbDish. */
  dbIngredients: Ingredient[];
  menuIngredients: Ingredient[];
  unknownMenuItems: string[];
  nameIngredients: Ingredient[];
};

export type DishRating = {
  status: DishStatus;
  /** One German sentence naming the cause. */
  reason: string;
  findings: Finding[];
  /** Short German check labels, shown one after another while scanning. */
  checks: string[];
};
