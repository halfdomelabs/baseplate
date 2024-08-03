/**
 * Capitalize the first letter of a string
 *
 * Mirrors Capitalize type from Typescript (https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
 *
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalizeString(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
