import type { Prisma } from '@src/generated/prisma/client.js';

import { prisma } from '@src/services/prisma.js';

import type {
  AnyBoundTransformer,
  InferTransformed,
  InferUnresolvedTransformed,
  TransformPlan,
} from './transformer-types.js';

/**
 * Resolve any deferred data in the transformed map.
 *
 * Transformer data can be either a direct value or a deferred function
 * `(tx) => Promise<value>`. This resolves all deferred values inside
 * the transaction.
 */
async function resolveTransformed<
  TTransformers extends Record<string, AnyBoundTransformer>,
>(
  transformed: InferUnresolvedTransformed<TTransformers>,
  tx: Prisma.TransactionClient,
): Promise<InferTransformed<TTransformers>> {
  const resolved: Record<string, unknown> = {};

  for (const key of Object.keys(transformed)) {
    const value = (transformed as Record<string, unknown>)[key];
    resolved[key] =
      typeof value === 'function'
        ? await (value as (tx: Prisma.TransactionClient) => Promise<unknown>)(
            tx,
          )
        : value;
  }

  return resolved as InferTransformed<TTransformers>;
}

/**
 * Execute a transform plan inside a Prisma transaction.
 *
 * Resolves any deferred transformer data (functions that need `tx`),
 * calls the `execute` callback with resolved data, then runs all
 * `afterExecute` hooks collected from the transformers.
 *
 * If `refetch` is provided, calls it after the transaction with the
 * result to reload the record with includes/relations. Cannot be used
 * with `tx` since the parent transaction may not have committed yet.
 *
 * If `tx` is provided, reuses that transaction (for nested plans).
 * Otherwise opens a new `$transaction`.
 *
 * @example
 * ```typescript
 * const result = await executeTransformPlan(plan, {
 *   execute: async ({ tx, transformed }) =>
 *     tx.todoList.create({ data: { ...rest, ...transformed } }),
 *   refetch: (item) =>
 *     prisma.todoList.findUniqueOrThrow({ where: { id: item.id }, ...query }),
 * });
 * ```
 */
export async function executeTransformPlan<
  TTransformers extends Record<string, AnyBoundTransformer>,
  TResult,
  TRefetchResult = TResult,
>(
  plan: TransformPlan<TTransformers>,
  config: {
    tx?: Prisma.TransactionClient;
    execute: (args: {
      tx: Prisma.TransactionClient;
      transformed: InferTransformed<TTransformers>;
    }) => Promise<TResult>;
    refetch?: (result: TResult) => Promise<TRefetchResult>;
  },
): Promise<TResult | TRefetchResult> {
  const { execute, refetch } = config;

  if (config.tx && refetch) {
    throw new Error(
      'Cannot use refetch with an existing transaction — the parent transaction may not have committed yet.',
    );
  }

  const runInTx = async (tx: Prisma.TransactionClient): Promise<TResult> => {
    const resolved = await resolveTransformed(plan.transformed, tx);
    const result = await execute({ tx, transformed: resolved });

    for (const hook of plan.afterExecute) {
      await hook({ tx, result });
    }

    return result;
  };

  const txResult = config.tx
    ? await runInTx(config.tx)
    : await prisma.$transaction(async (tx) => runInTx(tx));

  if (refetch) {
    return refetch(txResult);
  }

  return txResult;
}
