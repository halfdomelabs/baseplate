import type { ServiceContext } from '@src/utils/service-context.js';

import { type Prisma } from '@src/generated/prisma/client.js';
import { prisma } from '@src/services/prisma.js';

import type {
  AnyFieldDefinition,
  AnyOperationHooks,
  DataOperationType,
  InferFieldOutput,
  InferFieldsCreateOutput,
  InferFieldsOutput,
  InferFieldsUpdateOutput,
  InferInput,
  OperationContext,
  OperationHooks,
  PrismaTransaction,
  TransactionalOperationContext,
} from './types.js';
import type {
  CreateInput,
  GetPayload,
  ModelPropName,
  ModelQuery,
  UpdateInput,
  WhereUniqueInput,
} from './utility-types.js';

import { NotFoundError } from '../http-errors.js';
import { mergePrismaQueries, type PrismaInclude } from './prisma-utils.js';

/**
 * Helper to invoke an array of hooks with a given context
 */
export async function invokeHooks<TContext>(
  hooks: ((ctx: TContext) => Promise<void>)[] | undefined,
  context: TContext,
): Promise<void> {
  if (!hooks || hooks.length === 0) return;
  await Promise.all(hooks.map((hook) => hook(context)));
}

type FieldDataOrFunction<TField extends AnyFieldDefinition> =
  | InferFieldOutput<TField>
  | ((tx: PrismaTransaction) => Promise<InferFieldOutput<TField>>);

/**
 * Transform field definitions into Prisma create/update data
 */
export async function transformFields<
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
    loadExisting: () => Promise<object | undefined>;
  },
): Promise<{
  data:
    | InferFieldsOutput<TFields>
    | ((tx: PrismaTransaction) => Promise<InferFieldsOutput<TFields>>);
  hooks: AnyOperationHooks;
}> {
  const hooks: Required<AnyOperationHooks> = {
    beforeExecute: [],
    afterExecute: [],
    afterCommit: [],
  };

  const data = {} as {
    [K in keyof TFields]: FieldDataOrFunction<TFields[K]>;
  };

  for (const [key, field] of Object.entries(fields)) {
    const fieldKey = key as keyof typeof input;
    const value = input[fieldKey];

    if (allowOptionalFields && value === undefined) continue;

    const result = await field.processInput(value, {
      operation,
      serviceContext,
      fieldName: fieldKey as string,
      loadExisting,
    });

    if (result.data) {
      data[fieldKey] = result.data as FieldDataOrFunction<
        TFields[keyof TFields]
      >;
    }

    if (result.hooks) {
      hooks.beforeExecute.push(...(result.hooks.beforeExecute ?? []));
      hooks.afterExecute.push(...(result.hooks.afterExecute ?? []));
      hooks.afterCommit.push(...(result.hooks.afterCommit ?? []));
    }
  }

  function splitCreateUpdateData(data: {
    [K in keyof TFields]: InferFieldOutput<TFields[K]>;
  }): {
    create: InferFieldsCreateOutput<TFields>;
    update: InferFieldsUpdateOutput<TFields>;
  } {
    const create = {} as InferFieldsCreateOutput<TFields>;
    const update = {} as InferFieldsUpdateOutput<TFields>;
    for (const [key, value] of Object.entries<
      InferFieldOutput<TFields[keyof TFields]>
    >(data)) {
      if (value.create !== undefined) {
        create[key as keyof TFields] =
          value.create as InferFieldsCreateOutput<TFields>[keyof TFields];
      }
      if (value.update) {
        update[key as keyof TFields] =
          value.update as InferFieldsUpdateOutput<TFields>[keyof TFields];
      }
    }
    return { create, update };
  }

  const transformedData = Object.values(data).some(
    (value) => typeof value === 'function',
  )
    ? async (tx: PrismaTransaction) => {
        const awaitedData = Object.fromEntries(
          await Promise.all(
            Object.entries(data).map(
              async ([key, value]: [
                keyof TFields,
                FieldDataOrFunction<TFields[keyof TFields]>,
              ]): Promise<
                [keyof TFields, InferFieldOutput<TFields[keyof TFields]>]
              > => [key, typeof value === 'function' ? await value(tx) : value],
            ),
          ),
        ) as {
          [K in keyof TFields]: InferFieldOutput<TFields[K]>;
        };
        return splitCreateUpdateData(awaitedData);
      }
    : splitCreateUpdateData(
        data as { [K in keyof TFields]: InferFieldOutput<TFields[K]> },
      );

  return { data: transformedData, hooks };
}

/**
 * =========================================
 * Create Operation
 * =========================================
 */

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
    ctx: OperationContext<GetPayload<TModelName>, { hasResult: false }>,
  ) => Promise<void>;

  /**
   * Optional step to prepare computed fields based off the raw input
   */
  prepareComputedFields?: (
    data: InferInput<TFields>,
    ctx: OperationContext<GetPayload<TModelName>, { hasResult: false }>,
  ) => TPrepareResult | Promise<TPrepareResult>;

  /**
   * Transform step to shape final Prisma payload. This runs inside the transaction
   * so be sure to keep it lightweight and avoid any heavy computations.
   */
  buildData: (
    data: InferFieldsCreateOutput<TFields> & TPrepareResult,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    >,
  ) => CreateInput<TModelName> | Promise<CreateInput<TModelName>>;

  hooks?: OperationHooks<GetPayload<TModelName>>;
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
      { hasResult: false }
    > = {
      operation: 'create' as const,
      serviceContext: context,
      loadExisting: () => Promise.resolve(undefined),
      result: undefined,
    };

    // Authorization
    if (config.authorize) {
      await config.authorize(data, baseOperationContext);
    }

    // Step 1: Transform fields (OUTSIDE TRANSACTION)
    const [{ data: fieldsData, hooks: fieldsHooks }, preparedData] =
      await Promise.all([
        transformFields(config.fields, data, {
          operation: 'create',
          serviceContext: context,
          allowOptionalFields: false,
          loadExisting: () => Promise.resolve(undefined),
        }),
        config.prepareComputedFields
          ? config.prepareComputedFields(data, baseOperationContext)
          : Promise.resolve(undefined as TPrepareResult),
      ]);

    const allHooks: AnyOperationHooks = {
      beforeExecute: [
        ...(config.hooks?.beforeExecute ?? []),
        ...(fieldsHooks.beforeExecute ?? []),
      ],
      afterExecute: [
        ...(config.hooks?.afterExecute ?? []),
        ...(fieldsHooks.afterExecute ?? []),
      ],
      afterCommit: [
        ...(config.hooks?.afterCommit ?? []),
        ...(fieldsHooks.afterCommit ?? []),
      ],
    };

    // Execute in transaction
    return prisma
      .$transaction(async (tx) => {
        const txContext: TransactionalOperationContext<
          GetPayload<TModelName>,
          { hasResult: false }
        > = {
          ...baseOperationContext,
          tx,
        };

        // Run beforeExecute hooks
        await invokeHooks(allHooks.beforeExecute, txContext);

        // Run all async create data transformations
        const awaitedFieldsData =
          typeof fieldsData === 'function' ? await fieldsData(tx) : fieldsData;

        // Build data
        const builtData = await config.buildData(
          { ...awaitedFieldsData.create, ...preparedData },
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
    ctx: OperationContext<GetPayload<TModelName>, { hasResult: false }>,
  ) => Promise<void>;

  /**
   * Optional prepare step - runs BEFORE transaction
   * For heavy I/O, validation, data enrichment
   */
  prepare?: (
    data: Partial<InferInput<TFields>>,
    ctx: OperationContext<GetPayload<TModelName>, { hasResult: false }>,
  ) => Promise<TPrepareResult>;

  /**
   * Build data for the update operation
   */
  buildData: (
    data: InferFieldsUpdateOutput<TFields> & TPrepareResult,
    ctx: TransactionalOperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    >,
  ) => UpdateInput<TModelName> | Promise<UpdateInput<TModelName>>;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<GetPayload<TModelName>>;
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

    // Collect existing model include fields
    const existingModelIncludes = Object.entries(config.fields)
      .map(([key, field]) => field.existingModelInclude?.(key))
      .filter((value) => value !== undefined);
    const existingModelInclude = mergePrismaQueries(existingModelIncludes);

    const baseOperationContext: OperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    > = {
      operation: 'update' as const,
      serviceContext: context,
      loadExisting: async () => {
        if (existingItem) return existingItem;
        const findUniqueOrThrow = prisma[config.model]
          .findUnique as unknown as (args: {
          where: WhereUniqueInput<TModelName>;
          include?: PrismaInclude;
        }) => Promise<GetPayload<TModelName> | null>;
        const result = await findUniqueOrThrow({
          where,
          include: existingModelInclude,
        });
        if (!result) throw new NotFoundError(`${config.model} not found`);
        existingItem = result;
        return result;
      },
      result: undefined,
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

    const [{ data: fieldsData, hooks: fieldsHooks }, preparedData] =
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
        ...(fieldsHooks.beforeExecute ?? []),
      ],
      afterExecute: [
        ...(config.hooks?.afterExecute ?? []),
        ...(fieldsHooks.afterExecute ?? []),
      ],
      afterCommit: [
        ...(config.hooks?.afterCommit ?? []),
        ...(fieldsHooks.afterCommit ?? []),
      ],
    };

    // Execute in transaction
    return prisma
      .$transaction(async (tx) => {
        const txContext: TransactionalOperationContext<
          GetPayload<TModelName>,
          { hasResult: false }
        > = {
          ...baseOperationContext,
          tx,
        };

        // Run beforeExecute hooks
        await invokeHooks(allHooks.beforeExecute, txContext);

        // Run all async update data transformations
        const awaitedFieldsData =
          typeof fieldsData === 'function' ? await fieldsData(tx) : fieldsData;
        const updateData = { ...awaitedFieldsData.update, ...preparedData };

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
      { hasResult: false }
    >,
  ) => Promise<void>;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<GetPayload<TModelName>>;
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
      { hasResult: false }
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
      result: undefined,
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
          { hasResult: false }
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
