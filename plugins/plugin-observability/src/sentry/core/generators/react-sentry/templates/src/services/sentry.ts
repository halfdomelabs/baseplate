// @ts-nocheck

import { config } from '%reactConfigImports';
import { router } from '%reactRouterImports';
import * as Sentry from '@sentry/react';

const SENTRY_ENABLED = !!config.VITE_SENTRY_DSN;
const TRACE_SAMPLE_RATE = 1;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: config.VITE_SENTRY_DSN,
    environment: config.VITE_ENVIRONMENT,
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: TRACE_SAMPLE_RATE,
  });
}

export function identifySentryUser(user: Sentry.User): void {
  if (!SENTRY_ENABLED) return;

  Sentry.setUser(user);
}

export function logBreadcrumbToSentry(breadcrumb: Sentry.Breadcrumb): void {
  if (!SENTRY_ENABLED) return;

  Sentry.addBreadcrumb(breadcrumb);
}

export function logErrorToSentry(
  error: unknown,
  additionalContext?: Record<string, unknown>,
): string | undefined {
  if (!SENTRY_ENABLED) return;

  let sentryId: string | undefined;

  Sentry.withScope((scope) => {
    TPL_SENTRY_SCOPE_ACTIONS;
    if (additionalContext) {
      scope.setExtras(additionalContext);
    }

    sentryId = Sentry.captureException(error);
  });

  return sentryId;
}
