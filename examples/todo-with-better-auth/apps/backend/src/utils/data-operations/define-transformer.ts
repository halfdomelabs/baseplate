import type { ServiceContext } from '../service-context.js';
import type {
  AfterExecuteHook,
  BoundTransformer,
  Transformer,
  TransformerResult,
} from './transformer-types.js';

/** A value that may or may not be wrapped in a Promise */
type MaybePromise<T> = T | Promise<T>;

/**
 * Configuration for `defineTransformer`.
 *
 * Provides a single `processInput` function that handles both create and update
 * operations via a discriminated union on the `context` parameter.
 *
 * @template TInput - The input value type
 * @template TCreateArgs - Tuple of additional create args
 * @template TUpdateArgs - Tuple of additional update args
 * @template TCreateOutput - Prisma data type for create operations
 * @template TUpdateOutput - Prisma data type for update operations
 */
export interface DefineTransformerConfig<
  TInput,
  TCreateArgs extends unknown[],
  TUpdateArgs extends unknown[],
  TCreateOutput,
  TUpdateOutput,
> {
  /**
   * Process the input value for either a create or update operation.
   *
   * The `context` parameter is a discriminated union:
   * - `{ type: 'create', args: TCreateArgs }` — creating a new record
   * - `{ type: 'update', args: TUpdateArgs }` — updating an existing record
   *
   * Return `{ data: { create?, update? } }` with the Prisma-compatible data
   * for each operation type, plus optional `afterExecute` hooks.
   */
  processInput(
    value: TInput,
    context:
      | { type: 'create'; args: TCreateArgs }
      | { type: 'update'; args: TUpdateArgs },
    ctx: { serviceContext: ServiceContext },
  ): MaybePromise<{
    data?: { create?: TCreateOutput; update?: TUpdateOutput };
    afterExecute?: AfterExecuteHook[];
  }>;
}

/**
 * Define a transformer from a single `processInput` function.
 *
 * This helper generates `forCreate(input, ...args)` and `forUpdate(input, ...args)`
 * methods from one function that uses a discriminated union to distinguish operations.
 *
 * @example
 * ```typescript
 * const passwordTransformer = defineTransformer<string, [], [], string, string>({
 *   async processInput(value) {
 *     const hashed = await hash(value);
 *     return { data: { create: hashed, update: hashed } };
 *   },
 * });
 *
 * // Usage:
 * passwordTransformer.forCreate(password)
 * passwordTransformer.forUpdate(password)
 * ```
 */
export function defineTransformer<
  TInput,
  TCreateArgs extends unknown[],
  TUpdateArgs extends unknown[],
  TCreateOutput,
  TUpdateOutput,
>(
  config: DefineTransformerConfig<
    TInput,
    TCreateArgs,
    TUpdateArgs,
    TCreateOutput,
    TUpdateOutput
  >,
): Transformer<TInput, TCreateArgs, TUpdateArgs, TCreateOutput, TUpdateOutput> {
  return {
    forCreate(
      input: TInput,
      ...args: TCreateArgs
    ): BoundTransformer<TCreateOutput> {
      return {
        async process(ctx): Promise<TransformerResult<TCreateOutput>> {
          const result = await config.processInput(
            input,
            { type: 'create', args },
            ctx,
          );
          return {
            data: result.data?.create,
            afterExecute: result.afterExecute,
          };
        },
      };
    },

    forUpdate(
      input: TInput | undefined,
      ...args: TUpdateArgs
    ): BoundTransformer<TUpdateOutput> {
      return {
        async process(ctx): Promise<TransformerResult<TUpdateOutput>> {
          if (input === undefined) {
            return {};
          }
          const result = await config.processInput(
            input,
            { type: 'update', args },
            ctx,
          );
          return {
            data: result.data?.update,
            afterExecute: result.afterExecute,
          };
        },
      };
    },
  };
}
