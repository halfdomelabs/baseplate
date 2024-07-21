// @ts-nocheck
import * as Sentry from '@sentry/node';
import { config } from './config';

const SENTRY_ENABLED = !!config.SENTRY_DSN;

export function isSentryEnabled(): boolean {
  return SENTRY_ENABLED;
}

export function registerSentryEventProcessor(): void {
  Sentry.addEventProcessor((event) => {
    SCOPE_CONFIGURATION_BLOCKS;
    return event;
  });
}

export function logErrorToSentry(
  error: Error,
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
