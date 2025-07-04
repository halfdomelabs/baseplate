/**
 * Converts a string to the specified case while preserving non-alphanumeric prefixes and suffixes.
 *
 * @param input - The string to convert
 * @param caseConverter - The case conversion function to apply
 * @returns The converted string with preserved prefix and suffix
 *
 * @example
 * ```typescript
 * convertCaseWithPrefix('_layoutTest', kebabCase)
 * // Returns: '_layout-test'
 *
 * convertCaseWithPrefix('__privateHelper', kebabCase)
 * // Returns: '__private-helper'
 *
 * convertCaseWithPrefix('[id]', kebabCase)
 * // Returns: '[id]'
 * ```
 */
export function convertCaseWithPrefix(
  input: string,
  caseConverter: (str: string) => string,
): string {
  // Handle special pattern where the entire string is non-alphanumeric (like "[id]")
  if (!/[a-zA-Z0-9]/.test(input)) {
    return input;
  }

  // Extract non-alphanumeric prefix
  const prefixMatch = /^([^a-zA-Z0-9]*)/.exec(input);
  const prefix = prefixMatch?.[1] ?? '';

  // Extract non-alphanumeric suffix
  const suffixMatch = /([^a-zA-Z0-9]*)$/.exec(input);
  const suffix = suffixMatch?.[1] ?? '';

  // Get the middle part (everything between prefix and suffix)
  const startIndex = prefix.length;
  const endIndex = input.length - suffix.length;
  const middlePart = input.slice(startIndex, endIndex);

  // Only apply case conversion to the middle part if it contains alphanumeric characters
  const convertedMiddlePart =
    middlePart && /[a-zA-Z0-9]/.test(middlePart)
      ? caseConverter(middlePart)
      : middlePart;

  return prefix + convertedMiddlePart + suffix;
}
