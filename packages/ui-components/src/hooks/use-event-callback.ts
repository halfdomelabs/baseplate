import { useEffect, useMemo, useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any -- allow for better matching of function types */

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- safe to return the function
    return (...args) => current(...args);
  }, []);
}
