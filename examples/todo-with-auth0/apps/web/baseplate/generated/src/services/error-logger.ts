import type { GraphQLFormattedError } from 'graphql';

import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { GraphQLError } from 'graphql';

import { logger } from './logger';
import { logErrorToSentry } from './sentry';

/* HOISTED:annotate-graphql-error:START */

function annotateGraphQLError(
  error: GraphQLError | GraphQLFormattedError,
  context: Record<string, unknown>,
): void {
  context.reqId = error.extensions?.reqId;
  context.code = error.extensions?.code;
  context.statusCode = error.extensions?.statusCode;
  context.path = error.path?.join('.');
  // only visible in development
  const originalError = error.extensions?.originalError as {
    message?: string;
    stack?: string;
  } | null;
  if (typeof originalError === 'object' && originalError !== null) {
    context.originalError = originalError.message;
    const serverError = new Error(originalError.message);
    serverError.stack = `[Original Error] ${originalError.stack}`;
    logger.error(serverError);
  }
}

/* HOISTED:annotate-graphql-error:END */

interface ErrorContext extends Record<string, unknown> {
  errorId?: string;
}

/**
 * Logs error to the appropriate receivers.
 *
 * @param err Error object
 * @param additionalContext Additional context to be logged
 */
export function logError(
  error: unknown,
  additionalContext?: Record<string, unknown>,
): string | undefined {
  const context: ErrorContext = { ...additionalContext };

  /* TPL_CONTEXT_ACTIONS:START */

  if (error instanceof GraphQLError) {
    annotateGraphQLError(error, context);
  }

  if (CombinedGraphQLErrors.is(error)) {
    if (error.errors.length > 0) {
      annotateGraphQLError(error.errors[0], context);
    }
    // it's more useful to log the current stack trace than the one from
    // CombinedGraphQLErrors which is always the same
    const currentStack = new Error('stack').stack?.split('\n');
    error.stack = [
      error.stack?.split('\n')[0],
      currentStack
        ?.slice(currentStack.findIndex((line) => line.includes('logError')) + 1)
        .join('\n'),
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (ServerError.is(error)) {
    context.networkErrorResponse = error.bodyText;
  }

  /* TPL_CONTEXT_ACTIONS:END */

  /* TPL_LOGGER_ACTIONS:START */
  context.errorId = logErrorToSentry(error, context);
  /* TPL_LOGGER_ACTIONS:END */

  if (Object.keys(context).length > 0) {
    logger.error(error, context);
  } else {
    logger.error(error);
  }

  return context.errorId;
}
