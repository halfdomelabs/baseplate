import { logger } from './logger';

/**
 * Reports error remotely
 *
 * @param error Error object
 */
export function reportError(error: unknown): void {
  // no error reporters registered
}

/**
 * Logs an error to the appropriate receivers.
 *
 * @param err Error object
 */
export function reportAndLogError(error: unknown): void {
  reportError(error);
  logger.error(error);
}
