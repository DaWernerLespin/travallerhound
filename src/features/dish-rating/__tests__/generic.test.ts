import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';
import { DISHES } from '@/features/dish-db/data/dishes';
import { parseMenuText } from '@/features/menu-input/parse-menu';

import { buildRatingInput } from '../build-input';
import { rateDish } from '../rate-dish';
import type { StaffVerdict } from '../types';

const rate = (line: string, verdict?: StaffVerdict) => {
  const [item] = parseMenuText(line, dishKnowledge);
  return { item, rating: rateDish(buildRatingInput(item, dishKnowledge), verdict) };
};

describe('generic menu entries', () => {
  it('recognises category terms instead of matching a dish', () => {
    for (const line of ['Burgers 15,00', 'Formule à partager 2 pers. 39,00', 'Accompagnements au choix 4,50', 'Plat du jour 14,90']) {
      const { item } = rate(line);
      expect([line, item.generic?.id]).not.toEqual([line, undefined]);
      expect(item.match).toBeNull();
    }
  });

  it('explains the term in German and stays unclear', () => {
    const { rating } = rate('Accompagnements 4,50');
    expect(rating.status).toBe('undefined');
    expect(rating.reason).toContain('„Accompagnements“ bedeutet „Beilagen“');
    expect(rating.reason).toContain('zu allgemein formuliert');
  });

  it('stays unclear even after staff confirmation', () => {
    const confirmed: StaffVerdict = { peanut: 'absent', lupin: 'absent', crossContamination: 'absent', ingredients: {} };
    expect(rate('Plat du jour 14,90', confirmed).rating.status).toBe('undefined');
  });

  it('still turns red when the entry names an allergen', () => {
    expect(rate('Burgers 15,00\nBoeuf, pain, sauce cacahuète').rating.status).toBe('unsafe');
  });

  it('does not treat specific dishes as generic', () => {
    expect(rate('Burger de bœuf 16,00').item.generic).toBeNull();
    expect(rate('Pizza margherita 12,00').item.generic).toBeNull();
    expect(rate('Mousse au chocolat 7,00').item.generic).toBeNull();
  });

  it('never treats a dish from the database as generic', () => {
    const generic = DISHES.flatMap((dish) => [dish.fr, ...dish.aliases]).filter((name) => dishKnowledge.matchGeneric(name));
    expect(generic).toEqual([]);
  });
});
