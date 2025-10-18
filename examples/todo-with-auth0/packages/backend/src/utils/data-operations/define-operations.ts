import type { Args, Result } from '@prisma/client/runtime/client';

import type { ServiceContext } from '@src/utils/service-context.js';

import { type Prisma } from '@src/generated/prisma/client.js';
import { prisma } from '@src/services/prisma.js';

import type {
  AnyFieldDefinition,
  AnyOperationHooks,
  DataOperationType,
  InferFieldsAsyncCreateOutput,
  InferFieldsAsyncUpdateOutput,
  InferFieldsCreateOutput,
  InferFieldsUpdateOutput,
  InferInput,
  OperationContext,
  OperationHooks,
  PrismaTransaction,
  TransactionalOperationContext,
} from './types.js';

import { NotFoundError } from '../http-errors.js';

/**
 * Helper to invoke an array of hooks with a given context
 */
async function invokeHooks<TContext>(
  hooks: ((ctx: TContext) => Promise<void>)[] | undefined,
  context: TContext,
): Promise<void> {
  if (!hooks || hooks.length === 0) return;
  await Promise.all(hooks.map((hook) => hook(context)));
}

/**
 * Transform field definitions into Prisma create/update data
 */
async function transformFields<
  TFields extends Record<string, AnyFieldDefinition>,
>(
  fields: TFields,
  input: InferInput<TFields>,
  {
    serviceContext,
    operation,
    allowOptionalFields,
    loadExisting,
  }: {
    serviceContext: ServiceContext;
    operation: DataOperationType;
    allowOptionalFields: boolean;
    loadExisting?: () => Promise<Record<string, unknown>>;
  },
): Promise<{
  createData: InferFieldsAsyncCreateOutput<TFields>;
  updateData: InferFieldsAsyncUpdateOutput<TFields>;
  hooks: AnyOperationHooks;
}> {
  const hooks: AnyOperationHooks = {
    beforeExecute: [],
    afterExecute: [],
    afterCommit: [],
  };

  const createData = {} as InferFieldsAsyncCreateOutput<TFields>;
  const updateData = {} as InferFieldsAsyncUpdateOutput<TFields>;

  for (const [key, field] of Object.entries(fields)) {
    const fieldKey = key as keyof typeof input;
    const value = input[fieldKey];

    if (allowOptionalFields && value === undefined) continue;

    const result = await field.processInput(value, {
      operation,
      serviceContext,
      fieldName: fieldKey as string,
      loadExisting: loadExisting
        ? async () => {
            const existingItem = await loadExisting();
            return existingItem[fieldKey as keyof typeof existingItem];
          }
        : undefined,
    });

    if (result.data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- we don't know the type
      createData[fieldKey] = result.data.create;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- we don't know the type
      updateData[fieldKey] = result.data.update;
    }

    if (result.hooks) {
      if (result.hooks.beforeExecute) {
        const beforeHook = result.hooks.beforeExecute;
        hooks.beforeExecute?.push((ctx) => beforeHook(ctx));
      }
      if (result.hooks.afterExecute) {
        const afterHook = result.hooks.afterExecute;
        hooks.afterExecute?.push((ctx) => afterHook(ctx));
      }
      if (result.hooks.afterCommit) {
        const commitHook = result.hooks.afterCommit;
        hooks.afterCommit?.push((ctx) => commitHook(ctx));
      }
    }
  }

  return { createData, updateData, hooks };
}

type ModelPropName = Prisma.TypeMap['meta']['modelProps'];

/** Get the payload type for a given model */
type GetPayload<
  TModelName extends ModelPropName,
  TQueryArgs = undefined,
> = Result<(typeof prisma)[TModelName], TQueryArgs, 'findUnique'>;

type ModelQuery<TModelName extends ModelPropName> = Pick<
  Args<(typeof prisma)[TModelName], 'findUnique'>,
  'select' | 'include'
>;

type WhereUniqueInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'findUnique'
>['where'];

/**
 * =========================================
 * Create Operation
 * =========================================
 */

type CreateInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'create'
>['data'];

/**
 * Configuration for create operation
 */
export interface CreateOperationConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TPrepareResult extends Record<string, unknown> | undefined = undefined,
> {
  /**
   * Prisma model name
   */
  model: TModelName;

  /**
   * Field definitions for the create operation
   */
  fields: TFields;

  /**
   * Optional authorization check before creating
   */
  authorize?: (
    data: InferInput<TFields>,
    ctx: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: false; hasNew: false }
    >,
  ) => Promise<void>;

  /**
   * Optional step to prepare computed fields based off the raw input
   */
  prepareComputedFields?: (
    data: InferInput<TFields>,
    ctx: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: false; hasNew: false }
    >,
  ) => TPrepareResult | Promise<TPrepareResult>;

  /**
   * Transform step to shape final Prisma payload. This runs inside the transaction
   * so be sure to keep it lightweight and avoid any heavy computations.
   */
  buildData: (
    data: InferFieldsCreateOutput<TFields> & TPrepareResult,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasExisting: false; hasNew: false }
    >,
  ) => CreateInput<TModelName> | Promise<CreateInput<TModelName>>;

  hooks?: OperationHooks<GetPayload<TModelName>, { hasExisting: false }>;
}

export interface CreateOperationInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  data: InferInput<TFields>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Define a create operation
 */
export function defineCreateOperation<
  TModelName extends Prisma.TypeMap['meta']['modelProps'],
  TFields extends Record<string, AnyFieldDefinition>,
  TPrepareResult extends Record<string, unknown> | undefined = undefined,
>(
  config: CreateOperationConfig<TModelName, TFields, TPrepareResult>,
): <TQueryArgs extends ModelQuery<TModelName>>(
  input: CreateOperationInput<TModelName, TFields, TQueryArgs>,
) => Promise<GetPayload<TModelName, TQueryArgs>> {
  return async <TQueryArgs extends ModelQuery<TModelName>>({
    data,
    query,
    context,
  }: CreateOperationInput<TModelName, TFields, TQueryArgs>) => {
    const baseOperationContext: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: false; hasNew: false }
    > = {
      operation: 'create' as const,
      serviceContext: context,
      loadExisting: undefined,
      new: undefined,
    };

    // Authorization
    if (config.authorize) {
      await config.authorize(data, baseOperationContext);
    }

    // Step 1: Transform fields (OUTSIDE TRANSACTION)
    const [{ createData: asyncCreateData, hooks: fieldHooks }, preparedData] =
      await Promise.all([
        transformFields(config.fields, data, {
          operation: 'create',
          serviceContext: context,
          allowOptionalFields: false,
          loadExisting: undefined,
        }),
        config.prepareComputedFields
          ? config.prepareComputedFields(data, baseOperationContext)
          : Promise.resolve(undefined as TPrepareResult),
      ]);

    const allHooks: AnyOperationHooks = {
      beforeExecute: [
        ...(config.hooks?.beforeExecute ?? []),
        ...(fieldHooks.beforeExecute ?? []),
      ],
      afterExecute: [
        ...(config.hooks?.afterExecute ?? []),
        ...(fieldHooks.afterExecute ?? []),
      ],
      afterCommit: [
        ...(config.hooks?.afterCommit ?? []),
        ...(fieldHooks.afterCommit ?? []),
      ],
    };

    // Execute in transaction
    return prisma
      .$transaction(async (tx) => {
        const txContext: TransactionalOperationContext<
          GetPayload<TModelName>,
          { hasExisting: false; hasNew: false }
        > = {
          ...baseOperationContext,
          tx,
        };

        // Run beforeExecute hooks
        await invokeHooks(allHooks.beforeExecute, txContext);

        // Run all async create data transformations
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- we don't know the type
        const createData: InferFieldsCreateOutput<TFields> = Object.fromEntries(
          await Promise.all(
            Object.entries(asyncCreateData).map(
              async ([key, data]: [string, unknown]) => [
                key,
                typeof data === 'function'
                  ? await (data as (tx: PrismaTransaction) => Promise<unknown>)(
                      tx,
                    )
                  : data,
              ],
            ),
          ),
        );

        // Build data
        const builtData = await config.buildData(
          { ...createData, ...preparedData },
          txContext,
        );

        const result = await (
          tx[config.model].create as unknown as (
            args: {
              data: CreateInput<TModelName>;
            } & TQueryArgs,
          ) => Promise<GetPayload<TModelName>>
        )({
          data: builtData,
          ...(query ?? ({} as TQueryArgs)),
        });

        // Run afterExecute hooks
        await invokeHooks(allHooks.afterExecute, {
          ...txContext,
          new: result,
        });

        return result;
      })
      .then(async (result) => {
        // Run afterCommit hooks (outside transaction)
        await invokeHooks(allHooks.afterCommit, {
          ...baseOperationContext,
          new: result,
        });
        return result as GetPayload<TModelName, TQueryArgs>;
      });
  };
}

/** =========================================
 * Update Operation
 * =========================================
 */

type UpdateInput<TModelName extends ModelPropName> = Args<
  (typeof prisma)[TModelName],
  'update'
>['data'];

/**
 * Configuration for update operation
 */
export interface UpdateOperationConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TPrepareResult extends Record<string, unknown> | undefined = undefined,
> {
  /**
   * Prisma model name
   */
  model: TModelName;

  /**
   * Field definitions for the update operation
   */
  fields: TFields;

  /**
   * Optional authorization check before updating
   */
  authorize?: (
    data: Partial<InferInput<TFields>>,
    ctx: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: true; hasNew: false }
    >,
  ) => Promise<void>;

  /**
   * Optional prepare step - runs BEFORE transaction
   * For heavy I/O, validation, data enrichment
   */
  prepare?: (
    data: Partial<InferInput<TFields>>,
    ctx: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: true; hasNew: false }
    >,
  ) => Promise<TPrepareResult>;

  /**
   * Build data for the update operation
   */
  buildData: (
    data: InferFieldsUpdateOutput<TFields> & TPrepareResult,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasExisting: true; hasNew: false }
    >,
  ) => UpdateInput<TModelName> | Promise<UpdateInput<TModelName>>;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<
    GetPayload<TModelName> | undefined,
    { hasExisting: true }
  >;
}

export interface UpdateOperationInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  where: WhereUniqueInput<TModelName>;
  data: Partial<InferInput<TFields>>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Define an update operation
 */
export function defineUpdateOperation<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TPrepareResult extends Record<string, unknown> | undefined = Record<
    string,
    never
  >,
>(
  config: UpdateOperationConfig<TModelName, TFields, TPrepareResult>,
): <TQueryArgs extends ModelQuery<TModelName>>(
  input: UpdateOperationInput<TModelName, TFields, TQueryArgs>,
) => Promise<GetPayload<TModelName, TQueryArgs>> {
  return async <TQueryArgs extends ModelQuery<TModelName>>({
    where,
    data: inputData,
    query,
    context,
  }: UpdateOperationInput<TModelName, TFields, TQueryArgs>) => {
    let existingItem: GetPayload<TModelName> | undefined;
    const baseOperationContext: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: true; hasNew: false }
    > = {
      operation: 'update' as const,
      serviceContext: context,
      loadExisting: async () => {
        if (existingItem) return existingItem;
        const findUniqueOrThrow = prisma[config.model]
          .findUnique as unknown as (args: {
          where: WhereUniqueInput<TModelName>;
        }) => Promise<GetPayload<TModelName> | null>;
        const result = await findUniqueOrThrow({ where });
        if (!result) throw new NotFoundError(`${config.model} not found`);
        existingItem = result;
        return result;
      },
      new: undefined,
    };
    // Authorization
    if (config.authorize) {
      await config.authorize(inputData, baseOperationContext);
    }

    // Step 1: Transform fields (OUTSIDE TRANSACTION)
    // Only transform fields provided in input
    const fieldsToTransform = Object.fromEntries(
      Object.entries(config.fields).filter(([key]) => key in inputData),
    ) as TFields;

    const [{ updateData: asyncUpdateData, hooks: fieldHooks }, preparedData] =
      await Promise.all([
        transformFields(fieldsToTransform, inputData as InferInput<TFields>, {
          operation: 'update',
          serviceContext: context,
          allowOptionalFields: true,
          loadExisting: baseOperationContext.loadExisting as () => Promise<
            Record<string, unknown>
          >,
        }),
        config.prepare
          ? config.prepare(inputData, baseOperationContext)
          : Promise.resolve(undefined as TPrepareResult),
      ]);

    // Combine config hooks with field hooks
    const allHooks: AnyOperationHooks = {
      beforeExecute: [
        ...(config.hooks?.beforeExecute ?? []),
        ...(fieldHooks.beforeExecute ?? []),
      ],
      afterExecute: [
        ...(config.hooks?.afterExecute ?? []),
        ...(fieldHooks.afterExecute ?? []),
      ],
      afterCommit: [
        ...(config.hooks?.afterCommit ?? []),
        ...(fieldHooks.afterCommit ?? []),
      ],
    };

    // Execute in transaction
    return prisma
      .$transaction(async (tx) => {
        const txContext: TransactionalOperationContext<
          GetPayload<TModelName>,
          { hasExisting: true; hasNew: false }
        > = {
          ...baseOperationContext,
          tx,
        };

        // Run beforeExecute hooks
        await invokeHooks(allHooks.beforeExecute, txContext);

        // Run all async update data transformations
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- we don't know the type
        const updateData: InferFieldsUpdateOutput<TFields> = Object.fromEntries(
          await Promise.all(
            Object.entries(asyncUpdateData).map(
              async ([key, data]: [string, unknown]) => [
                key,
                typeof data === 'function'
                  ? await (data as (tx: PrismaTransaction) => Promise<unknown>)(
                      tx,
                    )
                  : data,
              ],
            ),
          ),
        );

        // Build data
        const builtData = await config.buildData(
          { ...updateData, ...preparedData },
          txContext,
        );

        const result = await (
          tx[config.model].update as unknown as (
            args: {
              where: WhereUniqueInput<TModelName>;
              data: UpdateInput<TModelName>;
            } & TQueryArgs,
          ) => Promise<GetPayload<TModelName>>
        )({
          where,
          data: builtData,
          ...(query ?? ({} as TQueryArgs)),
        });

        // Run afterExecute hooks
        await invokeHooks(allHooks.afterExecute, {
          ...txContext,
          new: result,
        });

        return result;
      })
      .then(async (result) => {
        // Run afterCommit hooks (outside transaction)
        await invokeHooks(allHooks.afterCommit, {
          ...baseOperationContext,
          new: result,
        });
        return result as GetPayload<TModelName, TQueryArgs>;
      });
  };
}

/**
 * Configuration for delete operation
 */
export interface DeleteOperationConfig<TModelName extends ModelPropName> {
  /**
   * Prisma model name
   */
  model: TModelName;

  /**
   * Optional authorization check before deleting
   */
  authorize?: (
    ctx: OperationContext<
      GetPayload<TModelName> | undefined,
      { hasExisting: true; hasNew: false }
    >,
  ) => Promise<void>;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<GetPayload<TModelName>, { hasExisting: true }>;
}

export interface DeleteOperationInput<
  TModelName extends ModelPropName,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  where: WhereUniqueInput<TModelName>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Define a delete operation
 */
export function defineDeleteOperation<TModelName extends ModelPropName>(
  config: DeleteOperationConfig<TModelName>,
): <TQueryArgs extends ModelQuery<TModelName>>(
  input: DeleteOperationInput<TModelName, TQueryArgs>,
) => Promise<GetPayload<TModelName, TQueryArgs>> {
  return async <TQueryArgs extends ModelQuery<TModelName>>({
    where,
    query,
    context,
  }: DeleteOperationInput<TModelName, TQueryArgs>) => {
    let existingItem: GetPayload<TModelName> | undefined;
    const baseOperationContext: OperationContext<
      GetPayload<TModelName>,
      { hasExisting: true; hasNew: false }
    > = {
      operation: 'delete' as const,
      serviceContext: context,
      loadExisting: async () => {
        if (existingItem) return existingItem;
        const findUniqueOrThrow = prisma[config.model]
          .findUnique as unknown as (args: {
          where: WhereUniqueInput<TModelName>;
        }) => Promise<GetPayload<TModelName> | null>;
        const result = await findUniqueOrThrow({ where });
        if (!result) throw new NotFoundError(`${config.model} not found`);
        existingItem = result;
        return result;
      },
      new: undefined,
    };

    // Authorization
    if (config.authorize) {
      await config.authorize(baseOperationContext);
    }

    const allHooks: AnyOperationHooks = {
      beforeExecute: config.hooks?.beforeExecute ?? [],
      afterExecute: config.hooks?.afterExecute ?? [],
      afterCommit: config.hooks?.afterCommit ?? [],
    };

    // Execute in transaction
    return prisma
      .$transaction(async (tx) => {
        const txContext: TransactionalOperationContext<
          GetPayload<TModelName>,
          { hasExisting: true; hasNew: false }
        > = {
          ...baseOperationContext,
          tx,
        };

        // Run beforeExecute hooks
        await invokeHooks(allHooks.beforeExecute, txContext);

        // Execute delete operation
        const result = await (
          tx[config.model].delete as unknown as (
            args: {
              where: WhereUniqueInput<TModelName>;
            } & TQueryArgs,
          ) => Promise<GetPayload<TModelName>>
        )({
          where,
          ...(query ?? ({} as TQueryArgs)),
        });

        // Run afterExecute hooks
        await invokeHooks(allHooks.afterExecute, {
          ...txContext,
          new: result,
        });

        return result;
      })
      .then(async (result) => {
        // Run afterCommit hooks (outside transaction)
        await invokeHooks(allHooks.afterCommit, {
          ...baseOperationContext,
          new: result,
        });
        return result as GetPayload<TModelName, TQueryArgs>;
      });
  };
}
