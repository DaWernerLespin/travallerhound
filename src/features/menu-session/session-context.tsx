import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { dishKnowledge } from '@/features/dish-db';
import { buildRatingInput } from '@/features/dish-rating/build-input';
import { applyTravelerDecision, rateDish } from '@/features/dish-rating/rate-dish';
import { EMPTY_VERDICT, type DishRating, type StaffVerdict, type TravelerDecision } from '@/features/dish-rating/types';
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
  /** Id of the loaded demo menu (for the demo staff answers), null for typed menus. */
  menuId: string | null;
  scanStartedAt: number | null;
  verdicts: Record<string, StaffVerdict>;
  /** The traveller's own safe / not safe call per dish, after a free-text answer. */
  decisions: Record<string, TravelerDecision>;
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
  | { type: 'loadMenu'; items: MenuItem[]; sourceLabel: string; menuId: string | null; now: number }
  | { type: 'addMessage'; message: ChatMessage }
  | { type: 'setVerdict'; itemId: string; verdict: StaffVerdict }
  | { type: 'setDecision'; itemId: string; decision: TravelerDecision }
  | { type: 'markOrdered'; itemIds: string[] }
  | { type: 'markIntroduced' }
  | { type: 'addToWishlist'; itemId: string }
  | { type: 'removeFromWishlist'; itemId: string }
  | { type: 'setFocus'; itemId: string | null }
  | { type: 'toggleNote'; itemId: string; noteId: string; on?: boolean };

const INITIAL: SessionState = {
  items: [],
  sourceLabel: null,
  menuId: null,
  scanStartedAt: null,
  verdicts: {},
  decisions: {},
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
      return { ...INITIAL, items: action.items, sourceLabel: action.sourceLabel, menuId: action.menuId, scanStartedAt: action.now };
    case 'addMessage': {
      // The intro and each dish's result appear only once, even if they are triggered twice.
      const { kind, itemId } = action.message;
      if (kind && state.messages.some((m) => m.kind === kind && m.itemId === itemId)) return state;
      return { ...state, messages: [...state.messages, action.message] };
    }
    case 'setVerdict':
      return { ...state, verdicts: { ...state.verdicts, [action.itemId]: action.verdict } };
    case 'setDecision':
      return { ...state, decisions: { ...state.decisions, [action.itemId]: action.decision } };
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
  loadMenuText: (text: string, sourceLabel: string, menuId?: string) => number;
  addMessage: (message: ChatMessage) => void;
  setVerdict: (itemId: string, verdict: StaffVerdict) => void;
  setDecision: (itemId: string, decision: TravelerDecision) => void;
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

  const loadMenuText = useCallback((text: string, sourceLabel: string, menuId?: string) => {
    const items = parseMenuText(text, dishKnowledge);
    dispatch({ type: 'loadMenu', items, sourceLabel, menuId: menuId ?? null, now: Date.now() });
    return items.length;
  }, []);
  const actions = useMemo(
    () => ({
      addMessage: (message: ChatMessage) => dispatch({ type: 'addMessage', message }),
      setVerdict: (itemId: string, verdict: StaffVerdict) => dispatch({ type: 'setVerdict', itemId, verdict }),
      setDecision: (itemId: string, decision: TravelerDecision) => dispatch({ type: 'setDecision', itemId, decision }),
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

/** Ratings for all menu items, including staff answers and the traveller's own decisions. */
export function useRatings(): Record<string, DishRating> {
  const { items, verdicts, decisions } = useMenuSession();
  return useMemo(() => {
    const ratings: Record<string, DishRating> = {};
    for (const item of items) {
      const rating = rateDish(buildRatingInput(item, dishKnowledge), verdicts[item.id] ?? EMPTY_VERDICT);
      ratings[item.id] = applyTravelerDecision(rating, decisions[item.id]);
    }
    return ratings;
  }, [items, verdicts, decisions]);
}

/** Rating before any staff answer – used to decide which questions to ask. */
export function baseRating(item: MenuItem): DishRating {
  return rateDish(buildRatingInput(item, dishKnowledge));
}
