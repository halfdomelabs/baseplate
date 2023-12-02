// @ts-nocheck

import { logger } from '%react-logger';

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

  CONTEXT_ACTIONS;

  LOGGER_ACTIONS;

  if (Object.keys(context).length) {
    logger.error(error, context);
  } else {
    logger.error(error);
  }

  return context.errorId;
}
