/**
 * Quotes a string with single quotes and escapes single quotes.
 * @param value - The string to quote.
 * @returns The quoted string.
 */
export function quot(value: string): string {
  return `'${value.replaceAll("'", String.raw`\'`)}'`;
}

/**
 * Quotes a string with double quotes and escapes double quotes.
 * @param value - The string to quote.
 * @returns The quoted string.
 */
export function doubleQuot(value: string): string {
  return `"${value.replaceAll('"', String.raw`\"`)}"`;
}
