import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { dishKnowledge } from '@/features/dish-db';
import { buildRatingInput } from '@/features/dish-rating/build-input';
import { rateDish } from '@/features/dish-rating/rate-dish';
import { EMPTY_VERDICT, type DishRating, type StaffVerdict } from '@/features/dish-rating/types';
import { parseMenuText } from '@/features/menu-input/parse-menu';
import type { MenuItem } from '@/features/menu-input/types';
import type { ChatMessage } from '@/features/staff-chat/types';

/**
 * One restaurant visit, in memory only (the MVP stores no data).
 * Flow: dishes go on the Wunschliste → one chat with the staff checks them → safe ones are on the Bestellliste → order together.
 */
type SessionState = {
  items: MenuItem[];
  sourceLabel: string | null;
  scanStartedAt: number | null;
  verdicts: Record<string, StaffVerdict>;
  /** One chat for the whole visit. */
  messages: ChatMessage[];
  /** Dish ids in the order they were added. */
  wishlist: string[];
  /** Dish the chat should ask about next (chosen by the traveller). */
  focusId: string | null;
  /** Preset note ids per dish ("ohne Sauce"). */
  notes: Record<string, string[]>;
  ordered: Record<string, boolean>;
  /** The allergy was already explained to the staff in this restaurant (sent once per loaded menu). */
  introduced: boolean;
};

type Action =
  | { type: 'loadMenu'; items: MenuItem[]; sourceLabel: string; now: number }
  | { type: 'addMessage'; message: ChatMessage }
  | { type: 'setVerdict'; itemId: string; verdict: StaffVerdict }
  | { type: 'markOrdered'; itemIds: string[] }
  | { type: 'markIntroduced' }
  | { type: 'addToWishlist'; itemId: string }
  | { type: 'removeFromWishlist'; itemId: string }
  | { type: 'setFocus'; itemId: string | null }
  | { type: 'toggleNote'; itemId: string; noteId: string; on?: boolean };

const INITIAL: SessionState = {
  items: [],
  sourceLabel: null,
  scanStartedAt: null,
  verdicts: {},
  messages: [],
  wishlist: [],
  focusId: null,
  notes: {},
  ordered: {},
  introduced: false,
};

export function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'loadMenu':
      return { ...INITIAL, items: action.items, sourceLabel: action.sourceLabel, scanStartedAt: action.now };
    case 'addMessage':
      return { ...state, messages: [...state.messages, action.message] };
    case 'setVerdict':
      return { ...state, verdicts: { ...state.verdicts, [action.itemId]: action.verdict } };
    case 'markOrdered': {
      const ordered = { ...state.ordered };
      for (const id of action.itemIds) ordered[id] = true;
      return { ...state, ordered };
    }
    case 'markIntroduced':
      return { ...state, introduced: true };
    case 'addToWishlist':
      return state.wishlist.includes(action.itemId) ? state : { ...state, wishlist: [...state.wishlist, action.itemId] };
    case 'removeFromWishlist':
      return {
        ...state,
        wishlist: state.wishlist.filter((id) => id !== action.itemId),
        focusId: state.focusId === action.itemId ? null : state.focusId,
      };
    case 'setFocus':
      return { ...state, focusId: action.itemId };
    case 'toggleNote': {
      const current = state.notes[action.itemId] ?? [];
      const has = current.includes(action.noteId);
      const on = action.on ?? !has;
      if (on === has) return state;
      const next = on ? [...current, action.noteId] : current.filter((id) => id !== action.noteId);
      return { ...state, notes: { ...state.notes, [action.itemId]: next } };
    }
  }
}

type SessionValue = SessionState & {
  /** Parses menu text and starts a new analysis. Returns the number of dishes found. */
  loadMenuText: (text: string, sourceLabel: string) => number;
  addMessage: (message: ChatMessage) => void;
  setVerdict: (itemId: string, verdict: StaffVerdict) => void;
  markOrdered: (itemIds: string[]) => void;
  markIntroduced: () => void;
  addToWishlist: (itemId: string) => void;
  removeFromWishlist: (itemId: string) => void;
  setFocus: (itemId: string | null) => void;
  toggleNote: (itemId: string, noteId: string, on?: boolean) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function MenuSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL);

  const loadMenuText = useCallback((text: string, sourceLabel: string) => {
    const items = parseMenuText(text, dishKnowledge);
    dispatch({ type: 'loadMenu', items, sourceLabel, now: Date.now() });
    return items.length;
  }, []);
  const actions = useMemo(
    () => ({
      addMessage: (message: ChatMessage) => dispatch({ type: 'addMessage', message }),
      setVerdict: (itemId: string, verdict: StaffVerdict) => dispatch({ type: 'setVerdict', itemId, verdict }),
      markOrdered: (itemIds: string[]) => dispatch({ type: 'markOrdered', itemIds }),
      markIntroduced: () => dispatch({ type: 'markIntroduced' }),
      addToWishlist: (itemId: string) => dispatch({ type: 'addToWishlist', itemId }),
      removeFromWishlist: (itemId: string) => dispatch({ type: 'removeFromWishlist', itemId }),
      setFocus: (itemId: string | null) => dispatch({ type: 'setFocus', itemId }),
      toggleNote: (itemId: string, noteId: string, on?: boolean) => dispatch({ type: 'toggleNote', itemId, noteId, on }),
    }),
    [],
  );

  const value = useMemo(() => ({ ...state, loadMenuText, ...actions }), [state, loadMenuText, actions]);
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
