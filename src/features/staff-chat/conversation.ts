import type { Finding, StaffAnswer, StaffVerdict } from '@/features/dish-rating/types';

import type { Question, StaffReply, StaffReplySource } from './types';

/**
 * Questions for one dish: the two the safety rating needs (allergens, cross-contamination),
 * then one per country-specific hidden risk (e.g. fries in peanut oil).
 * They are asked again for every dish; only the allergy explanation (phrase "intro") is sent once per visit.
 */
export function buildQuestions(dishName: string, findings: Finding[]): Question[] {
  const questions: Question[] = [
    { id: 'allergens', topic: 'allergens', label: 'Enthält das Gericht Erdnüsse oder Lupinen?', phrase: { id: 'ask_allergens', params: { dish: dishName } } },
    { id: 'cross', topic: 'cross', label: 'Geht es ohne Kreuzkontamination?', phrase: { id: 'ask_cross', params: { dish: dishName } } },
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
    const allergens = entry.peanut && entry.lupin ? 'Erdnuss oder Lupine' : entry.peanut ? 'Erdnuss/Erdnussöl' : 'Lupinenmehl';
    questions.push({
      id: `ingredient-${ingredientId}`,
      topic: 'ingredient',
      ingredientId,
      label: `${entry.de}: mit ${allergens}?`,
      phrase: { id: phraseId, params: { ingredientFr: entry.fr, ingredientDe: entry.de } },
    });
  }
  return questions;
}

export type ChecklistState = 'open' | 'ok' | 'risk' | 'unclear';
export type ChecklistItem = { id: string; label: string; state: ChecklistState };

const STATE: Record<StaffAnswer, ChecklistState> = { unasked: 'open', absent: 'ok', present: 'risk', unknown: 'unclear' };

/** What still has to be confirmed for this dish, ticked off by the staff's answers. */
export function buildChecklist(questions: Question[], verdict: StaffVerdict): ChecklistItem[] {
  return questions.flatMap((question): ChecklistItem[] => {
    switch (question.topic) {
      case 'allergens':
        return [
          { id: 'peanut', label: 'Erdnüsse', state: STATE[verdict.peanut] },
          { id: 'lupin', label: 'Lupinen', state: STATE[verdict.lupin] },
        ];
      case 'cross':
        return [{ id: 'cross', label: 'Kreuzkontamination', state: STATE[verdict.crossContamination] }];
      case 'ingredient': {
        const answer = question.ingredientId ? verdict.ingredients[question.ingredientId] : undefined;
        const label = (question.phrase.params?.ingredientDe ?? question.label).replace(/^./, (c) => c.toUpperCase());
        return [{ id: question.id, label, state: STATE[answer ?? 'unasked'] }];
      }
    }
  });
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
