import type { Ingredient, RiskLevel } from '../types';

/**
 * Curated ingredient table. Risks are typical assumptions for French restaurants (team research),
 * not verified per restaurant. Only the staff can confirm the actual preparation.
 */
function ing(
  id: string,
  fr: string,
  de: string,
  aliases: string[] = [],
  peanut: RiskLevel = 'none',
  lupin: RiskLevel = 'none',
  note?: string,
): Ingredient {
  return { id, fr, de, aliases, risk: { peanut, lupin }, note };
}

const FRYING_NOTE =
  'In Frankreich wird oft in Erdnussöl (huile d’arachide) frittiert – das steht meist nicht auf der Karte.';
const FLOUR_NOTE =
  'In Frankreich enthalten Backwaren und Teige teils Lupinenmehl (farine de lupin) – selten deklariert.';
const OIL_NOTE = 'Für Dressings und Saucen wird in Frankreich teils Erdnussöl verwendet.';

export const INGREDIENTS: Ingredient[] = [
  // --- contains ---
  ing('arachide', 'arachide', 'Erdnuss', ['arachides', 'cacahuete', 'cacahuetes', 'cacahouete', 'cacahouetes'], 'contains', 'none', 'Erdnüsse sind direkt enthalten.'),
  ing('huile-arachide', 'huile d’arachide', 'Erdnussöl', ['huile arachide'], 'contains', 'none', 'Erdnussöl ist direkt enthalten.'),
  ing('beurre-cacahuete', 'beurre de cacahuète', 'Erdnussbutter', ['beurre cacahuete', 'beurre d arachide'], 'contains', 'none', 'Erdnussbutter ist direkt enthalten.'),
  ing('sauce-satay', 'sauce satay', 'Satay-Sauce', ['satay'], 'contains', 'none', 'Satay-Sauce wird mit Erdnüssen gemacht.'),
  ing('lupin', 'lupin', 'Lupine', ['lupins', 'graines de lupin'], 'none', 'contains', 'Lupinen sind direkt enthalten.'),
  ing('farine-lupin', 'farine de lupin', 'Lupinenmehl', ['farine lupin'], 'none', 'contains', 'Lupinenmehl ist direkt enthalten.'),

  // --- hidden peanut (frying, oil, nut products) ---
  ing('frites', 'frites', 'Pommes frites', ['frite', 'frites maison', 'pommes frites'], 'hidden', 'none', FRYING_NOTE),
  ing('friture', 'friture', 'Frittiertes', ['beignet', 'beignets', 'tempura', 'pane', 'panee', 'frit', 'frits'], 'hidden', 'hidden', `${FRYING_NOTE} Panaden können Lupinenmehl enthalten.`),
  ing('pommes-sarladaises', 'pommes sarladaises', 'Sarlat-Bratkartoffeln', ['sarladaise', 'sarladaises'], 'hidden', 'none', 'Meist in Entenfett gebraten, teils aber in Erdnussöl.'),
  ing('huile', 'huile', 'Öl (unbestimmt)', ['huile vegetale'], 'hidden', 'none', 'Es ist nicht angegeben, welches Öl – in Frankreich häufig Erdnussöl.'),
  ing('vinaigrette', 'vinaigrette', 'Vinaigrette', ['sauce vinaigrette'], 'hidden', 'none', OIL_NOTE),
  ing('mayonnaise', 'mayonnaise', 'Mayonnaise', ['mayo'], 'hidden', 'none', 'Hausgemachte Mayonnaise wird teils mit Erdnussöl gerührt.'),
  ing('sauce-cesar', 'sauce César', 'Caesar-Dressing', ['sauce cesar'], 'hidden', 'none', OIL_NOTE),
  ing('rouille', 'rouille', 'Rouille', [], 'hidden', 'hidden', 'Knoblauch-Öl-Sauce, teils mit Erdnussöl; mit Brot gebunden (Lupinenmehl möglich).'),
  ing('pistou', 'pistou', 'Pistou', ['pesto'], 'hidden', 'none', 'Pistou ist eigentlich nussfrei, Pesto wird aber teils mit günstigeren Nüssen oder Erdnüssen gestreckt.'),
  ing('praline', 'praliné', 'Praliné', ['praline', 'pralinee'], 'hidden', 'none', 'Praliné ist meist aus Haselnuss oder Mandel, kann aber Erdnüsse oder Erdnussspuren enthalten.'),
  ing('noix', 'noix', 'Walnüsse', ['noix de grenoble', 'cerneaux de noix'], 'hidden', 'none', 'Walnuss ist keine Erdnuss, Nüsse werden aber oft zusammen mit Erdnüssen verarbeitet (Spuren).'),
  ing('noisette', 'noisette', 'Haselnuss', ['noisettes'], 'hidden', 'none', 'Haselnussprodukte können Erdnussspuren enthalten.'),
  ing('amande', 'amande', 'Mandel', ['amandes', 'poudre d amande'], 'hidden', 'none', 'Mandelprodukte können Erdnussspuren enthalten.'),
  ing('pate-tartiner', 'pâte à tartiner', 'Nuss-Nougat-Creme', ['nutella', 'pate a tartiner'], 'hidden', 'none', 'Kann Erdnussspuren enthalten.'),
  ing('chocolat', 'chocolat', 'Schokolade', ['chocolat noir', 'cacao'], 'hidden', 'none', 'Schokolade wird oft auf Anlagen mit Erdnüssen verarbeitet (Spuren).'),
  ing('glace', 'glace', 'Speiseeis', ['glaces', 'creme glacee', 'sorbet'], 'hidden', 'none', 'Eis wird oft mit Nusssorten gemeinsam portioniert (Kreuzkontakt).'),
  ing('nougat', 'nougat', 'Nougat', [], 'hidden', 'none', 'Nougat kann Erdnüsse enthalten.'),
  ing('curry', 'curry', 'Currysauce', ['sauce curry'], 'hidden', 'none', 'Currysaucen enthalten teils Erdnüsse oder Erdnussöl.'),

  // --- hidden lupin (flour, bakery, pastry) ---
  ing('farine', 'farine', 'Mehl (unbestimmt)', [], 'none', 'hidden', FLOUR_NOTE),
  ing('pain', 'pain', 'Brot', ['baguette', 'pain de campagne', 'pain grille'], 'none', 'hidden', FLOUR_NOTE),
  ing('toast', 'toast', 'Toast', ['toasts', 'pain de mie'], 'none', 'hidden', FLOUR_NOTE),
  ing('croutons', 'croûtons', 'Croûtons', ['crouton'], 'hidden', 'hidden', `${FLOUR_NOTE} Croûtons werden außerdem oft in Öl geröstet.`),
  ing('pate-feuilletee', 'pâte feuilletée', 'Blätterteig', ['feuillete', 'feuilletee', 'croustillant', 'vol au vent', 'bouchee'], 'none', 'hidden', FLOUR_NOTE),
  ing('pate-brisee', 'pâte brisée', 'Mürbeteig', ['pate sablee', 'fond de tarte', 'tarte', 'tartelette', 'quiche'], 'none', 'hidden', FLOUR_NOTE),
  ing('chapelure', 'chapelure', 'Paniermehl/Gratinkruste', ['panure', 'gratine', 'gratinee', 'gratin'], 'none', 'hidden', 'Paniermehl und Gratinkruste können Lupinenmehl enthalten.'),
  ing('bechamel', 'béchamel', 'Béchamelsauce', ['sauce bechamel', 'veloute', 'sauce blanche'], 'none', 'hidden', 'Mit Mehl gebunden – Lupinenmehl möglich.'),
  ing('crepe', 'crêpe', 'Crêpe-Teig', ['crepes'], 'none', 'hidden', FLOUR_NOTE),
  ing('galette', 'galette de sarrasin', 'Buchweizen-Galette', ['sarrasin', 'ble noir', 'galette'], 'none', 'hidden', 'Buchweizenteig wird teils mit Mehlmischungen gestreckt – Lupinenmehl möglich.'),
  ing('viennoiserie', 'viennoiserie', 'Feingebäck', ['croissant', 'brioche', 'pain au chocolat'], 'none', 'hidden', FLOUR_NOTE),
  ing('patisserie', 'pâtisserie', 'Gebäck/Kuchen', ['gateau', 'biscuit', 'genoise', 'pate a choux', 'choux', 'meringue', 'macaron', 'madeleine', 'financier'], 'none', 'hidden', FLOUR_NOTE),
  ing('pates', 'pâtes fraîches', 'Frische Nudeln', ['pates fraiches', 'raviolis', 'ravioles'], 'none', 'hidden', 'Frische und glutenfreie Nudeln enthalten teils Lupinenmehl.'),
  ing('sans-gluten', 'produit sans gluten', 'Glutenfreies Produkt', ['sans gluten'], 'none', 'hidden', 'Glutenfreie Backwaren und Teige enthalten besonders häufig Lupinenmehl.'),
  ing('charcuterie', 'charcuterie', 'Wurstwaren', ['saucisson', 'saucisse', 'saucisses', 'pate de campagne', 'terrine', 'rillettes', 'andouillette', 'boudin', 'chorizo'], 'none', 'hidden', 'Verarbeitete Wurstwaren können Lupinenprotein als Bindemittel enthalten.'),
  ing('pois-chiche', 'farine de pois chiche', 'Kichererbsenmehl', ['pois chiche', 'pois chiches'], 'hidden', 'hidden', 'Hülsenfrucht-Mehle werden teils gemischt oder auf denselben Anlagen verarbeitet.'),

  // --- no known risk ---
  ing('tomate', 'tomate', 'Tomate', ['tomates', 'tomate cerise']),
  ing('salade', 'salade', 'Blattsalat', ['salade verte', 'laitue', 'mesclun', 'roquette', 'mache', 'frisee']),
  ing('oeuf', 'œuf', 'Ei', ['oeufs', 'oeuf dur', 'jaune d oeuf', 'oeuf poche']),
  ing('jambon', 'jambon', 'Schinken', ['jambon de pays', 'jambon cru', 'jambon blanc', 'jambon de bayonne']),
  ing('pomme-de-terre', 'pomme de terre', 'Kartoffel', ['pommes de terre', 'pommes vapeur', 'puree', 'pommes grenaille']),
  ing('thon', 'thon', 'Thunfisch'),
  ing('olive', 'olive', 'Oliven', ['olives', 'olives vertes', 'olives noires']),
  ing('huile-olive', 'huile d’olive', 'Olivenöl', ['huile olive']),
  ing('haricot-vert', 'haricots verts', 'Grüne Bohnen', ['haricot vert']),
  ing('anchois', 'anchois', 'Sardellen'),
  ing('poulet', 'poulet', 'Hähnchen', ['volaille', 'blanc de poulet', 'coq']),
  ing('parmesan', 'grana padano', 'Hartkäse (Grana Padano/Parmesan)', ['parmesan', 'copeaux de parmesan']),
  ing('fromage', 'fromage', 'Käse', ['fromages', 'emmental', 'comte', 'gruyere', 'cantal', 'reblochon', 'roquefort', 'fromage de brebis', 'brebis', 'tomme', 'raclette']),
  ing('chevre', 'chèvre', 'Ziegenkäse', ['chevre chaud', 'fromage de chevre']),
  ing('mozzarella', 'mozzarella', 'Mozzarella', ['burrata']),
  ing('carotte', 'carotte', 'Karotte', ['carottes', 'carottes rapees']),
  ing('concombre', 'concombre', 'Gurke'),
  ing('radis', 'radis', 'Radieschen'),
  ing('mais', 'maïs', 'Mais'),
  ing('foie-gras', 'foie gras', 'Foie gras'),
  ing('gesier', 'gésiers', 'Geflügelmagen', ['gesier']),
  ing('canard', 'canard', 'Ente', ['magret', 'magret de canard', 'confit de canard', 'cuisse de canard']),
  ing('champignon', 'champignons', 'Pilze', ['champignon', 'champignons de paris', 'cepes', 'girolles']),
  ing('avocat', 'avocat', 'Avocado'),
  ing('pamplemousse', 'pamplemousse', 'Grapefruit'),
  ing('saumon', 'saumon', 'Lachs', ['saumon fume']),
  ing('herbes', 'herbes', 'Kräuter', ['aneth', 'basilic', 'persil', 'ciboulette', 'estragon', 'thym', 'fines herbes', 'herbes de provence']),
  ing('boeuf', 'bœuf', 'Rind', ['boeuf', 'entrecote', 'bavette', 'onglet', 'steak', 'tournedos', 'joue de boeuf']),
  ing('veau', 'veau', 'Kalb', ['escalope']),
  ing('porc', 'porc', 'Schwein', ['lardons', 'lard', 'poitrine']),
  ing('agneau', 'agneau', 'Lamm', ['gigot']),
  ing('lapin', 'lapin', 'Kaninchen'),
  ing('escargot', 'escargots', 'Schnecken', ['escargot']),
  ing('beurre', 'beurre', 'Butter', ['beurre persille', 'beurre d ail']),
  ing('creme', 'crème', 'Sahne/Milch', ['creme fraiche', 'lait', 'creme anglaise', 'chantilly', 'fromage blanc']),
  ing('ail', 'ail', 'Knoblauch'),
  ing('oignon', 'oignon', 'Zwiebel', ['oignons', 'echalote', 'echalotes']),
  ing('legumes', 'légumes', 'Gemüse', ['legume', 'courgette', 'courgettes', 'aubergine', 'aubergines', 'poivron', 'poivrons', 'poivrons rouges', 'artichaut', 'poireau', 'poireaux', 'navet', 'celeri', 'epinards', 'chou', 'choucroute']),
  ing('potiron', 'potiron', 'Kürbis', ['citrouille', 'butternut']),
  ing('figue', 'figues', 'Feigen', ['figue', 'confit de figues']),
  ing('fruits', 'fruits', 'Obst', ['pomme', 'poire', 'citron', 'orange', 'fraise', 'fraises', 'framboise', 'cerises', 'cerise', 'abricot', 'fruits rouges']),
  ing('fruits-mer', 'fruits de mer', 'Meeresfrüchte', ['moules', 'huitres', 'crevettes', 'saint jacques', 'coquilles saint jacques', 'langoustines']),
  ing('poisson', 'poisson', 'Fisch', ['bar', 'sole', 'cabillaud', 'morue', 'dorade', 'merlu', 'rascasse', 'lotte']),
  ing('vin', 'vin', 'Wein/Alkohol', ['vin blanc', 'vin rouge', 'cidre', 'calvados', 'cognac', 'grand marnier']),
  ing('moutarde', 'moutarde', 'Senf'),
  ing('sucre', 'sucre', 'Zucker', ['caramel', 'miel', 'vanille', 'caramelise']),
  ing('riz', 'riz', 'Reis'),
  ing('legumineuses', 'haricots blancs', 'Weiße Bohnen/Linsen', ['lentilles', 'flageolets']),
];
