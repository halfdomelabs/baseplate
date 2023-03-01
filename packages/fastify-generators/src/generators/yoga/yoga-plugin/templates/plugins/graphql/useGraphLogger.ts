// @ts-nocheck

import { performance } from 'perf_hooks';
import { Plugin, handleStreamOrSingleExecutionResult } from '@envelop/core';
import type { OnExecuteDoneHookResultOnNextHookPayload } from '@envelop/types';
import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql';
import { logger } from '%logger-service';

function getOperationType(document: DocumentNode): string | undefined {
  const operationDefinition = document.definitions.find(
    (d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION
  );
  return operationDefinition?.operation;
}

interface UseGraphLoggerOptions {
  logSubscriptionExecution?: boolean;
}

export const useGraphLogger = (options?: UseGraphLoggerOptions): Plugin => {
  const { logSubscriptionExecution } = options || {};
  function logResult(
    { args, result }: OnExecuteDoneHookResultOnNextHookPayload<unknown>,
    startTime?: number
  ): void {
    const operationType = getOperationType(args.document);
    const endTime = performance.now();

    const errors = result.errors || [];

    errors.forEach((error) => logger.error(error.originalError || error));

    if (operationType !== 'subscription' || logSubscriptionExecution) {
      logger.info(
        {
          operationType,
          operationName: args.operationName,
          executionTime: startTime && endTime - startTime,
          success: !errors?.length,
        },
        `executed graphql ${operationType || 'query'} (${
          args.operationName || 'Anonymous Operation'
        })`
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
          result.forEach((error) => logger.error(error.message));
        }
      };
    },
    onExecute({ args }) {
      const startTime = performance.now();
      return {
        onExecuteDone(payload) {
          return handleStreamOrSingleExecutionResult(payload, (p) =>
            logResult(p, startTime)
          );
        },
      };
    },
    onSubscribe({ args }) {
      logger.info(
        { operationName: args.operationName },
        `graphql subscription started (${
          args.operationName || 'Anonymous Operation'
        })`
      );
      return {
        onSubscribeResult(payload) {
          return handleStreamOrSingleExecutionResult(payload, (p) =>
            logResult(p)
          );
        },
        onSubscribeError({ error }) {
          logger.error(error);
        },
      };
    },
  };
};
