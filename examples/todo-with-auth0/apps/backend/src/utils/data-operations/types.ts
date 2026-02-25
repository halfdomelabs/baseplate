import type { ITXClientDenyList } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type { PrismaClient } from '@src/generated/prisma/client.js';

import type { GlobalRoleCheck, InstanceRoleCheck } from '../authorizers.js';
import type { ServiceContext } from '../service-context.js';
import type {
  GetPayload,
  ModelPropName,
  ModelQuery,
  WhereUniqueInput,
} from './prisma-types.js';

/**
 * Prisma transaction client type for data operations.
 *
 * This is the Prisma client type available within transaction callbacks,
 * with operations that cannot be used inside transactions excluded.
 */
export type PrismaTransaction = Omit<PrismaClient, ITXClientDenyList>;

/**
 * Type of data operation being performed.
 *
 * - **create**: Inserting a new record
 * - **update**: Modifying an existing record
 * - **upsert**: Creating or updating a record (used internally for nested relations)
 * - **delete**: Removing a record
 */
export type DataOperationType = 'create' | 'update' | 'upsert' | 'delete';

/* eslint-disable @typescript-eslint/no-explicit-any -- to allow any generic types */

/**
 * =========================================
 * Operation Contexts and Hooks
 * =========================================
 */

/**
 * Context object provided to operation hooks and authorization functions.
 *
 * Contains information about the operation being performed and provides
 * access to the service context and existing data.
 *
 * @template TModel - The Prisma model type
 * @template TConfig - Configuration object with hasResult flag
 */
export interface OperationContext<
  TModel,
  TConfig extends {
    hasResult: boolean;
  },
> {
  /** Type of operation being performed */
  operation: DataOperationType;
  /** Service context with user info, request details, etc. */
  serviceContext: ServiceContext;
  /** Function to load the existing model data (for update/delete operations) */
  loadExisting: () => Promise<TModel | undefined>;
  /** The operation result (only available after execution) */
  result: TConfig['hasResult'] extends true ? TModel : undefined;
}

/**
 * Context object provided to hooks that run inside a transaction.
 *
 * Extends {@link OperationContext} with access to the Prisma transaction client,
 * allowing hooks to perform additional database operations within the same transaction.
 *
 * @template TModel - The Prisma model type
 * @template TConfig - Configuration object with hasResult flag
 */
export interface TransactionalOperationContext<
  TModel,
  TConfig extends { hasResult: boolean },
> extends OperationContext<TModel, TConfig> {
  /** Prisma transaction client for performing database operations */
  tx: PrismaTransaction;
}

/**
 * Lifecycle hooks for data operations.
 *
 * Hooks allow you to execute custom logic at different points in the operation lifecycle:
 * - **beforeExecute**: Runs inside transaction, before the database operation
 * - **afterExecute**: Runs inside transaction, after the database operation (has access to result)
 * - **afterCommit**: Runs outside transaction, after successful commit (for side effects)
 *
 * @template TModel - The Prisma model type
 *
 * @example
 * ```typescript
 * const hooks: OperationHooks<User> = {
 *   beforeExecute: [
 *     async (ctx) => {
 *       // Validate business rules before saving
 *     },
 *   ],
 *   afterExecute: [
 *     async (ctx) => {
 *       // Update related records within same transaction
 *       await ctx.tx.auditLog.create({
 *         data: { action: 'user_created', userId: ctx.result.id },
 *       });
 *     },
 *   ],
 *   afterCommit: [
 *     async (ctx) => {
 *       // Send email notification (outside transaction)
 *       await emailService.sendWelcome(ctx.result.email);
 *     },
 *   ],
 * };
 * ```
 */
export interface OperationHooks<TModel> {
  /** Hooks that run inside transaction, before the database operation */
  beforeExecute?: ((
    context: TransactionalOperationContext<TModel, { hasResult: false }>,
  ) => Promise<void>)[];
  /** Hooks that run inside transaction, after the database operation */
  afterExecute?: ((
    context: TransactionalOperationContext<TModel, { hasResult: true }>,
  ) => Promise<void>)[];
  /** Hooks that run outside transaction, after successful commit */
  afterCommit?: ((
    context: OperationContext<TModel, { hasResult: true }>,
  ) => Promise<void>)[];
}

export type AnyOperationHooks = OperationHooks<any>;

/**
 * =========================================
 * Field Types
 * =========================================
 */

/**
 * Context provided to field `processInput` functions.
 *
 * Contains information about the operation and provides access to
 * existing data and service context.
 */
export interface FieldContext {
  /** Type of operation being performed */
  operation: DataOperationType;
  /** Name of the field being processed */
  fieldName: string;
  /** Service context with user info, request details, etc. */
  serviceContext: ServiceContext;
  /** Function to load existing model data (for updates) */
  loadExisting: () => Promise<object | undefined>;
}

/**
 * Transformed field data for create and update operations.
 *
 * Fields can produce different data structures for create vs. update operations.
 *
 * @template TCreateOutput - Data type for create operations
 * @template TUpdateOutput - Data type for update operations
 */
export interface FieldTransformData<TCreateOutput, TUpdateOutput> {
  /** Data to use when creating a new record */
  create?: TCreateOutput;
  /** Data to use when updating an existing record */
  update?: TUpdateOutput;
}

/**
 * Result of field processing, including transformed data and optional hooks.
 *
 * Hooks allow fields to perform side effects during the operation lifecycle.
 *
 * @template TCreateOutput - Data type for create operations
 * @template TUpdateOutput - Data type for update operations
 */
export interface FieldTransformResult<TCreateOutput, TUpdateOutput> {
  /** Transformed field data for create and update operations */
  data?: FieldTransformData<TCreateOutput, TUpdateOutput>;

  /** Optional hooks to execute during operation lifecycle */
  hooks?: AnyOperationHooks;
}

/**
 * Field definition for validating and transforming input values.
 *
 * A field definition specifies how to process a single input field:
 * - Validate the input value using a Zod schema
 * - Transform it into Prisma-compatible create/update data
 * - Optionally attach hooks for side effects
 *
 * @template TInputSchema - The Zod schema type for validation
 * @template TCreateOutput - Output type for create operations
 * @template TUpdateOutput - Output type for update operations
 *
 * @example
 * ```typescript
 * const nameField: FieldDefinition<z.ZodString, string, string> = {
 *   zodSchema: z.string().min(1),
 *   processInput: (value, ctx) => {
 *     const validated = z.string().min(1).parse(value);
 *     return {
 *       data: {
 *         create: validated,
 *         update: validated,
 *       },
 *     };
 *   },
 * };
 * ```
 */
export interface FieldDefinition<
  TInputSchema extends z.ZodType,
  TCreateOutput,
  TUpdateOutput,
> {
  /**
   * The Zod schema for validating this field's input.
   * This schema can be extracted and reused for validation in other contexts
   * (e.g., GraphQL mutations, REST endpoints, tRPC procedures).
   */
  schema: TInputSchema;

  /**
   * Processes and transforms an input value.
   *
   * Note: Validation happens at the operation level (defineCreateOperation/defineUpdateOperation),
   * not at the field level. This function receives already-validated input.
   *
   * @param value - The validated input value to process
   * @param ctx - Context about the operation
   * @returns Transformed data and optional hooks
   */
  processInput: (
    value: z.output<TInputSchema>,
    ctx: FieldContext,
  ) =>
    | Promise<FieldTransformResult<TCreateOutput, TUpdateOutput>>
    | FieldTransformResult<TCreateOutput, TUpdateOutput>;
}

/** Type alias for any field definition (used for generic constraints) */
export type AnyFieldDefinition = FieldDefinition<any, any, any>;

/**
 * =========================================
 * Type Inference Utilities
 * =========================================
 */

/** Identity type that expands type aliases for better IDE tooltips */
type Identity<T> = T extends object
  ? {} & {
      [P in keyof T]: T[P];
    }
  : T;

/**
 * Infers the input schema from a record of field definitions.
 *
 * Creates an object type where:
 * - Each key corresponds to a field name
 * - Each value type is the field's Zod schema type
 *
 * @template TFields - Record of field definitions
 *
 * @example
 * ```typescript
 * const fields = {
 *   name: scalarField(z.string()),
 *   email: scalarField(z.email().optional()),
 * };
 *
 * type InputSchema = InferInputSchema<typeof fields>;
 * // { name: z.ZodString; email?: z.ZodString | undefined }
 * ```
 */
export type InferInputSchema<
  TFields extends Record<string, AnyFieldDefinition>,
> = z.ZodObject<{
  [K in keyof TFields]: TFields[K] extends FieldDefinition<
    infer TInputSchema,
    any,
    any
  >
    ? TInputSchema
    : never;
}>;

/**
 * Infers the input type from a record of field definitions.
 *
 * Creates an object type where:
 * - Each key corresponds to a field name
 * - Each value type is the field's Zod schema type
 * - Fields accepting undefined become optional properties
 *
 * @template TFields - Record of field definitions
 *
 * @example
 * ```typescript
 * const fields = {
 *   name: scalarField(z.string()),
 *   email: scalarField(z.email().optional()),
 * };
 *
 * type Input = InferInput<typeof fields>;
 * // { name: string; email?: string | undefined }
 * ```
 */
export type InferInput<TFields extends Record<string, AnyFieldDefinition>> =
  z.output<InferInputSchema<TFields>>;

/**
 * Infers the output type (create and update) from a single field definition.
 *
 * @template TField - A field definition
 */
export type InferFieldOutput<TField extends FieldDefinition<any, any, any>> =
  TField extends FieldDefinition<any, infer TCreateOutput, infer TUpdateOutput>
    ? {
        create: TCreateOutput;
        update: TUpdateOutput;
      }
    : never;

/**
 * Infers the create output type from a record of field definitions.
 *
 * Creates an object type where each property is the field's create output type.
 *
 * @template TFields - Record of field definitions
 */
export type InferFieldsCreateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = Identity<{
  [K in keyof TFields]: InferFieldOutput<TFields[K]>['create'];
}>;

/**
 * Infers the update output type from a record of field definitions.
 *
 * Creates an object type where each property is the field's update output type
 * or undefined (since updates are partial).
 *
 * @template TFields - Record of field definitions
 */
export type InferFieldsUpdateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = Identity<{
  [K in keyof TFields]: InferFieldOutput<TFields[K]>['update'] | undefined;
}>;

/**
 * Combined create and update output types for a set of fields.
 *
 * @template TFields - Record of field definitions
 */
export interface InferFieldsOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /** Field outputs for create operations */
  create: InferFieldsCreateOutput<TFields>;
  /** Field outputs for update operations */
  update: InferFieldsUpdateOutput<TFields>;
}

/**
 * =========================================
 * Operation Plans
 * =========================================
 */

type HookPhase = keyof Required<AnyOperationHooks>;
type HookFn<TPhase extends HookPhase> =
  Required<AnyOperationHooks>[TPhase][number];

/**
 * Immutable plan for a create operation, returned by `composeCreate`.
 *
 * Contains the resolved field data, collected hooks, and service context.
 * Use `mapData` and `addHook` to derive new plans — the original is never mutated.
 */
export class CreatePlan<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /** The Prisma model name */
  readonly model: TModelName;

  /** Resolved field data for the create operation */
  readonly data: InferFieldsCreateOutput<TFields>;

  /** Collected hooks from field processing and any `addHook` calls */
  readonly hooks: Readonly<Required<AnyOperationHooks>>;

  /** Service context for the operation */
  readonly serviceContext: ServiceContext;

  constructor(args: {
    model: TModelName;
    data: InferFieldsCreateOutput<TFields>;
    hooks: Required<AnyOperationHooks>;
    serviceContext: ServiceContext;
  }) {
    this.model = args.model;
    this.data = args.data;
    this.hooks = args.hooks;
    this.serviceContext = args.serviceContext;
  }

  /** Return a new plan with transformed data. */
  mapData(
    fn: (
      data: InferFieldsCreateOutput<TFields>,
    ) => InferFieldsCreateOutput<TFields>,
  ): CreatePlan<TModelName, TFields> {
    return new CreatePlan({
      model: this.model,
      data: fn(this.data),
      hooks: this.hooks,
      serviceContext: this.serviceContext,
    });
  }

  /** Return a new plan with an additional hook appended to the given phase. */
  addHook<TPhase extends HookPhase>(
    phase: TPhase,
    hook: HookFn<TPhase>,
  ): CreatePlan<TModelName, TFields> {
    return new CreatePlan({
      model: this.model,
      data: this.data,
      hooks: {
        ...this.hooks,
        [phase]: [...this.hooks[phase], hook],
      },
      serviceContext: this.serviceContext,
    });
  }
}

/**
 * Immutable plan for an update operation, returned by `composeUpdate`.
 *
 * Contains the resolved field data, collected hooks, existing item access,
 * and service context. Use `mapData` and `addHook` to derive new plans —
 * the original is never mutated.
 */
export class UpdatePlan<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  /** The Prisma model name */
  readonly model: TModelName;

  /** Resolved field data for the update operation */
  readonly data: InferFieldsUpdateOutput<TFields>;

  /** Collected hooks from field processing and any `addHook` calls */
  readonly hooks: Readonly<Required<AnyOperationHooks>>;

  /** Service context for the operation */
  readonly serviceContext: ServiceContext;

  /**
   * Lazy loader for the existing item. Caches the result.
   * Call this if you need to inspect the existing item for diffing.
   */
  readonly loadExisting: () => Promise<GetPayload<TModelName>>;

  constructor(args: {
    model: TModelName;
    data: InferFieldsUpdateOutput<TFields>;
    hooks: Required<AnyOperationHooks>;
    serviceContext: ServiceContext;
    loadExisting: () => Promise<GetPayload<TModelName>>;
  }) {
    this.model = args.model;
    this.data = args.data;
    this.hooks = args.hooks;
    this.serviceContext = args.serviceContext;
    this.loadExisting = args.loadExisting;
  }

  /** Return a new plan with transformed data. */
  mapData(
    fn: (
      data: InferFieldsUpdateOutput<TFields>,
    ) => InferFieldsUpdateOutput<TFields>,
  ): UpdatePlan<TModelName, TFields> {
    return new UpdatePlan({
      model: this.model,
      data: fn(this.data),
      hooks: this.hooks,
      serviceContext: this.serviceContext,
      loadExisting: this.loadExisting,
    });
  }

  /** Return a new plan with an additional hook appended to the given phase. */
  addHook<TPhase extends HookPhase>(
    phase: TPhase,
    hook: HookFn<TPhase>,
  ): UpdatePlan<TModelName, TFields> {
    return new UpdatePlan({
      model: this.model,
      data: this.data,
      hooks: {
        ...this.hooks,
        [phase]: [...this.hooks[phase], hook],
      },
      serviceContext: this.serviceContext,
      loadExisting: this.loadExisting,
    });
  }
}

/**
 * =========================================
 * Compose Configs
 * =========================================
 */

/**
 * Configuration for `composeCreate`.
 */
export interface ComposeCreateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  model: TModelName;
  fields: TFields;
  input: InferInput<TFields>;
  context: ServiceContext;

  /**
   * Optional authorization checks. Only global roles are allowed for create
   * since there is no existing instance to check against.
   * Runs before field processing — fails fast on unauthorized access.
   */
  authorize?: GlobalRoleCheck[];
}

/**
 * Configuration for `composeUpdate`.
 *
 * The `loadExisting` function is a cached lazy loader for the existing item.
 * It is called by field processing (e.g., nested relations) when they need
 * to read the current state. The caller defines this function to control
 * how the item is fetched (e.g., with extra includes).
 */
export interface ComposeUpdateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
> {
  model: TModelName;
  fields: TFields;
  input: Partial<InferInput<TFields>>;
  context: ServiceContext;
  loadExisting: () => Promise<GetPayload<TModelName>>;

  /**
   * Optional authorization checks. Supports both global roles (strings)
   * and instance-level checks (functions that receive the existing item).
   * Runs before field processing — fails fast on unauthorized access.
   */
  authorize?: (
    | GlobalRoleCheck
    | InstanceRoleCheck<GetPayload<TModelName>>
  )[];
}

/**
 * =========================================
 * Data Service Input Types
 * =========================================
 */

/**
 * Input type for data service create functions.
 */
export interface DataCreateInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName> = ModelQuery<TModelName>,
> {
  data: InferInput<TFields>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Input type for data service update functions.
 */
export interface DataUpdateInput<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName> = ModelQuery<TModelName>,
> {
  where: WhereUniqueInput<TModelName>;
  data: Partial<InferInput<TFields>>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * Input type for data service delete functions.
 */
export interface DataDeleteInput<
  TModelName extends ModelPropName,
  TQueryArgs extends ModelQuery<TModelName> = ModelQuery<TModelName>,
> {
  where: WhereUniqueInput<TModelName>;
  query?: TQueryArgs;
  context: ServiceContext;
}

/**
 * =========================================
 * Commit Configs
 * =========================================
 */

/**
 * Configuration for `commitCreate`.
 */
export interface CommitCreateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Prisma query arguments (include) to shape returned data */
  query?: TQueryArgs;

  /**
   * Optional override for the default refetch behavior.
   * By default, records are refetched using `findUnique({ where: { id } })`
   * via a generic Prisma delegate. Provide this if you need custom refetch logic.
   */
  refetchWithQuery?: (
    result: GetPayload<TModelName>,
    query: TQueryArgs,
  ) => Promise<GetPayload<TModelName>>;

  /** Execute the Prisma create operation inside the transaction */
  execute: (args: {
    tx: PrismaTransaction;
    data: InferFieldsCreateOutput<TFields>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<GetPayload<TModelName>>;
}

/**
 * Configuration for `commitUpdate`.
 */
export interface CommitUpdateConfig<
  TModelName extends ModelPropName,
  TFields extends Record<string, AnyFieldDefinition>,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** Prisma query arguments (include) to shape returned data */
  query?: TQueryArgs;

  /**
   * Optional override for the default refetch behavior.
   * By default, records are refetched using `findUnique({ where: { id } })`
   * via a generic Prisma delegate. Provide this if you need custom refetch logic.
   */
  refetchWithQuery?: (
    result: GetPayload<TModelName>,
    query: TQueryArgs,
  ) => Promise<GetPayload<TModelName>>;

  /** Execute the Prisma update operation inside the transaction */
  execute: (args: {
    tx: PrismaTransaction;
    data: InferFieldsUpdateOutput<TFields>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<GetPayload<TModelName>>;
}

/**
 * Configuration for `commitDelete`.
 *
 * Delete has no compose step since there are no fields to process.
 * Authorization, hooks, and execution are all handled directly.
 */
export interface CommitDeleteConfig<
  TModelName extends ModelPropName,
  TQueryArgs extends ModelQuery<TModelName>,
> {
  /** The Prisma model name */
  model: TModelName;

  /** Where clause to identify the record to delete */
  where: WhereUniqueInput<TModelName>;

  /** Prisma query arguments (include) to shape returned data */
  query?: TQueryArgs;

  /** Service context for the operation */
  context: ServiceContext;

  /**
   * Optional authorization checks. Supports both global roles (strings)
   * and instance-level checks (functions that receive the existing item).
   * Runs before hooks and delete execution.
   */
  authorize?: (
    | GlobalRoleCheck
    | InstanceRoleCheck<GetPayload<TModelName>>
  )[];

  /** Optional hooks to run during the delete lifecycle */
  hooks?: Partial<AnyOperationHooks>;

  /**
   * Lazy loader for the existing item. Required when using instance-level
   * authorization or hooks that need to inspect the record before deletion.
   * The result is cached so the item is fetched at most once.
   */
  loadExisting?: () => Promise<GetPayload<TModelName>>;

  /** Execute the Prisma delete operation inside the transaction */
  execute: (args: {
    tx: PrismaTransaction;
    where: WhereUniqueInput<TModelName>;
    query: { include: NonNullable<TQueryArgs['include']> };
    serviceContext: ServiceContext;
  }) => Promise<GetPayload<TModelName>>;
}
