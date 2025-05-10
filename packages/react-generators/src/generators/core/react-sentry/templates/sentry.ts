// @ts-nocheck

import { config } from '%reactConfigImports';
import * as Sentry from '@sentry/react';
import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

const SENTRY_ENABLED = !!config.VITE_SENTRY_DSN;
const TRACE_SAMPLE_RATE = 1;

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: config.VITE_SENTRY_DSN,
    environment: config.VITE_ENVIRONMENT,
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
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
