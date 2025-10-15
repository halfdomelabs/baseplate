// Hack to get the correct type for the sentryTransport

import * as Sentry from '@sentry/node';

import { getSentryTestkit } from './sentry.test-kit.test-helper.js';

// initialize your Sentry instance with sentryTransport
Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  transport: getSentryTestkit().sentryTransport,
  sendDefaultPii: true,
  tracesSampleRate: 1,
});
