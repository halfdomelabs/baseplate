// @ts-nocheck

HEADER;

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
  const context = {
    ...additionalContext,
    errorId: undefined as string | undefined,
  };

  LOGGER_ACTIONS;

  return context.errorId;
}
