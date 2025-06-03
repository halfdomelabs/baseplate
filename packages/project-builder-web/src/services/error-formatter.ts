import type { AppRouter } from '@baseplate-dev/project-builder-server';

import { TRPCClientError } from '@trpc/client';

import { UserVisibleError } from '#src/utils/error.js';

import { logError } from './error-logger.js';

type TypedTRPCClientError = TRPCClientError<AppRouter>;

function getFormattedErrorSuffix(error: unknown): string {
  if (error instanceof TRPCClientError) {
    const typedError = error as TypedTRPCClientError;
    if (typedError.data?.isUserVisible && typedError.message) {
      return [typedError.message, typedError.data.descriptionText]
        .filter(Boolean)
        .join('\n');
    }
    if (typedError.message.includes('Failed to fetch')) {
      return 'Could not connect to the server. Please start the server and try again.';
    }
  }
  if (error instanceof UserVisibleError) {
    return error.message;
  }
  return 'Check console logs for more details.';
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
