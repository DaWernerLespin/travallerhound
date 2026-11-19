import type { GenericTerm } from '../types';

/**
 * Menu entries that name a category, not a dish ("Burgers", "Accompagnements").
 * They are never matched to a single dish and always stay "Unklar".
 * A menu line counts as generic only if it consists of nothing but one of these terms.
 */
function term(id: string, fr: string, meaning: string, aliases: string[] = []): GenericTerm {
  return { id, fr, meaning, aliases };
}

export const GENERIC_TERMS: GenericTerm[] = [
  term('burgers', 'Burgers', 'verschiedene Burger', ['burger', 'nos burgers']),
  term('pizzas', 'Pizzas', 'verschiedene Pizzen', ['nos pizzas']),
  term('formule-partager', 'Formule à partager', 'ein Angebot zum Teilen, meist mehrere Gerichte', [
    'formule',
    'a partager',
    'planche a partager',
    'plateau a partager',
  ]),
  term('formule-midi', 'Formule midi', 'ein Mittagsmenü', ['formule du midi', 'menu midi', 'formule dejeuner']),
  term('accompagnements', 'Accompagnements', 'Beilagen', ['accompagnement', 'garniture', 'garnitures', 'nos accompagnements']),
  term('plat-du-jour', 'Plat du jour', 'das Tagesgericht', ['plat du moment', 'suggestion du jour', 'menu du jour']),
  term('suggestion-chef', 'Suggestion du chef', 'eine Empfehlung des Küchenchefs', [
    'suggestions du chef',
    'specialite du chef',
    'idee du chef',
    'selon arrivage',
  ]),
  term('entree-du-jour', 'Entrée du jour', 'die Tagesvorspeise', ['entree du moment']),
  term('dessert-du-jour', 'Dessert du jour', 'das Tagesdessert', ['dessert du moment', 'dessert maison', 'desserts maison']),
  term('desserts', 'Desserts', 'verschiedene Nachspeisen', ['nos desserts']),
  term('glaces', 'Glaces', 'verschiedene Eissorten', ['glaces et sorbets', 'nos glaces']),
  term('menu-enfant', 'Menu enfant', 'ein Kindermenü', ['menu enfants', 'formule enfant', 'menu kids']),
  term('tapas', 'Tapas', 'eine Auswahl kleiner Häppchen', ['nos tapas']),
];
