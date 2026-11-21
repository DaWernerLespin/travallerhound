import { QuickReplySource } from './conversation';
import { DeepLTextTranslator } from './deepl-translator';
import { PhraseTableTranslator } from './phrases';
import type { StaffReplySource, TextTranslator, Translator } from './types';

/** Swap here for an AI translator or free-text/speech staff replies later. */
export const translator: Translator = new PhraseTableTranslator();
export const staffReplySource: StaffReplySource = new QuickReplySource();
/** Free text in the chat (both directions). */
export const textTranslator: TextTranslator = new DeepLTextTranslator();
