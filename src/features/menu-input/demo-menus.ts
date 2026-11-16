/**
 * Transcripts of bundled demo menus. They stand in for OCR (not possible offline in Expo Go).
 * `(V)` marks the vegetarian leaf symbol of the original menu.
 */
export type DemoMenu = {
  id: string;
  title: string;
  /** Size in bytes of the original image, used to recognise an uploaded copy. */
  fileSize: number;
  text: string;
};

export const CHOUCHOU_MENU: DemoMenu = {
  id: 'chouchou',
  title: 'Chouchou Restaurant & Bar, Paris',
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

export const DEMO_MENUS: DemoMenu[] = [CHOUCHOU_MENU];
