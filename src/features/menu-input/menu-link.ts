import { DEMO_MENUS, type DemoMenu } from './demo-menus';

/** Public address of the web app. QR codes point to `${PUBLIC_URL}/karte/<menu id>`. */
export const PUBLIC_URL = 'https://travallerhound.vercel.app';

export function demoMenuUrl(id: string): string {
  return `${PUBLIC_URL}/karte/${id}`;
}

export function findDemoMenu(id: string): DemoMenu | undefined {
  const wanted = id.trim().toLowerCase();
  return DEMO_MENUS.find((menu) => menu.id === wanted);
}

/** Demo menu for a scanned QR code: accepts a link containing `/karte/<id>` (any host) or a bare menu id. */
export function demoMenuFromCode(code: string): DemoMenu | undefined {
  const match = code.trim().match(/\/karte\/([a-z0-9-]+)/i);
  return findDemoMenu(match ? match[1] : code);
}
