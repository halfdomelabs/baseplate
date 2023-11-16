import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Works similarly to `useState`, but allows the state to be controlled and shows a warning if the state is changed from controlled to uncontrolled or vice versa.
 */
export function useControlledState<T>(
  value: T | undefined,
  setValue: ((value: T) => void) | undefined,
): [T | undefined, (value: T) => void];
export function useControlledState<T>(
  value: T | undefined,
  setValue: ((value: T) => void) | undefined,
  defaultValue: T,
): [T, (value: T) => void];
export function useControlledState<T>(
  value: T | undefined,
  setValue: ((value: T) => void) | undefined,
  defaultValue?: T,
): [T, (value: T) => void] {
  const isControlled = value !== undefined;
  const isControlledRef = useRef(isControlled);
  const setValuePropsRef = useRef(setValue);
  const [internalState, setInternalState] = useState(defaultValue);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (isControlledRef.current !== isControlled) {
        // eslint-disable-next-line no-console
        console.warn(
          'Component is changing from controlled to uncontrolled (or visa versa). Component should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled Combobox for the lifetime of the component. Check the `value` prop.',
        );
      }
    }
    isControlledRef.current = isControlled;
  }, [isControlled]);

  useEffect(() => {
    setValuePropsRef.current = setValue;
  }, [setValue]);

  const setState = useCallback((value: T) => {
    if (setValuePropsRef.current) {
      setValuePropsRef.current(value);
    }
    if (!isControlledRef.current) {
      setInternalState(value);
    }
  }, []);

  return [(isControlled ? value : internalState) as T, setState];
}
