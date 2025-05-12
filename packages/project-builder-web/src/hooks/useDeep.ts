import { isEqual } from 'es-toolkit';
import { useRef } from 'react';

/**
 * A hook that returns a deeply memoized value of a selector function.
 *
 * @param selector - The selector function to deeply memoize.
 */
export function useDeep<S, U>(selector: (state: S) => U): (state: S) => U {
  const prev = useRef<U>(undefined);

  return (state) => {
    const next = selector(state);
    if (isEqual(prev.current, next)) {
      return prev.current as U;
    }
    prev.current = next;
    return next;
  };
}
