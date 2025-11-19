/**
 * Stable string comparison function that uses lexicographic ordering.
 *
 * Unlike `localeCompare`, this function provides consistent results across
 * different operating systems and locales. Use this for deterministic sorting
 * where locale-aware comparison is not required.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * ```ts
 * const items = ['banana', 'apple', 'cherry'];
 * items.sort(compareStrings); // ['apple', 'banana', 'cherry']
 * ```
 */
export function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
