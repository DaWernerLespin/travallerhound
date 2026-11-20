import type { Language, Phrase, Translator } from './types';

type Params = Record<string, string>;
type Template = Record<Language, (p: Params) => string>;

/** Offline phrase table (DE ↔ FR). Add phrases here; ids are referenced by questions and replies. */
const PHRASES: Record<string, Template> = {
  // --- traveler ---
  /** Sent once per restaurant visit, before the first question: severity + a friendly, grateful tone. */
  intro: {
    de: () =>
      'Guten Tag! Ihre Karte sieht köstlich aus und ich würde sehr gerne bei Ihnen essen. Ich habe eine schwere Allergie gegen Erdnüsse und Lupinen: Schon kleinste Spuren können bei mir einen lebensbedrohlichen allergischen Schock auslösen. Ich habe ein Notfallmedikament dabei. Ich stelle Ihnen ein paar kurze Fragen zu den Gerichten. Vielen Dank für Ihre Hilfe!',
    fr: () =>
      'Bonjour ! Votre carte a l’air délicieuse et j’aimerais beaucoup manger chez vous. J’ai une allergie grave aux arachides et au lupin : même des traces infimes peuvent provoquer chez moi un choc allergique mortel. J’ai un médicament d’urgence sur moi. Je vais vous poser quelques questions rapides sur les plats. Merci beaucoup pour votre aide !',
  },
  ask_allergens: {
    de: (p) => `Enthält „${p.dish}“ Erdnüsse, Erdnussöl, Lupinen oder Lupinenmehl?`,
    fr: (p) => `Le plat « ${p.dish} » contient-il des arachides, de l’huile d’arachide, du lupin ou de la farine de lupin ?`,
  },
  ask_cross: {
    de: (p) =>
      `Kann „${p.dish}“ ohne Kreuzkontamination zubereitet werden, mit sauberen Utensilien und ohne Öl, das mit Erdnüssen in Kontakt gekommen ist?`,
    fr: (p) =>
      `Pouvez-vous préparer « ${p.dish} » sans contamination croisée, avec des ustensiles propres et sans huile ayant été en contact avec des arachides ?`,
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
  order_list: {
    de: (p) => `Vielen Dank für Ihre Hilfe! Ich bestelle gerne: ${p.listDe}`,
    fr: (p) => `Merci beaucoup pour votre aide ! Je voudrais commander : ${p.listFr}`,
  },
  order: {
    de: () => 'Vielen Dank für Ihre Hilfe! Dann nehme ich sehr gerne dieses Gericht.',
    fr: () => 'Merci beaucoup pour votre aide ! Je prends ce plat avec plaisir.',
  },
  decline: {
    de: () => 'Vielen Dank für Ihre Ehrlichkeit! Ich wähle ein anderes Gericht.',
    fr: () => 'Merci beaucoup pour votre franchise ! Je vais choisir un autre plat.',
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
  reply_with_change: {
    de: (p) => `Ja, mit einer Änderung: ${p.noteDe}.`,
    fr: (p) => `Oui, avec une modification : ${p.noteFr}.`,
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
