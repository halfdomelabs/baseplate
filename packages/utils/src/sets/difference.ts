/**
 * Returns a new Set containing values in `setA` that are not in `setB`.
 *
 * @param setA - The original set
 * @param setB - The set of values to exclude
 * @returns A new Set with the difference
 */
export function differenceSet<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const value of setA) {
    if (!setB.has(value)) {
      result.add(value);
    }
  }
  return result;
}
