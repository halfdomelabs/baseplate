/**
 * Asserts that an array has no duplicate values based on an optional key function.
 * Throws an error if duplicates are found, listing all duplicate keys.
 *
 * @template T The type of elements in the array.
 * @param items The array to check for duplicates.
 * @param context A string describing the context for the error message (e.g., "route loader fields").
 * @param keyFn A function that extracts the comparison key from each element. Defaults to identity.
 * @throws Error if duplicate keys are found.
 */
export function assertNoDuplicates<T>(
  items: readonly T[],
  context: string,
  keyFn?: (item: T) => unknown,
): void {
  const getKey = keyFn ?? ((item: T) => item);
  const seen = new Map<unknown, number>();
  const duplicates: unknown[] = [];

  for (const item of items) {
    const key = getKey(item);
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 1) {
      // First time we see a duplicate
      duplicates.push(key);
    }
  }

  if (duplicates.length > 0) {
    const duplicateList = duplicates
      .map((key) => JSON.stringify(key))
      .join(', ');
    throw new Error(`Duplicate ${context} found: ${duplicateList}`);
  }
}
