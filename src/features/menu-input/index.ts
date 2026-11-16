import { DemoMenuTextSource } from './demo-menu-text-source';
import type { MenuTextSource } from './types';

/** Swap here for real OCR (dev build or cloud) later. */
export const menuTextSource: MenuTextSource = new DemoMenuTextSource();
