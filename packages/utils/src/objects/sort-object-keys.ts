import { compareStrings } from '../string/compare-strings.js';

/**
 * Sorts the keys of an object.
 *
 * @param obj - The object to sort.
 * @returns The sorted object.
 */
export function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => compareStrings(a, b)),
  ) as T;
}
