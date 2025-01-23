/**
 * Finds duplicates in a list of strings
 *
 * @param strings List of strings
 * @returns List of duplicates
 */
export function findDuplicates(strings: string[]): string[] {
  const stringSet = new Set<string>();
  const duplicates: string[] = [];

  for (const str of strings) {
    if (stringSet.has(str)) {
      duplicates.push(str);
    } else {
      stringSet.add(str);
    }
  }

  return duplicates;
}
