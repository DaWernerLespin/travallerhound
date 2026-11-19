import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';
import { DISHES } from '@/features/dish-db/data/dishes';
import { INGREDIENTS } from '@/features/dish-db/data/ingredients';
import { CHOUCHOU_MENU } from '@/features/menu-input/demo-menus';
import { parseMenuText } from '@/features/menu-input/parse-menu';
import { applyReply, buildQuestions, QuickReplySource } from '@/features/staff-chat/conversation';

import { buildRatingInput } from '../build-input';
import { rateDish } from '../rate-dish';
import { EMPTY_VERDICT, type StaffVerdict } from '../types';

function rateMenuLine(text: string, verdict: StaffVerdict = EMPTY_VERDICT) {
  const [item] = parseMenuText(text, dishKnowledge);
  return { item, rating: rateDish(buildRatingInput(item, dishKnowledge), verdict) };
}

const CONFIRMED: StaffVerdict = { peanut: 'absent', lupin: 'absent', crossContamination: 'absent', ingredients: {} };

describe('data', () => {
  it('has ~100 dishes whose ingredients all exist', () => {
    expect(DISHES.length).toBeGreaterThanOrEqual(100);
    const ids = new Set(INGREDIENTS.map((i) => i.id));
    for (const dish of DISHES) {
      for (const id of dish.ingredientIds) expect([dish.id, ids.has(id)]).toEqual([dish.id, true]);
    }
  });

  it('has unique ids', () => {
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(DISHES.length);
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(INGREDIENTS.length);
  });
});

describe('rating', () => {
  it('marks dishes with peanuts as unsafe', () => {
    expect(rateMenuLine('Poulet aux cacahuètes 14,50').rating.status).toBe('unsafe');
  });

  it('marks lupin dishes as unsafe', () => {
    expect(rateMenuLine('Lupins au sel 4,00').rating.status).toBe('unsafe');
  });

  it('flags hidden peanut oil in frites maison as undefined', () => {
    const { rating } = rateMenuLine('Steak frites maison 19,90');
    expect(rating.status).toBe('undefined');
    expect(rating.reason).toContain('Erdnussöl');
  });

  it('rates an unremarkable known dish as likely safe, never safe', () => {
    expect(rateMenuLine('Ratatouille 12,00').rating.status).toBe('likely_safe');
  });

  it('rates unknown dishes as undefined', () => {
    expect(rateMenuLine('Spécialité du chef 25,00').rating.status).toBe('undefined');
  });

  it('detects allergens in the name of an unknown dish', () => {
    expect(rateMenuLine('Tarte maison au beurre de cacahuète 8,00').rating.status).toBe('unsafe');
  });

  it('only becomes safe when staff confirms everything', () => {
    expect(rateMenuLine('Ratatouille 12,00', CONFIRMED).rating.status).toBe('safe');
    expect(rateMenuLine('Ratatouille 12,00', { ...CONFIRMED, crossContamination: 'unknown' }).rating.status).toBe('unsafe');
    expect(rateMenuLine('Ratatouille 12,00', { ...CONFIRMED, crossContamination: 'present' }).rating.status).toBe('unsafe');
  });

  it('never lets staff override a stated allergen', () => {
    expect(rateMenuLine('Poulet aux cacahuètes 14,50', CONFIRMED).rating.status).toBe('unsafe');
  });

  it('is a risk when staff is unsure about an ingredient', () => {
    const verdict = { ...CONFIRMED, ingredients: { frites: 'unknown' as const } };
    expect(rateMenuLine('Steak frites 19,90', verdict).rating.status).toBe('unsafe');
  });

  it('is a risk as soon as staff cannot rule out an allergen, even before all questions are answered', () => {
    expect(rateMenuLine('Ratatouille 12,00', { ...EMPTY_VERDICT, peanut: 'unknown', lupin: 'unknown' }).rating.status).toBe('unsafe');
  });

  it('adds menu ingredients to the DB recipe', () => {
    const { item, rating } = rateMenuLine('Salade Parisienne 16,90\nJambon, oeuf dur, tomates, sauce arachide');
    expect(item.menuIngredients.map((i) => i.id)).toContain('arachide');
    expect(rating.status).toBe('unsafe');
  });
});

describe('menu parsing', () => {
  const items = parseMenuText(CHOUCHOU_MENU.text, dishKnowledge);

  it('finds all 22 Chouchou dishes and matches each to the DB', () => {
    expect(items).toHaveLength(22);
    for (const item of items) expect([item.name, item.match?.dish.id ?? null]).not.toEqual([item.name, null]);
  });

  it('keeps sections, prices and the vegetarian tag', () => {
    const vegetables = items.find((i) => i.name.startsWith('Assiette de légumes'));
    expect(vegetables?.section).toBe('Entrées');
    expect(vegetables?.price).toBe('11,90');
    expect(vegetables?.tags).toEqual(['vegetarian']);
    expect(vegetables?.listedItems.length).toBeGreaterThan(3);
    expect(vegetables?.unknownMenuItems).toEqual([]);
  });

  it('recognises every listed Chouchou ingredient', () => {
    expect(items.flatMap((i) => i.unknownMenuItems)).toEqual([]);
  });

  it('skips English translation lines', () => {
    const parsed = parseMenuText('Salade Niçoise 17,90\nTuna, hard-boiled egg, olives, tomatoes\nSoupe à l’oignon 9,00', dishKnowledge);
    expect(parsed.map((i) => i.name)).toEqual(['Salade Niçoise', 'Soupe à l’oignon']);
  });

  it('matches dishes with extra details after the name', () => {
    const parsed = parseMenuText('Quiche lorraine, salade verte 12,90\nConfit de canard, pommes sarladaises 21,00', dishKnowledge);
    expect(parsed.map((i) => i.match?.dish.id)).toEqual(['quiche-lorraine', 'confit-canard']);
  });

  it('does not match unrelated dishes that share one word', () => {
    expect(dishKnowledge.matchDish('Salade de lentilles')).toBeNull();
  });

  it('prefers exact words over typo matches (crêpe vs. crème)', () => {
    const parsed = parseMenuText('Crêpe au chocolat 6,00\nCrème caramel 6,00\nCrêpe caramel 6,00', dishKnowledge);
    expect(parsed.map((i) => i.match?.dish.id)).toEqual(['crepe-nutella', 'creme-caramel', 'crepe-caramel']);
  });

  it('accepts plain typed dish names without prices', () => {
    const parsed = parseMenuText('crème brûlée\nquiche lorraine', dishKnowledge);
    expect(parsed.map((i) => i.match?.dish.id)).toEqual(['creme-brulee', 'quiche-lorraine']);
  });
});

describe('staff chat', () => {
  it('asks country-specific questions for hidden risks', () => {
    const { item } = rateMenuLine('Steak frites 19,90');
    const base = rateDish(buildRatingInput(item, dishKnowledge));
    const questions = buildQuestions(item.name, base.findings);
    expect(questions.map((q) => q.id)).toEqual(expect.arrayContaining(['allergens', 'cross', 'ingredient-frites']));
  });

  it('turns a dish safe after the staff confirms allergens and cross-contamination', () => {
    const { item } = rateMenuLine('Ratatouille 12,00');
    const base = rateDish(buildRatingInput(item, dishKnowledge));
    const [allergens, cross] = buildQuestions(item.name, base.findings);
    const replies = new QuickReplySource();
    let verdict = applyReply(EMPTY_VERDICT, allergens, replies.repliesFor(allergens)[0]);
    verdict = applyReply(verdict, cross, replies.repliesFor(cross)[0]);
    expect(rateDish(buildRatingInput(item, dishKnowledge), verdict).status).toBe('safe');
  });
});
