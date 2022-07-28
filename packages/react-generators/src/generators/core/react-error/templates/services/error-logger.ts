// @ts-nocheck

import { logger } from '%react-logger';

/**
 * Logs an error to the appropriate receivers.
 *
 * @param err Error object
 */
export function logError(error: unknown): void {
  logger.error(error);
  ERROR_REPORTERS;
}
