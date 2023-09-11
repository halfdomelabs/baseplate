// @ts-nocheck

import {
  getDocumentString,
  handleStreamOrSingleExecutionResult,
  isOriginalGraphQLError,
  OnExecuteDoneHookResultOnNextHook,
  type Plugin,
} from '@envelop/core';
import * as Sentry from '@sentry/node';
import type { Primitive, Span, TraceparentData } from '@sentry/types';
import {
  DocumentNode,
  ExecutionArgs,
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  print,
} from 'graphql';
import { logger } from '@src/services/logger';
import { isSentryEnabled } from '%fastify-sentry/service';
import { HttpError } from '@src/utils/http-errors';

// Copied from https://github.com/n1ru4l/envelop/blob/main/packages/plugins/sentry/src/index.ts
// Modified to allow reporting status of Sentry transactions

export interface SentryPluginOptions {
  /**
   * Starts a new transaction for every GraphQL Operation.
   * When disabled, an already existing Transaction will be used.
   *
   * @default true
   */
  startTransaction?: boolean;
  /**
   * Renames Transaction.
   * @default false
   */
  renameTransaction?: boolean;
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
   * Adds custom tags to every Transaction.
   */
  appendTags?: (args: ExecutionArgs) => Record<string, Primitive>;
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
   * Produces tracing data for Transaction
   *
   * @default is empty
   */
  traceparentData?: (args: ExecutionArgs) => TraceparentData | undefined;
  /**
   * Produces a "op" (operation) of created Span.
   *
   * @default execute
   */
  operationName?: (args: ExecutionArgs) => string;
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

export const useSentry = (options: SentryPluginOptions = {}): Plugin => {
  if (!isSentryEnabled()) {
    return {};
  }

  function pick<K extends keyof SentryPluginOptions>(
    key: K,
    defaultValue: NonNullable<SentryPluginOptions[K]>,
  ): NonNullable<SentryPluginOptions[K]> {
    return options[key] ?? defaultValue;
  }

  const startTransaction = pick('startTransaction', true);
  const includeRawResult = pick('includeRawResult', false);
  const includeExecuteVariables = pick('includeExecuteVariables', false);
  const renameTransaction = pick('renameTransaction', false);
  const skipOperation = pick('skip', () => false);
  const skipError = pick('skipError', defaultSkipError);

  const eventIdKey = options.eventIdKey === null ? null : 'sentryEventId';

  function addEventId(err: GraphQLError, eventId: string | null): GraphQLError {
    if (eventIdKey !== null && eventId !== null) {
      // eslint-disable-next-line no-param-reassign
      err.extensions[eventIdKey] = eventId;
    }

    return err;
  }

  return {
    onExecute({ args }) {
      const typedArgs = args as TypedExecutionArgs;
      if (skipOperation(typedArgs)) {
        return undefined;
      }

      const rootOperation = typedArgs.document.definitions.find(
        (o): o is OperationDefinitionNode =>
          o.kind === Kind.OPERATION_DEFINITION,
      );
      if (!rootOperation) {
        return undefined;
      }
      const operationType = rootOperation.operation;

      const document = getDocumentString(typedArgs.document, print);

      const opName =
        typedArgs.operationName ??
        rootOperation.name?.value ??
        'Anonymous Operation';
      const addedTags: Record<string, Primitive> =
        options.appendTags?.(args) ?? {};
      const traceparentData = options.traceparentData?.(args) ?? {};

      const transactionName = options.transactionName
        ? options.transactionName(args)
        : opName;
      const op = options.operationName
        ? options.operationName(args)
        : 'execute';
      const tags = {
        operationName: opName,
        operation: operationType,
        ...addedTags,
      };

      let rootSpan: Span;

      if (startTransaction) {
        rootSpan = Sentry.startTransaction({
          name: transactionName,
          op,
          tags,
          ...traceparentData,
        });

        if (!rootSpan) {
          const error = [
            `Could not create the root Sentry transaction for the GraphQL operation "${transactionName}".`,
            `It's very likely that this is because you have not included the Sentry tracing SDK in your app's runtime before handling the request.`,
          ];
          throw new Error(error.join('\n'));
        }
      } else {
        const scope = Sentry.getCurrentHub().getScope();
        const parentSpan = scope?.getSpan();
        const span = parentSpan?.startChild({
          description: transactionName,
          op,
          tags,
        });

        if (!span) {
          logger.warn(
            [
              `Flag "startTransaction" is disabled but Sentry failed to find a transaction.`,
              `Try to create a transaction before GraphQL execution phase is started.`,
            ].join('\n'),
          );
          return undefined;
        }

        rootSpan = span;

        if (renameTransaction) {
          scope.setTransactionName(transactionName);
        }
      }

      Sentry.configureScope((scope) => scope.setSpan(rootSpan));

      rootSpan.setData('document', document);

      if (options.configureScope) {
        Sentry.configureScope((scope) => options.configureScope?.(args, scope));
      }

      return {
        onExecuteDone(payload) {
          const handleResult: OnExecuteDoneHookResultOnNextHook<unknown> = ({
            result,
            setResult,
          }) => {
            if (includeRawResult) {
              rootSpan.setData('result', result);
            }

            if (result.errors && result.errors.length > 0) {
              Sentry.withScope((scope) => {
                scope.setTransactionName(opName);
                scope.setTag('operation', operationType);
                scope.setTag('operationName', opName);
                scope.setExtra('document', document);

                scope.setTags(addedTags ?? {});

                if (includeRawResult) {
                  scope.setExtra('result', result);
                }

                if (includeExecuteVariables) {
                  scope.setExtra('variables', args.variableValues);
                }

                const errors = result.errors?.map((err: GraphQLError) => {
                  if (skipError(err) === true) {
                    return err;
                  }

                  if (err.originalError instanceof HttpError) {
                    rootSpan.setHttpStatus(err.originalError.statusCode);
                  } else {
                    rootSpan.setStatus('internal_error');
                  }

                  const errorPath = (err.path ?? [])
                    .map((v: string | number) =>
                      typeof v === 'number' ? '$index' : v,
                    )
                    .join(' > ');

                  if (errorPath) {
                    scope.addBreadcrumb({
                      category: 'execution-path',
                      message: errorPath,
                      level: 'debug',
                    });
                  }

                  const eventId = Sentry.captureException(err.originalError, {
                    fingerprint: ['graphql', errorPath, opName, operationType],
                    contexts: {
                      GraphQL: {
                        operationName: opName,
                        operationType,
                        variables: args.variableValues,
                      },
                    },
                  });

                  return addEventId(err, eventId);
                });

                setResult({
                  ...result,
                  errors,
                });
              });
            } else {
              rootSpan.setStatus('ok');
            }

            rootSpan.finish();
          };
          return handleStreamOrSingleExecutionResult(payload, handleResult);
        },
      };
    },
  };
};
