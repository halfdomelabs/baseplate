import type { ITXClientDenyList } from '@prisma/client/runtime/client';

import type { PrismaClient } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

/** Prisma transaction type for data operations */
export type PrismaTransaction = Omit<PrismaClient, ITXClientDenyList>;

/** Type of data operation */
export type DataOperationType = 'create' | 'update' | 'upsert' | 'delete';

/* eslint-disable @typescript-eslint/no-explicit-any -- to allow any generic types */

/**
 * =========================================
 * Operation Contexts and Hooks
 * =========================================
 */

/** Context for operation-level logic (non-transactional) */
export interface OperationContext<
  TModel,
  TConfig extends {
    hasResult: boolean;
  },
> {
  operation: DataOperationType;
  serviceContext: ServiceContext;
  loadExisting: () => Promise<TModel | undefined>;
  result: TConfig['hasResult'] extends true ? TModel : undefined;
}

/** Context for operation-level logic inside a transaction */
export interface TransactionalOperationContext<
  TModel,
  TConfig extends { hasResult: boolean },
> extends OperationContext<TModel, TConfig> {
  tx: PrismaTransaction;
}

/** Operation hooks */
export interface OperationHooks<TModel> {
  beforeExecute?: ((
    context: TransactionalOperationContext<TModel, { hasResult: false }>,
  ) => Promise<void>)[];
  afterExecute?: ((
    context: TransactionalOperationContext<TModel, { hasResult: true }>,
  ) => Promise<void>)[];
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

/** Context for field transformations */
export interface FieldContext {
  operation: DataOperationType;
  fieldName: string;
  serviceContext: ServiceContext;
  loadExisting: () => Promise<object | undefined>;
}

export interface FieldTransformData<TCreateOutput, TUpdateOutput> {
  create?: TCreateOutput;
  update?: TUpdateOutput;
}

/** Result of field transformation with optional hooks */
export interface FieldTransformResult<TCreateOutput, TUpdateOutput> {
  data?:
    | FieldTransformData<TCreateOutput, TUpdateOutput>
    | ((
        tx: PrismaTransaction,
      ) => Promise<FieldTransformData<TCreateOutput, TUpdateOutput>>);

  hooks?: AnyOperationHooks;
}

/**
 * Field definition with validation and optional transformation
 */
export interface FieldDefinition<TInput, TCreateOutput, TUpdateOutput> {
  processInput: (
    value: TInput,
    ctx: FieldContext,
  ) =>
    | Promise<FieldTransformResult<TCreateOutput, TUpdateOutput>>
    | FieldTransformResult<TCreateOutput, TUpdateOutput>;
}

export type AnyFieldDefinition = FieldDefinition<any, any, any>;

type RequiredKeys<T> = {
  [P in keyof T]: T[P] extends Exclude<T[P], undefined> ? P : never;
}[keyof T];
type OptionalForUndefinedKeys<T> = Partial<T> & Pick<T, RequiredKeys<T>>;

type Identity<T> = T extends object
  ? {} & {
      [P in keyof T]: T[P];
    }
  : T;

/**
 * Infer input types from field definitions
 */
export type InferInput<TFields extends Record<string, AnyFieldDefinition>> =
  Identity<
    OptionalForUndefinedKeys<{
      [K in keyof TFields]: TFields[K] extends FieldDefinition<
        infer TInput,
        any,
        any
      >
        ? TInput
        : never;
    }>
  >;

/**
 * Infer create output types from field definitions
 */
export type InferFieldOutput<TField extends FieldDefinition<any, any, any>> =
  TField extends FieldDefinition<any, infer TCreateOutput, infer TUpdateOutput>
    ? {
        create: TCreateOutput;
        update: TUpdateOutput;
      }
    : never;

export type InferFieldsCreateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = Identity<{
  [K in keyof TFields]: InferFieldOutput<TFields[K]>['create'];
}>;

/**
 * Infer update output types from field definitions
 */
export type InferFieldsUpdateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = Identity<{
  [K in keyof TFields]: InferFieldOutput<TFields[K]>['update'] | undefined;
}>;

export interface InferFieldsOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> {
  create: InferFieldsCreateOutput<TFields>;
  update: InferFieldsUpdateOutput<TFields>;
}
