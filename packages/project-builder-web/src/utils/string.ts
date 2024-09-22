// Split the string into words and separators, preserving original form
function splitIntoTokens(str: string): string[] {
  const regex = /([_\s-]*[A-Z]+(?![^\s\-_A-Z])|[_\s-]*[A-Z]*[^\s\-_A-Z]+)/g;
  return str.match(regex) ?? [];
}

/**
 * Truncates a string and appends an ellipsis ('...') if it exceeds the specified maximum length.
 *
 * @param str - The string to be truncated.
 * @param maxLength - The maximum allowed length of the string including the ellipsis.
 * @returns The truncated string with an ellipsis if it exceeds the maximum length, otherwise the original string.
 */
export function ellipsisString(str: string, maxLength: number): string {
  return str.length <= maxLength
    ? str
    : str.substring(0, maxLength - 3) + '...';
}

/**
 * Truncates a string from the middle and adds an ellipsis ('...') if it exceeds the specified maximum length.
 *
 * @param str - The input string to be truncated.
 * @param maxLength - The maximum allowed length of the truncated string including the ellipsis, defaults to 20.
 * @returns The truncated string with an ellipsis in the middle if it exceeds the maximum length.
 *
 * The function works as follows:
 * - If the input string length is less than or equal to the maximum length, it returns the original string.
 * - If the input string length is less than or equal to 3, it returns '...'.
 * - It splits the string into tokens and checks if the first and last tokens together exceed the maximum length.
 * - If they do, it truncates the string using an ellipsis.
 * - Otherwise, it reconstructs the string by adding tokens until the length exceeds the maximum length, then adds an ellipsis and the last token.
 */
export function ellipsisStringFromMiddle(str: string, maxLength = 20): string {
  if (str.length <= maxLength) {
    return str;
  }

  if (str.length <= 3) {
    return '...';
  }

  const tokens = splitIntoTokens(str);

  if (tokens.length === 1) {
    return ellipsisString(str, maxLength);
  }

  // Check if first and last tokens exceed maxLength
  const firstToken = tokens[0];
  const lastToken = tokens[tokens.length - 1].replace(/^[_\s-]+/, '');
  const lastTokenLength = lastToken.length;
  if (firstToken.length + lastTokenLength + 3 > maxLength) {
    return ellipsisString(str, maxLength);
  }

  let reconstructed = firstToken;

  // Keep adding tokens until the length exceeds maxLength
  for (let i = 1; i < tokens.length - 1; i++) {
    const nextTokenLength = tokens[i].length;
    if (
      reconstructed.length + nextTokenLength + lastTokenLength + 3 >
      maxLength
    ) {
      break;
    }
    reconstructed += tokens[i];
  }

  // trim any separators from the end of the last token
  return reconstructed + '...' + lastToken;
}
