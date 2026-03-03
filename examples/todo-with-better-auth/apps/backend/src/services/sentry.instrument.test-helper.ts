import * as Sentry from '@sentry/node';

import { sentryTestCollector } from './sentry.test-collector.test-helper.js';

Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  beforeSend: sentryTestCollector.beforeSend,
  sendDefaultPii: true,
  tracesSampleRate: 1,
});
