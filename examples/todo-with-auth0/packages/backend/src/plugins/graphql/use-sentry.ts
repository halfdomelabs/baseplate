import type { Plugin } from '@envelop/core';
import type { ExecutionArgs, OperationDefinitionNode } from 'graphql';

import { getDocumentString } from '@envelop/core';
import { AttributeNames } from '@pothos/tracing-sentry';
import * as Sentry from '@sentry/node';
import { Kind, print } from 'graphql';

interface OperationInfo {
  opName: string;
  opType: string;
  transactionName: string;
  document: string;
}

function getOperationInfo(args: ExecutionArgs): OperationInfo {
  const rootOperation = args.document.definitions.find(
    (o): o is OperationDefinitionNode => o.kind === Kind.OPERATION_DEFINITION,
  );
  const opType = rootOperation?.operation;

  const document = getDocumentString(args.document, print);

  const opName =
    args.operationName ?? rootOperation?.name?.value ?? 'Anonymous Operation';

  const transactionName = `${opType} ${opName}`;

  return {
    opName,
    opType: opType ?? 'unknown',
    transactionName,
    document,
  };
}

export const useSentry: () => Plugin = () => ({
  onExecute: ({ setExecuteFn, executeFn }) => {
    setExecuteFn((options) => {
      const { opName, opType, transactionName, document } =
        getOperationInfo(options);

      Sentry.getCurrentScope()
        .setTransactionName(transactionName)
        .setContext('graphql', {
          operation_name: opName,
          operation_type: opType,
          source: document,
        });
      return Sentry.startSpan(
        {
          op: 'graphql.execute',
          name: transactionName,
          forceTransaction: true,
          attributes: {
            [AttributeNames.OPERATION_NAME]: options.operationName as string,
            [AttributeNames.SOURCE]: document,
          },
        },
        () => executeFn(options) as Promise<void>,
      );
    });
  },
});
