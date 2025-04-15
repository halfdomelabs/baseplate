/**
 * Creates a Map from an iterable, using a key-generating function.
 * If multiple elements generate the same key, later elements override earlier ones.
 *
 * Analogous to lodash's keyBy function, but returns a Map instead of an object.
 *
 * @template T The type of elements in the iterable.
 * @template K The key type returned by the key function.
 * @param iterable The iterable to transform.
 * @param keyFn A function that returns a unique key for each element.
 * @returns A Map where each key maps to a single element.
 */
export function mapKeyBy<T, K>(
  iterable: Iterable<T>,
  keyFn: (item: T) => K,
): Map<K, T> {
  const result = new Map<K, T>();
  for (const item of iterable) {
    const key = keyFn(item);
    result.set(key, item);
  }
  return result;
}
