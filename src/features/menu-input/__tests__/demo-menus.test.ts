import { describe, expect, it } from '@jest/globals';

import { dishKnowledge } from '@/features/dish-db';

import { DEMO_MENUS } from '../demo-menus';
import { parseMenuText } from '../parse-menu';

/** Dishes on the demo menus that are deliberately left unknown (shows the "unknown dish" path). */
const KNOWN_UNKNOWN = new Set(['Suspens']);

describe('demo menus', () => {
  it('have unique ids', () => {
    expect(new Set(DEMO_MENUS.map((menu) => menu.id)).size).toBe(DEMO_MENUS.length);
  });

  it.each(DEMO_MENUS.map((menu) => [menu.id, menu] as const))('%s: every dish is in the database or a generic term', (_id, menu) => {
    const missing = parseMenuText(menu.text, dishKnowledge)
      .filter((item) => !item.match && !item.generic && !KNOWN_UNKNOWN.has(item.name))
      .map((item) => item.name);
    expect(missing).toEqual([]);
  });
});
