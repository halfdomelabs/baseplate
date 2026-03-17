import type { ServiceContext } from '../service-context.js';
import type {
  AfterExecuteHook,
  AnyBoundTransformer,
  InferTransformed,
  TransformPlan,
} from './transformer-types.js';

/**
 * Configuration for `prepareTransformers`.
 *
 * @template TTransformers - Record of bound transformers (from `.forCreate()` / `.forUpdate()`)
 */
export interface PrepareTransformersConfig<
  TTransformers extends Record<string, AnyBoundTransformer>,
> {
  /** Bound transformers to process. Each should be the result of `.forCreate()` or `.forUpdate()`. */
  transformers: TTransformers;
  /** Service context with user info, request details, etc. */
  context: ServiceContext;
}

/**
 * Process all bound transformers and collect their results into a `TransformPlan`.
 *
 * Each bound transformer's `process` method is called to produce Prisma-compatible
 * data and optional afterExecute hooks. The results are aggregated into a plan
 * that can be passed to `executePlan`.
 *
 * @template TTransformers - Record of bound transformers
 * @param config - Configuration with bound transformers and service context
 * @returns A `TransformPlan` with resolved data and collected hooks
 *
 * @example
 * ```typescript
 * const plan = await prepareTransformers({
 *   transformers: {
 *     coverPhoto: coverPhotoTransformer.forCreate(coverPhoto),
 *   },
 *   context,
 * });
 * ```
 */
export async function prepareTransformers<
  TTransformers extends Record<string, AnyBoundTransformer>,
>(
  config: PrepareTransformersConfig<TTransformers>,
): Promise<TransformPlan<TTransformers>> {
  const { transformers, context } = config;
  const transformed = {} as InferTransformed<TTransformers>;
  const afterExecute: AfterExecuteHook[] = [];

  for (const [key, boundTransformer] of Object.entries(transformers)) {
    const result = await boundTransformer.process({
      serviceContext: context,
    });

    if (result.data !== undefined) {
      (transformed as Record<string, unknown>)[key] = result.data;
    }

    if (result.afterExecute) {
      afterExecute.push(...result.afterExecute);
    }
  }

  return { transformed, afterExecute };
}
