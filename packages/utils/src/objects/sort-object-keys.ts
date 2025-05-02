/**
 * Sorts the keys of an object.
 *
 * @param obj - The object to sort.
 * @returns The sorted object.
 */
export function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  ) as T;
}
