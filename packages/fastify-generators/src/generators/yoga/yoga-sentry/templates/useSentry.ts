// @ts-nocheck

import {
  getDocumentString,
  handleStreamOrSingleExecutionResult,
  isOriginalGraphQLError,
  OnExecuteDoneHookResultOnNextHook,
  type Plugin,
} from '@envelop/core';
import * as Sentry from '@sentry/node';
import {
  DocumentNode,
  ExecutionArgs,
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  print,
} from 'graphql';
import { isSentryEnabled } from '%fastify-sentry/service';
import { HttpError } from '@src/utils/http-errors';
import { logError } from '%error-logger';

// Copied from https://github.com/n1ru4l/envelop/blob/main/packages/plugins/sentry/src/index.ts
// Modified to allow reporting status of Sentry transactions

export interface SentryPluginOptions {
  /**
   * Adds result of each resolver and operation to Span's data (available under "result")
   * @default false
   */
  includeRawResult?: boolean;
  /**
   * Adds arguments of each resolver to Span's tag called "args"
   * @default false
   */
  includeResolverArgs?: boolean;
  /**
   * Adds operation's variables to a Scope (only in case of errors)
   * @default false
   */
  includeExecuteVariables?: boolean;
  /**
   * The key of the event id in the error's extension. `null` to disable.
   * @default sentryEventId
   */
  eventIdKey?: string | null;
  /**
   * Callback to set context information onto the scope.
   */
  configureScope?: (args: ExecutionArgs, scope: Sentry.Scope) => void;
  /**
   * Produces a name of Transaction (only when "renameTransaction" or "startTransaction" are enabled) and description of created Span.
   *
   * @default operation's name or "Anonymous Operation" when missing)
   */
  transactionName?: (args: ExecutionArgs) => string;
  /**
   * Indicates whether or not to skip the entire Sentry flow for given GraphQL operation.
   * By default, no operations are skipped.
   */
  skip?: (args: ExecutionArgs) => boolean;
  /**
   * Indicates whether or not to skip Sentry exception reporting for a given error.
   * By default, this plugin skips all `GraphQLError` errors and does not report it to Sentry.
   */
  skipError?: (args: Error) => boolean;
}

export const defaultSkipError = isOriginalGraphQLError;

interface TypedExecutionArgs extends ExecutionArgs {
  document: DocumentNode;
  operationName?: string;
}

interface OperationInfo {
  opName: string;
  opType: string;
  transactionName: string;
  document: string;
}

export const useSentry = (options: SentryPluginOptions = {}): Plugin => {
  if (!isSentryEnabled()) {
    return {};
  }

  const {
    includeRawResult = false,
    includeExecuteVariables = false,
    skip: skipOperation = () => false,
    skipError = defaultSkipError,
  } = options;

  const eventIdKey = options.eventIdKey === null ? null : 'sentryEventId';

  function addEventId(
    err: GraphQLError,
    eventId: string | undefined,
  ): GraphQLError {
    if (eventIdKey !== null && eventId) {
      err.extensions[eventIdKey] = eventId;
    }

    return err;
  }

  function getOperationInfo(
    args: TypedExecutionArgs,
  ): OperationInfo | undefined {
    if (skipOperation(args)) {
      return undefined;
    }

    const rootOperation = args.document.definitions.find(
      (o): o is OperationDefinitionNode => o.kind === Kind.OPERATION_DEFINITION,
    );
    if (!rootOperation) {
      return undefined;
    }
    const opType = rootOperation.operation;

    const document = getDocumentString(args.document, print);

    const opName =
      args.operationName ?? rootOperation.name?.value ?? 'Anonymous Operation';

    const transactionName = `${opType} ${opName}`;

    return {
      opName,
      opType,
      transactionName,
      document,
    };
  }

  function handleGraphQLErrors(
    args: TypedExecutionArgs,
    operationInfo: OperationInfo,
    resultErrors?: readonly unknown[],
  ): unknown[] | undefined {
    if (!resultErrors || resultErrors.length === 0) {
      return undefined;
    }
    Sentry.withScope((scope) => {
      if (includeExecuteVariables) {
        scope.setExtra('variables', args.variableValues);
      }

      scope.setTransactionName(operationInfo.transactionName);

      const errors = resultErrors.map((error) => {
        const err = error as GraphQLError;
        if (skipError(err) === true) {
          return err;
        }

        const errorPath = (err.path ?? [])
          .map((v: string | number) => (typeof v === 'number' ? '$index' : v))
          .join(' > ');

        scope.setContext('GraphQL', {
          operationName: operationInfo.opName,
          operationType: operationInfo.opType,
          document: operationInfo.document,
          path: errorPath,
        });

        const eventId = logError(err.originalError);

        return addEventId(err, eventId);
      });

      return errors;
    });
  }

  return {
    onExecute({ args }) {
      const operationInfo = getOperationInfo(args as TypedExecutionArgs);
      if (!operationInfo) {
        return undefined;
      }

      const { opType, opName, transactionName, document } = operationInfo;

      const hub = Sentry.getCurrentHub();

      const sentryTransaction = hub.getScope().getTransaction();

      if (sentryTransaction) {
        sentryTransaction.setName(transactionName, 'route');
        sentryTransaction.op = 'graphql.server';
        sentryTransaction.origin = 'auto.graphql.tracing';
        sentryTransaction.description = `${opType} ${opName}`;
        sentryTransaction.setContext('graphql', {
          operationType: opType,
          operationName: opName,
          document,
        });
        sentryTransaction.setTag('operationName', opName);
        sentryTransaction.setTag('operationType', opType);
      }

      const span = hub.getScope().getSpan();

      if (options.configureScope) {
        Sentry.configureScope((scope) => options.configureScope?.(args, scope));
      }

      const handleResult: OnExecuteDoneHookResultOnNextHook<unknown> = ({
        result,
        setResult,
      }) => {
        if (includeRawResult && span) {
          span.setData('result', result);
        }

        // get highest http error to set span status
        const httpStatus =
          result.errors?.reduce<number>((acc, err: GraphQLError) => {
            if (err.originalError instanceof HttpError) {
              return Math.max(acc, err.originalError.statusCode);
            }
            return Math.max(acc, 500);
          }, 200) ?? 200;

        span?.setHttpStatus(httpStatus);

        const updatedErrors = handleGraphQLErrors(
          args,
          operationInfo,
          result.errors,
        );

        if (updatedErrors) {
          setResult({
            ...result,
            errors: updatedErrors,
          });
        }
      };

      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(payload, handleResult);
        },
      };
    },
    // only handle errors from subscription execution
    onSubscribe({ args }) {
      const operationInfo = getOperationInfo(args as TypedExecutionArgs);
      if (!operationInfo) {
        return undefined;
      }

      return {
        onSubscribeResult(payload) {
          const handleResult: OnExecuteDoneHookResultOnNextHook<unknown> = ({
            result,
            setResult,
          }) => {
            const updatedErrors = handleGraphQLErrors(
              args,
              operationInfo,
              result.errors,
            );

            if (updatedErrors) {
              setResult({
                ...result,
                errors: updatedErrors,
              });
            }
          };
          return handleStreamOrSingleExecutionResult(payload, handleResult);
        },
      };
    },
  };
};
