import { distance } from 'fastest-levenshtein';

/**
 * Finds the n closest matches to a target string from an array of strings using Levenshtein distance.
 *
 * @param target - The string to find matches for
 * @param candidates - Array of candidate strings to search through
 * @param n - Number of closest matches to return (defaults to 1)
 * @returns Array of the n closest matches, sorted by distance (closest first)
 *
 * @example
 * ```typescript
 * const candidates = ['apple', 'banana', 'orange', 'grape'];
 * const matches = findClosestMatch('aple', candidates, 2);
 * // Returns: ['apple', 'grape'] (assuming these are the 2 closest matches)
 * ```
 */
export function findClosestMatch(
  target: string,
  candidates: string[],
  n = 1,
): string[] {
  if (candidates.length === 0) {
    return [];
  }

  if (n <= 0) {
    return [];
  }

  // Calculate distances for all candidates
  const distances = candidates.map((candidate, index) => ({
    candidate,
    distance: distance(target, candidate),
    index,
  }));

  // Sort by distance (ascending) and then by original index for stable sorting
  distances.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return a.index - b.index;
  });

  // Return the n closest matches
  return distances.slice(0, n).map((item) => item.candidate);
}
