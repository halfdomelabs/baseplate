import type { GraphQLFormattedError } from 'graphql';

import { ApolloError } from '@apollo/client';
import * as Sentry from '@sentry/react';
import { GraphQLError } from 'graphql';

import { router } from '../app/router';
import { config } from './config';

/* HOISTED:configureSentryScopeForGraphqlError:START */

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

/* HOISTED:configureSentryScopeForGraphqlError:END */

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
    /* TPL_SENTRY_SCOPE_ACTIONS:START */

    if (error instanceof ApolloError && error.graphQLErrors.length === 1) {
      const graphqlError = error.graphQLErrors[0];
      configureSentryScopeForGraphqlError(scope, graphqlError);
    }

    if (error instanceof GraphQLError) {
      configureSentryScopeForGraphqlError(scope, error);
    }

    /* TPL_SENTRY_SCOPE_ACTIONS:END */
    if (additionalContext) {
      scope.setExtras(additionalContext);
    }

    sentryId = Sentry.captureException(error);
  });

  return sentryId;
}
