import type { ITXClientDenyList } from '@prisma/client/runtime/client';

import type { PrismaClient } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

/** Prisma transaction type for data operations */
export type PrismaTransaction = Omit<PrismaClient, ITXClientDenyList>;

/** Type of data operation */
export type DataOperationType = 'create' | 'update' | 'upsert' | 'delete';

/**
 * =========================================
 * Field Types
 * =========================================
 */

/** Context for field transformations */
export interface FieldContext<TModelValue = unknown> {
  operation: DataOperationType;
  fieldName: string;
  serviceContext: ServiceContext;
  loadExisting?: () => Promise<TModelValue>;
}

/** Result of field transformation with optional hooks */
export interface FieldTransformResult<
  TCreateOutput,
  TUpdateOutput,
  TModelValue,
> {
  data?: {
    create?:
      | TCreateOutput
      | ((tx: PrismaTransaction) => Promise<TCreateOutput>);
    update?:
      | TUpdateOutput
      | ((tx: PrismaTransaction) => Promise<TUpdateOutput>);
  };

  hooks?: {
    /** Run inside transaction before main operation */
    beforeExecute?: (ctx: { tx: PrismaTransaction }) => Promise<void>;

    /** Run inside transaction after main operation */
    afterExecute?: (ctx: { tx: PrismaTransaction; new: TModelValue }) => Promise<void>;

    /** Run after transaction commits */
    afterCommit?: (ctx: { new: TModelValue }) => Promise<void>;
  };
}

/**
 * Field definition with validation and optional transformation
 */
export interface FieldDefinition<
  TInput,
  TCreateOutput,
  TUpdateOutput,
  TModelValue,
> {
  processInput: (
    value: TInput,
    ctx: FieldContext<TModelValue>,
  ) =>
    | Promise<FieldTransformResult<TCreateOutput, TUpdateOutput, TModelValue>>
    | FieldTransformResult<TCreateOutput, TUpdateOutput, TModelValue>;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- to allow any generic types */

export type AnyFieldDefinition = FieldDefinition<any, any, any, any>;

/**
 * Infer input types from field definitions
 */
export type InferInput<TFields extends Record<string, AnyFieldDefinition>> = {
  [K in keyof TFields]: TFields[K] extends FieldDefinition<
    infer TInput,
    any,
    any,
    any
  >
    ? TInput
    : never;
};

/**
 * Infer create output types from field definitions
 */
export type InferFieldsCreateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = {
  [K in keyof TFields]: TFields[K] extends FieldDefinition<
    any,
    infer TCreateOutput,
    any,
    any
  >
    ? TCreateOutput
    : never;
};

/**
 * Infer update output types from field definitions
 */
export type InferFieldsUpdateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = {
  [K in keyof TFields]: TFields[K] extends FieldDefinition<
    any,
    any,
    infer TUpdateOutput,
    any
  >
    ? TUpdateOutput | undefined
    : never;
};

/**
 * Infer async create output types from field definitions
 */
export type InferFieldsAsyncCreateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = {
  [K in keyof TFields]: TFields[K] extends FieldDefinition<
    any,
    infer TCreateOutput,
    any,
    any
  >
    ? TCreateOutput | ((tx: PrismaTransaction) => Promise<TCreateOutput>)
    : never;
};

/**
 * Infer async update output types from field definitions
 */
export type InferFieldsAsyncUpdateOutput<
  TFields extends Record<string, AnyFieldDefinition>,
> = {
  [K in keyof TFields]: TFields[K] extends FieldDefinition<
    any,
    any,
    infer TUpdateOutput,
    any
  >
    ? TUpdateOutput | ((tx: PrismaTransaction) => Promise<TUpdateOutput>)
    : never;
};

/**
 * =========================================
 * Operation Contexts and Hooks
 * =========================================
 */

/** Context for operation-level logic (non-transactional) */
export interface OperationContext<
  TModel,
  TConfig extends {
    hasExisting: boolean;
    hasNew: boolean;
  },
> {
  operation: DataOperationType;
  serviceContext: ServiceContext;
  loadExisting: TConfig['hasExisting'] extends true
    ? () => Promise<TModel>
    : undefined;
  new: TConfig['hasNew'] extends true ? TModel : undefined;
}

/** Context for operation-level logic inside a transaction */
export interface TransactionalOperationContext<
  TModel,
  TConfig extends {
    hasExisting: boolean;
    hasNew: boolean;
  },
> extends OperationContext<TModel, TConfig> {
  tx: PrismaTransaction;
}

/** Operation hooks */
export interface OperationHooks<
  TModel,
  TConfig extends { hasExisting: boolean },
> {
  beforeExecute?: ((
    context: TransactionalOperationContext<
      TModel,
      { hasExisting: TConfig['hasExisting']; hasNew: false }
    >,
  ) => Promise<void>)[];
  afterExecute?: ((
    context: TransactionalOperationContext<
      TModel,
      { hasExisting: TConfig['hasExisting']; hasNew: true }
    >,
  ) => Promise<void>)[];
  afterCommit?: ((
    context: OperationContext<
      TModel,
      { hasExisting: TConfig['hasExisting']; hasNew: true }
    >,
  ) => Promise<void>)[];
}

export type AnyOperationHooks = OperationHooks<any, any>;
