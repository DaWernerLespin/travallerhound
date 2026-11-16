import type { Language, Phrase, Translator } from './types';

type Params = Record<string, string>;
type Template = Record<Language, (p: Params) => string>;

/** Offline phrase table (DE ↔ FR). Add phrases here; ids are referenced by questions and replies. */
const PHRASES: Record<string, Template> = {
  // --- traveler ---
  ask_allergens: {
    de: (p) =>
      `Guten Tag! Ich habe eine schwere Allergie gegen Erdnüsse und Lupinen – schon Spuren sind gefährlich. Enthält „${p.dish}“ Erdnüsse, Erdnussöl, Lupinen oder Lupinenmehl?`,
    fr: (p) =>
      `Bonjour ! J’ai une allergie grave aux arachides et au lupin – même des traces sont dangereuses. Le plat « ${p.dish} » contient-il des arachides, de l’huile d’arachide, du lupin ou de la farine de lupin ?`,
  },
  ask_cross: {
    de: () =>
      'Können Sie das Gericht ohne Kreuzkontamination zubereiten – mit sauberen Utensilien und ohne Öl, in dem Erdnüsse frittiert wurden?',
    fr: () =>
      'Pouvez-vous préparer ce plat sans contamination croisée – avec des ustensiles propres et sans huile ayant servi à frire des arachides ?',
  },
  ask_ingredient_peanut: {
    de: (p) => `Wird „${p.ingredientDe}“ mit Erdnüssen oder Erdnussöl zubereitet?`,
    fr: (p) => `Est-ce que « ${p.ingredientFr} » est préparé avec des arachides ou de l’huile d’arachide ?`,
  },
  ask_ingredient_lupin: {
    de: (p) => `Enthält „${p.ingredientDe}“ Lupinenmehl?`,
    fr: (p) => `Est-ce que « ${p.ingredientFr} » contient de la farine de lupin ?`,
  },
  ask_ingredient_both: {
    de: (p) => `Enthält „${p.ingredientDe}“ Erdnüsse, Erdnussöl oder Lupinenmehl?`,
    fr: (p) => `Est-ce que « ${p.ingredientFr} » contient des arachides, de l’huile d’arachide ou de la farine de lupin ?`,
  },
  order: {
    de: () => 'Vielen Dank! Dann nehme ich dieses Gericht.',
    fr: () => 'Merci beaucoup ! Je vais prendre ce plat.',
  },
  decline: {
    de: () => 'Danke für die Information. Ich wähle ein anderes Gericht.',
    fr: () => 'Merci pour l’information. Je vais choisir un autre plat.',
  },

  // --- staff ---
  reply_none: {
    de: () => 'Nein, das Gericht enthält weder Erdnüsse noch Lupinen.',
    fr: () => 'Non, ce plat ne contient ni arachide ni lupin.',
  },
  reply_peanut: {
    de: () => 'Ja, es enthält Erdnüsse oder Erdnussöl.',
    fr: () => 'Oui, il contient de l’arachide ou de l’huile d’arachide.',
  },
  reply_lupin: {
    de: () => 'Ja, es enthält Lupinen oder Lupinenmehl.',
    fr: () => 'Oui, il contient du lupin ou de la farine de lupin.',
  },
  reply_ask_chef: {
    de: () => 'Ich frage beim Küchenchef nach. Einen Moment bitte.',
    fr: () => 'Je vais demander au chef. Un instant, s’il vous plaît.',
  },
  reply_unknown: {
    de: () => 'Das weiß ich nicht, ich kann es nicht garantieren.',
    fr: () => 'Je ne sais pas, je ne peux pas le garantir.',
  },
  reply_cross_none: {
    de: () => 'Ja, wir verwenden saubere Utensilien und Öl ohne Erdnüsse. Keine Kreuzkontamination.',
    fr: () => 'Oui, nous utiliserons des ustensiles propres et une huile sans arachide. Pas de contamination croisée.',
  },
  reply_cross_possible: {
    de: () => 'Nein, in unserer Küche ist eine Kreuzkontamination möglich.',
    fr: () => 'Non, une contamination croisée est possible dans notre cuisine.',
  },
  reply_ingredient_no: {
    de: () => 'Nein, ohne Erdnüsse und ohne Lupinen.',
    fr: () => 'Non, sans arachide et sans lupin.',
  },
  reply_ingredient_yes: {
    de: () => 'Ja, das ist enthalten.',
    fr: () => 'Oui, il en contient.',
  },
};

export class PhraseTableTranslator implements Translator {
  async render(phrase: Phrase, language: Language): Promise<string> {
    const template = PHRASES[phrase.id];
    if (!template) throw new Error(`Unknown phrase: ${phrase.id}`);
    return template[language](phrase.params ?? {});
  }
}
