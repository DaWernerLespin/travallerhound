import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { dishKnowledge } from '@/features/dish-db';
import { buildRatingInput } from '@/features/dish-rating/build-input';
import { rateDish } from '@/features/dish-rating/rate-dish';
import { EMPTY_VERDICT, type DishRating, type StaffVerdict } from '@/features/dish-rating/types';
import { parseMenuText } from '@/features/menu-input/parse-menu';
import type { MenuItem } from '@/features/menu-input/types';
import type { ChatMessage } from '@/features/staff-chat/types';

/** In-memory only: the MVP stores no data (no accounts, nothing persisted). */
type SessionState = {
  items: MenuItem[];
  sourceLabel: string | null;
  scanStartedAt: number | null;
  verdicts: Record<string, StaffVerdict>;
  chats: Record<string, ChatMessage[]>;
  ordered: Record<string, boolean>;
  /** The allergy was already explained to the staff in this restaurant (sent once per loaded menu). */
  introduced: boolean;
};

type Action =
  | { type: 'loadMenu'; items: MenuItem[]; sourceLabel: string; now: number }
  | { type: 'addMessage'; itemId: string; message: ChatMessage }
  | { type: 'setVerdict'; itemId: string; verdict: StaffVerdict }
  | { type: 'markOrdered'; itemId: string }
  | { type: 'markIntroduced' };

const INITIAL: SessionState = { items: [], sourceLabel: null, scanStartedAt: null, verdicts: {}, chats: {}, ordered: {}, introduced: false };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'loadMenu':
      return { ...INITIAL, items: action.items, sourceLabel: action.sourceLabel, scanStartedAt: action.now };
    case 'addMessage':
      return {
        ...state,
        chats: { ...state.chats, [action.itemId]: [...(state.chats[action.itemId] ?? []), action.message] },
      };
    case 'setVerdict':
      return { ...state, verdicts: { ...state.verdicts, [action.itemId]: action.verdict } };
    case 'markOrdered':
      return { ...state, ordered: { ...state.ordered, [action.itemId]: true } };
    case 'markIntroduced':
      return { ...state, introduced: true };
  }
}

type SessionValue = SessionState & {
  /** Parses menu text and starts a new analysis. Returns the number of dishes found. */
  loadMenuText: (text: string, sourceLabel: string) => number;
  addMessage: (itemId: string, message: ChatMessage) => void;
  setVerdict: (itemId: string, verdict: StaffVerdict) => void;
  markOrdered: (itemId: string) => void;
  markIntroduced: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function MenuSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const loadMenuText = useCallback((text: string, sourceLabel: string) => {
    const items = parseMenuText(text, dishKnowledge);
    dispatch({ type: 'loadMenu', items, sourceLabel, now: Date.now() });
    return items.length;
  }, []);
  const addMessage = useCallback((itemId: string, message: ChatMessage) => dispatch({ type: 'addMessage', itemId, message }), []);
  const setVerdict = useCallback((itemId: string, verdict: StaffVerdict) => dispatch({ type: 'setVerdict', itemId, verdict }), []);
  const markOrdered = useCallback((itemId: string) => dispatch({ type: 'markOrdered', itemId }), []);
  const markIntroduced = useCallback(() => dispatch({ type: 'markIntroduced' }), []);

  const value = useMemo(
    () => ({ ...state, loadMenuText, addMessage, setVerdict, markOrdered, markIntroduced }),
    [state, loadMenuText, addMessage, setVerdict, markOrdered, markIntroduced],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useMenuSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useMenuSession must be used inside MenuSessionProvider');
  return value;
}

/** Ratings for all menu items, including staff answers. */
export function useRatings(): Record<string, DishRating> {
  const { items, verdicts } = useMenuSession();
  return useMemo(() => {
    const ratings: Record<string, DishRating> = {};
    for (const item of items) {
      ratings[item.id] = rateDish(buildRatingInput(item, dishKnowledge), verdicts[item.id] ?? EMPTY_VERDICT);
    }
    return ratings;
  }, [items, verdicts]);
}

/** Rating before any staff answer – used to decide which questions to ask. */
export function baseRating(item: MenuItem): DishRating {
  return rateDish(buildRatingInput(item, dishKnowledge));
}
