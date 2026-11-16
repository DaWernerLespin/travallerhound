import { QuickReplySource } from './conversation';
import { PhraseTableTranslator } from './phrases';
import type { StaffReplySource, Translator } from './types';

/** Swap here for an AI translator or free-text/speech staff replies later. */
export const translator: Translator = new PhraseTableTranslator();
export const staffReplySource: StaffReplySource = new QuickReplySource();
