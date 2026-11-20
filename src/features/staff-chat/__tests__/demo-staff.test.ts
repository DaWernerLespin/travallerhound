import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';
import { buildRatingInput } from '@/features/dish-rating/build-input';
import { rateDish } from '@/features/dish-rating/rate-dish';
import { EMPTY_VERDICT } from '@/features/dish-rating/types';
import { DEMO_MENUS } from '@/features/menu-input/demo-menus';
import { parseMenuText } from '@/features/menu-input/parse-menu';
import { wishState, type WishState } from '@/features/order/order-state';

import { applyReply, buildQuestions, isAnswered, QuickReplySource } from '../conversation';
import { RESTAURANT_STAFF } from '../demo-staff';

const replies = new QuickReplySource();

/** Plays the whole conversation for every dish of a demo menu with the prepared staff answers. */
function simulate(menuId: string): Record<string, WishState> {
  const menu = DEMO_MENUS.find((m) => m.id === menuId)!;
  const persona = RESTAURANT_STAFF[menuId];
  const result: Record<string, WishState> = {};
  for (const item of parseMenuText(menu.text, dishKnowledge)) {
    const input = buildRatingInput(item, dishKnowledge);
    const base = rateDish(input);
    const questions = buildQuestions(item.name, base.findings);
    let verdict = EMPTY_VERDICT;
    for (const question of questions) {
      const status = rateDish(input, verdict).status;
      if (status === 'safe' || status === 'unsafe') break;
      const answer = persona.answer({ question, item, findings: base.findings });
      const reply = replies.repliesFor(question).find((r) => r.id === answer.replyId);
      if (!reply) throw new Error(`${menuId}: no reply "${answer.replyId}" for ${question.topic}`);
      verdict = applyReply(verdict, question, reply);
    }
    const open = questions.filter((q) => !isAnswered(q, verdict)).length;
    result[item.name] = wishState(rateDish(input, verdict), open, false);
  }
  return result;
}

const count = (result: Record<string, WishState>, state: WishState) => Object.values(result).filter((s) => s === state).length;

describe('demo restaurant staff', () => {
  it('has prepared answers for every demo menu', () => {
    for (const menu of DEMO_MENUS) expect(RESTAURANT_STAFF[menu.id]).toBeDefined();
  });

  it('Brasserie (indifferent): nothing can be ordered', () => {
    expect(count(simulate('brasserie'), 'confirmed')).toBe(0);
  });

  it('Chouchou (very helpful): every dish without a stated allergen can be ordered', () => {
    const result = simulate('chouchou');
    expect(count(result, 'dropped')).toBe(0);
  });

  it('Bistro de saison (cross-contamination in desserts): mains yes, desserts no', () => {
    const result = simulate('bistro-saison');
    expect(result['Risotto aux champignons']).toBe('confirmed');
    expect(result['Moelleux au chocolat']).toBe('dropped');
  });

  it('TGV bistro (packaged): savoury yes, sweets and snacks no', () => {
    const result = simulate('tgv-bistro');
    expect(result['Quiche Lorraine']).toBe('confirmed');
    expect(result['Fondant au chocolat']).toBe('dropped');
    expect(result['Chips cuites au chaudron']).toBe('dropped');
  });

  it('Moroccan desserts (nut kitchen): fruit yes, pastry no', () => {
    const result = simulate('desserts-marocains');
    expect(result['Ananas frais']).toBe('confirmed');
    expect(result['Pâtisserie orientale']).toBe('dropped');
  });

  it('Grande brasserie (peanut-oil fryer): fries swapped for salad, other fried food out', () => {
    const result = simulate('grande-brasserie');
    expect(result['Moules frites']).toBe('confirmed');
    expect(result['Calamars frits']).toBe('dropped');
  });
});
