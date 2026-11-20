import type { StaffAnswer, StaffVerdict } from '@/features/dish-rating/types';

export type Language = 'de' | 'fr';

/** A message described by a template id + parameters, so any translator can render it. */
export type Phrase = { id: string; params?: Record<string, string> };

/**
 * Renders a phrase in a language. MVP: offline phrase table.
 * Later: an AI model can translate free text behind the same interface.
 */
export interface Translator {
  render(phrase: Phrase, language: Language): Promise<string>;
}

export type QuestionTopic = 'allergens' | 'cross' | 'ingredient';

export type Question = {
  id: string;
  topic: QuestionTopic;
  ingredientId?: string;
  /** Short German label for the question button. */
  label: string;
  phrase: Phrase;
};

/** Effect of a staff answer on the verdict. `ingredient` applies to the question's ingredient. */
export type ReplyEffect = Partial<Pick<StaffVerdict, 'peanut' | 'lupin' | 'crossContamination'>> & {
  ingredient?: StaffAnswer;
};

export type StaffReply = {
  id: string;
  phrase: Phrase;
  effect: ReplyEffect;
  tone: 'positive' | 'negative' | 'neutral';
  /** The staff picks a preset change (e.g. "salad instead of fries") that makes the answer true. */
  needsNote?: boolean;
};

/**
 * Where staff answers come from. MVP: French quick replies on the same phone.
 * Later: free text or speech, interpreted into the same ReplyEffect.
 */
export interface StaffReplySource {
  repliesFor(question: Question): StaffReply[];
}

export type ChatMessage = {
  id: string;
  /** `system` = Bruno's German status line in the chat (not shown to the staff). */
  side: 'traveler' | 'staff' | 'system';
  fr: string;
  de: string;
  /** Dish the message is about (none for the intro or the order). */
  itemId?: string;
};
