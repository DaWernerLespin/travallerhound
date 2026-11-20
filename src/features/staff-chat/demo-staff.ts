import type { Finding } from '@/features/dish-rating/types';
import type { MenuItem } from '@/features/menu-input/types';
import { normalizeFrench } from '@/lib/text';

import type { Question } from './types';

/**
 * Demo only: how the staff of each demo restaurant answers (prepared in advance, as agreed with Jana).
 * Each restaurant has its own attitude, so all paths of the app show up in a test.
 * In the demo the staff is virtual: it answers by itself as prepared here. The real product hands the phone
 * to the staff instead (quick replies in the chat), so real staff can give their own input.
 */
export type ScriptedAnswer = { replyId: string; noteId?: string };

export type StaffContext = { question: Question; item: MenuItem; findings: Finding[] };

export type StaffPersona = {
  /** Short German description, shown in the demo hint. */
  label: string;
  answer: (context: StaffContext) => ScriptedAnswer;
};

type Category = 'fries' | 'fried' | 'dressing' | 'flour' | 'nut';

const FRIES = new Set(['frites', 'pommes-sarladaises', 'chips']);
const FRIED = new Set(['friture', 'pommes-dauphines', 'nuggets-ing', 'cordon-bleu-ing', 'banane-plantain']);
const DRESSING = new Set([
  'huile', 'vinaigrette', 'mayonnaise', 'sauce-cesar', 'aioli-ing', 'remoulade', 'gribiche', 'sauce-mayo-epicee',
  'vinaigrette-moutarde', 'sauce-tartare', 'sauce-cocktail', 'rouille', 'pistou', 'huile-noix',
]);

/** What kind of hidden risk a dish has, from its rating findings (before any staff answer). */
export function riskCategories(findings: Finding[]): Set<Category> {
  const categories = new Set<Category>();
  for (const finding of findings) {
    const id = finding.ingredient?.id;
    if (!id || finding.level !== 'hidden') continue;
    if (FRIES.has(id)) categories.add('fries');
    else if (FRIED.has(id)) categories.add('fried');
    else if (DRESSING.has(id)) categories.add('dressing');
    else if (finding.allergen === 'lupin') categories.add('flour');
    else categories.add('nut');
  }
  return categories;
}

const SWEET_SECTIONS = ['dessert', 'glace', 'coupe', 'gateau', 'brioche', 'gourmandise', 'encas', 'douceur', 'patisserie'];
const isSweetOrSnack = (item: MenuItem) => {
  const section = normalizeFrench(item.section ?? '');
  return SWEET_SECTIONS.some((word) => section.includes(word));
};

const byTopic = (
  context: StaffContext,
  answers: { allergens: () => ScriptedAnswer; cross: () => ScriptedAnswer; ingredient: () => ScriptedAnswer },
) => answers[context.question.topic]();

/** Doesn't care: can't or won't guarantee anything, so nothing can be ordered. */
const INDIFFERENT: StaffPersona = {
  label: 'gleichgültig, kann nichts garantieren',
  answer: (context) =>
    byTopic(context, {
      allergens: () => ({ replyId: riskCategories(context.findings).size > 0 ? 'unknown' : 'none' }),
      cross: () => ({ replyId: 'unknown' }),
      ingredient: () => ({ replyId: 'unknown' }),
    }),
};

/** Very helpful: knows the risks and offers a change wherever needed. */
const VERY_HELPFUL: StaffPersona = {
  label: 'sehr hilfsbereit, kennt die Risiken, bietet Änderungen an',
  answer: (context) => {
    const categories = riskCategories(context.findings);
    return byTopic(context, {
      allergens: () =>
        categories.has('fries') || categories.has('fried')
          ? { replyId: 'with-change', noteId: categories.has('fries') ? 'salade-frites' : 'huile-propre' }
          : categories.has('nut')
            ? { replyId: 'with-change', noteId: 'sans-fruits-coque' }
            : { replyId: 'none' },
      cross: () => ({ replyId: 'cross-none' }),
      ingredient: () =>
        categories.has('fries') ? { replyId: 'with-change', noteId: 'salade-frites' } : { replyId: 'ingredient-no' },
    });
  },
};

/** Helpful, but the pastry and the ice cream are made next to nuts: desserts can be cross-contaminated. */
const HELPFUL_CROSS: StaffPersona = {
  label: 'hilfsbereit, aber Desserts und Gebäck mit Kreuzkontamination',
  answer: (context) => {
    const categories = riskCategories(context.findings);
    const risky = isSweetOrSnack(context.item) || categories.has('nut') || categories.has('flour');
    return byTopic(context, {
      allergens: () => ({ replyId: 'none' }),
      cross: () => ({ replyId: risky ? 'cross-possible' : 'cross-none' }),
      ingredient: () => ({ replyId: 'ingredient-no' }),
    });
  },
};

/** Ready-made products from packages: sweets and snacks "may contain traces of peanuts". */
const PACKAGED: StaffPersona = {
  label: 'Fertigprodukte: Süßes und Snacks mit Spurenhinweis',
  answer: (context) => {
    const sweet = isSweetOrSnack(context.item);
    return byTopic(context, {
      allergens: () => ({ replyId: sweet ? 'traces' : 'none' }),
      cross: () => ({ replyId: sweet ? 'traces' : 'cross-none' }),
      ingredient: () => ({ replyId: sweet ? 'unknown' : 'ingredient-no' }),
    });
  },
};

/** Nut kitchen: oriental pastry with peanuts, nuts everywhere; only fruit is clean. */
const NUT_KITCHEN: StaffPersona = {
  label: 'Nussküche: Gebäck mit Erdnüssen, nur Obst ohne Kontakt',
  answer: (context) => {
    const categories = riskCategories(context.findings);
    const pastry = context.findings.some((f) => f.ingredient?.id === 'patisserie');
    return byTopic(context, {
      allergens: () => ({ replyId: pastry && categories.has('nut') ? 'peanut' : categories.has('nut') ? 'traces' : 'none' }),
      cross: () => ({ replyId: categories.size > 0 ? 'cross-possible' : 'cross-none' }),
      ingredient: () => ({ replyId: categories.has('nut') ? 'ingredient-yes' : 'ingredient-no' }),
    });
  },
};

/** Helpful, but the fryer uses peanut oil: fries can be swapped for salad, other fried food is out. */
const PEANUT_FRYER: StaffPersona = {
  label: 'hilfsbereit, Fritteuse mit Erdnussöl: Pommes werden ersetzt',
  answer: (context) => {
    const categories = riskCategories(context.findings);
    return byTopic(context, {
      allergens: () =>
        categories.has('fried')
          ? { replyId: 'peanut' }
          : categories.has('fries')
            ? { replyId: 'with-change', noteId: 'salade-frites' }
            : { replyId: 'none' },
      cross: () => ({ replyId: categories.has('fried') ? 'cross-possible' : 'cross-none' }),
      ingredient: () =>
        categories.has('fried')
          ? { replyId: 'ingredient-yes' }
          : categories.has('fries')
            ? { replyId: 'with-change', noteId: 'salade-frites' }
            : { replyId: 'ingredient-no' },
    });
  },
};

/** Demo menu id (= QR menu id) → how that restaurant's staff answers. */
export const RESTAURANT_STAFF: Record<string, StaffPersona> = {
  brasserie: INDIFFERENT,
  chouchou: VERY_HELPFUL,
  'bistro-saison': HELPFUL_CROSS,
  'tgv-bistro': PACKAGED,
  'desserts-marocains': NUT_KITCHEN,
  'grande-brasserie': PEANUT_FRYER,
};

export function staffPersona(menuId: string | null): StaffPersona | null {
  return menuId ? (RESTAURANT_STAFF[menuId] ?? null) : null;
}
