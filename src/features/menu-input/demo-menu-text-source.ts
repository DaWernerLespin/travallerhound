import { DEMO_MENUS } from './demo-menus';
import type { MenuFile, MenuTextResult, MenuTextSource } from './types';

/**
 * Offline stand-in for OCR: recognises the bundled demo menus by file size or file name.
 * Any other file → the user types the dishes while looking at the image.
 */
export class DemoMenuTextSource implements MenuTextSource {
  async extract(file: MenuFile): Promise<MenuTextResult> {
    const name = file.name.toLowerCase();
    const menu = DEMO_MENUS.find(
      (m) => (m.fileSize !== undefined && m.fileSize === file.size) || name.includes(m.id),
    );
    if (menu) return { kind: 'text', text: menu.text, sourceLabel: menu.title };
    return {
      kind: 'manual',
      reason:
        'Texterkennung ist in dieser Demo-Version noch nicht eingebaut. Tippe die Gerichte ab – eine Zeile pro Gericht, Zutaten mit Komma dahinter.',
    };
  }
}
