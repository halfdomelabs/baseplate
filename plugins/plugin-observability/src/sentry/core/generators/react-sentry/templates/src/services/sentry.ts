// @ts-nocheck

import type { AnyRouter } from '@tanstack/react-router';

import { config } from '%reactConfigImports';
import * as Sentry from '@sentry/react';

const SENTRY_ENABLED = !!config.VITE_SENTRY_DSN;
const TRACE_SAMPLE_RATE = 1;

/**
 * Initializes Sentry with router instrumentation.
 *
 * Called from the app entrypoint: this module must not import the router, which
 * would create a dependency cycle.
 *
 * @param router The router instance to instrument.
 */
export function initSentry(router: AnyRouter): void {
  if (!SENTRY_ENABLED) return;

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
