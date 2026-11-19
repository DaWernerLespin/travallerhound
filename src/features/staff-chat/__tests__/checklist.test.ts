import { describe, expect, it } from '@jest/globals';

import { EMPTY_VERDICT } from '@/features/dish-rating/types';

import { buildChecklist, buildQuestions } from '../conversation';
import { PhraseTableTranslator } from '../phrases';

describe('staff checklist', () => {
  const questions = buildQuestions('Steak frites', []);

  it('starts with everything open', () => {
    expect(buildChecklist(questions, EMPTY_VERDICT).map((item) => [item.label, item.state])).toEqual([
      ['Erdnüsse', 'open'],
      ['Lupinen', 'open'],
      ['Kreuzkontamination', 'open'],
    ]);
  });

  it('ticks items off with the staff answers', () => {
    const verdict = { ...EMPTY_VERDICT, peanut: 'absent', lupin: 'unknown', crossContamination: 'present' } as const;
    expect(buildChecklist(questions, verdict).map((item) => item.state)).toEqual(['ok', 'unclear', 'risk']);
  });
});

describe('staff phrases', () => {
  const translator = new PhraseTableTranslator();

  it('explains the severity in the one-time intro, not in every dish question', async () => {
    expect(await translator.render({ id: 'intro' }, 'fr')).toContain('choc allergique');
    expect(await translator.render({ id: 'ask_allergens', params: { dish: 'X' } }, 'de')).not.toContain('Allergie');
  });

  it('asks about cross-contamination per dish', async () => {
    const cross = buildQuestions('Steak frites', []).find((q) => q.topic === 'cross');
    expect(await translator.render(cross!.phrase, 'de')).toContain('Steak frites');
  });
});
