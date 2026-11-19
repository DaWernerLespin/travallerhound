import type { DishKnowledge } from '@/features/dish-db/knowledge';
import type { Ingredient } from '@/features/dish-db/types';
import type { MenuItem } from '@/features/menu-input/types';

import type { RatingInput } from './types';

export function buildRatingInput(item: MenuItem, knowledge: DishKnowledge): RatingInput {
  const dbDish = item.match?.dish;
  const dbIngredients = (dbDish?.ingredientIds ?? [])
    .map((id) => knowledge.ingredientById(id))
    .filter((ingredient): ingredient is Ingredient => ingredient !== undefined);
  return {
    dbDish,
    generic: item.generic,
    dbIngredients,
    menuIngredients: item.menuIngredients,
    unknownMenuItems: item.unknownMenuItems,
    nameIngredients: item.nameIngredients,
  };
}
