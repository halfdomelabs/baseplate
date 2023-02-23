// @ts-nocheck

import {
  EnvelopError,
  handleStreamOrSingleExecutionResult,
  OnExecuteDoneHookResultOnNextHook,
  OnResolverCalledHook,
  Plugin,
} from '@envelop/core';
import * as Sentry from '@sentry/node';
import type { Span, TraceparentData } from '@sentry/types';
import {
  ExecutionArgs,
  GraphQLError,
  Kind,
  OperationDefinitionNode,
  print,
} from 'graphql';
import { HttpError } from '%http-errors';

// Copied from https://github.com/n1ru4l/envelop/blob/main/packages/plugins/sentry/src/index.ts
// Modified to allow reporting status of Sentry transactions

export type SentryPluginOptions = {
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
   * Creates a Span for every resolve function
   * @default true
   */
  trackResolvers?: boolean;
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
  appendTags?: (args: ExecutionArgs) => Record<string, unknown>;
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
   * By default, this plugin skips all `EnvelopError` errors and does not report it to Sentry.
   */
  skipError?: (args: Error) => boolean;
  /**
   * Indicates whether or not to track root level resolvers.
   */
  trackRootResolversOnly?: boolean;
};

export function defaultSkipError(error: Error): boolean {
  return error instanceof EnvelopError;
}

const sentryTracingSymbol = Symbol('sentryTracing');

type SentryTracingContext = {
  rootSpan: Span | undefined;
  opName: string;
  operationType: string;
};

export const useSentry = (options: SentryPluginOptions = {}): Plugin => {
  function pick<K extends keyof SentryPluginOptions>(
    key: K,
    defaultValue: NonNullable<SentryPluginOptions[K]>
  ): NonNullable<SentryPluginOptions[K]> {
    return options[key] ?? defaultValue;
  }

  const startTransaction = pick('startTransaction', true);
  const trackResolvers = pick('trackResolvers', true);
  const includeResolverArgs = pick('includeResolverArgs', false);
  const includeRawResult = pick('includeRawResult', false);
  const includeExecuteVariables = pick('includeExecuteVariables', false);
  const renameTransaction = pick('renameTransaction', false);
  const skipOperation = pick('skip', () => false);
  const skipError = pick('skipError', defaultSkipError);
  const trackRootResolversOnly = pick('trackRootResolversOnly', false);

  function addEventId(err: GraphQLError, eventId: string): GraphQLError {
    if (options.eventIdKey === null) {
      return err;
    }
    const eventIdKey = options.eventIdKey ?? 'sentryEventId';

    return new GraphQLError(
      err.message,
      err.nodes,
      err.source,
      err.positions,
      err.path,
      undefined,
      {
        ...err.extensions,
        [eventIdKey]: eventId,
      }
    );
  }

  const onResolverCalled: OnResolverCalledHook | undefined = trackResolvers
    ? ({ args: resolversArgs, info, context }) => {
        const sentryTracingContext = context[sentryTracingSymbol];
        if (!sentryTracingContext) {
          return () => {};
        }
        const { rootSpan } = sentryTracingContext as SentryTracingContext;
        if (rootSpan) {
          const { fieldName, returnType, parentType } = info;

          if (
            trackRootResolversOnly &&
            !['Query', 'Mutation', 'Subscription'].includes(parentType.name)
          ) {
            return () => {};
          }

          const parent = rootSpan;
          const tags: Record<string, string> = {
            fieldName,
            parentType: parentType.toString(),
            returnType: returnType.toString(),
          };

          if (includeResolverArgs) {
            tags.args = JSON.stringify(resolversArgs || {});
          }

          const childSpan = parent.startChild({
            description: `${parentType.name}.${fieldName}`,
            op: 'db.graphql.yoga',
            tags,
          });

          return ({ result }) => {
            if (includeRawResult) {
              childSpan.setData('result', result);
            }

            childSpan.finish();
          };
        }

        return () => {};
      }
    : undefined;

  return {
    onResolverCalled,
    onExecute({ args, extendContext }) {
      if (skipOperation(args)) {
        return {};
      }

      const rootOperation = args.document.definitions.find(
        (o) => o.kind === Kind.OPERATION_DEFINITION
      ) as OperationDefinitionNode;
      const operationType = rootOperation.operation;
      const document = print(args.document);
      const opName =
        args.operationName ||
        rootOperation.name?.value ||
        'Anonymous Operation';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addedTags: Record<string, any> =
        (options.appendTags && options.appendTags(args)) || {};
      const traceparentData =
        (options.traceparentData && options.traceparentData(args)) || {};

      const transactionName = options.transactionName
        ? options.transactionName(args)
        : opName;
      const op = options.operationName
        ? options.operationName(args)
        : 'db.graphql.yoga';
      const tags = {
        operationName: opName,
        operation: operationType,
        ...addedTags,
      };

      let rootSpan: Span;

      if (startTransaction) {
        rootSpan = Sentry.startTransaction({
          name: transactionName,
          description: 'execute',
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

        // set current scope to rootSpan
        const scope = Sentry.getCurrentHub().getScope();
        scope?.setSpan(rootSpan);
      } else {
        const scope = Sentry.getCurrentHub().getScope();
        const parentSpan = scope?.getSpan();
        const span = parentSpan?.startChild({
          description: transactionName,
          op,
          tags,
        });

        if (!span || !scope) {
          // eslint-disable-next-line no-console
          console.warn(
            [
              `Flag "startTransaction" is enabled but Sentry failed to find a transaction.`,
              `Try to create a transaction before GraphQL execution phase is started.`,
            ].join('\n')
          );
          return {};
        }

        rootSpan = span;

        if (renameTransaction) {
          scope.setTransactionName(transactionName);
        }
      }

      rootSpan.setData('document', document);

      if (options.configureScope) {
        Sentry.configureScope(
          (scope) =>
            options.configureScope && options.configureScope(args, scope)
        );
      }

      if (onResolverCalled) {
        const sentryContext: SentryTracingContext = {
          rootSpan,
          opName,
          operationType,
        };
        extendContext({ [sentryTracingSymbol]: sentryContext });
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

                scope.setTags(addedTags || {});

                if (includeRawResult) {
                  scope.setExtra('result', result);
                }

                if (includeExecuteVariables) {
                  scope.setExtra('variables', args.variableValues);
                }

                const errors = result.errors?.map((err) => {
                  if (skipError(err)) {
                    return err;
                  }

                  if (err.originalError instanceof HttpError) {
                    rootSpan.setHttpStatus(err.originalError.statusCode);
                  } else {
                    rootSpan.setStatus('unknown');
                  }

                  const errorPath = (err.path ?? []).join(' > ');
                  if (errorPath) {
                    scope.addBreadcrumb({
                      category: 'execution-path',
                      message: errorPath,
                      level: 'debug',
                    });
                  }

                  // Map index values in list to $index for better grouping of events.
                  const errorPathWithIndex = (err.path ?? [])
                    .map((v) => (typeof v === 'number' ? '$index' : v))
                    .join(' > ');

                  const eventId = Sentry.captureException(err, {
                    fingerprint: [
                      'graphql',
                      errorPathWithIndex,
                      opName,
                      operationType,
                    ],
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
