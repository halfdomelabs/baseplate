import { getAxiosErrorInfo } from './axios.js';
import { logger } from './logger.js';
import { logErrorToSentry } from './sentry.js';

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

  /* TPL_CONTEXT_ACTIONS:START */
  Object.assign(context, getAxiosErrorInfo(error));
  /* TPL_CONTEXT_ACTIONS:END */

  /* TPL_LOGGER_ACTIONS:START */
  context.errorId = logErrorToSentry(error, context);
  /* TPL_LOGGER_ACTIONS:END */

  logger.error({ err: error, ...context });

  return context.errorId;
}
