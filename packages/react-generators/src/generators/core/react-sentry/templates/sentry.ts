// @ts-nocheck

import * as Sentry from '@sentry/react';
import { config } from '%react-config';

const SENTRY_ENABLED = !!config.VITE_SENTRY_DSN;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: config.VITE_SENTRY_DSN,
    environment: config.VITE_ENVIRONMENT,
    integrations: [new Sentry.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

export function identifySentryUser(user: Sentry.User): void {
  if (SENTRY_ENABLED) {
    Sentry.setUser(user);
  }
}

export function captureSentryError(error: unknown): void {
  if (SENTRY_ENABLED) {
    Sentry.captureException(error);
  }
}
