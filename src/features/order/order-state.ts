import type { DishRating } from '@/features/dish-rating/types';

/**
 * Where a dish on the Wunschliste stands:
 * - pending: still to be checked with the staff
 * - confirmed: safe → on the Bestellliste
 * - dropped: not safe, or the staff could not confirm everything (after the conversation a dish is safe or not)
 * - ordered: already ordered
 */
export type WishState = 'pending' | 'confirmed' | 'dropped' | 'ordered';

export function wishState(rating: DishRating | undefined, openQuestions: number, ordered: boolean): WishState {
  if (ordered) return 'ordered';
  if (!rating) return 'pending';
  if (rating.status === 'safe') return 'confirmed';
  if (rating.status === 'unsafe') return 'dropped';
  return openQuestions > 0 ? 'pending' : 'dropped';
}

export type OrderOverview = Record<WishState, string[]>;

/** Splits the Wunschliste (in the order dishes were added) by state. */
export function orderOverview(
  wishlist: string[],
  ratings: Record<string, DishRating>,
  openQuestions: Record<string, number>,
  ordered: Record<string, boolean>,
): OrderOverview {
  const overview: OrderOverview = { pending: [], confirmed: [], dropped: [], ordered: [] };
  for (const id of wishlist) {
    overview[wishState(ratings[id], openQuestions[id] ?? 0, ordered[id] ?? false)].push(id);
  }
  return overview;
}

/** The dish the chat asks about next: the chosen one if still open, else the first open one. */
export function focusDish(pending: string[], chosen: string | null): string | null {
  if (chosen && pending.includes(chosen)) return chosen;
  return pending[0] ?? null;
}
