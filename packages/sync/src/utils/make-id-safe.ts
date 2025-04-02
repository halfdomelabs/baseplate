/**
 * Makes string safe for use as an identifier
 *
 * @param str - The string to make safe
 * @returns The safe string
 */
export function makeIdSafe(str: string): string {
  return str.replaceAll(/[^a-zA-Z0-9]/g, '_');
}
