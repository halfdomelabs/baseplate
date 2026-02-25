import { z } from 'zod';

import type { ServiceContext } from '../service-context.js';
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
} from './types.js';

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

/**
 * Transforms field definitions into Prisma create/update data structures.
 *
 * This function processes each field definition by:
 * 1. Validating the input value against the field's schema
 * 2. Transforming the value into Prisma-compatible create/update data
 * 3. Collecting hooks from each field for execution during the operation lifecycle
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
  data: InferFieldsOutput<TFields>;
  hooks: AnyOperationHooks;
}> {
  const hooks: Required<AnyOperationHooks> = {
    beforeExecute: [],
    afterExecute: [],
    afterCommit: [],
  };

  const data = {} as {
    [K in keyof TFields]: InferFieldOutput<TFields[K]>;
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
      data[fieldKey as keyof TFields] = result.data as InferFieldOutput<
        TFields[keyof TFields]
      >;
    }

    if (result.hooks) {
      hooks.beforeExecute.push(...(result.hooks.beforeExecute ?? []));
      hooks.afterExecute.push(...(result.hooks.afterExecute ?? []));
      hooks.afterCommit.push(...(result.hooks.afterCommit ?? []));
    }
  }

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

  return { data: { create, update }, hooks };
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
 * @returns Zod object schema preserving each field's optionality
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

type PartialSchema<T extends z.ZodObject<z.ZodRawShape>> = z.ZodObject<{
  [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]>;
}>;

/**
 * Generates a Zod schema for update operations from field definitions.
 *
 * Wraps {@link generateCreateSchema} with `.partial()` so every field becomes
 * optional, allowing callers to supply only the fields they want to change.
 *
 * @template TFields - Record of field definitions
 * @param fields - Field definitions to extract schemas from
 * @returns Partial Zod object schema where all fields are optional
 */
export function generateUpdateSchema<
  TFields extends Record<string, AnyFieldDefinition>,
>(fields: TFields): PartialSchema<InferInputSchema<TFields>> {
  return generateCreateSchema(fields).partial() as PartialSchema<
    InferInputSchema<TFields>
  >;
}
