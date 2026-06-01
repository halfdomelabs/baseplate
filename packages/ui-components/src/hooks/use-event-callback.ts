import { useCallback, useLayoutEffect, useRef } from 'react';

// oxlint-disable typescript/no-explicit-any

export function useEventCallback<Args extends any[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R;
export function useEventCallback<Args extends any[], R>(
  fn: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined;
export function useEventCallback<Args extends any[], R>(
  fn: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined {
  const ref = useRef<((...args: Args) => R) | undefined>(() => {
    throw new Error('Cannot call an event handler while rendering.');
  });

  // useLayoutEffect (not useEffect) so the ref is updated synchronously before
  // the browser paints — closing the stale-closure window that useEffect leaves
  // open between render commit and the async effect flush.
  useLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  const callback = useCallback(
    (...args: Args) => ref.current?.(...args) as R,
    [ref],
  );

  return fn ? callback : undefined;
}
