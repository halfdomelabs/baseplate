import type { Result } from '@prisma/client/runtime/client';

import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';

import { prisma } from '@src/services/prisma.js';

import type { GlobalRoleCheck, InstanceRoleCheck } from '../authorizers.js';
import type { ServiceContext } from '../service-context.js';
import type {
  GetPayload,
  ModelPropName,
  ModelQuery,
  WhereUniqueInput,
} from './prisma-types.js';
import type {
  AnyFieldDefinition,
  AnyOperationHooks,
  DataOperationType,
  InferFieldOutput,
  InferFieldsCreateOutput,
  InferFieldsOutput,
  InferFieldsUpdateOutput,
  InferInput,
  InferInputSchema,
  OperationContext,
  OperationHooks,
  PrismaTransaction,
  TransactionalOperationContext,
} from './types.js';

import {
  checkGlobalAuthorization,
  checkInstanceAuthorization,
} from '../authorizers.js';
import { NotFoundError } from '../http-errors.js';
import { makeGenericPrismaDelegate } from './prisma-utils.js';

/**
 * Invokes an array of hooks with the provided context.
 *
 * All hooks are executed in parallel using `Promise.all`. If no hooks are provided
 * or the array is empty, this function returns immediately.
 *
 * @template TContext - The context type passed to each hook
 * @param hooks - Optional array of async hook functions to invoke
 * @param context - The context object passed to each hook
 * @returns Promise that resolves when all hooks have completed
 *
 * @example
 * ```typescript
 * await invokeHooks(config.hooks?.beforeExecute, {
 *   operation: 'create',
 *   serviceContext: ctx,
 *   tx: transaction,
 * });
 * ```
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
 * Transforms field definitions into Prisma create/update data structures.
 *
 * This function processes each field definition by:
 * 1. Validating the input value against the field's schema
 * 2. Transforming the value into Prisma-compatible create/update data
 * 3. Collecting hooks from each field for execution during the operation lifecycle
 *
 * The function supports both synchronous and asynchronous field transformations.
 * If any field returns an async transformation function, the entire data object
 * becomes async and will be resolved inside the transaction.
 *
 * @template TFields - Record of field definitions
 * @param fields - Field definitions to process
 * @param input - Input data to validate and transform
 * @param options - Transformation options
 * @param options.serviceContext - Service context with user, request info
 * @param options.operation - Type of operation (create, update, upsert, delete)
 * @param options.allowOptionalFields - Whether to allow undefined field values
 * @param options.loadExisting - Function to load existing model data
 * @returns Object containing transformed data and collected hooks
 *
 * @example
 * ```typescript
 * const { data, hooks } = await transformFields(
 *   { name: scalarField(z.string()), email: scalarField(z.email()) },
 *   { name: 'John', email: 'john@example.com' },
 *   {
 *     serviceContext: ctx,
 *     operation: 'create',
 *     allowOptionalFields: false,
 *     loadExisting: () => Promise.resolve(undefined),
 *   },
 * );
 * ```
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

    if (result.data !== undefined) {
      data[fieldKey as keyof TFields] = result.data as FieldDataOrFunction<
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
      if (value.update !== undefined) {
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
 * Schema Generation Utilities
 * =========================================
 */

/**
 * Generates a Zod schema for create operations from field definitions.
 *
 * Extracts the Zod schema from each field definition and combines them
 * into a single object schema. This schema can be used for validation
 * in GraphQL resolvers, REST endpoints, tRPC procedures, or OpenAPI documentation.
 *
 * @template TFields - Record of field definitions
 * @param fields - Field definitions to extract schemas from
 * @returns Zod object schema with all fields required
 *
 * @example
 * ```typescript
 * const fields = {
 *   name: scalarField(z.string()),
 *   email: scalarField(z.email()),
 * };
 *
 * const schema = generateCreateSchema(fields);
 * // schema is z.object({ name: z.string(), email: z.email() })
 *
 * // Use for validation
 * const validated = schema.parse({ name: 'John', email: 'john@example.com' });
 * ```
 */
export function generateCreateSchema<
  TFields extends Record<string, AnyFieldDefinition>,
>(fields: TFields): InferInputSchema<TFields> {
  const shape = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.schema]),
  ) as {
    [K in keyof TFields]: TFields[K]['schema'];
  };

  return z.object(shape) as InferInputSchema<TFields>;
}

/**
 * =========================================
 * Create Operation
 * =========================================
 */

/**
 * Configuration for defining a create operation.
 *
 * Create operations insert new records into the database with support for:
 * - Field-level validation and transformation
 * - Authorization checks before creation
 * - Computed fields based on raw input
 * - Transaction management with lifecycle hooks
 * - Nested relation creation
 *
 * @template TModelName - Prisma model name (e.g., 'user', 'post')
 * @template TFields - Record of field definitions
 * @template TPrepareResult - Type of data returned by prepareComputedFields
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
   * Optional authorization check before creating.
   * Only global roles (strings) are allowed since there is no model instance.
   *
   * @example
   * ```typescript
   * authorize: ['admin', 'system']
   * ```
   */
  authorize?: GlobalRoleCheck[];

  /**
   * Optional step to prepare computed fields based off the raw input
   */
  prepareComputedFields?: (
    data: InferInput<TFields>,
    ctx: OperationContext<GetPayload<TModelName>, { hasResult: false }>,
  ) => TPrepareResult | Promise<TPrepareResult>;

  /**
   * Execute the create operation. This function receives validated field data
   * and must return a Prisma create operation. It runs inside the transaction.
   */
  create: <TQueryArgs extends ModelQuery<TModelName>>(input: {
    tx: PrismaTransaction;
    data: InferFieldsCreateOutput<TFields> & TPrepareResult;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<
    Result<
      (typeof prisma)[TModelName],
      // We type the query parameter to ensure that the user always includes ...query into the create call
      { include: NonNullable<TQueryArgs['include']> },
      'create'
    >
  >;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<GetPayload<TModelName>>;
}

/**
 * Input parameters for executing a create operation.
 *
 * @template TModelName - Prisma model name
 * @template TFields - Record of field definitions
 * @template TQueryArgs - Prisma query arguments (select/include)
 */
export interface CreateOperationInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Data to create the new record with */
  data: InferInput<TFields>;
  /** Optional Prisma query arguments to shape the returned data */
  query?: TQueryArgs;
  /** Service context containing user info, request details, etc. */
  context: ServiceContext;
  /**
   * Skip Zod validation if data has already been validated (avoids double validation).
   * Set to true when validation happened at a higher layer (e.g., GraphQL input type validation).
   */
  skipValidation?: boolean;
}

type CreateOperationFunction<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> = (<TQueryArgs extends ModelQuery<TModelName>>(
  input: CreateOperationInput<TModelName, TFields, TQueryArgs>,
) => Promise<GetPayload<TModelName, TQueryArgs>>) & {
  $dataSchema: InferInputSchema<TFields>;
};

/**
 * Defines a type-safe create operation for a Prisma model.
 *
 * Creates a reusable function for inserting new records with built-in:
 * - Input validation via field definitions
 * - Authorization checks
 * - Computed field preparation
 * - Transaction management
 * - Hook execution at each lifecycle phase
 *
 * @template TModelName - Prisma model name
 * @template TFields - Record of field definitions
 * @template TPrepareResult - Type of prepared computed fields
 * @param config - Operation configuration
 * @returns Async function that executes the create operation
 *
 * @example
 * ```typescript
 * const createUser = defineCreateOperation({
 *   model: 'user',
 *   fields: {
 *     name: scalarField(z.string()),
 *     email: scalarField(z.email()),
 *   },
 *   authorize: async (data, ctx) => {
 *     // Check if user has permission to create
 *   },
 *   create: ({ tx, data, query, serviceContext }) =>
 *     tx.user.create({
 *       data: {
 *         name: data.name,
 *         email: data.email,
 *         createdById: serviceContext.user?.id,
 *       },
 *       ...query,
 *     }),
 * });
 *
 * // Usage
 * const user = await createUser({
 *   data: { name: 'John', email: 'john@example.com' },
 *   context: serviceContext,
 * });
 * ```
 */
export function defineCreateOperation<
  TModelName extends Prisma.TypeMap['meta']['modelProps'],
  TFields extends Record<string, AnyFieldDefinition>,
  TPrepareResult extends Record<string, unknown> | undefined = Record<
    string,
    never
  >,
>(
  config: CreateOperationConfig<TModelName, TFields, TPrepareResult>,
): CreateOperationFunction<TModelName, TFields> {
  const dataSchema = generateCreateSchema(config.fields);

  const createOperation = async <TQueryArgs extends ModelQuery<TModelName>>({
    data,
    query,
    context,
    skipValidation,
  }: CreateOperationInput<TModelName, TFields, TQueryArgs>): Promise<
    GetPayload<TModelName, TQueryArgs>
  > => {
    // Throw error if query select is provided since we will not necessarily have a full result to return
    if (query?.select) {
      throw new Error(
        'Query select is not supported for create operations. Use include instead.',
      );
    }

    // Validate data unless skipValidation is true (e.g., when GraphQL already validated)
    const validatedData = skipValidation ? data : dataSchema.parse(data);

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
    if (config.authorize && config.authorize.length > 0) {
      checkGlobalAuthorization(context, config.authorize);
    }

    // Step 1: Transform fields (OUTSIDE TRANSACTION)
    const [{ data: fieldsData, hooks: fieldsHooks }, preparedData] =
      await Promise.all([
        transformFields(config.fields, validatedData, {
          operation: 'create',
          serviceContext: context,
          allowOptionalFields: false,
          loadExisting: () => Promise.resolve(undefined),
        }),
        config.prepareComputedFields
          ? config.prepareComputedFields(validatedData, baseOperationContext)
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

        const result = await config.create({
          tx,
          data: { ...awaitedFieldsData.create, ...preparedData },
          query: (query ?? {}) as {
            include: NonNullable<TQueryArgs['include']>;
          },
          serviceContext: context,
        });

        // Run afterExecute hooks
        await invokeHooks(allHooks.afterExecute, {
          ...txContext,
          result,
        });

        return result;
      })
      .then(async (result) => {
        // Run afterCommit hooks (outside transaction)
        await invokeHooks(allHooks.afterCommit, {
          ...baseOperationContext,
          result,
        });
        return result as GetPayload<TModelName, TQueryArgs>;
      });
  };
  createOperation.$dataSchema = dataSchema;
  return createOperation;
}

/**
 * =========================================
 * Update Operation
 * =========================================
 */

/**
 * Configuration for defining an update operation.
 *
 * Update operations modify existing database records with support for:
 * - Partial updates (only specified fields are updated)
 * - Authorization checks before modification
 * - Pre-transaction preparation step for heavy I/O
 * - Field-level validation and transformation
 * - Transaction management with lifecycle hooks
 *
 * @template TModelName - Prisma model name (e.g., 'user', 'post')
 * @template TFields - Record of field definitions
 * @template TPrepareResult - Type of data returned by prepare function
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
   * Optional authorization check before updating.
   * Both global roles (strings) and instance roles (functions) are allowed.
   * Discrimination: `typeof check === 'string'` for global roles.
   *
   * @example
   * ```typescript
   * authorize: ['admin', userAuthorizer.roles.owner]
   * ```
   */
  authorize?: (GlobalRoleCheck | InstanceRoleCheck<GetPayload<TModelName>>)[];

  /**
   * Optional prepare step - runs BEFORE transaction
   * For heavy I/O, validation, data enrichment
   */
  prepareComputedFields?: (
    data: Partial<InferInput<TFields>>,
    ctx: OperationContext<GetPayload<TModelName>, { hasResult: false }>,
  ) => TPrepareResult | Promise<TPrepareResult>;

  /**
   * Execute the update operation. This function receives validated field data
   * and must return a Prisma update operation. It runs inside the transaction.
   */
  update: <TQueryArgs extends ModelQuery<TModelName>>(input: {
    tx: PrismaTransaction;
    where: WhereUniqueInput<TModelName>;
    data: InferFieldsUpdateOutput<TFields> & TPrepareResult;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<
    Result<
      (typeof prisma)[TModelName],
      // We type the query parameter to ensure that the user always includes ...query into the update call
      { include: NonNullable<TQueryArgs['include']> },
      'update'
    >
  >;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<GetPayload<TModelName>>;
}

/**
 * Input parameters for executing an update operation.
 *
 * @template TModelName - Prisma model name
 * @template TFields - Record of field definitions
 * @template TQueryArgs - Prisma query arguments (select/include)
 */
export interface UpdateOperationInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Unique identifier to locate the record to update */
  where: WhereUniqueInput<TModelName>;
  /** Partial data containing only the fields to update */
  data: Partial<InferInput<TFields>>;
  /** Optional Prisma query arguments to shape the returned data */
  query?: TQueryArgs;
  /** Service context containing user info, request details, etc. */
  context: ServiceContext;
  /**
   * Skip Zod validation if data has already been validated (avoids double validation).
   * Set to true when validation happened at a higher layer (e.g., GraphQL input type validation).
   */
  skipValidation?: boolean;
}

type UpdateOperationFunction<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> = (<TQueryArgs extends ModelQuery<TModelName>>(
  input: UpdateOperationInput<TModelName, TFields, TQueryArgs>,
) => Promise<GetPayload<TModelName, TQueryArgs>>) & {
  $dataSchema: z.ZodObject<{
    [k in keyof TFields]: z.ZodOptional<TFields[k]['schema']>;
  }>;
};
/**
 * Defines a type-safe update operation for a Prisma model.
 *
 * Creates a reusable function for modifying existing records with built-in:
 * - Partial input validation (only specified fields are processed)
 * - Authorization checks with access to existing data
 * - Pre-transaction preparation for heavy I/O
 * - Transaction management
 * - Hook execution at each lifecycle phase
 *
 * @template TModelName - Prisma model name
 * @template TFields - Record of field definitions
 * @template TPrepareResult - Type of prepared data
 * @param config - Operation configuration
 * @returns Async function that executes the update operation
 * @throws {NotFoundError} If the record to update doesn't exist
 *
 * @example
 * ```typescript
 * const updateUser = defineUpdateOperation({
 *   model: 'user',
 *   fields: {
 *     name: scalarField(z.string()),
 *     email: scalarField(z.email()),
 *   },
 *   authorize: async (data, ctx) => {
 *     const existing = await ctx.loadExisting();
 *     // Check if user owns this record
 *   },
 *   update: ({ tx, where, data, query, serviceContext }) =>
 *     tx.user.update({
 *       where,
 *       data: {
 *         ...data,
 *         updatedById: serviceContext.user?.id,
 *       },
 *       ...query,
 *     }),
 * });
 *
 * // Usage
 * const user = await updateUser({
 *   where: { id: userId },
 *   data: { name: 'Jane' }, // Only update name
 *   context: serviceContext,
 * });
 * ```
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
): UpdateOperationFunction<TModelName, TFields> {
  const dataSchema = generateCreateSchema(config.fields).partial();

  const updateOperation = async <TQueryArgs extends ModelQuery<TModelName>>({
    where,
    data: inputData,
    query,
    context,
    skipValidation,
  }: UpdateOperationInput<TModelName, TFields, TQueryArgs>): Promise<
    GetPayload<TModelName, TQueryArgs>
  > => {
    // Throw error if query select is provided since we will not necessarily have a full result to return
    if (query?.select) {
      throw new Error(
        'Query select is not supported for update operations. Use include instead.',
      );
    }

    // Validate data unless skipValidation is true (e.g., when GraphQL already validated)
    const validatedData = (
      skipValidation ? inputData : dataSchema.parse(inputData)
    ) as Partial<InferInput<TFields>>;

    let existingItem: GetPayload<TModelName> | undefined;

    const delegate = makeGenericPrismaDelegate(prisma, config.model);

    const baseOperationContext: OperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    > = {
      operation: 'update' as const,
      serviceContext: context,
      loadExisting: async () => {
        if (existingItem) return existingItem;
        const result = await delegate.findUnique({
          where,
        });
        if (!result) throw new NotFoundError(`${config.model} not found`);
        existingItem = result;
        return result;
      },
      result: undefined,
    };

    // Authorization - check roles, lazy loading instance only if needed
    if (config.authorize && config.authorize.length > 0) {
      await checkInstanceAuthorization(
        context,
        baseOperationContext.loadExisting as () => Promise<
          GetPayload<TModelName>
        >,
        config.authorize,
      );
    }

    // Step 1: Transform fields (outside transaction)
    // Only transform fields provided in input
    const fieldsToTransform = Object.fromEntries(
      Object.entries(config.fields).filter(([key]) => key in validatedData),
    ) as TFields;

    const [{ data: fieldsData, hooks: fieldsHooks }, preparedData] =
      await Promise.all([
        transformFields(
          fieldsToTransform,
          validatedData as InferInput<TFields>,
          {
            operation: 'update',
            serviceContext: context,
            allowOptionalFields: true,
            loadExisting: baseOperationContext.loadExisting as () => Promise<
              Record<string, unknown>
            >,
          },
        ),
        config.prepareComputedFields
          ? config.prepareComputedFields(validatedData, baseOperationContext)
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

        const result = await config.update({
          tx,
          where,
          data: { ...awaitedFieldsData.update, ...preparedData },
          query: (query ?? {}) as {
            include: NonNullable<TQueryArgs['include']>;
          },
          serviceContext: context,
        });

        // Run afterExecute hooks
        await invokeHooks(allHooks.afterExecute, {
          ...txContext,
          result,
        });

        return result;
      })
      .then(async (result) => {
        // Run afterCommit hooks (outside transaction)
        await invokeHooks(allHooks.afterCommit, {
          ...baseOperationContext,
          result,
        });
        return result as GetPayload<TModelName, TQueryArgs>;
      });
  };
  updateOperation.$dataSchema = generateCreateSchema(config.fields).partial();
  return updateOperation;
}

/**
 * Configuration for defining a delete operation.
 *
 * Delete operations remove records from the database with support for:
 * - Authorization checks before deletion
 * - Transaction management
 * - Lifecycle hooks for cleanup operations
 * - Access to the record being deleted
 *
 * @template TModelName - Prisma model name (e.g., 'user', 'post')
 */
export interface DeleteOperationConfig<TModelName extends ModelPropName> {
  /**
   * Prisma model name
   */
  model: TModelName;

  /**
   * Optional authorization check before deleting.
   * Both global roles (strings) and instance roles (functions) are allowed.
   * Discrimination: `typeof check === 'string'` for global roles.
   *
   * @example
   * ```typescript
   * authorize: ['admin', userAuthorizer.roles.owner]
   * ```
   */
  authorize?: (GlobalRoleCheck | InstanceRoleCheck<GetPayload<TModelName>>)[];

  /**
   * Execute the delete operation. This function receives the where clause
   * and must return a Prisma delete operation. It runs inside the transaction.
   */
  delete: <TQueryArgs extends ModelQuery<TModelName>>(input: {
    tx: PrismaTransaction;
    where: WhereUniqueInput<TModelName>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<
    Result<
      (typeof prisma)[TModelName],
      // We type the query parameter to ensure that the user always includes ...query into the delete call
      { include: NonNullable<TQueryArgs['include']> },
      'delete'
    >
  >;

  /**
   * Optional hooks for the operation
   */
  hooks?: OperationHooks<GetPayload<TModelName>>;
}

/**
 * Input parameters for executing a delete operation.
 *
 * @template TModelName - Prisma model name
 * @template TQueryArgs - Prisma query arguments (select/include)
 */
export interface DeleteOperationInput<
  TModelName extends ModelPropName,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Unique identifier to locate the record to delete */
  where: WhereUniqueInput<TModelName>;
  /** Optional Prisma query arguments to shape the returned data */
  query?: TQueryArgs;
  /** Service context containing user info, request details, etc. */
  context: ServiceContext;
}

/**
 * Defines a type-safe delete operation for a Prisma model.
 *
 * Creates a reusable function for removing records with built-in:
 * - Authorization checks with access to the record being deleted
 * - Transaction management
 * - Hook execution for cleanup operations (e.g., deleting associated files)
 * - Returns the deleted record
 *
 * @template TModelName - Prisma model name
 * @param config - Operation configuration
 * @returns Async function that executes the delete operation
 * @throws {NotFoundError} If the record to delete doesn't exist
 *
 * @example
 * ```typescript
 * const deleteUser = defineDeleteOperation({
 *   model: 'user',
 *   authorize: async (ctx) => {
 *     const existing = await ctx.loadExisting();
 *     // Check if user has permission to delete
 *   },
 *   delete: ({ tx, where, query, serviceContext }) =>
 *     tx.user.delete({
 *       where,
 *       ...query,
 *     }),
 *   hooks: {
 *     afterCommit: [
 *       async (ctx) => {
 *         // Clean up user's files, sessions, etc.
 *         await cleanupUserResources(ctx.result.id);
 *       },
 *     ],
 *   },
 * });
 *
 * // Usage
 * const deletedUser = await deleteUser({
 *   where: { id: userId },
 *   context: serviceContext,
 * });
 * ```
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
    // Throw error if query select is provided since we will not necessarily have a full result to return
    if (query?.select) {
      throw new Error(
        'Query select is not supported for delete operations. Use include instead.',
      );
    }

    const delegate = makeGenericPrismaDelegate(prisma, config.model);

    let existingItem: GetPayload<TModelName> | undefined;
    const baseOperationContext: OperationContext<
      GetPayload<TModelName>,
      { hasResult: false }
    > = {
      operation: 'delete' as const,
      serviceContext: context,
      loadExisting: async () => {
        if (existingItem) return existingItem;
        const result = await delegate.findUnique({ where });
        if (!result) throw new NotFoundError(`${config.model} not found`);
        existingItem = result;
        return result;
      },
      result: undefined,
    };

    // Authorization - check roles, lazy loading instance only if needed
    if (config.authorize && config.authorize.length > 0) {
      await checkInstanceAuthorization(
        context,
        baseOperationContext.loadExisting as () => Promise<
          GetPayload<TModelName>
        >,
        config.authorize,
      );
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
        const result = await config.delete({
          tx,
          where,
          query: (query ?? {}) as {
            include: NonNullable<TQueryArgs['include']>;
          },
          serviceContext: context,
        });

        // Run afterExecute hooks
        await invokeHooks(allHooks.afterExecute, {
          ...txContext,
          result,
        });

        return result;
      })
      .then(async (result) => {
        // Run afterCommit hooks (outside transaction)
        await invokeHooks(allHooks.afterCommit, {
          ...baseOperationContext,
          result,
        });
        return result as GetPayload<TModelName, TQueryArgs>;
      });
  };
}
