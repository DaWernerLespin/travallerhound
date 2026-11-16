import type { DishKnowledge } from '@/features/dish-db/knowledge';
import { normalizeFrench } from '@/lib/text';

import type { MenuItem, MenuTag } from './types';

const PRICE = /\d{1,3}[.,]\d{2}\s*€?/g;
const HAS_PRICE = /\d{1,3}[.,]\d{2}/;
const PORTION = /\b\d+\s*(pcs|pieces|pièces|pce|p)\b\.?/gi;
const VEGETARIAN = /\(v\)|🌿|🌱/gi;
const HAS_VEGETARIAN = /\(v\)|🌿|🌱|\bv[ée]g[ée]tarien(ne)?\b/i;
const NAME_SEPARATOR = /\s+[–—-]\s+|\s*:\s+/;

const ENGLISH_WORDS = new Set([
  'with', 'and', 'the', 'of', 'in', 'their', 'on', 'salad', 'cheese', 'plate', 'soup', 'egg', 'chicken', 'beef',
  'ham', 'tomatoes', 'potatoes', 'duck', 'smoked', 'salmon', 'hard', 'boiled', 'goat', 'snails', 'shells',
  'grilled', 'vegetables', 'mixed', 'platter', 'onion', 'pumpkin', 'toasts', 'dill', 'crunchy', 'nuts', 'green',
]);

/**
 * Parses menu text: one dish per line (optional price), optionally followed by a comma-separated
 * ingredient line. Section headers (ALL CAPS) and English translation lines are skipped.
 */
export function parseMenuText(text: string, knowledge: DishKnowledge): MenuItem[] {
  const items: MenuItem[] = [];
  let section: string | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isSectionHeader(line)) {
      section = titleCase(line);
      continue;
    }

    const prices = line.match(PRICE) ?? [];
    const previous = items[items.length - 1];
    if (prices.length === 0 && previous && previous.listedItems.length === 0 && looksLikeIngredientList(line, knowledge)) {
      addListedItems(previous, splitItems(line), knowledge);
      continue;
    }
    if (prices.length === 0 && isEnglish(line)) continue;

    items.push(createItem(line, prices[0], section, items.length, knowledge));
  }
  return items;
}

function createItem(
  line: string,
  price: string | undefined,
  section: string | undefined,
  index: number,
  knowledge: DishKnowledge,
): MenuItem {
  const tags: MenuTag[] = HAS_VEGETARIAN.test(line) ? ['vegetarian'] : [];
  const cleaned = line.replace(VEGETARIAN, ' ').replace(PRICE, ' ').replace(PORTION, ' ').replace(/\s+/g, ' ').trim();
  const [namePart, ...rest] = cleaned.split(NAME_SEPARATOR);
  const name = namePart.replace(/[\s,.;]+$/, '').trim();

  const item: MenuItem = {
    id: `${index}-${normalizeFrench(name).replace(/ /g, '-')}`,
    name,
    section,
    price: price?.trim(),
    tags,
    match: knowledge.matchDish(name),
    listedItems: [],
    menuIngredients: [],
    unknownMenuItems: [],
    nameIngredients: knowledge.ingredientsInText(name),
  };
  if (rest.length > 0) addListedItems(item, splitItems(rest.join(', ')), knowledge);
  return item;
}

/** Menu ingredients are added to what we know – they never replace the DB recipe. */
function addListedItems(item: MenuItem, listed: string[], knowledge: DishKnowledge): void {
  const extraction = knowledge.extractIngredients(listed);
  item.listedItems.push(...listed);
  item.menuIngredients.push(...extraction.ingredients.filter((i) => !item.menuIngredients.some((m) => m.id === i.id)));
  item.unknownMenuItems.push(...extraction.unknownItems);
}

function splitItems(line: string): string[] {
  return line
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function looksLikeIngredientList(line: string, knowledge: DishKnowledge): boolean {
  const parts = splitItems(line);
  if (parts.length < 2) return false;
  const known = parts.filter((part) => knowledge.ingredientsInText(part).length > 0).length;
  return known / parts.length >= 0.5 && !isEnglish(line);
}

function isEnglish(line: string): boolean {
  const words = line.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length === 0) return false;
  const english = words.filter((word) => ENGLISH_WORDS.has(word)).length;
  return english / words.length >= 0.4;
}

function isSectionHeader(line: string): boolean {
  const letters = line.replace(/[^\p{L}]/gu, '');
  return letters.length >= 3 && letters === letters.toUpperCase() && !HAS_PRICE.test(line) && line.split(/\s+/).length <= 3;
}

function titleCase(line: string): string {
  const lower = line.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
