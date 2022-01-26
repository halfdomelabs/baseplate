/**
 * Converts an unknown error into a string with correct type-checking
 *
 * @param error Unknown thrown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return `Unknown error of type ${typeof error}`;
}
