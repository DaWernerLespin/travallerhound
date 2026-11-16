import type { DishStatus } from '@/features/dish-rating/types';
import { useElapsed } from '@/lib/use-elapsed';

import { checkIndex, revealAt, scanDuration } from './scan-timing';
import { useMenuSession, useRatings } from './session-context';

export type ScanState = {
  /** undefined while the dish is still being checked (shown red). */
  status?: DishStatus;
  checking?: string;
};

/** Scan progress: every dish starts red and shows what is checked, then settles to its rating. */
export function useScan() {
  const { items, scanStartedAt } = useMenuSession();
  const ratings = useRatings();
  const duration = scanDuration(items.length);
  const elapsed = useElapsed(scanStartedAt, duration);

  const states: Record<string, ScanState> = {};
  items.forEach((item, index) => {
    const rating = ratings[item.id];
    if (elapsed >= revealAt(index, items.length)) {
      states[item.id] = { status: rating.status };
    } else {
      states[item.id] = { checking: rating.checks[checkIndex(elapsed, rating.checks.length)] };
    }
  });

  return {
    states,
    ratings,
    progress: duration > 0 ? elapsed / duration : 1,
    secondsLeft: Math.ceil(duration - elapsed),
    done: elapsed >= duration,
    duration,
    elapsed,
  };
}
