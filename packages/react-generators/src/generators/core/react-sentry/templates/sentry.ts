// @ts-nocheck

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { config } from '%react-config';

const SENTRY_ENABLED = !!config.REACT_APP_SENTRY_DSN;

export function initializeSentry(): void {
  if (SENTRY_ENABLED) {
    Sentry.init({
      dsn: config.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    });
  }
}

export function captureSentryError(error: unknown): void {
  if (SENTRY_ENABLED) {
    Sentry.captureException(error);
  }
}
