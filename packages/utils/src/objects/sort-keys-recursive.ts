/**
 * Recursively sorts all keys in an object, including nested objects and arrays.
 *
 * @param obj - The object to sort recursively.
 * @returns A new object with all keys sorted recursively.
 */
export function sortKeysRecursive<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeysRecursive) as T;
  }

  return Object.fromEntries(
    Object.entries(obj)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, sortKeysRecursive(value)]),
  ) as T;
}
