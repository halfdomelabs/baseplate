// @ts-nocheck

import { config } from '%configServiceImports';
import { SEMANTIC_ATTRIBUTE_SENTRY_OP } from '@sentry/core';
import * as Sentry from '@sentry/node';
import os from 'node:os';

const SENTRY_ENABLED = !!config.SENTRY_DSN;

const IGNORED_TRANSACTION_NAMES = new Set(['GET /healthz']);

const SENTRY_TRACES_SAMPLE_RATE = 1;

// Ensure to call this before importing any other modules!
if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.APP_ENVIRONMENT,
    serverName: os.hostname(),
    integrations: TPL_INTEGRATIONS,

    tracesSampler: ({ parentSampled, attributes, name }) => {
      // Only trace incoming HTTP server transactions (Sentry infers
      // `sentry.op` before sampling). Background roots (queue polls, cron
      // jobs) never end, so their buffered child spans would leak memory.
      if (attributes?.[SEMANTIC_ATTRIBUTE_SENTRY_OP] !== 'http.server') {
        return false;
      }

      // Honor an upstream sampling decision (e.g. distributed trace headers).
      if (typeof parentSampled === 'boolean') {
        return parentSampled;
      }

      // The transaction `name` is "<METHOD> <path>" (e.g. "GET /healthz")
      // regardless of OTel semantic-convention version.
      if (IGNORED_TRANSACTION_NAMES.has(name)) {
        return false;
      }

      return SENTRY_TRACES_SAMPLE_RATE;
    },

    // Set sampling rate for profiling
    // This is relative to tracesSampleRate
    profilesSampleRate: 1,
  });
}
