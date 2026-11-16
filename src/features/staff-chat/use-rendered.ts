import { useEffect, useState } from 'react';

import { translator } from './index';
import type { Language, Phrase } from './types';

/** Renders phrases with the (possibly async) translator, e.g. for the staff's answer buttons. */
export function useRenderedPhrases(phrases: Phrase[], language: Language): string[] {
  const key = JSON.stringify(phrases);
  const [texts, setTexts] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const parsed = JSON.parse(key) as Phrase[];
    Promise.all(parsed.map((phrase) => translator.render(phrase, language))).then((result) => {
      if (!cancelled) setTexts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [key, language]);

  return texts;
}
