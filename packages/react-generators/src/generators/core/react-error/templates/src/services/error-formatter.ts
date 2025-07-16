// @ts-nocheck

import { logError } from '$errorLogger';

TPL_GET_FORMATTED_ERROR_SUFFIX;

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
