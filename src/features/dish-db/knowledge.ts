import { containsPhrase, editDistance, normalizeFrench, tokens } from '@/lib/text';

import { DISHES } from './data/dishes';
import { GENERIC_TERMS } from './data/generic-terms';
import { INGREDIENTS } from './data/ingredients';
import type { Dish, GenericTerm, Ingredient } from './types';

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
  /** Generic category term ("Burgers", "Plat du jour") if the menu name is nothing but that. */
  matchGeneric(menuName: string): GenericTerm | null;
  /** Ingredients mentioned anywhere in a free text (e.g. a dish name). */
  ingredientsInText(text: string): Ingredient[];
  /** Map a list of menu ingredient items (e.g. "Jambon", "oeuf dur") to known ingredients. */
  extractIngredients(items: string[]): IngredientExtraction;
  ingredientById(id: string): Ingredient | undefined;
}

const MATCH_THRESHOLD = 0.6;

/** Words that may surround a generic term without making it a specific dish. */
// Run through tokens() so the words get the same singular form as menu text ("choix" → "choi").
const GENERIC_FILLER = new Set(tokens('choix pers personnes pieces pcs'));

type Phrase = { normalized: string; ingredient: Ingredient };

export class CuratedDishKnowledge implements DishKnowledge {
  private readonly ingredientIndex = new Map<string, Ingredient>();
  private readonly phrases: Phrase[];
  private readonly dishNames: { dish: Dish; tokens: string[]; normalized: string }[];
  private readonly genericNames: { term: GenericTerm; key: string }[];

  constructor(dishes: Dish[] = DISHES, ingredients: Ingredient[] = INGREDIENTS, genericTerms: GenericTerm[] = GENERIC_TERMS) {
    this.genericNames = genericTerms.flatMap((term) =>
      [term.fr, ...term.aliases].map((name) => ({ term, key: genericKey(name) })),
    );
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

  matchGeneric(menuName: string): GenericTerm | null {
    const key = genericKey(menuName);
    if (!key) return null;
    return this.genericNames.find((entry) => entry.key === key)?.term ?? null;
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

/** Sorted meaningful words of a name without numbers and filler words – equal keys = same generic term. */
function genericKey(name: string): string {
  return tokens(normalizeFrench(name))
    .filter((token) => !/^\d+$/.test(token) && !GENERIC_FILLER.has(token))
    .sort()
    .join(' ');
}

/** Share of matching tokens (typo-tolerant) relative to the larger token set. */
function tokenSimilarity(a: string[], b: string[]): number {
  if (b.length === 0) return 0;
  const unmatched = [...b];
  let matches = 0;
  for (const token of a) {
    const exact = unmatched.indexOf(token);
    const index = exact >= 0 ? exact : unmatched.findIndex((other) => tokensEqual(token, other));
    if (index >= 0) {
      // A typo match counts a bit less, so "crêpe" never beats an exact "crème" (and vice versa).
      matches += exact >= 0 ? 1 : 0.9;
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
  const contained = candidateTokens.every((token) => nameTokens.includes(token));
  return contained ? 0.7 + 0.3 * (candidateTokens.length / nameTokens.length) : 0;
}

function tokensEqual(a: string, b: string): boolean {
  if (a === b) return true;
  return a.length >= 5 && b.length >= 5 && editDistance(a, b) <= 1;
}
