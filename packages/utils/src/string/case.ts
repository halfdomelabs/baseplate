/**
 * Lowercase the first character of a string, leaving the remainder unchanged.
 *
 * - Returns the input unchanged when it's an empty string
 * - Non-alphabetic first characters are returned as-is
 *
 * @param str - The input string
 * @returns The string with the first character lowercased
 * @example
 * lowercaseFirstChar('Hello') // 'hello'
 * lowercaseFirstChar('hello') // 'hello'
 * lowercaseFirstChar('1World') // '1World'
 */
export function lowercaseFirstChar(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Uppercase the first character of a string, leaving the remainder unchanged.
 *
 * - Returns the input unchanged when it's an empty string
 * - Non-alphabetic first characters are returned as-is
 *
 * @param str - The input string
 * @returns The string with the first character uppercased
 * @example
 * uppercaseFirstChar('hello') // 'Hello'
 * uppercaseFirstChar('Hello') // 'Hello'
 * uppercaseFirstChar('#tag') // '#tag'
 */
export function uppercaseFirstChar(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}
