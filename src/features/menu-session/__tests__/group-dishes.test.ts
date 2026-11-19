import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';
import { buildRatingInput } from '@/features/dish-rating/build-input';
import { rateDish } from '@/features/dish-rating/rate-dish';
import type { DishRating } from '@/features/dish-rating/types';
import { BRASSERIE_MENU } from '@/features/menu-input/demo-menus';
import { parseMenuText } from '@/features/menu-input/parse-menu';

import { groupDishes } from '../group-dishes';

const items = parseMenuText(BRASSERIE_MENU.text, dishKnowledge);
const ratings: Record<string, DishRating> = Object.fromEntries(
  items.map((item) => [item.id, rateDish(buildRatingInput(item, dishKnowledge))]),
);

describe('groupDishes', () => {
  it('keeps menu sections in menu order', () => {
    expect(groupDishes(items, ratings).map((g) => g.title)).toEqual(['Plats', 'Desserts']);
  });

  it('sorts each section by risk, safest first, and keeps the menu number', () => {
    const plats = groupDishes(items, ratings)[0];
    const ranks = plats.entries.map((e) => e.status);
    expect(ranks[0]).toBe('likely_safe');
    expect(ranks[ranks.length - 1]).toBe('unsafe');
    expect(plats.entries.find((e) => e.item.name.startsWith('Poulet aux cacahuètes'))?.number).toBe(2);
  });

  it('can hide red dishes but still counts them', () => {
    const plats = groupDishes(items, ratings, true)[0];
    expect(plats.entries.some((e) => e.status === 'unsafe')).toBe(false);
    expect(plats.riskCount).toBe(1);
  });
});
