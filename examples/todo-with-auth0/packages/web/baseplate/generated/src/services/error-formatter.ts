import { logError } from './error-logger';

/* TPL_GET_FORMATTED_ERROR_SUFFIX:START */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFormattedErrorSuffix(_error: unknown): string {
  return 'Please try again later.';
}
/* TPL_GET_FORMATTED_ERROR_SUFFIX:END */

export function formatError(
  error: unknown,
  context = 'Sorry, something went wrong.',
): string {
  const suffix = getFormattedErrorSuffix(error);
  return `${context} ${suffix}`;
}

export function logAndFormatError(error: unknown, context?: string): string {
  logError(error);
  return formatError(error, context);
}
