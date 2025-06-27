// @ts-nocheck

import type { Ref } from 'react';

/**
 * Merges multiple React refs into a single ref callback. This is useful when you need to pass multiple refs to the same component.
 *
 * @param refs - An array of refs to merge. Each ref can be either a function ref or a ref object.
 * @returns A ref callback that can be assigned to the ref attribute of a React element, or undefined if all refs are undefined.
 * @template T - The type of the element that the refs will be associated with.
 */
export function mergeRefs<T>(
  ...refs: (Ref<T> | undefined)[]
): Ref<T> | undefined {
  // Return undefined if all refs are undefined
  if (refs.every((ref) => ref === undefined)) {
    return undefined;
  }

  return (instance: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    }
  };
}
