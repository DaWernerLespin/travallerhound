import { ALLERGENS, type Allergen, type GenericTerm, type Ingredient } from '@/features/dish-db/types';

import type { DishRating, Finding, FindingSource, RatingInput, StaffVerdict } from './types';
import { EMPTY_VERDICT } from './types';

export const ALLERGEN_LABEL: Record<Allergen, string> = { peanut: 'Erdnuss', lupin: 'Lupine' };

const SOURCE_LABEL: Record<FindingSource, string> = {
  db: 'Typische Zutaten',
  menu: 'Speisekarte',
  name: 'Name des Gerichts',
  staff: 'Personal',
};

export function sourceLabel(source: FindingSource): string {
  return SOURCE_LABEL[source];
}

/**
 * Safety rating for one dish. Safety first:
 * - "contains" can never be overridden, not even by the staff.
 * - Only the staff can make a dish safe (no peanut, no lupin, no cross-contamination).
 * - If the staff can't rule something out, the dish is a risk: after the conversation it is either safe or not.
 */
export function rateDish(input: RatingInput, verdict: StaffVerdict = EMPTY_VERDICT): DishRating {
  const findings = collectFindings(input, verdict);
  const checks = buildChecks(input, findings);

  const contains = findings.find((f) => f.level === 'contains' && f.source !== 'staff');
  if (contains) {
    return { status: 'unsafe', reason: contains.text, findings, checks };
  }

  const staffPresent = findings.find((f) => f.source === 'staff' && f.level === 'contains');
  if (staffPresent) {
    return { status: 'unsafe', reason: staffPresent.text, findings, checks };
  }

  const staffUnsure = findings.find((f) => f.source === 'staff' && f.level === 'unknown');
  if (staffUnsure) {
    return { status: 'unsafe', reason: `${staffUnsure.text} Deshalb gebe ich das Gericht nicht frei.`, findings, checks };
  }

  // A category like "Burgers" can't be rated – not even after staff answers, since the actual dish stays open.
  if (input.generic) {
    return { status: 'undefined', reason: genericReason(input.generic), findings, checks };
  }

  if (isConfirmedByStaff(verdict)) {
    return {
      status: 'safe',
      reason: 'Das Personal bestätigt: keine Erdnüsse, keine Lupinen und keine Kreuzkontamination.',
      findings,
      checks,
    };
  }

  if (!input.dbDish) {
    return {
      status: 'undefined',
      reason:
        'Dieses Gericht kenne ich nicht und die Karte nennt evtl. nicht alle Zutaten. Bitte frag unbedingt beim Personal nach.',
      findings,
      checks,
    };
  }

  const open = findings.find((f) => f.level === 'hidden' || f.level === 'unknown');
  if (open) {
    return { status: 'undefined', reason: open.text, findings, checks };
  }

  return {
    status: 'likely_safe',
    reason:
      'Ich habe keine typischen Risiken gefunden. Sicher ist es erst, wenn das Personal Zubereitung und Kreuzkontamination bestätigt.',
    findings,
    checks,
  };
}

/** Safe only if the staff confirmed all three and was not unsure about any ingredient. */
export function genericReason(term: GenericTerm): string {
  return `„${term.fr}“ bedeutet „${term.meaning}“ und ist zu allgemein formuliert, um eine Aussage zu treffen. Frag beim Personal, was genau serviert wird.`;
}

export function isConfirmedByStaff(verdict: StaffVerdict): boolean {
  const unsureAboutIngredient = Object.values(verdict.ingredients).some((answer) => answer !== 'absent');
  return (
    verdict.peanut === 'absent' &&
    verdict.lupin === 'absent' &&
    verdict.crossContamination === 'absent' &&
    !unsureAboutIngredient
  );
}

function collectFindings(input: RatingInput, verdict: StaffVerdict): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  const addIngredient = (ingredient: Ingredient, source: FindingSource) => {
    if (seen.has(ingredient.id)) return;
    seen.add(ingredient.id);
    const staffAnswer = verdict.ingredients[ingredient.id];
    for (const allergen of ALLERGENS) {
      const level = ingredient.risk[allergen];
      if (level === 'none') continue;
      // The staff can clear a hidden risk of one ingredient, never a "contains".
      if (level === 'hidden' && staffAnswer === 'absent') continue;
      findings.push({
        source,
        level: level === 'hidden' && staffAnswer === 'present' ? 'contains' : level,
        allergen,
        ingredient,
        text: ingredientText(ingredient, allergen, level, staffAnswer === 'present'),
      });
    }
  };

  for (const ingredient of input.nameIngredients) addIngredient(ingredient, 'name');
  for (const ingredient of input.menuIngredients) addIngredient(ingredient, 'menu');
  for (const ingredient of input.dbIngredients) addIngredient(ingredient, 'db');

  for (const item of input.unknownMenuItems) {
    findings.push({
      source: 'menu',
      level: 'unknown',
      text: `Die Zutat „${item}“ kenne ich nicht. Bitte beim Personal nachfragen.`,
    });
  }

  findings.push(...staffFindings(verdict));
  return findings;
}

function ingredientText(ingredient: Ingredient, allergen: Allergen, level: 'hidden' | 'contains', staffSaysPresent: boolean): string {
  const name = `${ingredient.de} (${ingredient.fr})`;
  if (staffSaysPresent) return `Das Personal sagt: ${name} enthält ${ALLERGEN_LABEL[allergen]}.`;
  if (level === 'contains') return `${name} enthält ${ALLERGEN_LABEL[allergen]}. ${ingredient.note ?? ''}`.trim();
  return `${name}: ${ALLERGEN_LABEL[allergen]} möglich. ${ingredient.note ?? ''}`.trim();
}

function staffFindings(verdict: StaffVerdict): Finding[] {
  const findings: Finding[] = [];
  const unsureIngredients = Object.values(verdict.ingredients).filter((answer) => answer === 'unknown').length;
  if (unsureIngredients > 0) {
    findings.push({ source: 'staff', level: 'unknown', text: 'Das Personal kann ein Risiko bei einer Zutat nicht ausschließen.' });
  }
  for (const allergen of ALLERGENS) {
    const answer = verdict[allergen];
    if (answer === 'present') {
      findings.push({ source: 'staff', level: 'contains', allergen, text: `Das Personal sagt: Das Gericht enthält ${ALLERGEN_LABEL[allergen]}.` });
    } else if (answer === 'unknown') {
      findings.push({ source: 'staff', level: 'unknown', allergen, text: `Das Personal kann ${ALLERGEN_LABEL[allergen]} nicht ausschließen.` });
    } else if (answer === 'absent') {
      findings.push({ source: 'staff', level: 'none', allergen, text: `Das Personal bestätigt: ohne ${ALLERGEN_LABEL[allergen]}.` });
    }
  }
  if (verdict.crossContamination === 'present') {
    findings.push({ source: 'staff', level: 'contains', text: 'Das Personal sagt: Kreuzkontamination ist möglich.' });
  } else if (verdict.crossContamination === 'unknown') {
    findings.push({ source: 'staff', level: 'unknown', text: 'Das Personal kann eine Kreuzkontamination nicht ausschließen.' });
  } else if (verdict.crossContamination === 'absent') {
    findings.push({ source: 'staff', level: 'none', text: 'Das Personal bestätigt: keine Kreuzkontamination.' });
  }
  return findings;
}

function buildChecks(input: RatingInput, findings: Finding[]): string[] {
  const checks = [
    input.generic
      ? `„${input.generic.fr}“ ist ein Oberbegriff`
      : input.dbDish
        ? `Rezept „${input.dbDish.fr}“ gefunden`
        : 'Suche das Gericht in der Datenbank',
  ];
  for (const finding of findings) {
    if (!finding.ingredient || !finding.allergen || finding.source === 'staff') continue;
    checks.push(`Prüfe ${finding.ingredient.de} auf ${ALLERGEN_LABEL[finding.allergen]}`);
  }
  checks.push('Prüfe Erdnuss und Lupine');
  return [...new Set(checks)].slice(0, 4);
}
