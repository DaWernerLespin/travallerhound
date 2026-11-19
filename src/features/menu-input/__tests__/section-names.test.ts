import { describe, expect, it } from '@jest/globals';

import { germanSection, SECTION_NAME_COUNT, sectionTitle } from '../section-names';

describe('German section names', () => {
  it('knows at least 200 French headers', () => {
    expect(SECTION_NAME_COUNT).toBeGreaterThanOrEqual(200);
  });

  it('ignores case, accents, articles and plural', () => {
    expect(germanSection('ENTRÉES')).toBe('Vorspeisen');
    expect(germanSection('Les entrees')).toBe('Vorspeisen');
    expect(germanSection('Desserts maison')).toBe('Desserts');
    expect(germanSection('Vins au verre')).toBe('Offene Weine');
  });

  it('falls back from "nos …" to the core term', () => {
    expect(germanSection('Nos tartares')).toBe('Tatar');
  });

  it('shows both names, or only French when unknown or identical', () => {
    expect(sectionTitle('Plats')).toBe('Plats · Hauptgerichte');
    expect(sectionTitle('Chez Mamie')).toBe('Chez Mamie');
    expect(sectionTitle('Cocktails')).toBe('Cocktails');
  });
});
