/**
 * Transcripts of bundled demo menus. They stand in for OCR (not possible offline in Expo Go).
 * `(V)` marks the vegetarian leaf symbol of the original menu.
 */
export type DemoMenu = {
  id: string;
  title: string;
  /** One short German line for the demo menu list. */
  description: string;
  /** Size in bytes of the original image, used to recognise an uploaded copy (none = text-only demo). */
  fileSize?: number;
  text: string;
};

export const CHOUCHOU_MENU: DemoMenu = {
  id: 'chouchou',
  title: 'Chouchou Restaurant & Bar, Paris',
  description: 'Echte Speisekarte (Vorspeisen & Salate)',
  fileSize: 898423,
  text: `ENTRÉES
Carpaccio de boeuf au grana padano 11,90
Les escargots coquilles 6pcs 11,90 12pcs 22,90
Assiette de légumes grillés (V) 11,90
Courgettes, aubergines, poivrons rouges et verts, artichaut, laitue, olives vertes
Oeuf mayonnaise traditionnel 7,90
Croustillant de chèvre noix et basilic, salade verte 11,90
Tomates, mozzarella, vinaigrette au pistou 11,90
Terrine de foie gras de canard, confit de figues 20,90
Assiette de saumon fumé sur toasts à l'aneth, salade 19,90
Assiette de charcuterie 16,00
Assiette mixte charcuterie et fromage 18,90

SOUPES
Soupe à l'oignon gratinée 11,90
Soupe de potiron au pistou 11,90

SALADES
Salade Parisienne 16,90
Jambon, oeuf dur, tomates, pommes de terre, salade
Salade Niçoise 17,90
Thon, oeuf dur, olives, tomates, pommes de terre, haricots verts, anchois, salade
Salade Cesar 17,90
Poulet, salade, croûtons, grana padano, oeuf, sauce Cesar
Salade Végétarienne (V) 16,90
Salade, carottes râpées, concombre, tomates, radis, maïs, olives vertes
Salade Landaise 22,50
Salade, tomates, foie gras, gésiers, magret de canard, croûtons
Salade Auvergnate 17,90
Salade, tomates, oeuf, jambon de pays, cantal, noix, pommes de terre
Salade Chèvre chaud 17,90
Salade, tomates, chèvre chaud sur toast, noix, haricots verts
Salade Italienne au pistou 17,90
Salade, grana padano, mozzarella, olives, fromage de brebis, tomates, pistou, jambon cru
Salade Norvégienne 19,90
Salade, saumon fumé, oeuf, avocat, pommes de terre, tomates
Salade Fraîcheur 19,90
Salade, pamplemousse, champignons de Paris, avocat, tomates, radis, concombre`,
};

/** Text-only example that shows all three colours (incl. dishes with stated peanuts). */
export const BRASSERIE_MENU: DemoMenu = {
  id: 'brasserie',
  title: 'Beispielkarte Brasserie',
  description: 'Zeigt alle Einstufungen',
  text: `PLATS
Steak frites maison 19,50
Poulet aux cacahuètes, riz 16,90
Ratatouille provençale 13,50
Quiche lorraine, salade verte 12,90
Moules marinières 17,00
Confit de canard, pommes sarladaises 21,00
DESSERTS
Crème brûlée 7,50
Mousse au chocolat 7,00
Crêpe sans gluten au sucre 6,50
Salade de fruits frais 6,00`,
};

/** Train bistro (TGV INOUI), spring 2025 menu. Allergen notes of the original are not part of the transcript. */
export const TGV_BISTRO_MENU: DemoMenu = {
  id: 'tgv-bistro',
  title: 'Le Bistro TGV INOUI',
  description: 'Echte Karte aus dem Zug: Snacks, Clubs, Süßes',
  text: `SALADES
Carottes râpées aux agrumes 4,90
Pommes de terre sauce gribiche: dés de Cantal 9,90

CLUBS
Club jambon: beurre demi-sel, emmental 6,90
Club poulet: mayonnaise, tomates mi-séchées 6,90

CHAUD
Quiche Lorraine 7,40
Croque-monsieur 7,90
Burger bœuf: cheddar, sauce tomate 9,40
Saucisse de Toulouse: purée 10,50
Plat du moment 10,50

DESSERTS
Yaourt vanille 3,40
Yaourt mangue 3,60
Purée de fruits du moment 3,90
Fondant au chocolat 4,90

GÂTEAUX DE VOYAGE
Madeleine pur beurre 3,20
Cookie aux éclats de chocolat noir 3,50
Cake citron-pavot 4,10
Moelleux au chocolat 4,10

BRIOCHES
Brioche pur beurre au sucre 2,30
Brioche aux pépites de chocolat 2,50

GOURMANDISES
Petits carrés chocolat au lait et cœur caramel 2,50
M&M's bonbons chocolatés 3,00
Bonbons Haribo 3,20
Chocolat noir aux noisettes et amandes 4,40

ENCAS SALÉS
Chips cuites au chaudron 3,00
Mini saucissons secs 3,80
Noix de cajou aux herbes de Provence 3,90`,
};

/** Seasonal bistro with daily lunch formula. */
export const BISTRO_SAISON_MENU: DemoMenu = {
  id: 'bistro-saison',
  title: 'Bistro de saison',
  description: 'Echte Karte: Vorspeisen, Hauptgerichte, Desserts, Eis',
  text: `ENTRÉES
Velouté de courge: éclats de marrons 9,00
Poireaux vinaigrette et œuf mimosa 10,00
Salade de haricots coco: tomates séchées, magret fumé, poire 10,00
Carpaccio de saumon: vinaigrette miso et passion 14,00
Crème de pommes de terre et oignons: toast au comté, crème de truffe 15,00
Escargots: chorizo, crème d'ail 12,00
Ceviche de dorade: purée de haricots coco, crème de coco aux marrons 14,00

PLATS
Risotto aux champignons 14,00
Magret de canard: tatin de légumes, jus au vinaigre balsamique 19,00
Filet de volaille aux morilles: purée de pommes de terre 27,00
Côte de veau: purée de céleri, sauce Périgueux 31,00
Tartare de bœuf: pommes frites 18,00
Filet de maigre: butternut rôtie, beurre blanc à l'orange safrané 18,00
Cabillaud: fregola, bouillon de champignons à la moelle 20,00

FROMAGES
Saint-Marcellin 8,00

DESSERTS
Pain perdu aux poires et noisettes 8,00
Pomme rôtie: ganache marron et rhum, crumble 8,00
Moelleux au chocolat: crème fraîche épicée 8,00
Agrumes: gelée à l'hibiscus, gâteau au yaourt de brebis 8,00
Café gourmand 9,00

GLACES
Fraisier Melba: fraise, sorbet fraise, glace vanille, chantilly, coulis de fraise 13,00
Chocolat liégeois: glace chocolat, glace vanille, glaçage chocolat, chantilly, amandes 12,00
Pina colada: sorbet coco, sorbet ananas, chantilly, ananas 13,00
Tarte citron: sorbet citron, sorbet citron vert, sablé breton, chantilly, amandes 12,00
Pistachio: glace chocolat, glace pistache, glaçage chocolat, chantilly 12,00`,
};

/** Dessert menu of a Moroccan restaurant. */
export const MAROCAIN_DESSERTS_MENU: DemoMenu = {
  id: 'desserts-marocains',
  title: 'Restaurant marocain, Desserts',
  description: 'Echte Dessertkarte: orientalisches Gebäck, Eis',
  text: `NOS DESSERTS
Datte en branche 7,50
Pâtisserie orientale 3,00
Ananas au kirsch 8,50
Ananas frais 7,50
Salade de fruits à la marocaine 8,00
Salade d'orange à la marocaine 7,50

DESSERTS GLACÉS
Suspens 7,50
Nougat glacé 7,50
Profiteroles 8,00
Noix de coco givrée 7,50
Orange givrée 7,50
Citron givré 7,50
Irish coffee 10,50

COUPES GLACÉES
Coupe mixte: vanille, café, chocolat, fraise, framboise 7,50
Sorbet exotique: cassis, citron, fruit de la passion 7,50
Coupe Auberge: vanille, fraise, chocolat, salade de fruits, chantilly 9,50
Dame blanche: vanille, chocolat, chantilly 7,50
Banana split: vanille, fraise, chocolat 8,50
Café liégeois: café, chantilly 7,50
Chocolat liégeois: chocolat, chantilly 7,50
Gourmande à la fraise: vanille, fraise 8,50
Pêche Melba: pêche, vanille 8,50
Poire Belle-Hélène: vanille, chocolat 8,50

ALCOOLISÉES
Coupe Sahara: citron, boukha 9,50
Coupe rhum-raisins 9,50
Coupe sorbet cassis et crème de cassis 9,50
La Colonel: citron, vodka 9,50
La Générale: cassis, vodka 9,50
Coupe Marrakech: chocolat noir, menthe 9,50`,
};

/** Classic Paris brasserie with a lunch dish per weekday. */
export const GRANDE_BRASSERIE_MENU: DemoMenu = {
  id: 'grande-brasserie',
  title: 'Grande brasserie, Paris',
  description: 'Echte Karte: Klassiker, Fisch, Fleisch, Desserts',
  text: `ENTRÉES
Os à moelle aux girolles 14,00
Terrine de campagne au porc noir de Bigorre 12,00
Tarama 19,00
Calamars frits: sauce tartare 15,00
Crevettes roses: sauce cocktail 16,00
Frisée aux lardons: œuf poché 13,00
Salade de haricots verts: girolles, parmesan 14,00
Poireaux vinaigrette: croûtons, herbes 10,00
Oeufs mayo 9,00
Cœur de saumon fumé: crème épaisse 18,00
Soupe à l'oignon gratinée 9,00
Six escargots de Bourgogne 19,00
Foie gras de canard 22,00

SALADES ET SANDWICHS
Salade Parisienne 19,00
Lobster roll 38,00
Croque-monsieur: jambon, comté 19,00
Club sandwich 24,00

POISSONS
Saumon à l'oseille 25,00
Noix de Saint-Jacques rôties: câpres, citron 39,00
Tartare de bar: concombre, pomme 23,00
Sole à la plancha 69,00
Filet de bar au beurre citronné 29,00

VIANDES
Filet de bœuf sauce béarnaise 36,00
Filet de bœuf au poivre 37,00
Tartare de bœuf 19,00
Suprême de volaille aux morilles 29,00
Foie de veau au vinaigre de framboise 29,00
Saucisse au couteau: purée 19,00
T-bone steak à partager 95,00

PÂTES
Mac and cheese: jambon, truffe 22,00
Rigatoni aux morilles 27,00

ACCOMPAGNEMENTS
Pommes frites 6,00
Purée de pommes de terre 6,00
Haricots verts 6,00
Riz basmati 6,00
Salade verte 6,00

PLATS DU JOUR
Ravioles de Royan gratinées 20,00
Tomate farcie 20,00
Endives au jambon 20,00
Blanquette de veau 20,00
Brandade de morue 20,00
Moules frites 20,00
Poulet rôti 20,00

FROMAGES ET DESSERTS
Comté 24 mois 10,00
Salade de fruits de saison 12,00
Tartelette au citron 12,00
Mousse au chocolat: fleur de sel 11,00
Brioche façon pain perdu 14,00
Baba au rhum et chantilly 14,00
Crème brûlée à la vanille 9,00
Poire Belle-Hélène 12,00
Chou chantilly et expresso 9,00
Glace artisanale: vanille, caramel beurre salé, chocolat, yaourt, fraise, citron 4,00`,
};

export const DEMO_MENUS: DemoMenu[] = [
  CHOUCHOU_MENU,
  BRASSERIE_MENU,
  TGV_BISTRO_MENU,
  BISTRO_SAISON_MENU,
  MAROCAIN_DESSERTS_MENU,
  GRANDE_BRASSERIE_MENU,
];
