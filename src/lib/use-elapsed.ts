import { useEffect, useState } from 'react';

/** Seconds since `startedAt` (ms timestamp), ticking until `until` seconds. */
export function useElapsed(startedAt: number | null, until: number): number {
  const compute = () => (startedAt === null ? 0 : Math.min(until, (Date.now() - startedAt) / 1000));
  const [elapsed, setElapsed] = useState(compute);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed(Math.min(until, (Date.now() - startedAt) / 1000));
    tick();
    const timer = setInterval(() => {
      tick();
      if ((Date.now() - startedAt) / 1000 >= until) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [startedAt, until]);

  return elapsed;
}
