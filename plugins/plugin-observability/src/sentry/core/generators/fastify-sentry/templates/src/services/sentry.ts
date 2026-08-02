// @ts-nocheck

import type { FastifyError } from 'fastify';

import { getConfig } from '%configServiceImports';
import { HttpError } from '%errorHandlerServiceImports';
import * as Sentry from '@sentry/node';
import { omit } from 'es-toolkit';

// Sensitive headers that should not be logged to Sentry with the request
const EXCLUDED_HEADERS = ['cookie', 'authorization'];

export function isSentryEnabled(): boolean {
  // An error logger must never throw: in a process without backend env,
  // treat Sentry as disabled rather than propagating the config parse error.
  try {
    return !!getConfig().SENTRY_DSN;
  } catch {
    return false;
  }
}

export function shouldLogToSentry(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.statusCode >= 500;
  }

  const fastifyError = error as FastifyError;
  if (typeof fastifyError === 'object' && fastifyError.statusCode) {
    return fastifyError.statusCode <= 500;
  }

  TPL_LOG_TO_SENTRY_CONDITIONS;

  return true;
}

export function registerSentryEventProcessor(): void {
  Sentry.addEventProcessor((event, hint) => {
    if (hint.originalException && !shouldLogToSentry(hint.originalException)) {
      return null;
    }

    TPL_SCOPE_CONFIGURATION;

    return event;
  });

  // Make sure we don't send sensitive data to Sentry
  Sentry.addEventProcessor((event) => {
    if (event.request) {
      if (EXCLUDED_HEADERS.includes('cookie')) {
        delete event.request.cookies;
      }
      if (event.request.headers) {
        event.request.headers = omit(event.request.headers, EXCLUDED_HEADERS);
      }
    }
    return event;
  });
}

export function logErrorToSentry(
  error: unknown,
  additionalContext?: Record<string, unknown>,
): string | undefined {
  if (!isSentryEnabled()) {
    return;
  }
  const sentryId = Sentry.captureException(
    error,
    additionalContext ? { extra: additionalContext } : undefined,
  );

  return sentryId;
}
