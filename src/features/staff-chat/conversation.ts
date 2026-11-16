import type { Finding, StaffVerdict } from '@/features/dish-rating/types';

import type { Question, StaffReply, StaffReplySource } from './types';

/**
 * Questions for one dish: the two the safety rating needs (allergens, cross-contamination),
 * then one per country-specific hidden risk (e.g. fries in peanut oil).
 */
export function buildQuestions(dishName: string, findings: Finding[]): Question[] {
  const questions: Question[] = [
    { id: 'allergens', topic: 'allergens', phrase: { id: 'ask_allergens', params: { dish: dishName } } },
    { id: 'cross', topic: 'cross', phrase: { id: 'ask_cross' } },
  ];

  const hidden = new Map<string, { fr: string; de: string; peanut: boolean; lupin: boolean }>();
  for (const finding of findings) {
    if (finding.level !== 'hidden' || !finding.ingredient || !finding.allergen) continue;
    const entry = hidden.get(finding.ingredient.id) ?? {
      fr: finding.ingredient.fr,
      de: finding.ingredient.de,
      peanut: false,
      lupin: false,
    };
    entry[finding.allergen] = true;
    hidden.set(finding.ingredient.id, entry);
  }

  for (const [ingredientId, entry] of hidden) {
    const phraseId = entry.peanut && entry.lupin ? 'ask_ingredient_both' : entry.peanut ? 'ask_ingredient_peanut' : 'ask_ingredient_lupin';
    questions.push({
      id: `ingredient-${ingredientId}`,
      topic: 'ingredient',
      ingredientId,
      phrase: { id: phraseId, params: { ingredientFr: entry.fr, ingredientDe: entry.de } },
    });
  }
  return questions;
}

const ASK_CHEF: StaffReply = { id: 'ask-chef', phrase: { id: 'reply_ask_chef' }, effect: {}, tone: 'neutral' };

const REPLIES: Record<Question['topic'], StaffReply[]> = {
  allergens: [
    { id: 'none', phrase: { id: 'reply_none' }, effect: { peanut: 'absent', lupin: 'absent' }, tone: 'positive' },
    { id: 'peanut', phrase: { id: 'reply_peanut' }, effect: { peanut: 'present' }, tone: 'negative' },
    { id: 'lupin', phrase: { id: 'reply_lupin' }, effect: { lupin: 'present' }, tone: 'negative' },
    ASK_CHEF,
    { id: 'unknown', phrase: { id: 'reply_unknown' }, effect: { peanut: 'unknown', lupin: 'unknown' }, tone: 'negative' },
  ],
  cross: [
    { id: 'cross-none', phrase: { id: 'reply_cross_none' }, effect: { crossContamination: 'absent' }, tone: 'positive' },
    { id: 'cross-possible', phrase: { id: 'reply_cross_possible' }, effect: { crossContamination: 'present' }, tone: 'negative' },
    ASK_CHEF,
    { id: 'unknown', phrase: { id: 'reply_unknown' }, effect: { crossContamination: 'unknown' }, tone: 'negative' },
  ],
  ingredient: [
    { id: 'ingredient-no', phrase: { id: 'reply_ingredient_no' }, effect: { ingredient: 'absent' }, tone: 'positive' },
    { id: 'ingredient-yes', phrase: { id: 'reply_ingredient_yes' }, effect: { ingredient: 'present' }, tone: 'negative' },
    ASK_CHEF,
    { id: 'unknown', phrase: { id: 'reply_unknown' }, effect: { ingredient: 'unknown' }, tone: 'negative' },
  ],
};

/** MVP reply source: fixed French quick replies per question topic. */
export class QuickReplySource implements StaffReplySource {
  repliesFor(question: Question): StaffReply[] {
    return REPLIES[question.topic];
  }
}

/** True if the reply settles the question (asking the chef does not). */
export function isFinalReply(reply: StaffReply): boolean {
  return Object.keys(reply.effect).length > 0;
}

export function applyReply(verdict: StaffVerdict, question: Question, reply: StaffReply): StaffVerdict {
  const { ingredient, ...dishLevel } = reply.effect;
  const next: StaffVerdict = { ...verdict, ...dishLevel, ingredients: { ...verdict.ingredients } };
  if (ingredient && question.ingredientId) next.ingredients[question.ingredientId] = ingredient;
  return next;
}
