/**
 * Wraps a string in double quotes.
 *
 * @param str - The string to wrap in double quotes.
 * @returns The string wrapped in double quotes.
 */
export function doubleQuot(str: string): string {
  if (str.includes('"')) {
    throw new Error(`String cannot contain "`);
  }
  return `"${str}"`;
}
