import { useEffect, useMemo, useRef } from 'react';

type FunctionType<T extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export function useEventCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
): T;
export function useEventCallback<T extends (...args: unknown[]) => unknown>(
  fn: T | undefined,
): T | undefined;
export function useEventCallback<T extends (...args: unknown[]) => unknown>(
  fn: FunctionType<T> | undefined,
): FunctionType<T> | undefined {
  const ref = useRef<FunctionType<T> | undefined>(fn);

  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useMemo(() => {
    const { current } = ref;
    if (!current) {
      return undefined;
    }
    return (...args) => {
      return current(...args);
    };
  }, [ref]);
}
