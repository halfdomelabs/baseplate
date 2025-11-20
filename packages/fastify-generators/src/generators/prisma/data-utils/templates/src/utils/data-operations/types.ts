// @ts-nocheck

import type { PrismaClient } from '%prismaGeneratedImports';
import type { ServiceContext } from '%serviceContextImports';
import type { ITXClientDenyList } from '@prisma/client/runtime/client';
import type { z } from 'zod';

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
  /** Skip Zod validation if data has already been validated (avoids double validation) */
  skipValidation?: boolean;
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
 * The data can be either synchronous or asynchronous (resolved inside transaction).
 * Hooks allow fields to perform side effects during the operation lifecycle.
 *
 * @template TCreateOutput - Data type for create operations
 * @template TUpdateOutput - Data type for update operations
 */
export interface FieldTransformResult<TCreateOutput, TUpdateOutput> {
  /**
   * Transformed field data or an async function that resolves to field data.
   * Async functions are resolved inside the transaction, allowing access to tx client.
   */
  data?:
    | FieldTransformData<TCreateOutput, TUpdateOutput>
    | ((
        tx: PrismaTransaction,
      ) => Promise<FieldTransformData<TCreateOutput, TUpdateOutput>>);

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
  TInputSchema extends z.ZodSchema,
  TCreateOutput,
  TUpdateOutput,
> {
  /**
   * The Zod schema for validating this field's input.
   * This schema can be extracted and reused for validation in other contexts
   * (e.g., GraphQL mutations, REST endpoints, tRPC procedures).
   */
  zodSchema: TInputSchema;

  /**
   * Processes and transforms an input value.
   *
   * @param value - The input value to process
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
 *   email: scalarField(z.string().email().optional()),
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
 *   email: scalarField(z.string().email().optional()),
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
