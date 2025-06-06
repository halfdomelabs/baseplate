// @ts-nocheck

import { logError } from './error-logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFormattedErrorSuffix(error: unknown): string {
  TPL_ERROR_FORMATTERS;
  return 'Please try again later.';
}

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
