import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';
import { parseMenuText } from '@/features/menu-input/parse-menu';
import { sessionReducer } from '@/features/menu-session/session-context';
import { QuickReplySource } from '@/features/staff-chat/conversation';

import { buildRatingInput } from '../build-input';
import { applyTravelerDecision, definitelyContains, rateDish } from '../rate-dish';

const rate = (line: string) => {
  const [item] = parseMenuText(line, dishKnowledge);
  return rateDish(buildRatingInput(item, dishKnowledge));
};

describe('traveller decision after a free-text answer', () => {
  it('leaves the rating alone without a decision', () => {
    const rating = rate('Carpaccio de boeuf');
    expect(applyTravelerDecision(rating, undefined)).toBe(rating);
  });

  it('marks an open dish safe or not safe', () => {
    const rating = rate('Carpaccio de boeuf');
    expect(rating.status).not.toBe('safe');
    expect(applyTravelerDecision(rating, 'safe').status).toBe('safe');
    expect(applyTravelerDecision(rating, 'unsafe').status).toBe('unsafe');
  });

  it('never marks a dish safe that definitely contains peanuts', () => {
    const rating = rate('Poulet aux cacahuètes');
    expect(definitelyContains(rating)).toBe(true);
    expect(applyTravelerDecision(rating, 'safe').status).toBe('unsafe');
  });

  it('is stored per dish in the visit session', () => {
    const start = sessionReducer(
      {
        items: [], sourceLabel: null, menuId: null, scanStartedAt: null, verdicts: {}, decisions: {},
        messages: [], wishlist: [], focusId: null, notes: {}, ordered: {}, introduced: false,
      },
      { type: 'setDecision', itemId: 'a', decision: 'safe' },
    );
    expect(start.decisions).toEqual({ a: 'safe' });
  });
});

describe('answers to a free-text question', () => {
  it('never change the rating', () => {
    for (const reply of new QuickReplySource().freeReplies()) expect(reply.effect).toEqual({});
  });
});
