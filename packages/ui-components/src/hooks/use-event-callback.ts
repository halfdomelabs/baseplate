import { useEffect, useMemo, useRef } from 'react';

// oxlint-disable typescript/no-explicit-any

type FunctionType<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T;
export function useEventCallback<T extends (...args: any[]) => any>(
  fn: T | undefined,
): T | undefined;
export function useEventCallback<T extends (...args: any[]) => any>(
  fn: FunctionType<T> | undefined,
): FunctionType<T> | undefined {
  const ref = useRef<FunctionType<T> | undefined>(fn);

  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useMemo(() => {
    const { current } = ref;
    if (!current) {
      return;
    }
    // oxlint-disable-next-line typescript/no-unsafe-return -- safe to return the function
    return (...args) => current(...args);
  }, []);
}
