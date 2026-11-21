/**
 * Order notes, shown in German for the traveller and in French for the staff.
 * Preset notes come from this fixed list; the traveller can add their own (translated with DeepL).
 */
export type OrderNote = { id: string; de: string; fr: string };

export const ORDER_NOTES: OrderNote[] = [
  { id: 'salade-frites', de: 'Salat statt Pommes', fr: 'salade à la place des frites' },
  { id: 'legumes-accompagnement', de: 'Gemüse statt Beilage', fr: 'légumes à la place de l’accompagnement' },
  { id: 'sans-sauce', de: 'ohne Sauce', fr: 'sans sauce' },
  { id: 'sauce-a-part', de: 'Sauce separat', fr: 'sauce à part' },
  { id: 'sans-vinaigrette', de: 'ohne Dressing', fr: 'sans vinaigrette' },
  { id: 'sans-pain', de: 'ohne Brot', fr: 'sans pain' },
  { id: 'sans-accompagnement', de: 'ohne Beilage', fr: 'sans accompagnement' },
  { id: 'sans-fruits-coque', de: 'ohne Nüsse', fr: 'sans fruits à coque' },
  { id: 'sans-panure', de: 'ohne Panade oder Teigkruste', fr: 'sans panure ni pâte' },
  { id: 'huile-propre', de: 'in frischem Öl, separate Pfanne', fr: 'cuit dans une huile propre, poêle à part' },
];

/** The traveller's own notes in this app session (in memory, like the visit). */
const customNotes = new Map<string, OrderNote>();
let customCounter = 0;

/** Registers a note the traveller typed (German) with its French translation; returns it with a new id. */
export function addCustomNote(de: string, fr: string): OrderNote {
  const note = { id: `custom-${++customCounter}`, de, fr };
  customNotes.set(note.id, note);
  return note;
}

export function isCustomNote(id: string): boolean {
  return customNotes.has(id);
}

export function findNote(id: string): OrderNote | undefined {
  return ORDER_NOTES.find((note) => note.id === id) ?? customNotes.get(id);
}

/** "Steak frites, sans sauce, sauce à part" */
export function withNotes(dish: string, noteIds: string[], language: 'de' | 'fr'): string {
  const notes = noteIds.map((id) => findNote(id)?.[language]).filter(Boolean);
  return notes.length > 0 ? `${dish}, ${notes.join(', ')}` : dish;
}
