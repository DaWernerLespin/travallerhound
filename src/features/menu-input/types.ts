import type { DishMatch } from '@/features/dish-db/knowledge';
import type { GenericTerm, Ingredient } from '@/features/dish-db/types';

export type MenuTag = 'vegetarian';

/** One dish as it appears on the scanned/typed menu. */
export type MenuItem = {
  id: string;
  /** Name exactly as on the menu (French). */
  name: string;
  section?: string;
  price?: string;
  tags: MenuTag[];
  match: DishMatch | null;
  /** Set when the entry is a category ("Burgers") – then `match` is always null. */
  generic: GenericTerm | null;
  /** Ingredient items listed on the menu, as written. */
  listedItems: string[];
  menuIngredients: Ingredient[];
  unknownMenuItems: string[];
  nameIngredients: Ingredient[];
};

/** A file the user picked (photo, PNG, PDF). */
export type MenuFile = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export type MenuTextResult =
  | { kind: 'text'; text: string; sourceLabel: string }
  /** Text could not be read automatically – user types it while looking at the file. */
  | { kind: 'manual'; reason: string };

/**
 * Turns a menu file into text. MVP: known demo menus only (offline, Expo Go has no OCR).
 * Later: on-device OCR (dev build) or a cloud OCR/vision model can implement this.
 */
export interface MenuTextSource {
  extract(file: MenuFile): Promise<MenuTextResult>;
}
