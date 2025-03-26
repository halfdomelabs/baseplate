/**
 * Groups values of an iterable using a key-generating function and returns a Map.
 *
 * Mimics the behavior of ES2025 `Map.groupBy`.
 *
 * @template T The type of elements in the iterable.
 * @template K The key type returned by the key function.
 * @param iterable The iterable to group.
 * @param keyFn A function that returns a grouping key for each element.
 * @returns A Map where each key maps to an array of elements with that key.
 */
export function mapGroupBy<T, K>(
  iterable: Iterable<T>,
  keyFn: (item: T) => K,
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  for (const item of iterable) {
    const key = keyFn(item);
    const group = result.get(key);
    if (group) {
      group.push(item);
    } else {
      result.set(key, [item]);
    }
  }
  return result;
}
