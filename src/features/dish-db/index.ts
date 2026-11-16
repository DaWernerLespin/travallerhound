import { CuratedDishKnowledge, type DishKnowledge } from './knowledge';

/** Swap here to use another knowledge source (e.g. web/AI research) later. */
export const dishKnowledge: DishKnowledge = new CuratedDishKnowledge();
