// @ts-nocheck
import * as Sentry from '@sentry/node';
import { config } from './config';
import { HttpError } from '%http-errors';
import { FastifyError } from 'fastify';

const SENTRY_ENABLED = !!config.SENTRY_DSN;

export function isSentryEnabled(): boolean {
  return SENTRY_ENABLED;
}

export function shouldLogToSentry(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.statusCode >= 500;
  }

  const fastifyError = error as FastifyError;
  if (typeof fastifyError === 'object' && fastifyError.statusCode) {
    return fastifyError.statusCode <= 500;
  }

  SHOULD_LOG_TO_SENTRY_BLOCKS;

  return true;
}

export function registerSentryEventProcessor(): void {
  Sentry.addEventProcessor((event, hint) => {
    if (hint?.originalException && !shouldLogToSentry(hint.originalException)) {
      return null;
    }
    SCOPE_CONFIGURATION_BLOCKS;
    return event;
  });
}

export function logErrorToSentry(
  error: unknown,
  additionalContext?: Record<string, unknown>,
): string | undefined {
  if (!SENTRY_ENABLED) {
    return;
  }
  const sentryId = Sentry.captureException(
    error,
    additionalContext ? { extra: additionalContext } : undefined,
  );

  return sentryId;
}
