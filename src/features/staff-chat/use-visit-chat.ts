import { useEffect, useMemo, useRef, useState } from 'react';

import { FEATURES } from '@/constants/features';
import { EMPTY_VERDICT } from '@/features/dish-rating/types';
import type { MenuItem } from '@/features/menu-input/types';
import { baseRating, useMenuSession, useRatings } from '@/features/menu-session/session-context';
import { findNote, withNotes } from '@/features/order/notes';
import { focusDish, orderOverview, type WishState } from '@/features/order/order-state';

import { applyReply, buildChecklist, buildQuestions, isAnswered, isFinalReply } from './conversation';
import { staffPersona } from './demo-staff';
import { staffReplySource, translator } from './index';
import type { Phrase, Question, StaffReply } from './types';

let messageCounter = 0;
const nextId = () => `m${++messageCounter}`;

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

  const send = async (side: 'traveler' | 'staff', phrase: Phrase, itemId?: string) => {
    const [fr, de] = await Promise.all([translator.render(phrase, 'fr'), translator.render(phrase, 'de')]);
    session.addMessage({ id: nextId(), side, fr, de, itemId });
  };
  const note = (de: string, itemId?: string) => session.addMessage({ id: nextId(), side: 'system', fr: '', de, itemId });

  // Explain the allergy right away when the chat opens with dishes to check, and only once per visit.
  const introSent = useRef(false);
  const needsIntro = active && !session.introduced && overview.pending.length > 0;
  useEffect(() => {
    if (!needsIntro || introSent.current) return;
    introSent.current = true;
    session.markIntroduced();
    void send('traveler', { id: 'intro' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsIntro]);

  // Tell the traveller once when a dish is settled: on the Bestellliste or dropped.
  const announced = useRef(new Map<string, WishState>());
  useEffect(() => {
    if (!active) return;
    for (const id of [...overview.confirmed, ...overview.dropped]) {
      const state: WishState = overview.confirmed.includes(id) ? 'confirmed' : 'dropped';
      const mark = state === 'confirmed' ? '✓' : '✕';
      const already = session.messages.some((m) => m.side === 'system' && m.itemId === id && m.de.startsWith(mark));
      if (already || announced.current.get(id) === state) continue;
      announced.current.set(id, state);
      const item = itemsById.get(id);
      if (!item) continue;
      if (state === 'confirmed') note(`✓ „${item.name}“ ist sicher und steht auf deiner Bestellliste.`, id);
      else note(`✕ „${item.name}“ fällt weg. ${ratings[id]?.reason ?? ''}`.trim(), id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview.confirmed.join(), overview.dropped.join()]);

  const ask = async (question: Question) => {
    if (!focusId) return;
    await send('traveler', question.phrase, focusId);
    setActiveQuestion(question);
  };

  const reply = async (answer: StaffReply, noteId?: string) => {
    if (!activeQuestion || !focusId) return;
    const picked = noteId ? findNote(noteId) : undefined;
    const phrase = picked ? { ...answer.phrase, params: { noteDe: picked.de, noteFr: picked.fr } } : answer.phrase;
    await send('staff', phrase, focusId);
    if (picked) session.toggleNote(focusId, picked.id, true);
    session.setVerdict(focusId, applyReply(verdict, activeQuestion, answer));
    if (isFinalReply(answer)) setActiveQuestion(null);
  };

  /** Ask about another dish of the Wunschliste next (not while the staff is answering). */
  const choose = (id: string) => {
    if (!activeQuestion) session.setFocus(id);
  };

  /** Orders all dishes on the Bestellliste at once, with their notes (French for the staff). */
  const orderAll = async () => {
    const ids = overview.confirmed;
    if (ids.length === 0) return;
    const list = (language: 'de' | 'fr') =>
      ids.map((id) => `\n• ${withNotes(itemsById.get(id)?.name ?? '', session.notes[id] ?? [], language)}`).join('');
    await send('traveler', { id: 'order_list', params: { listDe: list('de'), listFr: list('fr') } });
    session.markOrdered(ids);
  };

  const itemOf = (id: string): MenuItem | undefined => itemsById.get(id);

  // Demo restaurants: the answer prepared for this restaurant's staff.
  const persona = FEATURES.demoStaff ? staffPersona(session.menuId) : null;
  const staffReplies = activeQuestion ? staffReplySource.repliesFor(activeQuestion) : [];
  const scriptedAnswer = persona && activeQuestion && focus ? persona.answer({ question: activeQuestion, item: focus, findings: baseRating(focus).findings }) : null;
  const scriptedReply = scriptedAnswer ? staffReplies.find((r) => r.id === scriptedAnswer.replyId) : undefined;
  const scripted = scriptedReply ? { reply: scriptedReply, noteId: scriptedAnswer?.noteId } : null;

  return {
    messages: session.messages,
    overview,
    focus,
    focusRating: focusId ? ratings[focusId] : undefined,
    openQuestions: focusId ? openQuestionsOf(focusId) : [],
    checklist: focusId ? buildChecklist(questionsById.get(focusId) ?? [], verdict) : [],
    activeQuestion,
    staffReplies,
    scripted,
    personaLabel: persona?.label ?? null,
    notes: session.notes,
    itemOf,
    ask,
    reply,
    choose,
    orderAll,
  };
}
