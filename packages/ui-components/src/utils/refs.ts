import { ForwardedRef } from 'react';

/**
 * Merges multiple React refs into a single ref callback. This is useful when you need to pass multiple refs to the same component.
 *
 * @param refs - An array of refs to merge. Each ref can be either a function ref or a ref object.
 * @returns A ref callback that can be assigned to the ref attribute of a React element. This callback will update all refs in the array with the current instance of the element.
 * @template T - The type of the element that the refs will be associated with.
 */
export function mergeRefs<T>(refs: ForwardedRef<T>[]): ForwardedRef<T> {
  return (instance: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    });
  };
}
