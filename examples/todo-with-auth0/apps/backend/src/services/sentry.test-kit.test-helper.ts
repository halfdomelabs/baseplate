import type * as Sentry from '@sentry/node';

import sentryTestkit from 'sentry-testkit';

// See https://github.com/zivl/sentry-testkit/issues/142
type TypedSentryTestkit = Omit<
  ReturnType<typeof sentryTestkit>,
  'sentryTransport'
> & {
  sentryTransport: Sentry.NodeOptions['transport'];
};

const testkitInstance = sentryTestkit() as TypedSentryTestkit;

export function getSentryTestkit(): TypedSentryTestkit {
  return testkitInstance;
}
