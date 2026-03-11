// @ts-nocheck

import type {
  GetPayload,
  ModelInclude,
  ModelPropName,
  WhereUniqueInput,
} from '$prismaTypes';
import type {
  AnyFieldDefinition,
  AnyOperationHooks,
  CommitCreateConfig,
  CommitDeleteConfig,
  CommitUpdateConfig,
  CreatePlan,
  OperationContext,
  TransactionalOperationContext,
  UpdatePlan,
} from '$types';

import { invokeHooks } from '$fieldUtils';
import { makeGenericPrismaDelegate } from '$prismaUtils';
import { checkInstanceAuthorization } from '%authorizerUtilsImports';
import { NotFoundError } from '%errorHandlerServiceImports';
import { prisma } from '%prismaImports';

/**
 * Validate that query does not use `select` — only `include` is supported.
 * Prisma `select` changes the return shape, which is incompatible with our
 * typed return values and re-fetch logic.
 */
function validateQuery(query: unknown, operation: string): void {
  if (query && typeof query === 'object') {
    const unsupportedKeys = Object.entries(query)
      .filter(([key, value]) => key !== 'include' && value !== undefined)
      .map(([key]) => key);
    if (unsupportedKeys.length > 0) {
      throw new Error(
        `Unsupported query keys for ${operation} operations: ${unsupportedKeys.join(', ')}. Only 'include' is supported.`,
      );
    }
  }
}

/**
 * Checks if any hooks are present that could modify data after the initial operation.
 * Used to determine if a re-fetch is needed after operation completes.
 */
function hasPostExecuteHooks(hooks: AnyOperationHooks): boolean {
  return (
    (hooks.afterExecute?.length ?? 0) > 0 ||
    (hooks.afterCommit?.length ?? 0) > 0
  );
}

/**
 * Re-fetch a record after hooks have run, ensuring included relations are fresh.
 *
 * Uses the caller's `refetchWithQuery` if provided, otherwise falls back to
 * `makeGenericPrismaDelegate` with `{ id: result.id }`. Throws an explicit
 * error if the result has no `id` field and no custom refetch was provided.
 */
async function refetchResult<
  TModelName extends ModelPropName,
  TIncludeArgs extends ModelInclude<TModelName>,
>(
  model: TModelName,
  result: GetPayload<TModelName>,
  query: TIncludeArgs,
  refetchWithQuery?: (
    result: GetPayload<TModelName>,
    query: TIncludeArgs,
  ) => Promise<GetPayload<TModelName, TIncludeArgs>>,
): Promise<GetPayload<TModelName, TIncludeArgs>> {
  if (refetchWithQuery) {
    return refetchWithQuery(result, query);
  }

  const resultRecord = result as Record<string, unknown>;
  if (!('id' in resultRecord) || !resultRecord.id) {
    throw new Error(
      `Cannot refetch ${model}: result has no 'id' field. Provide a custom refetchWithQuery.`,
    );
  }

  const delegate = makeGenericPrismaDelegate(prisma, model);
  const freshResult = await delegate.findUnique({
    where: { id: resultRecord.id } as WhereUniqueInput<TModelName>,
    include: query.include as NonNullable<ModelInclude<TModelName>['include']>,
  });
  if (!freshResult) {
    throw new NotFoundError(`${model} not found after operation`);
  }
  return freshResult as GetPayload<TModelName, TIncludeArgs>;
}

/**
 * Commit a create operation plan.
 *
 * Opens a Prisma transaction and executes the full lifecycle:
 * 1. Validate query (no `select`)
 * 2. Run beforeExecute hooks (inside transaction)
 * 3. Call the execute callback with plan data
 * 4. Run afterExecute hooks (inside transaction, with result)
 * 5. Run afterCommit hooks (outside transaction, with result)
 * 6. Re-fetch if hooks modified related records and query includes relations
 */
export async function commitCreate<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TIncludeArgs extends ModelInclude<TModelName> = ModelInclude<TModelName>,
>(
  plan: CreatePlan<TModelName, TFields>,
  config: CommitCreateConfig<TModelName, TFields, TIncludeArgs>,
): Promise<GetPayload<TModelName, TIncludeArgs>> {
  validateQuery(config.query, 'create');

  const { execute } = config;
  const needsRefetch = hasPostExecuteHooks(plan.hooks);

  const baseOperationContext: OperationContext<
    GetPayload<TModelName>,
    { hasResult: false }
  > = {
    operation: 'create',
    serviceContext: plan.serviceContext,
    loadExisting: () => Promise.resolve(undefined),
    result: undefined,
  };

  const transactionResult = await prisma.$transaction(async (tx) => {
    const txContext: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    > = {
      ...baseOperationContext,
      tx,
    };

    // Run beforeExecute hooks
    await invokeHooks(plan.hooks.beforeExecute, txContext);

    // If re-fetching, don't include relations in initial create
    const createQuery =
      needsRefetch || !config.query
        ? ({} as ModelInclude<TModelName>)
        : (config.query as ModelInclude<TModelName>);

    const result = await execute({
      tx,
      data: plan.data,
      query: createQuery,
      serviceContext: plan.serviceContext,
    });

    // Run afterExecute hooks
    await invokeHooks(plan.hooks.afterExecute, {
      ...txContext,
      result,
    });

    return result;
  });

  // Run afterCommit hooks (outside transaction)
  await invokeHooks(plan.hooks.afterCommit, {
    ...baseOperationContext,
    result: transactionResult,
  });

  // Re-fetch if hooks modified related records and query includes relations
  if (needsRefetch && config.query?.include) {
    return refetchResult(
      plan.model,
      transactionResult as GetPayload<TModelName>,
      config.query,
      config.refetchWithQuery,
    );
  }

  return transactionResult as GetPayload<TModelName, TIncludeArgs>;
}

/**
 * Commit an update operation plan.
 *
 * Opens a Prisma transaction and executes the full lifecycle:
 * 1. Validate query (no `select`)
 * 2. Run beforeExecute hooks (inside transaction)
 * 3. Call the execute callback with plan data
 * 4. Run afterExecute hooks (inside transaction, with result)
 * 5. Run afterCommit hooks (outside transaction, with result)
 * 6. Re-fetch if hooks modified related records and query includes relations
 */
export async function commitUpdate<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TIncludeArgs extends ModelInclude<TModelName> = ModelInclude<TModelName>,
>(
  plan: UpdatePlan<TModelName, TFields>,
  config: CommitUpdateConfig<TModelName, TFields, TIncludeArgs>,
): Promise<GetPayload<TModelName, TIncludeArgs>> {
  validateQuery(config.query, 'update');

  const { execute } = config;
  const needsRefetch = hasPostExecuteHooks(plan.hooks);

  const baseOperationContext: OperationContext<
    GetPayload<TModelName>,
    { hasResult: false }
  > = {
    operation: 'update',
    serviceContext: plan.serviceContext,
    loadExisting: plan.loadExisting as () => Promise<
      GetPayload<TModelName> | undefined
    >,
    result: undefined,
  };

  const transactionResult = await prisma.$transaction(async (tx) => {
    const txContext: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    > = {
      ...baseOperationContext,
      tx,
    };

    // Run beforeExecute hooks
    await invokeHooks(plan.hooks.beforeExecute, txContext);

    // If re-fetching, don't include relations in initial update
    const updateQuery =
      needsRefetch || !config.query
        ? ({} as ModelInclude<TModelName>)
        : (config.query as ModelInclude<TModelName>);

    const result = await execute({
      tx,
      data: plan.data,
      query: updateQuery,
      serviceContext: plan.serviceContext,
    });

    // Run afterExecute hooks
    await invokeHooks(plan.hooks.afterExecute, {
      ...txContext,
      result,
    });

    return result;
  });

  // Run afterCommit hooks (outside transaction)
  await invokeHooks(plan.hooks.afterCommit, {
    ...baseOperationContext,
    result: transactionResult,
  });

  // Re-fetch if hooks modified related records and query includes relations
  if (needsRefetch && config.query?.include) {
    return refetchResult(
      plan.model,
      transactionResult as GetPayload<TModelName>,
      config.query,
      config.refetchWithQuery,
    );
  }

  return transactionResult as GetPayload<TModelName, TIncludeArgs>;
}

/**
 * Execute a delete operation.
 *
 * No compose step is needed since there are no fields to process.
 * Handles authorization, hooks, transaction, and execution directly.
 *
 * 1. Validate query (no `select`)
 * 2. Run authorization checks (if configured)
 * 3. Open transaction
 * 4. Run beforeExecute hooks (inside transaction)
 * 5. Call the execute callback
 * 6. Run afterExecute hooks (inside transaction, with result)
 * 7. Run afterCommit hooks (outside transaction, with result)
 */
export async function commitDelete<
  TModelName extends ModelPropName,
  TIncludeArgs extends ModelInclude<TModelName> = ModelInclude<TModelName>,
>(
  config: CommitDeleteConfig<TModelName, TIncludeArgs>,
): Promise<GetPayload<TModelName, TIncludeArgs>> {
  validateQuery(config.query, 'delete');

  const { context, execute, loadExisting: rawLoadExisting } = config;

  // Memoize loadExisting if provided
  let cached: GetPayload<TModelName> | undefined;
  const loadExisting: () => Promise<GetPayload<TModelName> | undefined> =
    rawLoadExisting
      ? async () => {
          cached ??= await rawLoadExisting();
          return cached;
        }
      : () => Promise.resolve(undefined);

  // Authorization
  if (config.authorize && config.authorize.length > 0) {
    await checkInstanceAuthorization(
      context,
      loadExisting as () => Promise<GetPayload<TModelName>>,
      config.authorize,
    );
  }

  const hooks: Required<AnyOperationHooks> = {
    beforeExecute: [...(config.hooks?.beforeExecute ?? [])],
    afterExecute: [...(config.hooks?.afterExecute ?? [])],
    afterCommit: [...(config.hooks?.afterCommit ?? [])],
  };

  const baseOperationContext: OperationContext<
    GetPayload<TModelName>,
    { hasResult: false }
  > = {
    operation: 'delete',
    serviceContext: context,
    loadExisting,
    result: undefined,
  };

  const transactionResult = await prisma.$transaction(async (tx) => {
    const txContext: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    > = {
      ...baseOperationContext,
      tx,
    };

    // Run beforeExecute hooks
    await invokeHooks(hooks.beforeExecute, txContext);

    const result = await execute({
      tx,
      query: (config.query ?? {}) as ModelInclude<TModelName>,
      serviceContext: context,
    });

    // Run afterExecute hooks
    await invokeHooks(hooks.afterExecute, {
      ...txContext,
      result,
    });

    return result;
  });

  // Run afterCommit hooks (outside transaction)
  await invokeHooks(hooks.afterCommit, {
    ...baseOperationContext,
    result: transactionResult,
  });

  return transactionResult as GetPayload<TModelName, TIncludeArgs>;
}
