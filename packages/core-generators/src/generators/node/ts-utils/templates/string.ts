// @ts-nocheck

/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
