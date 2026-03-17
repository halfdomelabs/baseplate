import type { Prisma } from '@src/generated/prisma/client.js';

import type { ServiceContext } from '../service-context.js';

/* eslint-disable @typescript-eslint/no-explicit-any -- generic type utilities */

/** A value that may or may not be wrapped in a Promise */
type MaybePromise<T> = T | Promise<T>;

/** Hook that runs inside a transaction after the main operation */
export type AfterExecuteHook = (ctx: {
  tx: Prisma.TransactionClient;
  result: unknown;
}) => Promise<void>;

/**
 * Result of processing a bound transformer.
 *
 * @template TOutput - The Prisma-compatible data type this transformer produces
 */
export interface TransformerResult<TOutput> {
  /** Transformed data, or a deferred function that produces data inside a transaction */
  data?: TOutput | ((tx: Prisma.TransactionClient) => Promise<TOutput>);
  /** Hooks to run inside the transaction after the main operation */
  afterExecute?: AfterExecuteHook[];
}

/**
 * A fully-bound transformer ready to be processed.
 *
 * Created by calling `.forCreate(input, ...args)` or `.forUpdate(input, ...args)`
 * on a `Transformer`. The input value and context are already captured — `process`
 * only needs the service context.
 *
 * @template TOutput - The Prisma-compatible data type this transformer produces
 */
export interface BoundTransformer<TOutput> {
  /** Process the bound input and produce Prisma data + optional hooks */
  process(ctx: {
    serviceContext: ServiceContext;
  }): MaybePromise<TransformerResult<TOutput>>;
}

/** Type alias for any bound transformer (used for generic constraints) */
export type AnyBoundTransformer = BoundTransformer<any>;

/**
 * A reusable transformer definition with `.forCreate()` and `.forUpdate()` methods.
 *
 * Transformers handle complex field processing that goes beyond simple Zod validation:
 * file uploads, nested entity orchestration, state machine transitions, etc.
 *
 * @template TInput - The input value type
 * @template TCreateArgs - Tuple of additional args for `.forCreate()` (empty `[]` = no extra args)
 * @template TUpdateArgs - Tuple of additional args for `.forUpdate()` (e.g., `[existing: string | null]`)
 * @template TCreateOutput - Prisma data type for create operations
 * @template TUpdateOutput - Prisma data type for update operations
 */
export interface Transformer<
  TInput,
  TCreateArgs extends unknown[],
  TUpdateArgs extends unknown[],
  TCreateOutput,
  TUpdateOutput,
> {
  /** Bind for a create operation. Takes the input value + any create-specific args. */
  forCreate(
    input: TInput,
    ...args: TCreateArgs
  ): BoundTransformer<TCreateOutput>;
  /** Bind for an update operation. Takes the input value (or undefined for partial) + any update-specific args. */
  forUpdate(
    input: TInput | undefined,
    ...args: TUpdateArgs
  ): BoundTransformer<TUpdateOutput>;
}

/** Type alias for any transformer (used for generic constraints) */
export type AnyTransformer = Transformer<any, any[], any[], any, any>;

/**
 * The result of `prepareTransformers`. Contains resolved transformer data
 * and collected afterExecute hooks.
 *
 * @template TTransformers - Record of bound transformers
 */
export interface TransformPlan<
  TTransformers extends Record<string, AnyBoundTransformer>,
> {
  /** Resolved data from each transformer, keyed by transformer name */
  transformed: InferTransformed<TTransformers>;
  /** Collected afterExecute hooks from all transformers */
  afterExecute: AfterExecuteHook[];
}

/** Infer the output type of a bound transformer */
type InferBoundOutput<T extends AnyBoundTransformer> =
  T extends BoundTransformer<infer TOutput> ? TOutput : never;

/** Infer the resolved transformed data map from a record of bound transformers */
export type InferTransformed<
  TTransformers extends Record<string, AnyBoundTransformer>,
> = {
  [K in keyof TTransformers]: InferBoundOutput<TTransformers[K]>;
};
