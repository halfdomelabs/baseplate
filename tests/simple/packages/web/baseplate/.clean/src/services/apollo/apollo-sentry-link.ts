import { ApolloLink } from '@apollo/client';
import { getMainDefinition, Observable } from '@apollo/client/utilities';
import { Kind } from 'graphql';

import { logError } from '../error-logger';
import { logBreadcrumbToSentry } from '../sentry';

export const apolloSentryLink = new ApolloLink((operation, forward) => {
  operation.setContext({ startAt: Date.now() });
  return new Observable((observer) => {
    function logResult(error?: Error): void {
      try {
        const operationDuration = Date.now() - operation.getContext().startAt;
        const { operationName, query } = operation;
        const definition = getMainDefinition(query);
        const operationType =
          definition.kind === Kind.OPERATION_DEFINITION
            ? definition.operation
            : 'unknown';

        logBreadcrumbToSentry({
          type: 'query',
          category: 'graphql',
          message: `${operationType} ${operationName} [${operationDuration}ms]${
            error ? ` (Error: ${error.message})` : ''
          }`,
          level: error ? 'error' : 'info',
        });
      } catch (err) {
        logError(err);
      }
    }

    const sub = forward(operation).subscribe({
      next: (result) => {
        logResult(result.errors?.[0]);
        observer.next(result);
      },
      error: (error) => {
        if (error instanceof Error) {
          logResult(error);
        }
        observer.error(error);
      },
      complete: () => {
        observer.complete();
      },
    });
    return () => {
      sub.unsubscribe();
    };
  });
});
