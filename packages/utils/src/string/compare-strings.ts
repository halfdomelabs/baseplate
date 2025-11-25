/**
 * Stable string comparison function that uses case-insensitive lexicographic ordering
 * with a case-sensitive tiebreaker for determinism.
 *
 * This matches the default behavior of `localeCompare` (case-insensitive) while
 * providing consistent results across different operating systems and locales.
 * Use this for deterministic sorting where locale-aware comparison is not required.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * ```ts
 * const items = ['Banana', 'apple', 'Cherry', 'cherry'];
 * items.sort(compareStrings); // ['apple', 'Banana', 'Cherry', 'cherry']
 * ```
 */
export function compareStrings(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower < bLower) return -1;
  if (aLower > bLower) return 1;
  // Tiebreaker: case-sensitive comparison for determinism
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
