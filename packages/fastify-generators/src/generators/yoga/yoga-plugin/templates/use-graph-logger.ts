// @ts-nocheck

import type { Plugin } from '@envelop/core';
import type { OnExecuteDoneHookResultOnNextHookPayload } from '@envelop/types';
import type { DocumentNode, OperationDefinitionNode } from 'graphql';

import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { handleStreamOrSingleExecutionResult } from '@envelop/core';
import { GraphQLError, Kind } from 'graphql';
import { performance } from 'node:perf_hooks';

function getOperationType(document: DocumentNode): string | undefined {
  const operationDefinition = document.definitions.find(
    (d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION,
  );
  return operationDefinition?.operation;
}

interface UseGraphLoggerOptions {
  logSubscriptionExecution?: boolean;
  skipLogErrors?: boolean;
}

export const useGraphLogger = (options?: UseGraphLoggerOptions): Plugin => {
  const { logSubscriptionExecution, skipLogErrors } = options ?? {};
  function logResult(
    { args, result }: OnExecuteDoneHookResultOnNextHookPayload<unknown>,
    startTime?: number,
  ): void {
    const typedArgs = args as {
      document: DocumentNode;
      operationName: string;
    };
    const operationType = getOperationType(typedArgs.document);
    const endTime = performance.now();

    const errors = result.errors ?? [];

    if (!skipLogErrors) {
      for (const error of errors) {
        logError(
          error instanceof GraphQLError
            ? (error.originalError ?? error)
            : error,
        );
      }
    }

    if (operationType !== 'subscription' || logSubscriptionExecution) {
      logger.info(
        {
          operationType,
          operationName: typedArgs.operationName,
          executionTime: startTime && endTime - startTime,
          success: errors.length === 0,
        },
        `executed graphql ${operationType ?? 'query'} (${
          typedArgs.operationName || 'Anonymous Operation'
        })`,
      );
    }
  }
  return {
    // Log parser errors
    onParse() {
      return ({ result }) => {
        if (result instanceof Error) {
          logger.error(result);
        }
      };
    },
    // Log validation errors
    onValidate() {
      return ({ result, valid }) => {
        if (!valid) {
          for (const error of result) {
            logger.error(error instanceof Error ? error.message : error);
          }
        }
      };
    },
    onExecute() {
      const startTime = performance.now();
      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(payload, (p) => {
            logResult(p, startTime);
          });
        },
      };
    },
    onSubscribe({ args }: { args: { operationName?: string } }) {
      logger.info(
        { operationName: args.operationName },
        `graphql subscription started (${
          args.operationName ?? 'Anonymous Operation'
        })`,
      );
      return {
        onSubscribeResult(payload) {
          return handleStreamOrSingleExecutionResult(payload, (p) => {
            logResult(p);
          });
        },
        onSubscribeError({ error }) {
          logger.error(error);
        },
      };
    },
  };
};
