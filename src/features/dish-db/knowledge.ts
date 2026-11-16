import { containsPhrase, editDistance, normalizeFrench, tokens } from '@/lib/text';

import { DISHES } from './data/dishes';
import { INGREDIENTS } from './data/ingredients';
import type { Dish, Ingredient } from './types';

export type DishMatch = { dish: Dish; score: number };

export type IngredientExtraction = {
  ingredients: Ingredient[];
  /** Listed items (original text) that matched no known ingredient. */
  unknownItems: string[];
};

/**
 * Source of dish/ingredient knowledge. MVP: curated offline DB.
 * Later: web or AI research may implement this too – but it must never be the only reason for a safe rating.
 */
export interface DishKnowledge {
  matchDish(menuName: string): DishMatch | null;
  /** Ingredients mentioned anywhere in a free text (e.g. a dish name). */
  ingredientsInText(text: string): Ingredient[];
  /** Map a list of menu ingredient items (e.g. "Jambon", "oeuf dur") to known ingredients. */
  extractIngredients(items: string[]): IngredientExtraction;
  ingredientById(id: string): Ingredient | undefined;
}

const MATCH_THRESHOLD = 0.6;

type Phrase = { normalized: string; ingredient: Ingredient };

export class CuratedDishKnowledge implements DishKnowledge {
  private readonly ingredientIndex = new Map<string, Ingredient>();
  private readonly phrases: Phrase[];
  private readonly dishNames: { dish: Dish; tokens: string[]; normalized: string }[];

  constructor(dishes: Dish[] = DISHES, ingredients: Ingredient[] = INGREDIENTS) {
    for (const ingredient of ingredients) this.ingredientIndex.set(ingredient.id, ingredient);
    this.phrases = ingredients
      .flatMap((ingredient) =>
        [ingredient.fr, ...ingredient.aliases].map((name) => ({ normalized: normalizeFrench(name), ingredient })),
      )
      .filter((phrase) => phrase.normalized.length > 0)
      // Longest phrases first, so "huile d'arachide" wins over "huile".
      .sort((a, b) => b.normalized.length - a.normalized.length);
    this.dishNames = dishes.flatMap((dish) =>
      [dish.fr, ...dish.aliases].map((name) => {
        const normalized = normalizeFrench(name);
        return { dish, normalized, tokens: tokens(normalized) };
      }),
    );
  }

  ingredientById(id: string): Ingredient | undefined {
    return this.ingredientIndex.get(id);
  }

  matchDish(menuName: string): DishMatch | null {
    const normalized = normalizeFrench(menuName);
    const nameTokens = tokens(normalized);
    if (nameTokens.length === 0) return null;

    let best: DishMatch | null = null;
    let bestLength = 0;
    for (const candidate of this.dishNames) {
      const score =
        candidate.normalized === normalized
          ? 1
          : Math.max(tokenSimilarity(nameTokens, candidate.tokens), containmentScore(nameTokens, candidate.tokens));
      const better =
        !best || score > best.score || (score === best.score && candidate.normalized.length > bestLength);
      if (better) {
        best = { dish: candidate.dish, score };
        bestLength = candidate.normalized.length;
      }
    }
    return best && best.score >= MATCH_THRESHOLD ? best : null;
  }

  ingredientsInText(text: string): Ingredient[] {
    return this.findPhrases(normalizeFrench(text)).ingredients;
  }

  extractIngredients(items: string[]): IngredientExtraction {
    const found = new Map<string, Ingredient>();
    const unknownItems: string[] = [];
    for (const item of items) {
      const { ingredients } = this.findPhrases(normalizeFrench(item));
      if (ingredients.length === 0) {
        if (item.trim()) unknownItems.push(item.trim());
        continue;
      }
      for (const ingredient of ingredients) found.set(ingredient.id, ingredient);
    }
    return { ingredients: [...found.values()], unknownItems };
  }

  /** Greedy longest-phrase search; matched words are consumed so they are not matched twice. */
  private findPhrases(normalized: string): { ingredients: Ingredient[] } {
    let rest = ` ${normalized} `;
    const found = new Map<string, Ingredient>();
    for (const phrase of this.phrases) {
      if (!containsPhrase(rest.trim(), phrase.normalized)) continue;
      found.set(phrase.ingredient.id, phrase.ingredient);
      rest = rest.split(` ${phrase.normalized} `).join(' | ');
    }
    return { ingredients: [...found.values()] };
  }
}

/** Share of matching tokens (typo-tolerant) relative to the larger token set. */
function tokenSimilarity(a: string[], b: string[]): number {
  if (b.length === 0) return 0;
  const unmatched = [...b];
  let matches = 0;
  for (const token of a) {
    const index = unmatched.findIndex((other) => tokensEqual(token, other));
    if (index >= 0) {
      matches++;
      unmatched.splice(index, 1);
    }
  }
  return matches / Math.max(a.length, b.length);
}

/**
 * Menu names often add sides or details ("Quiche lorraine, salade verte").
 * If every word of a known dish name appears in the menu name, it is a good match.
 */
function containmentScore(nameTokens: string[], candidateTokens: string[]): number {
  if (candidateTokens.length === 0) return 0;
  const contained = candidateTokens.every((token) => nameTokens.some((other) => tokensEqual(token, other)));
  return contained ? 0.7 + 0.3 * (candidateTokens.length / nameTokens.length) : 0;
}

function tokensEqual(a: string, b: string): boolean {
  if (a === b) return true;
  return a.length >= 5 && b.length >= 5 && editDistance(a, b) <= 1;
}
