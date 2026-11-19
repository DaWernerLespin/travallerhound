import { useEffect, useMemo, useRef, useState } from 'react';

import { EMPTY_VERDICT, type StaffVerdict } from '@/features/dish-rating/types';
import { baseRating, useMenuSession, useRatings } from '@/features/menu-session/session-context';

import { applyReply, buildChecklist, buildQuestions, isFinalReply } from './conversation';
import { staffReplySource, translator } from './index';
import type { Phrase, Question, StaffReply } from './types';

let messageCounter = 0;

/** Chat state for one dish: the traveler asks in German, the staff answers in French on the same phone. */
export function useStaffChat(itemId: string) {
  const session = useMenuSession();
  const ratings = useRatings();
  const item = session.items.find((i) => i.id === itemId);
  const verdict = session.verdicts[itemId] ?? EMPTY_VERDICT;
  const messages = session.chats[itemId] ?? [];
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  // Questions come from the rating *before* staff answers, so they don't disappear once answered.
  const questions = useMemo(() => (item ? buildQuestions(item.name, baseRating(item).findings) : []), [item]);
  const openQuestions = questions.filter((q) => !isAnswered(q, verdict));

  const send = async (side: 'traveler' | 'staff', phrase: Phrase) => {
    const [fr, de] = await Promise.all([translator.render(phrase, 'fr'), translator.render(phrase, 'de')]);
    session.addMessage(itemId, { id: `m${++messageCounter}`, side, fr, de });
  };

  // Explain the allergy right away when the first chat of a restaurant visit opens, and only once per visit.
  const introSent = useRef(false);
  const needsIntro = !session.introduced && openQuestions.length > 0 && !session.ordered[itemId];
  useEffect(() => {
    if (!needsIntro || introSent.current) return;
    introSent.current = true;
    session.markIntroduced();
    void send('traveler', { id: 'intro' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsIntro]);

  const ask = async (question: Question) => {
    await send('traveler', question.phrase);
    setActiveQuestion(question);
  };

  const reply = async (answer: StaffReply) => {
    if (!activeQuestion) return;
    await send('staff', answer.phrase);
    session.setVerdict(itemId, applyReply(verdict, activeQuestion, answer));
    if (isFinalReply(answer)) setActiveQuestion(null);
  };

  const order = async () => {
    await send('traveler', { id: 'order' });
    session.markOrdered(itemId);
  };

  const decline = () => send('traveler', { id: 'decline' });

  return {
    item,
    rating: item ? ratings[item.id] : undefined,
    messages,
    openQuestions,
    checklist: buildChecklist(questions, verdict),
    introduced: session.introduced,
    activeQuestion,
    staffReplies: activeQuestion ? staffReplySource.repliesFor(activeQuestion) : [],
    ordered: session.ordered[itemId] ?? false,
    ask,
    reply,
    order,
    decline,
  };
}

function isAnswered(question: Question, verdict: StaffVerdict): boolean {
  switch (question.topic) {
    case 'allergens':
      return verdict.peanut !== 'unasked' || verdict.lupin !== 'unasked';
    case 'cross':
      return verdict.crossContamination !== 'unasked';
    case 'ingredient':
      return question.ingredientId !== undefined && verdict.ingredients[question.ingredientId] !== undefined;
  }
}
