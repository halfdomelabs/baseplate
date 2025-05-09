import type { FastifyError } from 'fastify';

import * as Sentry from '@sentry/node';
import { omit } from 'es-toolkit';
import { GraphQLError } from 'graphql';

import { HttpError } from '../utils/http-errors.js';
import { config } from './config.js';

const SENTRY_ENABLED = !!config.SENTRY_DSN;

// Sensitive headers that should not be logged to Sentry with the request
const EXCLUDED_HEADERS = ['cookie', 'authorization'];

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

  if (error instanceof GraphQLError) {
    return (
      !error.extensions.http?.status || error.extensions.http.status >= 500
    );
  }

  return true;
}

export function registerSentryEventProcessor(): void {
  Sentry.addEventProcessor((event, hint) => {
    if (hint.originalException && !shouldLogToSentry(hint.originalException)) {
      return null;
    }

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
  if (!SENTRY_ENABLED) {
    return;
  }
  const sentryId = Sentry.captureException(
    error,
    additionalContext ? { extra: additionalContext } : undefined,
  );

  return sentryId;
}
