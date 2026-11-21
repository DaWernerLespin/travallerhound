import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Language, TextTranslator } from './types';

/** Deployed site, used by native builds that don't run against the dev server. */
const PRODUCTION_URL = 'https://travallerhound.vercel.app';

/**
 * Where /api/translate lives. The DeepL key never ships in the app: the dev server (metro.config.js)
 * or the Vercel function (api/translate.js) calls DeepL. Override with EXPO_PUBLIC_TRANSLATE_URL.
 */
export function translateUrl(): string {
  const override = process.env.EXPO_PUBLIC_TRANSLATE_URL;
  if (override) return override;
  if (Platform.OS === 'web') return '/api/translate';
  const devHost = Constants.expoConfig?.hostUri;
  return devHost ? `http://${devHost}/api/translate` : `${PRODUCTION_URL}/api/translate`;
}

export class DeepLTextTranslator implements TextTranslator {
  async translate(text: string, from: Language, to: Language): Promise<string> {
    const response = await fetch(translateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source: from, target: to }),
    });
    const data = (await response.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!response.ok || typeof data.text !== 'string') throw new Error(data.error ?? `Übersetzung ${response.status}`);
    return data.text;
  }
}
