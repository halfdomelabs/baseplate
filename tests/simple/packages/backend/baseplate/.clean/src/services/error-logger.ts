import { logger } from './logger';
import { logErrorToSentry } from './sentry';

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

  context.errorId = logErrorToSentry(error, context);

  logger.error({ err: error, ...context });

  return context.errorId;
}
