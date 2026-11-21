import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';
import type { DishRating, DishStatus } from '@/features/dish-rating/types';
import { EMPTY_VERDICT } from '@/features/dish-rating/types';
import { parseMenuText } from '@/features/menu-input/parse-menu';
import { sessionReducer } from '@/features/menu-session/session-context';
import { applyReply, buildQuestions, QuickReplySource } from '@/features/staff-chat/conversation';
import { PhraseTableTranslator } from '@/features/staff-chat/phrases';
import type { ChatMessage } from '@/features/staff-chat/types';
import { hadFreeAnswer, orderName } from '@/features/staff-chat/use-visit-chat';

import { addCustomNote, findNote, isCustomNote, ORDER_NOTES, withNotes } from '../notes';
import { focusDish, orderOverview, wishState } from '../order-state';

const rating = (status: DishStatus): DishRating => ({ status, reason: '', findings: [], checks: [] });

describe('Wunschliste states', () => {
  it('safe → confirmed, unsafe → dropped, open questions → pending', () => {
    expect(wishState(rating('safe'), 0, false)).toBe('confirmed');
    expect(wishState(rating('unsafe'), 2, false)).toBe('dropped');
    expect(wishState(rating('undefined'), 1, false)).toBe('pending');
    expect(wishState(rating('likely_safe'), 3, false)).toBe('pending');
  });

  it('after the conversation a dish is safe or not: no open questions but not safe → dropped', () => {
    expect(wishState(rating('undefined'), 0, false)).toBe('dropped');
  });

  it('ordered wins over everything', () => {
    expect(wishState(rating('safe'), 0, true)).toBe('ordered');
  });

  it('splits the list and keeps the order dishes were added', () => {
    const ratings = { a: rating('safe'), b: rating('undefined'), c: rating('unsafe'), d: rating('likely_safe') };
    expect(orderOverview(['d', 'a', 'b', 'c'], ratings, { b: 2, d: 3 }, {})).toEqual({
      pending: ['d', 'b'],
      confirmed: ['a'],
      dropped: ['c'],
      ordered: [],
    });
  });

  it('asks about the chosen dish next, else the first open one', () => {
    expect(focusDish(['x', 'y'], 'y')).toBe('y');
    expect(focusDish(['x', 'y'], 'gone')).toBe('x');
    expect(focusDish([], null)).toBeNull();
  });
});

describe('order notes', () => {
  it('have unique ids and both languages', () => {
    expect(new Set(ORDER_NOTES.map((note) => note.id)).size).toBe(ORDER_NOTES.length);
    for (const note of ORDER_NOTES) expect(note.de && note.fr).toBeTruthy();
  });

  it('are added to the dish name in the right language', () => {
    expect(withNotes('Steak frites', ['salade-frites', 'sans-sauce'], 'fr')).toBe('Steak frites, salade à la place des frites, sans sauce');
    expect(withNotes('Steak frites', [], 'de')).toBe('Steak frites');
  });
});

describe('staff answer with a change', () => {
  const questions = buildQuestions('Steak frites', []);
  const replies = new QuickReplySource().repliesFor(questions[0]);
  const withChange = replies.find((reply) => reply.needsNote)!;

  it('is offered and counts as a confirmation', () => {
    expect(withChange).toBeDefined();
    expect(applyReply(EMPTY_VERDICT, questions[0], withChange)).toMatchObject({ peanut: 'absent', lupin: 'absent' });
  });

  it('names the change in both languages', async () => {
    const note = findNote('salade-frites')!;
    const phrase = { ...withChange.phrase, params: { noteDe: note.de, noteFr: note.fr } };
    const translator = new PhraseTableTranslator();
    expect(await translator.render(phrase, 'fr')).toContain('salade à la place des frites');
    expect(await translator.render(phrase, 'de')).toContain('Salat statt Pommes');
  });
});

describe('visit session', () => {
  const start = sessionReducer(
    {
      items: [],
      sourceLabel: null,
      menuId: null,
      scanStartedAt: null,
      verdicts: {},
      decisions: {},
      messages: [],
      wishlist: [],
      focusId: null,
      notes: {},
      ordered: {},
      introduced: false,
    },
    { type: 'loadMenu', items: [], sourceLabel: 'Demo', menuId: null, now: 0 },
  );

  it('adds a dish to the Wunschliste only once and removes it again', () => {
    let state = sessionReducer(start, { type: 'addToWishlist', itemId: 'a' });
    state = sessionReducer(state, { type: 'addToWishlist', itemId: 'a' });
    expect(state.wishlist).toEqual(['a']);
    state = sessionReducer(state, { type: 'setFocus', itemId: 'a' });
    state = sessionReducer(state, { type: 'removeFromWishlist', itemId: 'a' });
    expect(state.wishlist).toEqual([]);
    expect(state.focusId).toBeNull();
  });

  it('shows the intro and each dish result only once', () => {
    let state = start;
    for (let i = 0; i < 2; i++) {
      state = sessionReducer(state, { type: 'addMessage', message: { id: `r${i}`, side: 'system', fr: '', de: 'ok', itemId: 'a', kind: 'safe' } });
      state = sessionReducer(state, { type: 'addMessage', message: { id: `i${i}`, side: 'traveler', fr: 'x', de: 'x', kind: 'intro' } });
    }
    expect(state.messages).toHaveLength(2);
  });

  it('toggles notes and orders several dishes at once', () => {
    let state = sessionReducer(start, { type: 'toggleNote', itemId: 'a', noteId: 'sans-sauce' });
    state = sessionReducer(state, { type: 'toggleNote', itemId: 'a', noteId: 'sans-sauce', on: true });
    expect(state.notes.a).toEqual(['sans-sauce']);
    state = sessionReducer(state, { type: 'toggleNote', itemId: 'a', noteId: 'sans-sauce' });
    expect(state.notes.a).toEqual([]);
    state = sessionReducer(state, { type: 'markOrdered', itemIds: ['a', 'b'] });
    expect(state.ordered).toEqual({ a: true, b: true });
  });
});

describe('own order notes', () => {
  it('are listed with their French translation', () => {
    const note = addCustomNote('ohne Koriander', 'sans coriandre');
    expect(isCustomNote(note.id)).toBe(true);
    expect(withNotes('Steak frites', ['sans-sauce', note.id], 'fr')).toBe('Steak frites, sans sauce, sans coriandre');
    expect(withNotes('Steak frites', [note.id], 'de')).toBe('Steak frites, ohne Koriander');
  });
});

describe('free-text answers', () => {
  const msg = (side: ChatMessage['side'], itemId: string, free = false): ChatMessage => ({ id: `${side}${itemId}${free}`, side, fr: '', de: '', itemId, free });

  it('let the traveller decide after a typed staff answer', () => {
    expect(hadFreeAnswer([msg('staff', 'a', true)], 'a')).toBe(true);
  });

  it('let the traveller decide after a tapped answer to a free-text question', () => {
    expect(hadFreeAnswer([msg('traveler', 'a', true), msg('staff', 'a')], 'a')).toBe(true);
  });

  it('do not count quick answers to quick questions or other dishes', () => {
    expect(hadFreeAnswer([msg('traveler', 'a'), msg('staff', 'a')], 'a')).toBe(false);
    expect(hadFreeAnswer([msg('traveler', 'b', true), msg('staff', 'b')], 'a')).toBe(false);
  });
});

describe('order message', () => {
  it('names the dish in German with the French original in brackets', () => {
    const [item] = parseMenuText('Carpaccio de boeuf', dishKnowledge);
    expect(orderName(item, 'de')).toBe(`${item.match?.dish.de} (${item.name})`);
    expect(orderName(item, 'fr')).toBe(item.name);
  });

  it('keeps the French name alone when the dish is unknown', () => {
    const [item] = parseMenuText('Spécialité xyz du chef', dishKnowledge);
    expect(item.match).toBeFalsy();
    expect(orderName(item, 'de')).toBe(item.name);
  });
});
