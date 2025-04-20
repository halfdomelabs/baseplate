// @ts-nocheck

import { logger } from '%reactLoggerImports';

interface ErrorContext extends Record<string, unknown> {
  errorId?: string;
}

/**
 * Logs error to the appropriate receivers.
 *
 * @param err Error object
 * @param additionalContext Additional context to be logged
 */
export function logError(
  error: unknown,
  additionalContext?: Record<string, unknown>,
): string | undefined {
  const context: ErrorContext = { ...additionalContext };

  TPL_CONTEXT_ACTIONS;

  TPL_LOGGER_ACTIONS;

  if (Object.keys(context).length) {
    logger.error(error, context);
  } else {
    logger.error(error);
  }

  return context.errorId;
}
