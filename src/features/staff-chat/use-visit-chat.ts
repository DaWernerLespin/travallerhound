import { useEffect, useMemo, useRef, useState } from 'react';

import { FEATURES } from '@/constants/features';
import { EMPTY_VERDICT, type TravelerDecision } from '@/features/dish-rating/types';
import type { MenuItem } from '@/features/menu-input/types';
import { baseRating, useMenuSession, useRatings } from '@/features/menu-session/session-context';
import { findNote, withNotes } from '@/features/order/notes';
import { focusDish, orderOverview, type WishState } from '@/features/order/order-state';

import { applyReply, buildChecklist, buildQuestions, isAnswered, isFinalReply } from './conversation';
import { staffPersona } from './demo-staff';
import { staffReplySource, textTranslator, translator } from './index';
import type { ChatMessage, Phrase, Question, StaffReply } from './types';

/** True if the staff answered in free text, or answered a free-text question, about this dish. */
export function hadFreeAnswer(messages: ChatMessage[], itemId: string): boolean {
  let freeQuestion = false;
  for (const message of messages) {
    if (message.itemId !== itemId) continue;
    if (message.side === 'traveler' && message.free) freeQuestion = true;
    else if (message.side === 'staff' && (message.free || freeQuestion)) return true;
  }
  return false;
}

/** Dish name in the order message: French for the staff; German with the French original in brackets for the traveller. */
export function orderName(item: MenuItem | undefined, language: 'de' | 'fr'): string {
  if (!item) return '';
  const german = item.match?.dish.de;
  return language === 'de' && german ? `${german} (${item.name})` : item.name;
}

let messageCounter = 0;
/** Differs per module load, so ids stay unique when the counter restarts (e.g. hot reload while a chat is open). */
const RUN = Date.now().toString(36);
/** How long the virtual demo staff "types" before answering. */
const VIRTUAL_STAFF_DELAY_MS = 900;
const nextId = () => `m${RUN}-${++messageCounter}`;

/**
 * One chat for the whole restaurant visit. The traveller asks in German, the staff answers in French on the same phone.
 * It works through the Wunschliste dish by dish; safe dishes land on the Bestellliste, the others drop out.
 */
/**
 * `active`: only the chat screen sends the intro and the status lines, so other screens using
 * this hook (analysis, Bestellliste) don't send them twice.
 */
export function useVisitChat({ active = true }: { active?: boolean } = {}) {
  const session = useMenuSession();
  const ratings = useRatings();
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  /** The staff has the phone to answer a free-text question. */
  const [freeOpen, setFreeOpen] = useState(false);
  const staffMode = activeQuestion !== null || freeOpen;

  const itemsById = useMemo(() => new Map(session.items.map((item) => [item.id, item])), [session.items]);
  // Questions come from the rating *before* staff answers, so they don't disappear once answered.
  const questionsById = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const id of session.wishlist) {
      const item = itemsById.get(id);
      if (item) map.set(id, buildQuestions(item.name, baseRating(item).findings));
    }
    return map;
  }, [session.wishlist, itemsById]);

  const openQuestionsOf = (id: string) =>
    (questionsById.get(id) ?? []).filter((q) => !isAnswered(q, session.verdicts[id] ?? EMPTY_VERDICT));
  const openCounts = Object.fromEntries(session.wishlist.map((id) => [id, openQuestionsOf(id).length]));
  const overview = orderOverview(session.wishlist, ratings, openCounts, session.ordered);
  const focusId = focusDish(overview.pending, session.focusId);
  const focus = focusId ? itemsById.get(focusId) : undefined;
  const verdict = focusId ? (session.verdicts[focusId] ?? EMPTY_VERDICT) : EMPTY_VERDICT;

  const send = async (side: 'traveler' | 'staff', phrase: Phrase, itemId?: string, kind?: ChatMessage['kind']) => {
    const [fr, de] = await Promise.all([translator.render(phrase, 'fr'), translator.render(phrase, 'de')]);
    session.addMessage({ id: nextId(), side, fr, de, itemId, kind });
  };
  /** Result card for a dish (German, for the traveller). */
  const result = (kind: 'safe' | 'unsafe', de: string, itemId: string) =>
    session.addMessage({ id: nextId(), side: 'system', fr: '', de, itemId, kind });

  // Explain the allergy right away when the chat opens with dishes to check, and only once per visit.
  const introSent = useRef(false);
  const needsIntro = active && !session.introduced && overview.pending.length > 0;
  useEffect(() => {
    if (!needsIntro || introSent.current) return;
    introSent.current = true;
    session.markIntroduced();
    void send('traveler', { id: 'intro' }, undefined, 'intro');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsIntro]);

  // Tell the traveller once when a dish is settled: on the Bestellliste or dropped.
  const announced = useRef(new Map<string, WishState>());
  useEffect(() => {
    if (!active) return;
    for (const id of [...overview.confirmed, ...overview.dropped]) {
      const state: WishState = overview.confirmed.includes(id) ? 'confirmed' : 'dropped';
      const kind = state === 'confirmed' ? 'safe' : 'unsafe';
      const already = session.messages.some((m) => m.itemId === id && m.kind === kind);
      if (already || announced.current.get(id) === state) continue;
      announced.current.set(id, state);
      const item = itemsById.get(id);
      if (!item) continue;
      if (state === 'confirmed') result('safe', 'Auf der Bestellliste', id);
      else result('unsafe', `${ratings[id]?.reason ?? ''} Nicht bestellbar.`.trim(), id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview.confirmed.join(), overview.dropped.join()]);

  // Demo restaurants: the staff is virtual and answers by itself, as prepared for that restaurant.
  // The real product hands the phone to the staff instead (StaffPanel).
  const persona = FEATURES.demoStaff ? staffPersona(session.menuId) : null;
  const [staffTyping, setStaffTyping] = useState(false);

  const answer = async (question: Question, staffReply: StaffReply, noteId?: string) => {
    if (!focusId) return;
    const picked = noteId ? findNote(noteId) : undefined;
    const phrase = picked ? { ...staffReply.phrase, params: { noteDe: picked.de, noteFr: picked.fr } } : staffReply.phrase;
    await send('staff', phrase, focusId);
    if (picked) session.toggleNote(focusId, picked.id, true);
    session.setVerdict(focusId, applyReply(verdict, question, staffReply));
  };

  const ask = async (question: Question) => {
    if (!focus || staffTyping) return;
    await send('traveler', question.phrase, focus.id);
    const scripted = persona?.answer({ question, item: focus, findings: baseRating(focus).findings });
    const scriptedReply = scripted && staffReplySource.repliesFor(question).find((r) => r.id === scripted.replyId);
    if (scripted && scriptedReply) {
      setStaffTyping(true);
      await new Promise((resolve) => setTimeout(resolve, VIRTUAL_STAFF_DELAY_MS));
      await answer(question, scriptedReply, scripted.noteId);
      setStaffTyping(false);
      return;
    }
    setActiveQuestion(question);
  };

  /** Real staff (no demo restaurant): the answer tapped on the hand-over panel. */
  const reply = async (staffReply: StaffReply, noteId?: string) => {
    if (activeQuestion) {
      await answer(activeQuestion, staffReply, noteId);
      if (isFinalReply(staffReply)) setActiveQuestion(null);
      return;
    }
    if (!freeOpen) return;
    // Answer to a free-text question: information only, the rating stays as it is.
    await send('staff', staffReply.phrase, focusId ?? undefined);
    if (staffReply.id !== 'ask-chef') setFreeOpen(false);
  };

  /**
   * The traveller's own question in German: translated to French, then the phone goes to the staff
   * (also in demo restaurants, since the virtual staff can't understand free text). Throws if translation fails.
   */
  const askFree = async (textDe: string) => {
    const de = textDe.trim();
    if (!de || staffMode || staffTyping) return;
    const fr = await textTranslator.translate(de, 'de', 'fr');
    session.addMessage({ id: nextId(), side: 'traveler', fr, de, itemId: focusId ?? undefined, free: true });
    setFreeOpen(true);
  };

  /** The staff's own answer in French, translated to German for the traveller. Throws if translation fails. */
  const replyFree = async (textFr: string) => {
    const fr = textFr.trim();
    if (!fr || !staffMode) return;
    const de = await textTranslator.translate(fr, 'fr', 'de');
    session.addMessage({ id: nextId(), side: 'staff', fr, de, itemId: focusId ?? undefined, free: true });
    setActiveQuestion(null);
    setFreeOpen(false);
  };

  /**
   * After a free-text exchange about the current dish, the traveller decides: safe or not safe.
   * Counts a typed staff answer, and any staff answer (also a tapped one) to the traveller's free-text question.
   */
  const canDecide = !staffMode && focusId !== null && hadFreeAnswer(session.messages, focusId);
  const decide = (decision: TravelerDecision) => {
    if (canDecide && focusId) session.setDecision(focusId, decision);
  };

  /** Ask about another dish of the Wunschliste next (not while the staff is answering). */
  const choose = (id: string) => {
    if (!staffMode && !staffTyping) session.setFocus(id);
  };

  /** Orders all dishes on the Bestellliste at once, with their notes (French for the staff). */
  const orderAll = async () => {
    const ids = overview.confirmed;
    if (ids.length === 0) return;
    const list = (language: 'de' | 'fr') =>
      ids.map((id) => `\n• ${withNotes(orderName(itemsById.get(id), language), session.notes[id] ?? [], language)}`).join('');
    await send('traveler', { id: 'order_list', params: { listDe: list('de'), listFr: list('fr') } });
    session.markOrdered(ids);
  };

  const itemOf = (id: string): MenuItem | undefined => itemsById.get(id);

  return {
    messages: session.messages,
    wishlist: session.wishlist,
    stateOf: (id: string): WishState =>
      (Object.keys(overview) as WishState[]).find((state) => overview[state].includes(id)) ?? 'pending',
    overview,
    focus,
    focusRating: focusId ? ratings[focusId] : undefined,
    openQuestions: focusId ? openQuestionsOf(focusId) : [],
    checklist: focusId ? buildChecklist(questionsById.get(focusId) ?? [], verdict) : [],
    activeQuestion,
    /** The phone is with the staff (quick question or free-text question). */
    staffMode,
    staffReplies: activeQuestion
      ? staffReplySource.repliesFor(activeQuestion)
      : freeOpen
        ? staffReplySource.freeReplies()
        : [],
    /** Demo: the staff is virtual and answers automatically. */
    virtualStaff: persona ? persona.label : null,
    staffTyping,
    notes: session.notes,
    itemOf,
    ask,
    reply,
    askFree,
    replyFree,
    canDecide,
    decide,
    choose,
    orderAll,
  };
}
