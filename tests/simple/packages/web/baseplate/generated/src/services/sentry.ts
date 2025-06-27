import type { GraphQLFormattedError } from 'graphql';

import { ApolloError } from '@apollo/client';
import * as Sentry from '@sentry/react';
import { GraphQLError } from 'graphql';
import React from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';

import { config } from './config';

function configureSentryScopeForGraphqlError(
  scope: Sentry.Scope,
  error: GraphQLError | GraphQLFormattedError,
): void {
  scope.setFingerprint(
    [
      '{{ default }}',
      error.extensions?.code as string,
      error.path?.join('.'),
    ].filter((value): value is string => typeof value === 'string' && !!value),
  );
  if (error.path?.[0]) {
    scope.setTransactionName(String(error.path[0]));
    scope.setTag('path', String(error.path.join('.')));
  }
}

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
    if (error instanceof ApolloError && error.graphQLErrors.length === 1) {
      const graphqlError = error.graphQLErrors[0];
      configureSentryScopeForGraphqlError(scope, graphqlError);
    }

    if (error instanceof GraphQLError) {
      configureSentryScopeForGraphqlError(scope, error);
    }

    if (additionalContext) {
      scope.setExtras(additionalContext);
    }

    sentryId = Sentry.captureException(error);
  });

  return sentryId;
}
