/**
 * Enhances an error with additional context while preserving the original stack trace
 * @param {Error} originalError - The original error that was caught
 * @param {string} contextMessage - Additional context to prepend to the error message
 * @param {Object} [additionalProps] - Optional object with additional properties to add to the error
 * @returns {Error} - Enhanced error with preserved stack trace
 */
export function enhanceErrorWithContext(
  originalError: unknown,
  contextMessage: string,
): Error {
  // Create a new error with combined message
  const enhancedError = new Error(
    `${contextMessage}:\n${
      originalError instanceof Error
        ? originalError.message
        : String(originalError)
    }`,
  );

  // Preserve the original stack if possible
  if (originalError instanceof Error) {
    enhancedError.stack = originalError.stack;
  }

  return enhancedError;
}
