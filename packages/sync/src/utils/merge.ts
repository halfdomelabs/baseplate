/**
 * Merges a variable number of `Map` instances or arrays of entries (`[key, value]`)
 * into a single `Map`. Throws an error if duplicate keys are found.
 *
 * @param {...(Map | [key, value][])[]} maps - A variable number of `Map` instances or arrays of entries to merge.
 * @returns {Map} - A new `Map` containing the merged entries.
 * @throws {Error} If a duplicate key is found across the provided maps.
 *
 * @example
 * const map1 = new Map([['a', 1]]);
 * const map2 = new Map([['b', 2]]);
 * const arrayEntries = [['c', 3]];
 * const result = safeMergeMap(map1, map2, arrayEntries);
 * // Result: Map { 'a' => 1, 'b' => 2, 'c' => 3 }
 *
 * @example
 * const map1 = new Map([['a', 1]]);
 * const map2 = new Map([['a', 2]]);
 * safeMergeMap(map1, map2); // Throws Error: Duplicate key found during merge: a
 */
export function safeMergeMap<K, V>(
  ...maps: (Map<K, V> | [K, V][])[]
): Map<K, V> {
  const result = new Map<K, V>();

  for (const map of maps) {
    for (const [key, value] of map) {
      if (result.has(key)) {
        throw new Error(`Duplicate key found during merge: ${String(key)}`);
      }
      result.set(key, value);
    }
  }

  return result;
}
