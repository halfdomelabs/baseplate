import { UserVisibleError } from 'src/utils/error';
import { logError } from './error-logger';

function getFormattedErrorSuffix(error: unknown): string {
  if (error instanceof UserVisibleError) {
    return error.message;
  }
  return 'Please try again later.';
}

export function formatError(
  error: unknown,
  context = 'Sorry, something went wrong.'
): string {
  const suffix = getFormattedErrorSuffix(error);
  return `${context} ${suffix}`;
}

export function logAndFormatError(error: unknown, context?: string): string {
  logError(error);
  return formatError(error, context);
}
