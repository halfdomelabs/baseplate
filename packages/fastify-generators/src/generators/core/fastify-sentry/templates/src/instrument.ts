// @ts-nocheck

import { config } from '%configServiceImports';
import * as Sentry from '@sentry/node';
import os from 'node:os';

const SENTRY_ENABLED = !!config.SENTRY_DSN;

const IGNORED_TRANSACTION_PATHS = new Set(['/healthz']);

const SENTRY_TRACES_SAMPLE_RATE = 1;

// Ensure to call this before importing any other modules!
if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.APP_ENVIRONMENT,
    serverName: os.hostname(),
    integrations: TPL_INTEGRATIONS,

    tracesSampler: ({ parentSampled, attributes }) => {
      const httpTarget = attributes?.['http.target'];
      if (
        typeof httpTarget === 'string' &&
        IGNORED_TRANSACTION_PATHS.has(httpTarget)
      ) {
        return false;
      }

      if (typeof parentSampled === 'boolean') {
        return parentSampled;
      }

      return SENTRY_TRACES_SAMPLE_RATE;
    },

    // Set sampling rate for profiling
    // This is relative to tracesSampleRate
    profilesSampleRate: 1,
  });
}
