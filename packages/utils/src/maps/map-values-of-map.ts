/**
 * Maps the values of a Map to a new Map with the same keys.
 *
 * @template K - Type of keys in the map.
 * @template V - Original value type.
 * @template R - Resulting value type.
 * @param map - The input Map to transform.
 * @param fn - A function to transform each value, receiving the value, key, and original map.
 * @returns A new Map with the same keys and transformed values.
 */
export function mapValuesOfMap<K, V, R>(
  map: Map<K, V>,
  fn: (value: V, key: K, map: Map<K, V>) => R,
): Map<K, R> {
  const result = new Map<K, R>();
  for (const [key, value] of map.entries()) {
    result.set(key, fn(value, key, map));
  }
  return result;
}
